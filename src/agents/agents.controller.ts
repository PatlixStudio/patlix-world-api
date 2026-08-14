import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'All agents (the workforce)' })
  findAll() {
    return this.agentsService.findAll().then((a) => a.map((x) => x.toDto()));
  }

  @Get(':id')
  @ApiOperation({ summary: 'One agent' })
  async findOne(@Param('id') id: string) {
    return (await this.agentsService.findById(id)).toDto();
  }

  @Post()
  @ApiOperation({ summary: 'Create an agent' })
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto).then((a) => a.toDto());
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an agent (status/location/activity) — emits events',
  })
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto).then((a) => a.toDto());
  }
}
