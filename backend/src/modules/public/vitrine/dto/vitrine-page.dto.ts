import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateVitrinePageDto {
  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  puckData?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoDescription?: string;
}

export class UpdateVitrinePageDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  puckData?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoDescription?: string;
}

export class ReorderPagesDto {
  @ApiProperty()
  pages: { id: string; order: number }[];
}
