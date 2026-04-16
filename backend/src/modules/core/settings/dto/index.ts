import { IsString, IsBoolean, IsOptional, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour définir un paramètre
 */
export class SetSettingDto {
  @ApiProperty({ description: 'Valeur du paramètre (string, number, object, etc.)' })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({ description: 'Crypter la valeur ?', default: false })
  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;

  @ApiPropertyOptional({ description: 'Description du paramètre' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO pour mise à jour en masse
 */
export class BulkUpdateSettingsDto {
  @ApiProperty({
    description: 'Liste des paramètres à mettre à jour',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { type: 'any' },
        encrypted: { type: 'boolean' },
      },
    },
  })
  @IsArray()
  settings: Array<{
    key: string;
    value: any;
    encrypted?: boolean;
  }>;
}

/**
 * DTO de réponse pour un paramètre
 */
export class SettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  section: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  encrypted: boolean;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * DTO de réponse pour test de connexion
 */
export class TestConnectionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  error?: string;

  @ApiPropertyOptional()
  apiKey?: string;

  @ApiPropertyOptional()
  connectionKey?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;
}
