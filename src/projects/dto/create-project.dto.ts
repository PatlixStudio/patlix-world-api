import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus } from '@patlixworld/shared';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  repoUrl?: string;

  @IsOptional()
  @IsString()
  workingDirectory?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
