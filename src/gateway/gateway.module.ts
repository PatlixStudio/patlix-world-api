import { Module } from '@nestjs/common';
import { WorldGateway } from './world.gateway';

@Module({
  providers: [WorldGateway],
  exports: [WorldGateway],
})
export class GatewayModule {}
