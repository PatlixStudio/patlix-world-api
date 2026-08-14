import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowStatus } from '@patlixworld/shared';
import { EventsService } from '../events/events.service';
import { Workflow } from './workflow.entity';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflows: Repository<Workflow>,
    private readonly events: EventsService,
  ) {}

  findAll(): Promise<Workflow[]> {
    return this.workflows.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<Workflow> {
    const workflow = await this.workflows.findOne({ where: { id } });
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async create(dto: CreateWorkflowDto): Promise<Workflow> {
    const workflow = this.workflows.create({
      title: dto.title,
      description: dto.description ?? '',
      projectId: dto.projectId ?? null,
      taskIds: dto.taskIds ?? [],
    });
    const saved = await this.workflows.save(workflow);
    await this.events.emit({ type: 'workflow.started', workflowId: saved.id });
    return saved;
  }

  async update(id: string, dto: UpdateWorkflowDto): Promise<Workflow> {
    const workflow = await this.findById(id);
    if (dto.status !== undefined) workflow.status = dto.status;
    if (dto.taskIds !== undefined) workflow.taskIds = dto.taskIds;
    const saved = await this.workflows.save(workflow);

    if (saved.status === WorkflowStatus.COMPLETED) {
      await this.events.emit({ type: 'workflow.completed', workflowId: saved.id });
    } else if (saved.status === WorkflowStatus.FAILED) {
      await this.events.emit({
        type: 'workflow.failed',
        workflowId: saved.id,
        error: undefined,
      });
    }
    return saved;
  }
}
