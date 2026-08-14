import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsService } from '../events/events.service';
import { Company } from './company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
    private readonly events: EventsService,
  ) {}

  findAll(): Promise<Company[]> {
    return this.companies.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return company;
  }

  async create(dto: CreateCompanyDto, ownerUserId: string): Promise<Company> {
    const company = this.companies.create({
      name: dto.name,
      ownerUserId,
      industry: dto.industry ?? 'technology',
      description: dto.description ?? '',
    });
    const saved = await this.companies.save(company);
    await this.events.emit({ type: 'company.created', company: saved.toDto() });
    return saved;
  }
}
