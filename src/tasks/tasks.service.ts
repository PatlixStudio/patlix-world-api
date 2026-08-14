import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskStatus } from '@patlixworld/shared';
import { EventsService } from '../events/events.service';
import { Task } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    private readonly events: EventsService,
  ) {}

  findAll(): Promise<Task[]> {
    return this.tasks.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.tasks.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasks.create({
      title: dto.title,
      description: dto.description ?? '',
      projectId: dto.projectId ?? null,
      assignedAgentId: dto.assignedAgentId ?? null,
      planId: dto.planId ?? null,
    });
    const saved = await this.tasks.save(task);
    await this.events.emit({ type: 'task.created', task: saved.toDto() });
    return saved;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findById(id);
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.progress !== undefined) task.progress = dto.progress;
    if (dto.assignedAgentId !== undefined) task.assignedAgentId = dto.assignedAgentId;
    if (dto.currentActivity !== undefined) task.currentActivity = dto.currentActivity;
    if (dto.error !== undefined) task.error = dto.error;

    const saved = await this.tasks.save(task);

    if (dto.assignedAgentId !== undefined) {
      await this.events.emit({
        type: 'agent.task.assigned',
        agentId: saved.assignedAgentId ?? saved.id,
        taskId: saved.id,
      });
    }
    if (saved.status === TaskStatus.COMPLETED) {
      await this.events.emit({ type: 'task.completed', taskId: saved.id });
    } else if (saved.status === TaskStatus.FAILED) {
      await this.events.emit({
        type: 'task.failed',
        taskId: saved.id,
        error: saved.error || undefined,
      });
    }
    await this.events.emit({ type: 'task.updated', task: saved.toDto() });
    return saved;
  }
}
