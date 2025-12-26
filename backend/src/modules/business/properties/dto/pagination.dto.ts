import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({ 
    description: 'Cursor for pagination (property ID to start from)',
    example: 'cm4abc123def456'
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
  total?: number;
}
