import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PropertyType } from '@patlixworld/shared';

export class CreatePropertyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  x?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  y?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  z?: number;

  @IsOptional()
  @IsString()
  buildingStyle?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
