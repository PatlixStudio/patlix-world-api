import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExecuteToolDto {
  @IsString()
  @IsNotEmpty()
  taskId!: string;

  /** Real working directory; must be inside an allowed repo root. */
  @IsOptional()
  @IsString()
  workdir?: string;

  /** Optional override for the prompt handed to the tool. */
  @IsOptional()
  @IsString()
  prompt?: string;
}
