import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'All companies' })
  findAll() {
    return this.companiesService.findAll().then((c) => c.map((x) => x.toDto()));
  }

  @Get(':id')
  @ApiOperation({ summary: 'One company' })
  async findOne(@Param('id') id: string) {
    return (await this.companiesService.findById(id)).toDto();
  }

  @Post()
  @ApiOperation({ summary: 'Create a company (owned by current user)' })
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: RequestUser) {
    return this.companiesService.create(dto, user.userId).then((c) => c.toDto());
  }
}
