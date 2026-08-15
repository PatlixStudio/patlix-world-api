import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '../agents/agents.module';
import { EventsModule } from '../events/events.module';
import { Plan } from '../orchestration/plan.entity';
import { TasksModule } from '../tasks/tasks.module';
import { ToolsModule } from '../tools/tools.module';
import { ExecutorService } from './executor.service';

/**
 * Real-work driver: after a plan is approved it walks each step's agent to the
 * work location and executes the task through the permissioned OpenCode tool.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Plan]),
    AgentsModule,
    TasksModule,
    ToolsModule,
    EventsModule,
  ],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}