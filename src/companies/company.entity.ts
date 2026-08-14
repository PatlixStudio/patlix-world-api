import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CompanyDto } from '@patlixworld/shared';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  ownerUserId: string;

  @Column({ default: 'technology' })
  industry: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): CompanyDto {
    return {
      id: this.id,
      name: this.name,
      ownerUserId: this.ownerUserId,
      industry: this.industry,
      description: this.description,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
