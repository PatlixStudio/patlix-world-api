import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PropertyType, PropertyDto } from '@patlixworld/shared';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 24, default: PropertyType.CUSTOM })
  type: PropertyType;

  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  ownerUserId: string | null;

  @Column({ default: 'forest' })
  zoneId: string;

  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'float', default: 0 })
  z: number;

  @Column({ default: 'modern' })
  buildingStyle: string;

  @Column({ type: 'text', default: '' })
  theme: string;

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  toDto(): PropertyDto {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      companyId: this.companyId ?? undefined,
      ownerUserId: this.ownerUserId ?? undefined,
      zoneId: this.zoneId,
      position: { x: this.x, y: this.y, z: this.z },
      buildingStyle: this.buildingStyle,
      theme: this.theme,
      isPublic: this.isPublic,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
