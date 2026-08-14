import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    controller = moduleRef.get(AppController);
  });

  it('reports health', () => {
    const health = controller.health();
    expect(health.status).toBe('ok');
    expect(health.name).toBe('patlix-world-api');
  });
});
