import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { WorldSnapshot, ZoneDto } from '@patlixworld/shared';
import { AgentsService } from '../agents/agents.service';
import { CompaniesService } from '../companies/companies.service';
import { ProjectsService } from '../projects/projects.service';
import { PropertiesService } from '../properties/properties.service';
import { TasksService } from '../tasks/tasks.service';
import { Zone } from './zone.entity';

/** World spatial state + snapshot assembly for clients. */
@Injectable()
export class WorldService {
  constructor(
    @InjectRepository(Zone)
    private readonly zones: Repository<Zone>,
    private readonly agents: AgentsService,
    private readonly projects: ProjectsService,
    private readonly companies: CompaniesService,
    private readonly properties: PropertiesService,
    private readonly tasks: TasksService,
  ) {}

  findAllZones(): Promise<Zone[]> {
    return this.zones.find({ order: { name: 'ASC' } });
  }

  async snapshot(): Promise<WorldSnapshot> {
    const [zones, agentList, projectList, companyList, propertyList, taskList] =
      await Promise.all([
        this.findAllZones(),
        this.agents.findAll(),
        this.projects.findAll(),
        this.companies.findAll(),
        this.properties.findAll(),
        this.tasks.findAll(),
      ]);
    return {
      zones: zones.map((z) => z.toDto()),
      agents: agentList.map((a) => a.toDto()),
      projects: projectList.map((p) => p.toDto()),
      companies: companyList.map((c) => c.toDto()),
      properties: propertyList.map((p) => p.toDto()),
      tasks: taskList.map((t) => t.toDto()),
    };
  }

  /** Convenience for seeding: create a zone if it doesn't exist yet. */
  async ensureZone(dto: Omit<ZoneDto, 'id'>): Promise<Zone> {
    let zone = await this.zones.findOne({ where: { name: dto.name } });
    if (!zone) {
      zone = this.zones.create({
        name: dto.name,
        kind: dto.kind,
        centerX: dto.center.x,
        centerY: dto.center.y,
        centerZ: dto.center.z,
        radius: dto.radius,
      });
      zone = await this.zones.save(zone);
    }
    return zone;
  }
}
