import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '../agents/agents.module';
import { EventsModule } from '../events/events.module';
import { TasksModule } from '../tasks/tasks.module';
import { ToolRun } from './tool-run.entity';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

/**
 * Permissioned real-tool execution: agent task → OpenCode CLI → streamed
 * progress events. Depends on tasks + agents + the event bus.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ToolRun]),
    TasksModule,
    AgentsModule,
    EventsModule,
  ],
  controllers: [ToolsController],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
