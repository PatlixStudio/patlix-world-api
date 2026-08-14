import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AgentStatus,
  OrchestrationRequest,
  PlanStatus,
  PlanStepDto,
  PlanStepStatus,
  TaskStatus,
} from '@patlixworld/shared';
import { AgentsService } from '../agents/agents.service';
import { EventsService } from '../events/events.service';
import { ModelsService } from '../models/models.service';
import { TasksService } from '../tasks/tasks.service';
import { Plan } from './plan.entity';

/**
 * Aurel — the orchestrator. Receives a high-level request, produces a plan
 * (LLM-generated with a deterministic local fallback), then assigns each step
 * to a capable agent by creating and dispatching Tasks.
 */
@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly plans: Repository<Plan>,
    private readonly agents: AgentsService,
    private readonly tasks: TasksService,
    private readonly models: ModelsService,
    private readonly events: EventsService,
  ) {}

  findAll(): Promise<Plan[]> {
    return this.plans.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Plan> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found`);
    }
    return plan;
  }

  /** Request → plan → assign: the heart of Aurel. */
  async planAndAssign(request: OrchestrationRequest): Promise<Plan> {
    const plan = this.plans.create({
      requestTitle: request.title,
      requestDescription: request.description ?? '',
      status: PlanStatus.PLANNING,
      steps: [],
    });
    const saved = await this.plans.save(plan);
    await this.events.emit({
      type: 'orchestration.plan.created',
      plan: saved.toDto(),
    });

    saved.steps = await this.generateSteps(request);
    saved.status = PlanStatus.ACTIVE;
    await this.plans.save(saved);
    await this.events.emit({
      type: 'orchestration.plan.updated',
      plan: (await this.findById(saved.id)).toDto(),
    });

    for (const step of saved.steps) {
      const agent = await this.pickAgent(step.role);
      const task = await this.tasks.create({
        title: step.title,
        description: step.description,
        assignedAgentId: agent?.id,
        planId: saved.id,
      });
      step.taskId = task.id;
      step.agentId = agent?.id;

      if (agent) {
        await this.tasks.update(task.id, { status: TaskStatus.ASSIGNED });
        await this.agents.update(agent.id, {
          status: AgentStatus.ASSIGNED,
          currentTaskId: task.id,
          currentGoal: task.title,
        });
        step.status = PlanStepStatus.ASSIGNED;
      }

      await this.events.emit({
        type: 'orchestration.plan.step.assigned',
        planId: saved.id,
        stepId: step.id,
        taskId: task.id,
        agentId: agent?.id ?? task.id,
      });
    }

    const final = await this.plans.save(saved);
    await this.events.emit({
      type: 'orchestration.plan.updated',
      plan: final.toDto(),
    });
    return final;
  }

  /** Ask an LLM for a plan; fall back to a deterministic local planner. */
  private async generateSteps(request: OrchestrationRequest): Promise<PlanStepDto[]> {
    const agents = await this.agents.findAll();
    const roster = agents.map((agent) => `${agent.name} (${agent.role})`).join(', ');

    const system = [
      'You are Aurel, the chief orchestrator of Patlix World.',
      'Decompose the user request into a small, ordered plan of concrete work steps.',
      'Return ONLY a JSON array, no prose or markdown fences. Each element: {"title": string, "description": string, "role": string}.',
      `Choose "role" from this roster when possible: ${roster}`,
    ].join(' ');

    try {
      const raw = await this.models.chat(
        [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `Title: ${request.title}\nDescription: ${request.description ?? ''}`,
          },
        ],
        { temperature: 0.2 },
      );
      const parsed = this.parseSteps(raw);
      if (parsed.length > 0) {
        return parsed;
      }
      this.logger.warn('LLM plan was empty or unparseable, using local planner');
    } catch (err) {
      this.logger.warn(
        `LLM planning failed (${(err as Error).message}), using local planner`,
      );
    }
    return this.localPlan(request);
  }

  private parseSteps(raw: string): PlanStepDto[] {
    try {
      const cleaned = raw
        .replace(/```(?:json)?/g, '')
        .trim()
        .replace(/^\[/, '[');
      const arr = JSON.parse(cleaned) as Array<{
        title?: unknown;
        description?: unknown;
        role?: unknown;
      }>;
      if (!Array.isArray(arr)) return [];
      const now = Date.now();
      const steps: PlanStepDto[] = [];
      for (const item of arr) {
        if (
          typeof item.title !== 'string' ||
          item.title.trim() === '' ||
          typeof item.role !== 'string'
        ) {
          continue;
        }
        steps.push({
          id: `step-${now}-${steps.length}`,
          title: item.title.trim(),
          description: typeof item.description === 'string' ? item.description : '',
          role: item.role.trim(),
          status: PlanStepStatus.PENDING,
        });
      }
      return steps;
    } catch {
      return [];
    }
  }

  /** Deterministic plan used when no LLM provider is reachable. */
  private localPlan(request: OrchestrationRequest): PlanStepDto[] {
    const title = request.title;
    return [
      {
        id: 'step-analyze',
        title: `Analyze: ${title}`,
        description: `Break "${title}" into concrete work and identify acceptance criteria.`,
        role: 'Backend Developer',
        status: PlanStepStatus.PENDING,
      },
      {
        id: 'step-implement',
        title: `Implement: ${title}`,
        description: `Execute the work for "${title}" against the Patlix World backend and publish results.`,
        role: 'Backend Developer',
        status: PlanStepStatus.PENDING,
      },
      {
        id: 'step-review',
        title: `Review: ${title}`,
        description: `Review the outcome of "${title}", verify it end-to-end, and report back to Aurel.`,
        role: 'Designer',
        status: PlanStepStatus.PENDING,
      },
    ];
  }

  /** Find the best agent for a role; fall back to any idle agent. */
  private async pickAgent(role: string): Promise<{ id: string } | null> {
    const agents = await this.agents.findAll();
    const roleNorm = role.trim().toLowerCase();
    const idle = agents.filter((agent) => agent.status === AgentStatus.IDLE);
    const pool = idle.length > 0 ? idle : agents;

    const byRole = pool.find((agent) => {
      const name = agent.name.toLowerCase();
      const r = agent.role.toLowerCase();
      return r.includes(roleNorm) || roleNorm.includes(r) || name.includes(roleNorm);
    });
    if (byRole) return { id: byRole.id };
    if (pool.length > 0) return { id: pool[0].id };
    return null;
  }
}
