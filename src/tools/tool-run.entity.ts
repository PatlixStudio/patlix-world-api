import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ToolRunStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

/**
 * A single real-tool execution: an agent (via the permissioned OpenCode CLI
 * executor) completes an assigned task in a real working directory. The full
 * transcript and token/cost accounting are persisted for observability.
 */
@Entity('tool_runs')
export class ToolRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  taskId: string;

  @Index()
  @Column({ type: 'uuid' })
  agentId: string;

  @Column({ default: 'opencode' })
  tool: string;

  @Column()
  workdir: string;

  @Column({ type: 'varchar', length: 16, default: ToolRunStatus.RUNNING })
  status: ToolRunStatus;

  @Column({ type: 'text', default: '' })
  prompt: string;

  @Column({ type: 'text', default: '' })
  transcript: string;

  @Column({ type: 'int', default: 0 })
  tokens: number;

  @Column({ type: 'float', default: 0 })
  cost: number;

  @Column({ type: 'text', default: '' })
  error: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): {
    id: string;
    taskId: string;
    agentId: string;
    tool: string;
    workdir: string;
    status: ToolRunStatus;
    transcript: string;
    tokens: number;
    cost: number;
    error: string;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id,
      taskId: this.taskId,
      agentId: this.agentId,
      tool: this.tool,
      workdir: this.workdir,
      status: this.status,
      transcript: this.transcript,
      tokens: this.tokens,
      cost: this.cost,
      error: this.error,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
