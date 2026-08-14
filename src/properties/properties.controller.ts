import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'All properties' })
  findAll() {
    return this.propertiesService.findAll().then((p) => p.map((x) => x.toDto()));
  }

  @Get(':id')
  @ApiOperation({ summary: 'One property' })
  async findOne(@Param('id') id: string) {
    return (await this.propertiesService.findById(id)).toDto();
  }

  @Post()
  @ApiOperation({ summary: 'Create a property' })
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto).then((p) => p.toDto());
  }
}
