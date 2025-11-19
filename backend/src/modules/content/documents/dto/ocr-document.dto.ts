import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OcrDocumentDto {
  @ApiPropertyOptional({ example: 'fra+eng' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ 
    example: 'tesseract', 
    enum: ['tesseract', 'google-vision', 'aws-textract']
  })
  @IsOptional()
  @IsString()
  engine?: string;
}
