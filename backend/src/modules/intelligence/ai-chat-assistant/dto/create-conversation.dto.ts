import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
