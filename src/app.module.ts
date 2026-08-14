import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { PropertiesModule } from './properties/properties.module';
import { ProjectsModule } from './projects/projects.module';
import { AgentsModule } from './agents/agents.module';
import { TasksModule } from './tasks/tasks.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { EventsModule } from './events/events.module';
import { GatewayModule } from './gateway/gateway.module';
import { WorldModule } from './world/world.module';
import { SeedModule } from './seed/seed.module';
import { ModelsModule } from './models/models.module';
import { OrchestrationModule } from './orchestration/orchestration.module';

/**
 * Root module. Patlix World backend — source of truth for the AI workforce
 * and the world's spatial state. Clients (the 3D renderer) are consumers.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'patlixworld'),
        password: config.get<string>('DB_PASSWORD', 'patlixworld'),
        database: config.get<string>('DB_NAME', 'patlixworld'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    PropertiesModule,
    ProjectsModule,
    AgentsModule,
    TasksModule,
    WorkflowsModule,
    GatewayModule,
    EventsModule,
    WorldModule,
    SeedModule,
    ModelsModule,
    OrchestrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
