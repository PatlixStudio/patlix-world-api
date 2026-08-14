import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'All workflows' })
  findAll() {
    return this.workflowsService.findAll().then((w) => w.map((x) => x.toDto()));
  }

  @Get(':id')
  @ApiOperation({ summary: 'One workflow' })
  async findOne(@Param('id') id: string) {
    return (await this.workflowsService.findById(id)).toDto();
  }

  @Post()
  @ApiOperation({ summary: 'Create a workflow (emits workflow.started)' })
  create(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(dto).then((w) => w.toDto());
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workflow' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowsService.update(id, dto).then((w) => w.toDto());
  }
}
