import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsService } from './metrics.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [MetricsService],
})
export class MetricsModule {}