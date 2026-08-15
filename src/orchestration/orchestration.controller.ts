import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Plan } from './plan.entity';
import { OrchestrationRequestDto } from './dto/orchestration-request.dto';
import { OrchestrationService } from './orchestration.service';

/**
 * Aurel orchestration: submit a request and get a plan. Plans gated on approval
 * wait in PENDING_APPROVAL until `POST /plans/:id/approve`; assignment and the
 * real executor start only after approval.
 */
@Controller('orchestration')
export class OrchestrationController {
  constructor(private readonly orchestration: OrchestrationService) {}

  @Post('requests')
  planAndAssign(@Body() dto: OrchestrationRequestDto): Promise<Plan> {
    return this.orchestration.planAndAssign(dto);
  }

  @Post('plans/:id/approve')
  approve(@Param('id') id: string): Promise<Plan> {
    return this.orchestration.approve(id);
  }

  @Post('plans/:id/reject')
  reject(@Param('id') id: string): Promise<Plan> {
    return this.orchestration.reject(id);
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
