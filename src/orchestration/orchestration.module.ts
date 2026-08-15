import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '../agents/agents.module';
import { EventsModule } from '../events/events.module';
import { ExecutorModule } from '../executor/executor.module';
import { ModelsModule } from '../models/models.module';
import { TasksModule } from '../tasks/tasks.module';
import { Plan } from './plan.entity';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationService } from './orchestration.service';

/** Aurel orchestration: request → plan → approve → assign → execute. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Plan]),
    ModelsModule,
    AgentsModule,
    TasksModule,
    EventsModule,
    ExecutorModule,
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}
