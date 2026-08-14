import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'All projects' })
  findAll() {
    return this.projectsService.findAll().then((p) => p.map((x) => x.toDto()));
  }

  @Get(':id')
  @ApiOperation({ summary: 'One project' })
  async findOne(@Param('id') id: string) {
    return (await this.projectsService.findById(id)).toDto();
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto).then((p) => p.toDto());
  }
}
