import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WorkflowStatus } from '@patlixworld/shared';

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];
}

export class UpdateWorkflowDto {
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];
}
