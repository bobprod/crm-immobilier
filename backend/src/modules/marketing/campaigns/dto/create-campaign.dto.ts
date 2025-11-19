import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Nom de la campagne' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Type de campagne', enum: ['email', 'sms', 'whatsapp', 'social'] })
  @IsEnum(['email', 'sms', 'whatsapp', 'social'])
  type: string;

  @ApiProperty({ description: 'Configuration', required: false })
  @IsObject()
  @IsOptional()
  config?: any;

  @ApiProperty({ description: 'Statistiques', required: false })
  @IsObject()
  @IsOptional()
  stats?: any;
}
