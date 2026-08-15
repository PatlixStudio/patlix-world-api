import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrchestrationRequest } from '@patlixworld/shared';

export class OrchestrationRequestDto implements OrchestrationRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Gate execution on an explicit human approval. Defaults to true. */
  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;
}
