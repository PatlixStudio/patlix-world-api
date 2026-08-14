import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Patlix World backend entry point.
 * Source of truth for agents, projects, properties and world state.
 * Exposes REST + Swagger + WebSocket (`/world`), default port 3003.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('patlix-world-api')
    .setDescription(
      'Patlix World — open-world AI workforce backend (agents, Aurel orchestration, tasks, tools, events, world state).',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  Logger.log(`🚀 Patlix World API on http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`📚 Swagger docs on http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
