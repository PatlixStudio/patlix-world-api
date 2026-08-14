import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrchestrationRequest } from '@patlixworld/shared';

export class OrchestrationRequestDto implements OrchestrationRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
