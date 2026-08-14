import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus, ProjectDto } from '@patlixworld/shared';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  propertyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ default: '' })
  repoUrl: string;

  @Column({ type: 'text', default: '' })
  workingDirectory: string;

  @Column({ default: 'main' })
  branch: string;

  @Column({ type: 'varchar', length: 16, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'text', default: '' })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): ProjectDto {
    return {
      id: this.id,
      name: this.name,
      propertyId: this.propertyId ?? undefined,
      companyId: this.companyId ?? undefined,
      repoUrl: this.repoUrl,
      workingDirectory: this.workingDirectory,
      branch: this.branch,
      status: this.status,
      description: this.description,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
