import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Plan } from './plan.entity';
import { OrchestrationRequestDto } from './dto/orchestration-request.dto';
import { OrchestrationService } from './orchestration.service';

/**
 * Aurel orchestration: submit a request and get a plan with tasks assigned to
 * agents. `POST /api/orchestration/requests` drives the whole pipeline.
 */
@Controller('orchestration')
export class OrchestrationController {
  constructor(private readonly orchestration: OrchestrationService) {}

  @Post('requests')
  planAndAssign(@Body() dto: OrchestrationRequestDto): Promise<Plan> {
    return this.orchestration.planAndAssign(dto);
  }

  @Get('plans')
  findAll(): Promise<Plan[]> {
    return this.orchestration.findAll();
  }

  @Get('plans/:id')
  findById(@Param('id') id: string): Promise<Plan> {
    return this.orchestration.findById(id);
  }
}
