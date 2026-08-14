import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus, TaskDto } from '@patlixworld/shared';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: TaskStatus.BACKLOG })
  status: TaskStatus;

  @Column({ type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedAgentId: string | null;

  @Column({ type: 'uuid', nullable: true })
  planId: string | null;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'text', default: '' })
  currentActivity: string;

  @Column({ type: 'text', default: '' })
  error: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): TaskDto {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      projectId: this.projectId ?? undefined,
      assignedAgentId: this.assignedAgentId ?? undefined,
      planId: this.planId ?? undefined,
      progress: this.progress,
      currentActivity: this.currentActivity,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
