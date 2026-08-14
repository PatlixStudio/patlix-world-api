import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { CompaniesModule } from '../companies/companies.module';
import { ProjectsModule } from '../projects/projects.module';
import { PropertiesModule } from '../properties/properties.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { WorldModule } from '../world/world.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    UsersModule,
    WorldModule,
    CompaniesModule,
    PropertiesModule,
    ProjectsModule,
    AgentsModule,
    TasksModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
