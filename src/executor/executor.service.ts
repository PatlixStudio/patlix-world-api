import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { setTimeout as sleep } from 'node:timers/promises';
import { Repository } from 'typeorm';
import {
  AgentStatus,
  PlanStatus,
  PlanStepStatus,
  TaskStatus,
} from '@patlixworld/shared';
import { AgentsService } from '../agents/agents.service';
import { EventsService } from '../events/events.service';
import { Plan } from '../orchestration/plan.entity';
import { TasksService } from '../tasks/tasks.service';
import { ToolsService } from '../tools/tools.service';

/**
 * Executes an approved plan sequentially: for each step the assigned agent
 * travels to the work location (NAVIGATING → visible walk in the 3D world),
 * then runs the real OpenCode tool (`ToolsService.executeAndWait`), which
 * streams agent tool and message events. Step and plan statuses are
 * advanced so Aurel's dashboard shows a live, observable pipeline.
 *
 * Resumable: on application bootstrap it re-drives any ACTIVE plan with
 * unfinished steps, so a backend restart never strands a running plan.
 */
@Injectable()
export class ExecutorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExecutorService.name);
  private readonly running = new Set<string>();

  constructor(
    @InjectRepository(Plan)
    private readonly plans: Repository<Plan>,
    private readonly agents: AgentsService,
    private readonly tasks: TasksService,
    private readonly tools: ToolsService,
    private readonly events: EventsService,
  ) {}

  /** Resume any ACTIVE plans left unfinished by a previous process. */
  async onApplicationBootstrap(): Promise<void> {
    const active = await this.plans.find({ where: { status: PlanStatus.ACTIVE } });
    for (const plan of active) {
      const unfinished = (plan.steps ?? []).some(
        (step) =>
          step.status !== PlanStepStatus.COMPLETED &&
          step.status !== PlanStepStatus.FAILED &&
          step.status !== PlanStepStatus.CANCELLED,
      );
      if (unfinished) {
        this.logger.log(`[plan ${plan.id}] resuming unfinished execution`);
        void this.runPlan(plan.id).catch((err) =>
          this.logger.error(`[plan ${plan.id}] resume failed: ${(err as Error).message}`),
        );
      }
    }
  }

  /** Execute every step of a plan in order. Resolves when the plan is done. */
  async runPlan(planId: string): Promise<void> {
    if (this.running.has(planId)) {
      this.logger.log(`[plan ${planId}] already executing; skipping`);
      return;
    }
    this.running.add(planId);
    try {
      let plan = await this.findById(planId);
      for (const step of plan.steps) {
        if (
          step.status === PlanStepStatus.COMPLETED ||
          step.status === PlanStepStatus.FAILED ||
          step.status === PlanStepStatus.CANCELLED
        ) {
          continue;
        }
        const ok = await this.runStep(step);
        plan = await this.findById(planId);
        const stepRef = plan.steps.find((s) => s.id === step.id);
        if (stepRef) {
          stepRef.status = ok ? PlanStepStatus.COMPLETED : PlanStepStatus.FAILED;
        }
        plan.status = ok ? PlanStatus.ACTIVE : PlanStatus.FAILED;
        await this.persistAndEmit(plan);
        if (!ok) break;
      }
      const final = await this.findById(planId);
      if (final.status === PlanStatus.ACTIVE) {
        final.status = PlanStatus.COMPLETED;
        await this.persistAndEmit(final);
      }
      this.logger.log(`[plan ${planId}] execution finished (${final.status})`);
    } finally {
      this.running.delete(planId);
    }
  }

  /** Travel + execute one step; resolves true on success. */
  private async runStep(step: { id: string; taskId?: string; agentId?: string }): Promise<boolean> {
    if (!step.taskId || !step.agentId) {
      this.logger.warn(`[plan] step ${step.id} has no task/agent; marking failed`);
      return false;
    }

    try {
      const agent = await this.agents.findById(step.agentId);
      const x = agent.x + 7;
      const z = agent.z + 4;
      await this.agents.update(step.agentId, {
        status: AgentStatus.NAVIGATING,
        currentActivity: 'Traveling to work location',
      });
      await this.agents.update(step.agentId, {
        x,
        z,
        heading: Math.atan2(x - agent.x, z - agent.z),
      });
      // Let the walk read in the 3D world before starting real work.
      await sleep(2500);

      this.logger.log(`[plan] step ${step.id}: agent ${agent.name} executing`);
      const ok = await this.tools.executeAndWait({
        taskId: step.taskId,
        workdir: this.workdirFor(agent.name),
      });
      await this.tasks.update(step.taskId, {
        status: ok ? TaskStatus.COMPLETED : TaskStatus.FAILED,
      });
      return ok;
    } catch (err) {
      this.logger.error(
        `[plan] step ${step.id} errored: ${(err as Error).message}`,
      );
      if (step.taskId) {
        await this.tasks
          .update(step.taskId, {
            status: TaskStatus.FAILED,
            error: (err as Error).message,
          })
          .catch(() => undefined);
      }
      return false;
    }
  }

  /** The design/implementation agents work on the 3D client (the demo repo). */
  private workdirFor(agentName: string): string {
    const root =
      process.env.WORLD_WORKSPACE_ROOT ?? '/home/Kai/development/patlix-workspace';
    if (agentName.toLowerCase().includes('design')) {
      return `${root}/apps/patlix-world-web`;
    }
    return `${root}/apps/patlix-world-web`;
  }

  private async findById(id: string): Promise<Plan> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) {
      throw new Error(`Plan ${id} not found`);
    }
    return plan;
  }

  private async persistAndEmit(plan: Plan): Promise<void> {
    await this.plans.save(plan);
    await this.events.emit({
      type: 'orchestration.plan.updated',
      plan: (await this.findById(plan.id)).toDto(),
    });
  }
}