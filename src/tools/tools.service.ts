import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { Repository } from 'typeorm';
import { AgentStatus, TaskStatus } from '@patlixworld/shared';
import { AgentsService } from '../agents/agents.service';
import { EventsService } from '../events/events.service';
import { TasksService } from '../tasks/tasks.service';
import { ExecuteToolDto } from './dto/execute-tool.dto';
import { ToolRun, ToolRunStatus } from './tool-run.entity';

interface OpenCodeEvent {
  type?: string;
  part?: {
    type?: string;
    text?: string;
    [key: string]: unknown;
  };
  tokens?: { total?: number; output?: number };
  cost?: number;
}

/**
 * Permissioned OpenCode executor. Runs an agent's assigned task as a real,
 * non-interactive `opencode run` in an allowed working directory and streams
 * progress (`agent.tool.*`, `agent.message.sent`, task/agent updates) over the
 * `/world` event bus. Only ever executes the OpenCode CLI — the agent can only
 * do what the CLI can do inside the permitted repo.
 */
@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);
  private readonly progressIntervalMs = 1500;

  constructor(
    @InjectRepository(ToolRun)
    private readonly runs: Repository<ToolRun>,
    private readonly tasks: TasksService,
    private readonly agents: AgentsService,
    private readonly events: EventsService,
    private readonly config: ConfigService,
  ) {}

  findAll(): Promise<ToolRun[]> {
    return this.runs.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<ToolRun> {
    const run = await this.runs.findOne({ where: { id } });
    if (!run) {
      throw new NotFoundException(`Tool run ${id} not found`);
    }
    return run;
  }

  /**
   * Execute an agent's assigned task via the OpenCode CLI (fire-and-forget).
   * Streams progress events in real time; the transcript and token/cost
   * accounting are stored.
   */
  async execute(dto: ExecuteToolDto): Promise<ToolRun> {
    const { run, agentId, taskId } = await this.createRun(dto);
    void this.spawnRun(run, agentId, taskId);
    return run;
  }

  /** Execute and await completion. Resolves true when the run succeeded. */
  async executeAndWait(dto: ExecuteToolDto): Promise<boolean> {
    const { run, agentId, taskId } = await this.createRun(dto);
    return this.spawnRun(run, agentId, taskId);
  }

  /** Validate, persist and announce the start of a tool run. */
  private async createRun(dto: ExecuteToolDto): Promise<{
    run: ToolRun;
    agentId: string;
    taskId: string;
  }> {
    const task = await this.tasks.findById(dto.taskId);
    if (!task.assignedAgentId) {
      throw new BadRequestException(
        `Task ${task.id} has no assigned agent; assign one before executing`,
      );
    }
    const agent = await this.agents.findById(task.assignedAgentId);
    const workdir = this.resolveWorkdir(dto.workdir);

    const run = this.runs.create({
      taskId: task.id,
      agentId: agent.id,
      workdir,
      prompt:
        dto.prompt ??
        [
          `You are ${agent.name} (${agent.role}) working in Patlix World.`,
          `Persona: ${agent.persona}`,
          `Complete the assigned task end-to-end and make real changes.`,
          `Work only inside the current working directory (this repo). Do not touch libs/, other apps/, or any repo outside it, and do not git commit.`,
          ``,
          `Task: ${task.title}`,
          `Description: ${task.description}`,
        ].join('\n'),
      status: ToolRunStatus.RUNNING,
    });
    const saved = await this.runs.save(run);

    await this.events.emit({
      type: 'agent.tool.started',
      agentId: agent.id,
      tool: 'opencode',
      description: task.title,
    });
    await this.tasks.update(task.id, {
      status: TaskStatus.IN_PROGRESS,
      currentActivity: `Starting opencode in ${workdir}…`,
    });
    await this.agents.update(agent.id, {
      status: AgentStatus.WORKING,
      currentGoal: task.title,
      currentActivity: `Running opencode: ${task.title}`,
    });
    return { run: saved, agentId: agent.id, taskId: task.id };
  }

  /** Resolve and permission-check the working directory. */
  private resolveWorkdir(requested?: string): string {
    const root = this.config.get<string>(
      'WORLD_WORKSPACE_ROOT',
      '/home/Kai/development/patlix-workspace',
    );
    const allowed = [
      `${root}/apps/patlix-world-api`,
      `${root}/apps/patlix-world-web`,
      `${root}/libs/patlix-world-shared`,
    ];
    const target = requested ? requested : `${root}/apps/patlix-world-web`;
    const resolved = target.endsWith('/') ? target.slice(0, -1) : target;
    if (!allowed.includes(resolved)) {
      throw new BadRequestException(
        `Working directory ${resolved} is not permitted (must be one of the patlix-world repos)`,
      );
    }
    return resolved;
  }

  private async spawnRun(
    run: ToolRun,
    agentId: string,
    taskId: string,
  ): Promise<boolean> {
    const bin = this.config.get<string>('OPENCODE_BIN', 'opencode') ?? 'opencode';
    const auto = this.config.get<string>('OPENCODE_AUTO', 'true') === 'true';
    const args = ['run', '--format', 'json'];
    if (auto) args.push('--auto');
    args.push('--dir', run.workdir, run.prompt);

    this.logger.log(`[run ${run.id}] ${bin} ${args.join(' ').slice(0, 160)}`);

    let resolveDone!: (ok: boolean) => void;
    const done = new Promise<boolean>((r) => {
      resolveDone = r;
    });

    const child = spawn(bin, args, {
      cwd: run.workdir,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let transcript = '';
    let lastEmit = 0;
    let tokens = 0;
    let cost = 0;

    const flushProgress = async (forced: boolean): Promise<void> => {
      const now = Date.now();
      if (!forced && now - lastEmit < this.progressIntervalMs) return;
      lastEmit = now;
      const snippet = transcript.slice(-400);
      await this.tasks.update(taskId, {
        currentActivity: snippet.length > 0 ? snippet : run.transcript.slice(-400),
      });
      await this.events.emit({
        type: 'agent.message.sent',
        agentId,
        content: snippet || '…working…',
      });
    };

    const onLine = (line: string): void => {
      let evt: OpenCodeEvent;
      try {
        evt = JSON.parse(line) as OpenCodeEvent;
      } catch {
        return;
      }
      const text = typeof evt.part?.text === 'string' ? evt.part.text : undefined;
      if (text) {
        transcript += `${text}\n`;
        run.transcript = transcript;
      }
      if (typeof evt.cost === 'number') cost = evt.cost;
      if (evt.tokens?.total && evt.tokens.total > tokens) {
        tokens = evt.tokens.total;
      }
      if (evt.type === 'step_finish') {
        void flushProgress(false);
      }
    };

    const reader = createInterface({ input: child.stdout });
    reader.on('line', onLine);

    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      void this.finishRun(run, agentId, taskId, {
        ok: false,
        transcript,
        tokens,
        cost,
        error: err.message,
      }).then((ok) => resolveDone(ok));
    });

    child.on('close', (code) => {
      reader.close();
      void this.finishRun(run, agentId, taskId, {
        ok: code === 0,
        transcript,
        tokens,
        cost,
        error: code === 0 ? '' : stderr.slice(0, 1000),
      }).then((ok) => resolveDone(ok));
    });

    this.logger.log(`[run ${run.id}] started (pid ${child.pid})`);
    return await done;
  }

  private async finishRun(
    run: ToolRun,
    agentId: string,
    taskId: string,
    result: {
      ok: boolean;
      transcript: string;
      tokens: number;
      cost: number;
      error: string;
    },
  ): Promise<boolean> {
    run.transcript = result.transcript;
    run.tokens = result.tokens;
    run.cost = result.cost;
    run.error = result.error;
    run.status = result.ok ? ToolRunStatus.COMPLETED : ToolRunStatus.FAILED;
    const saved = await this.runs.save(run);

    if (result.ok) {
      await this.events.emit({
        type: 'agent.tool.completed',
        agentId,
        tool: 'opencode',
      });
      await this.tasks.update(taskId, {
        status: TaskStatus.REVIEW,
        progress: 100,
        currentActivity: 'Tool run completed — awaiting review',
      });
      await this.agents.update(agentId, {
        status: AgentStatus.IDLE,
        currentActivity: 'Awaiting review',
      });
      this.logger.log(
        `[run ${run.id}] completed — ${result.tokens} tokens, $${result.cost.toFixed(4)}`,
      );
    } else {
      await this.events.emit({
        type: 'agent.tool.failed',
        agentId,
        tool: 'opencode',
        error: result.error || 'opencode exited non-zero',
      });
      await this.tasks.update(taskId, {
        status: TaskStatus.FAILED,
        error: result.error || 'tool run failed',
        currentActivity: 'Tool run failed',
      });
      await this.agents.update(agentId, {
        status: AgentStatus.BLOCKED,
        currentActivity: 'Tool run failed',
      });
      this.logger.warn(`[run ${run.id}] failed: ${result.error.slice(0, 200)}`);
    }
    void saved;
    return result.ok;
  }
}
