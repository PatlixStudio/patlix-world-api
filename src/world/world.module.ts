import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from '../agents/agents.module';
import { CompaniesModule } from '../companies/companies.module';
import { ProjectsModule } from '../projects/projects.module';
import { PropertiesModule } from '../properties/properties.module';
import { TasksModule } from '../tasks/tasks.module';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';
import { Zone } from './zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Zone]),
    AgentsModule,
    ProjectsModule,
    CompaniesModule,
    PropertiesModule,
    TasksModule,
  ],
  controllers: [WorldController],
  providers: [WorldService],
  exports: [WorldService],
})
export class WorldModule {}
