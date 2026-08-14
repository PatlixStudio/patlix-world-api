import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyType } from '@patlixworld/shared';
import { EventsService } from '../events/events.service';
import { Property } from './property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly properties: Repository<Property>,
    private readonly events: EventsService,
  ) {}

  findAll(): Promise<Property[]> {
    return this.properties.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<Property> {
    const property = await this.properties.findOne({ where: { id } });
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }
    return property;
  }

  async create(dto: CreatePropertyDto): Promise<Property> {
    const property = this.properties.create({
      name: dto.name,
      type: dto.type ?? PropertyType.CUSTOM,
      companyId: dto.companyId ?? null,
      zoneId: dto.zoneId ?? 'forest',
      x: dto.x ?? 0,
      y: dto.y ?? 0,
      z: dto.z ?? 0,
      buildingStyle: dto.buildingStyle ?? 'modern',
      theme: dto.theme ?? '',
      isPublic: dto.isPublic ?? false,
    });
    const saved = await this.properties.save(property);
    await this.events.emit({ type: 'property.created', property: saved.toDto() });
    return saved;
  }
}
