import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { ZoneDto } from '@patlixworld/shared';

/** A named region of the continuous world (forest, city, beach, ...). */
@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  kind: string;

  @Column({ type: 'float' })
  centerX: number;

  @Column({ type: 'float' })
  centerY: number;

  @Column({ type: 'float' })
  centerZ: number;

  @Column({ type: 'float' })
  radius: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  toDto(): ZoneDto {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      center: { x: this.centerX, y: this.centerY, z: this.centerZ },
      radius: this.radius,
    };
  }
}
