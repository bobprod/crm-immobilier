import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

export class QueryPeriodDto {
  @ApiProperty({
    description: "Période d'analyse",
    enum: ['week', 'month', 'year'],
    default: 'month',
    required: false,
  })
  @IsEnum(['week', 'month', 'year'])
  @IsOptional()
  period?: 'week' | 'month' | 'year';

  @ApiProperty({
    description: 'Nombre de résultats',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
