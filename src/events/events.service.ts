import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import type { EventEnvelope, PatlixEvent } from '@patlixworld/shared';
import { WorldGateway } from '../gateway/world.gateway';
import { WorldEvent } from './event.entity';

/**
 * Domain event bus: persists every event to the outbox and broadcasts it over
 * the `/world` socket. The 3D renderer (and any future client) consumes these;
 * it never produces them.
 */
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(WorldEvent)
    private readonly events: Repository<WorldEvent>,
    private readonly gateway: WorldGateway,
  ) {}

  async emit(event: PatlixEvent): Promise<void> {
    const envelope: EventEnvelope = {
      id: randomUUID(),
      type: event.type,
      timestamp: new Date().toISOString(),
      payload: event,
    };
    await this.events.save({
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
    this.gateway.broadcast(envelope);
  }
}
