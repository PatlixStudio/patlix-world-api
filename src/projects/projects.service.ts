import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectStatus } from '@patlixworld/shared';
import { EventsService } from '../events/events.service';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly events: EventsService,
  ) {}

  findAll(): Promise<Project[]> {
    return this.projects.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projects.create({
      name: dto.name,
      propertyId: dto.propertyId ?? null,
      companyId: dto.companyId ?? null,
      repoUrl: dto.repoUrl ?? '',
      workingDirectory: dto.workingDirectory ?? '',
      branch: dto.branch ?? 'main',
      status: dto.status ?? ProjectStatus.ACTIVE,
      description: dto.description ?? '',
    });
    const saved = await this.projects.save(project);
    await this.events.emit({ type: 'project.created', project: saved.toDto() });
    return saved;
  }
}
