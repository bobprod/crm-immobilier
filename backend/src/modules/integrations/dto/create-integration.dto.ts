import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateIntegrationDto {
  @ApiProperty({ description: "Type d'intégration", example: 'zapier' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Clé API' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'Configuration additionnelle', required: false })
  @IsObject()
  @IsOptional()
  config?: any;
}
