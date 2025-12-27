import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, IsObject } from 'class-validator';

/**
 * Type de cible pour la prospection
 */
export enum ProspectionTargetType {
  VENDEURS = 'vendeurs',
  ACHETEURS = 'acheteurs',
  INVESTISSEURS = 'investisseurs',
  LOCATAIRES = 'locataires',
  PROPRIETAIRES = 'proprietaires',
}

/**
 * Type de bien immobilier
 */
export enum PropertyTypeEnum {
  APPARTEMENT = 'appartement',
  MAISON = 'maison',
  TERRAIN = 'terrain',
  COMMERCIAL = 'commercial',
  BUREAU = 'bureau',
  IMMEUBLE = 'immeuble',
}

/**
 * DTO pour lancer une prospection
 */
export class StartProspectionDto {
  /**
   * Nom de la campagne de prospection
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Zone géographique de prospection
   * @example "Paris 15" ou "Lyon" ou "Ile-de-France"
   */
  @IsString()
  zone: string;

  /**
   * Type de cible
   */
  @IsEnum(ProspectionTargetType)
  targetType: ProspectionTargetType;

  /**
   * Type de bien recherché
   */
  @IsEnum(PropertyTypeEnum)
  @IsOptional()
  propertyType?: PropertyTypeEnum;

  /**
   * Budget min-max (optionnel)
   * @example "300k-500k" ou "1M-2M"
   */
  @IsString()
  @IsOptional()
  budget?: string;

  /**
   * Mots-clés additionnels pour affiner la recherche
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  /**
   * Nombre max de leads à générer
   */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxLeads?: number;

  /**
   * Options avancées
   */
  @IsObject()
  @IsOptional()
  options?: {
    /**
     * Moteur à utiliser ('internal' ou 'pica-ai')
     */
    engine?: 'internal' | 'pica-ai';

    /**
     * Budget max pour cette prospection (en USD)
     */
    maxCost?: number;
  };
}
