import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanDto, PlanStatus, PlanStepDto, PlanStepStatus } from '@patlixworld/shared';

/**
 * An Aurel-generated plan: request → ordered work steps → assigned agents.
 * Steps are stored as JSONB; each step is materialized as a Task when assigned.
 */
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requestTitle: string;

  @Column({ type: 'text', default: '' })
  requestDescription: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: PlanStatus.PLANNING })
  status: PlanStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  steps: PlanStepDto[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): PlanDto {
    return {
      id: this.id,
      requestTitle: this.requestTitle,
      requestDescription: this.requestDescription,
      status: this.status,
      steps: (this.steps ?? []).map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        role: step.role,
        status: step.status ?? PlanStepStatus.PENDING,
        taskId: step.taskId,
        agentId: step.agentId,
      })),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
