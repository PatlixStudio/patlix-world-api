import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayModule } from '../gateway/gateway.module';
import { WorldEvent } from './event.entity';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorldEvent]), GatewayModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
