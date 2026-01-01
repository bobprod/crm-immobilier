import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    description: 'Campaign name',
    example: 'Summer Promotion 2024 - Updated',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'Updated promotional campaign description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Scheduled date and time (ISO 8601 format)',
    example: '2024-12-31T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
