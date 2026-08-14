import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      name: 'patlix-world-api',
      version: '0.1.0',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
