import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsArray,
  Matches,
  IsObject,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'Phone number in E.164 format',
    example: '+33612345678',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +33612345678)',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Contact name',
    example: 'Jean Dupont',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'jean.dupont@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Array of tags',
    type: [String],
    example: ['client', 'vip'],
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Array of groups',
    type: [String],
    example: ['groupe-paris', 'clients-premium'],
  })
  @IsArray()
  @IsOptional()
  groups?: string[];

  @ApiPropertyOptional({
    description: 'Notes about the contact',
    example: 'Client intéressé par appartement 3 pièces',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Custom fields as key-value pairs',
    type: 'object',
    example: { budget: 250000, zone: 'Paris 15' },
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}
