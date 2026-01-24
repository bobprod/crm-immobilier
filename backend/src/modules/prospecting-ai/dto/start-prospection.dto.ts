import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, IsObject, ValidateIf, IsUrl } from 'class-validator';

/**
 * Mode de prospection
 */
export enum ProspectionInputMode {
  CRITERIA = 'criteria', // Mode manuel avec critères
  URLS = 'urls', // Mode URLs directes
}

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
   * Mode de prospection
   */
  @IsEnum(ProspectionInputMode)
  inputMode: ProspectionInputMode;

  /**
   * Nom de la campagne de prospection
   */
  @IsString()
  @IsOptional()
  name?: string;

  // ========================================
  // CRITERIA MODE FIELDS (required if inputMode === 'criteria')
  // ========================================

  /**
   * Zone géographique de prospection
   * @example "Paris 15" ou "Lyon" ou "Ile-de-France"
   */
  @ValidateIf((o) => o.inputMode === ProspectionInputMode.CRITERIA)
  @IsString()
  zone?: string;

  /**
   * Type de cible
   */
  @ValidateIf((o) => o.inputMode === ProspectionInputMode.CRITERIA)
  @IsEnum(ProspectionTargetType)
  targetType?: ProspectionTargetType;

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

  // ========================================
  // URL MODE FIELDS (required if inputMode === 'urls')
  // ========================================

  /**
   * Liste des URLs à scraper (mode URLs)
   * Maximum 50 URLs par campagne
   */
  @ValidateIf((o) => o.inputMode === ProspectionInputMode.URLS)
  @IsArray()
  @IsString({ each: true })
  @Max(50, { each: false })
  urls?: string[];

  // ========================================
  // COMMON OPTIONS
  // ========================================

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

    /**
     * Timeout en secondes
     */
    timeout?: number;
  };
}
