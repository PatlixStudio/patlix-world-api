import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'All tasks' })
  findAll() {
    return this.tasksService.findAll().then((t) => t.map((x) => x.toDto()));
  }

  @Get(':id')
  @ApiOperation({ summary: 'One task' })
  async findOne(@Param('id') id: string) {
    return (await this.tasksService.findById(id)).toDto();
  }

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto).then((t) => t.toDto());
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task (status/progress) — emits events' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto).then((t) => t.toDto());
  }
}
