import { IsInt, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour ajouter des crédits
 */
export class AddCreditsDto {
  @ApiProperty({ description: 'Nombre de crédits à ajouter', minimum: 1 })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiPropertyOptional({ description: 'ID de l\'agence (si applicable)' })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur (si applicable)' })
  @IsOptional()
  @IsString()
  userId?: string;
}

/**
 * DTO pour configurer les quotas
 */
export class SetQuotaDto {
  @ApiPropertyOptional({ description: 'Quota mensuel de crédits' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quotaMonthly?: number;

  @ApiPropertyOptional({ description: 'Quota journalier de crédits' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quotaDaily?: number;

  @ApiPropertyOptional({ description: 'Fréquence de reset', enum: ['daily', 'monthly'], default: 'monthly' })
  @IsOptional()
  @IsEnum(['daily', 'monthly'])
  resetFrequency?: 'daily' | 'monthly';

  @ApiPropertyOptional({ description: 'Seuil d\'alerte (% ou nombre de crédits restants)', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  alertThreshold?: number;
}

/**
 * DTO de réponse pour le solde de crédits
 */
export class CreditsBalanceResponseDto {
  @ApiProperty({ description: 'Solde de crédits disponibles' })
  balance: number;

  @ApiProperty({ description: 'Crédits consommés' })
  consumed: number;

  @ApiPropertyOptional({ description: 'Quota mensuel' })
  quotaMonthly?: number | null;

  @ApiPropertyOptional({ description: 'Quota journalier' })
  quotaDaily?: number | null;

  @ApiProperty({ description: 'Pool de crédits (agence ou utilisateur)' })
  isAgency: boolean;

  @ApiPropertyOptional({ description: 'Seuil d\'alerte' })
  alertThreshold?: number | null;

  @ApiProperty({ description: 'Alerte envoyée ?' })
  alertSent: boolean;

  @ApiPropertyOptional({ description: 'Pourcentage d\'utilisation (si quota défini)' })
  usagePercentage?: number;
}

/**
 * DTO de réponse pour les statistiques de crédits
 */
export class CreditsStatsResponseDto {
  @ApiProperty({ description: 'Solde actuel' })
  balance: number;

  @ApiProperty({ description: 'Crédits consommés' })
  consumed: number;

  @ApiPropertyOptional({ description: 'Quota mensuel' })
  quotaMonthly?: number | null;

  @ApiPropertyOptional({ description: 'Quota journalier' })
  quotaDaily?: number | null;

  @ApiProperty({ description: 'Pourcentage d\'utilisation' })
  usagePercentage: number;

  @ApiPropertyOptional({ description: 'Date du dernier reset' })
  lastResetAt?: Date | null;
}
