import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class UpdateContactDto {
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

  @ApiPropertyOptional({
    description: 'Block/unblock the contact',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  profilePicture?: string;
}
