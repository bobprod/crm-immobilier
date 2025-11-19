import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdatePublishedPropertyDto {
  @ApiProperty({ required: false, description: 'Is this property featured?' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({ required: false, description: 'Display order' })
  @IsNumber()
  @IsOptional()
  order?: number;
}
