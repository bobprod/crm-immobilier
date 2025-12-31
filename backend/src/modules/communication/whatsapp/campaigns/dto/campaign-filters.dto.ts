import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignType } from './create-campaign.dto';
import { CampaignStatus } from './campaign-response.dto';

export class CampaignFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by campaign status',
    enum: CampaignStatus,
    example: CampaignStatus.RUNNING,
  })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Filter by campaign type',
    enum: CampaignType,
    example: CampaignType.IMMEDIATE,
  })
  @IsEnum(CampaignType)
  @IsOptional()
  type?: CampaignType;

  @ApiPropertyOptional({
    description: 'Search in campaign name or description',
    example: 'summer',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
