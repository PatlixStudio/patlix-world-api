import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecuteToolDto } from './dto/execute-tool.dto';
import { ToolRun } from './tool-run.entity';
import { ToolsService } from './tools.service';

/**
 * Permissioned tool execution: trigger a real OpenCode run for an agent's
 * assigned task and stream progress over the `/world` event bus.
 */
@ApiTags('tools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tools')
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  @Post('execute')
  @ApiOperation({ summary: "Execute an agent's task via the OpenCode CLI" })
  execute(@Body() dto: ExecuteToolDto): Promise<ToolRun> {
    return this.tools.execute(dto);
  }

  @Get('runs')
  @ApiOperation({ summary: 'All tool runs' })
  findAll() {
    return this.tools.findAll().then((runs) => runs.map((r) => r.toDto()));
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'One tool run (with transcript)' })
  async findById(@Param('id') id: string) {
    return (await this.tools.findById(id)).toDto();
  }
}
