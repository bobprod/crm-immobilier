import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleIntegrationDto {
  @ApiProperty({ description: 'Activer/Désactiver l\'intégration' })
  @IsBoolean()
  isActive: boolean;
}
