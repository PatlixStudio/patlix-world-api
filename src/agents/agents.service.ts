import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsService } from '../events/events.service';
import { Agent } from './agent.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
    private readonly events: EventsService,
  ) {}

  findAll(): Promise<Agent[]> {
    return this.agents.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<Agent> {
    const agent = await this.agents.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    return agent;
  }

  async create(dto: CreateAgentDto): Promise<Agent> {
    const agent = this.agents.create({
      name: dto.name,
      role: dto.role,
      persona: dto.persona ?? '',
      provider: dto.provider ?? 'openrouter',
      model: dto.model ?? 'meta-llama/llama-3.3-70b-instruct:free',
      companyId: dto.companyId ?? null,
      projectId: dto.projectId ?? null,
      zoneId: dto.zoneId ?? 'beach',
      x: dto.x ?? 0,
      y: dto.y ?? 0,
      z: dto.z ?? 0,
    });
    const saved = await this.agents.save(agent);
    await this.events.emit({ type: 'agent.created', agent: saved.toDto() });
    return saved;
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findById(id);
    const previous = agent.toDto();

    if (dto.status !== undefined && dto.status !== agent.status) {
      agent.status = dto.status;
    }
    if (dto.currentTaskId !== undefined) agent.currentTaskId = dto.currentTaskId;
    if (dto.currentGoal !== undefined) agent.currentGoal = dto.currentGoal;
    if (dto.currentActivity !== undefined) agent.currentActivity = dto.currentActivity;
    if (dto.zoneId !== undefined) agent.zoneId = dto.zoneId;
    if (dto.x !== undefined) agent.x = dto.x;
    if (dto.y !== undefined) agent.y = dto.y;
    if (dto.z !== undefined) agent.z = dto.z;
    if (dto.heading !== undefined) agent.heading = dto.heading;

    const saved = await this.agents.save(agent);
    const current = saved.toDto();

    if (previous.status !== current.status) {
      await this.events.emit({
        type: 'agent.status.changed',
        agentId: saved.id,
        status: current.status,
        previous: previous.status,
      });
    }
    const moved =
      previous.location.x !== current.location.x ||
      previous.location.y !== current.location.y ||
      previous.location.z !== current.location.z ||
      previous.location.zoneId !== current.location.zoneId;
    if (moved) {
      await this.events.emit({
        type: 'agent.location.changed',
        agentId: saved.id,
        location: current.location,
      });
    }
    await this.events.emit({ type: 'agent.updated', agent: current });
    return saved;
  }
}
