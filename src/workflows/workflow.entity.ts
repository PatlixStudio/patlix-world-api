import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowStatus, WorkflowDto } from '@patlixworld/shared';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 24, default: WorkflowStatus.PENDING })
  status: WorkflowStatus;

  @Column({ type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  taskIds: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): WorkflowDto {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      projectId: this.projectId ?? undefined,
      taskIds: this.taskIds ?? [],
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
