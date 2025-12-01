import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';

export class ConvertLeadDto {
  @ApiProperty({ description: 'Prénom' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Nom' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Téléphone', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Type', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Budget (objet Json avec min, max, currency)',
    required: false,
    example: { min: 100000, max: 500000, currency: 'TND' },
  })
  @IsObject()
  @IsOptional()
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
    notes?: string;
  };

  @ApiProperty({ description: 'Devise par défaut', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Préférences', required: false })
  @IsObject()
  @IsOptional()
  preferences?: any;
}
