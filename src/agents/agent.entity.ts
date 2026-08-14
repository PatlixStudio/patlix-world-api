import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgentStatus, AgentDto } from '@patlixworld/shared';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  role: string;

  @Column({ type: 'text', default: '' })
  persona: string;

  @Index()
  @Column({ type: 'varchar', length: 24, default: AgentStatus.CREATED })
  status: AgentStatus;

  @Column({ default: 'openrouter' })
  provider: string;

  @Column({ default: 'meta-llama/llama-3.3-70b-instruct:free' })
  model: string;

  @Column({ type: 'text', nullable: true })
  baseUrl: string | null;

  @Column({ type: 'float', nullable: true })
  temperature: number | null;

  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({ type: 'uuid', nullable: true })
  currentTaskId: string | null;

  @Column({ type: 'text', default: '' })
  currentGoal: string;

  @Column({ type: 'text', default: '' })
  currentActivity: string;

  // --- world presence (backend is the source of truth) ---
  @Column({ default: 'beach' })
  zoneId: string;

  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'float', default: 0 })
  z: number;

  @Column({ type: 'float', default: 0 })
  heading: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): AgentDto {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      persona: this.persona,
      status: this.status,
      model: {
        provider: this.provider,
        model: this.model,
        baseUrl: this.baseUrl ?? undefined,
        temperature: this.temperature ?? undefined,
      },
      companyId: this.companyId ?? undefined,
      projectId: this.projectId ?? undefined,
      currentTaskId: this.currentTaskId ?? undefined,
      currentGoal: this.currentGoal,
      currentActivity: this.currentActivity,
      location: {
        zoneId: this.zoneId,
        x: this.x,
        y: this.y,
        z: this.z,
        heading: this.heading,
      },
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
