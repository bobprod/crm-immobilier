import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================
// QUERY PARAMS DTOs
// ============================================

/**
 * Paramètres de requête communs pour tous les endpoints AI Metrics Prospecting
 */
export class ProspectingMetricsQueryDto {
  @ApiPropertyOptional({
    description: "Filtrer par agence (multi-tenant)",
    example: 'clxyz123...',
  })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({
    description: "Filtrer par agent/utilisateur spécifique",
    example: 'clxyz456...',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par campagne de prospection',
    example: 'clxyz789...',
  })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({
    description: 'Date de début (ISO 8601)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Date de fin (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}

/**
 * DTO pour les endpoints avec groupement temporel
 */
export class TimeSeriesQueryDto extends ProspectingMetricsQueryDto {
  @ApiPropertyOptional({
    description: 'Granularité temporelle',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Vue d'ensemble des performances IA prospection
 */
export class ProspectingOverviewDto {
  @ApiProperty({ description: 'Nombre total de leads traités par l\'IA' })
  totalLeadsProcessed: number;

  @ApiProperty({ description: 'Nombre de leads avec LLM analysis (seriousnessScore défini)' })
  leadsWithLLMAnalysis: number;

  @ApiProperty({ description: 'Pourcentage de leads analysés par LLM' })
  llmCoverageRate: number;

  @ApiProperty({ description: 'Nombre total de matches créés' })
  totalMatches: number;

  @ApiProperty({ description: 'Nombre de matches qualifiés (score >= 50)' })
  qualifiedMatches: number;

  @ApiProperty({ description: 'Taux de qualification des matches (%)' })
  matchQualificationRate: number;

  @ApiProperty({ description: 'Score moyen de seriousness des leads' })
  avgSeriousnessScore: number;

  @ApiProperty({ description: 'Score moyen des matches' })
  avgMatchScore: number;

  @ApiProperty({ description: 'Nombre de leads convertis en prospects' })
  convertedLeads: number;

  @ApiProperty({ description: 'Taux de conversion leads → prospects (%)' })
  conversionRate: number;

  @ApiProperty({ description: 'Période de calcul' })
  period: {
    from: string;
    to: string;
  };
}

/**
 * Distribution des types de leads
 */
export class LeadTypeDistributionDto {
  @ApiProperty({ description: 'Type de lead', enum: ['mandat', 'requete', 'inconnu'] })
  leadType: string;

  @ApiProperty({ description: 'Nombre de leads' })
  count: number;

  @ApiProperty({ description: 'Pourcentage du total' })
  percentage: number;
}

/**
 * Distribution des intentions
 */
export class IntentionDistributionDto {
  @ApiProperty({ description: 'Intention', enum: ['acheter', 'louer', 'vendre', 'investir', 'inconnu'] })
  intention: string;

  @ApiProperty({ description: 'Nombre de leads' })
  count: number;

  @ApiProperty({ description: 'Pourcentage du total' })
  percentage: number;
}

/**
 * Distribution des urgences
 */
export class UrgencyDistributionDto {
  @ApiProperty({ description: 'Niveau d\'urgence', enum: ['basse', 'moyenne', 'haute', 'inconnu'] })
  urgency: string;

  @ApiProperty({ description: 'Nombre de leads' })
  count: number;

  @ApiProperty({ description: 'Pourcentage du total' })
  percentage: number;
}

/**
 * Distribution des statuts de validation
 */
export class ValidationStatusDistributionDto {
  @ApiProperty({ description: 'Statut de validation', enum: ['pending', 'valid', 'suspicious', 'spam'] })
  validationStatus: string;

  @ApiProperty({ description: 'Nombre de leads' })
  count: number;

  @ApiProperty({ description: 'Pourcentage du total' })
  percentage: number;
}

/**
 * Métriques de qualité LLM
 */
export class LLMQualityMetricsDto {
  @ApiProperty({ description: 'Nombre total de leads analysés par LLM' })
  totalAnalyzed: number;

  @ApiProperty({ description: 'Distribution des scores de seriousness' })
  seriousnessDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Score moyen de seriousness' })
  avgSeriousnessScore: number;

  @ApiProperty({ description: 'Score médian de seriousness' })
  medianSeriousnessScore: number;

  @ApiProperty({ description: 'Taux de détection de leads valides (%)' })
  validLeadDetectionRate: number;

  @ApiProperty({ description: 'Taux de détection de spam (%)' })
  spamDetectionRate: number;

  @ApiProperty({ description: 'Complétude moyenne des données extraites (%)' })
  avgDataCompleteness: number;
}

/**
 * Métriques de performance du matching
 */
export class MatchingPerformanceDto {
  @ApiProperty({ description: 'Nombre total de matches' })
  totalMatches: number;

  @ApiProperty({ description: 'Nombre de matches qualifiés (score >= 50)' })
  qualifiedMatches: number;

  @ApiProperty({ description: 'Taux de qualification (%)' })
  qualificationRate: number;

  @ApiProperty({ description: 'Score moyen' })
  avgScore: number;

  @ApiProperty({ description: 'Score médian' })
  medianScore: number;

  @ApiProperty({ description: 'Distribution des scores par plage' })
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Distribution des statuts' })
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Taux de conversion (matches → contacted/converted)' })
  conversionFunnel: {
    pending: number;
    notified: number;
    contacted: number;
    converted: number;
    ignored: number;
  };
}

/**
 * Point de données temporel
 */
export class TimeSeriesDataPointDto {
  @ApiProperty({ description: 'Date/période' })
  date: string;

  @ApiProperty({ description: 'Nombre de leads créés' })
  leadsCreated: number;

  @ApiProperty({ description: 'Nombre de leads analysés par LLM' })
  leadsAnalyzed: number;

  @ApiProperty({ description: 'Nombre de matches créés' })
  matchesCreated: number;

  @ApiProperty({ description: 'Nombre de matches qualifiés' })
  qualifiedMatches: number;

  @ApiProperty({ description: 'Score moyen de seriousness' })
  avgSeriousnessScore: number;

  @ApiProperty({ description: 'Score moyen des matches' })
  avgMatchScore: number;

  @ApiProperty({ description: 'Nombre de conversions' })
  conversions: number;
}

/**
 * Performance par source de données
 */
export class SourcePerformanceDto {
  @ApiProperty({ description: 'Source des données' })
  source: string;

  @ApiProperty({ description: 'Nombre de leads' })
  leadsCount: number;

  @ApiProperty({ description: 'Score moyen de seriousness' })
  avgSeriousnessScore: number;

  @ApiProperty({ description: 'Taux de leads valides (%)' })
  validRate: number;

  @ApiProperty({ description: 'Taux de spam (%)' })
  spamRate: number;

  @ApiProperty({ description: 'Taux de conversion (%)' })
  conversionRate: number;

  @ApiProperty({ description: 'Nombre de matches générés' })
  matchesGenerated: number;

  @ApiProperty({ description: 'Score moyen des matches' })
  avgMatchScore: number;
}

/**
 * Performance par campagne
 */
export class CampaignPerformanceDto {
  @ApiProperty({ description: 'ID de la campagne' })
  campaignId: string;

  @ApiProperty({ description: 'Nom de la campagne' })
  campaignName: string;

  @ApiProperty({ description: 'Statut de la campagne' })
  status: string;

  @ApiProperty({ description: 'Type de campagne' })
  type: string;

  @ApiProperty({ description: 'Nombre de leads trouvés' })
  leadsFound: number;

  @ApiProperty({ description: 'Nombre de leads analysés' })
  leadsAnalyzed: number;

  @ApiProperty({ description: 'Score moyen de seriousness' })
  avgSeriousnessScore: number;

  @ApiProperty({ description: 'Nombre de matches' })
  matchesCount: number;

  @ApiProperty({ description: 'Matches qualifiés' })
  qualifiedMatches: number;

  @ApiProperty({ description: 'Score moyen des matches' })
  avgMatchScore: number;

  @ApiProperty({ description: 'Taux de conversion (%)' })
  conversionRate: number;

  @ApiProperty({ description: 'Efficacité globale (score composite 0-100)' })
  efficiencyScore: number;
}

/**
 * Métriques de validation contact
 */
export class ContactValidationMetricsDto {
  @ApiProperty({ description: 'Total de validations effectuées' })
  totalValidations: number;

  @ApiProperty({ description: 'Validations email' })
  emailValidations: number;

  @ApiProperty({ description: 'Validations téléphone' })
  phoneValidations: number;

  @ApiProperty({ description: 'Taux de validité global (%)' })
  validRate: number;

  @ApiProperty({ description: 'Taux de spam détecté (%)' })
  spamRate: number;

  @ApiProperty({ description: 'Taux de domaines jetables (%)' })
  disposableRate: number;

  @ApiProperty({ description: 'Distribution par résultat' })
  resultDistribution: {
    valid: number;
    invalid: number;
    spam: number;
    disposable: number;
    catchAll: number;
  };
}

/**
 * Performance par ville/localisation
 */
export class LocationPerformanceDto {
  @ApiProperty({ description: 'Ville' })
  city: string;

  @ApiProperty({ description: 'Pays' })
  country: string;

  @ApiProperty({ description: 'Nombre de leads' })
  leadsCount: number;

  @ApiProperty({ description: 'Score moyen de seriousness' })
  avgSeriousnessScore: number;

  @ApiProperty({ description: 'Nombre de matches' })
  matchesCount: number;

  @ApiProperty({ description: 'Score moyen des matches' })
  avgMatchScore: number;

  @ApiProperty({ description: 'Taux de qualification (%)' })
  qualificationRate: number;

  @ApiProperty({ description: 'Taux de conversion (%)' })
  conversionRate: number;
}

/**
 * Métriques budget des leads
 */
export class BudgetAnalysisDto {
  @ApiProperty({ description: 'Budget moyen min' })
  avgBudgetMin: number;

  @ApiProperty({ description: 'Budget moyen max' })
  avgBudgetMax: number;

  @ApiProperty({ description: 'Distribution par tranche de budget' })
  budgetRangeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Leads avec budget défini (%)' })
  budgetCoverageRate: number;

  @ApiProperty({ description: 'Monnaie principale' })
  primaryCurrency: string;
}

/**
 * Top performers (leads/matches)
 */
export class TopPerformersDto {
  @ApiProperty({ description: 'Top leads par seriousnessScore' })
  topLeadsBySeriousness: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    seriousnessScore: number;
    leadType: string;
    city: string;
  }[];

  @ApiProperty({ description: 'Top matches par score' })
  topMatchesByScore: {
    id: string;
    leadId: string;
    propertyId: string;
    score: number;
    status: string;
    isQualified: boolean;
  }[];

  @ApiProperty({ description: 'Campagnes les plus efficaces' })
  topCampaigns: {
    id: string;
    name: string;
    leadsCount: number;
    conversionRate: number;
    efficiencyScore: number;
  }[];
}

// ============================================
// SALES / PIPELINE DTOs
// ============================================

/**
 * Funnel de conversion complet (Leads → Prospects → RDV → Deals)
 */
export class SalesFunnelDto {
  @ApiProperty({ description: 'Leads générés (prospecting_leads)' })
  leadsGenerated: number;

  @ApiProperty({ description: 'Leads qualifiés (seriousnessScore >= 60)' })
  leadsQualified: number;

  @ApiProperty({ description: 'Prospects créés (convertedProspectId not null)' })
  prospectsCreated: number;

  @ApiProperty({ description: 'Prospects actifs' })
  prospectsActive: number;

  @ApiProperty({ description: 'RDVs programmés' })
  appointmentsScheduled: number;

  @ApiProperty({ description: 'RDVs complétés' })
  appointmentsCompleted: number;

  @ApiProperty({ description: 'Visites effectuées' })
  visitsCompleted: number;

  @ApiProperty({ description: 'Offres faites' })
  offersMade: number;

  @ApiProperty({ description: 'Contrats signés' })
  contractsSigned: number;

  @ApiProperty({ description: 'Taux de conversion par étape (%)' })
  conversionRates: {
    leadsToQualified: number;
    qualifiedToProspects: number;
    prospectsToAppointments: number;
    appointmentsToVisits: number;
    visitsToOffers: number;
    offersToContracts: number;
    overallLeadsToContracts: number;
  };

  @ApiProperty({ description: 'Période' })
  period: { from: string; to: string };
}

/**
 * Performance des rendez-vous
 */
export class AppointmentsPerformanceDto {
  @ApiProperty({ description: 'Total RDVs' })
  totalAppointments: number;

  @ApiProperty({ description: 'Distribution par type' })
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Distribution par statut' })
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Taux de présence (%)' })
  attendanceRate: number;

  @ApiProperty({ description: 'Taux de no-show (%)' })
  noShowRate: number;

  @ApiProperty({ description: 'Note moyenne (0-5)' })
  avgRating: number;

  @ApiProperty({ description: 'Durée moyenne (minutes)' })
  avgDurationMinutes: number;

  @ApiProperty({ description: 'RDVs avec conversion' })
  appointmentsWithConversion: number;

  @ApiProperty({ description: 'Taux de conversion RDV → Deal (%)' })
  appointmentToConversionRate: number;
}

/**
 * Métriques de conversion (conversion_events)
 */
export class ConversionMetricsDto {
  @ApiProperty({ description: 'Total conversions' })
  totalConversions: number;

  @ApiProperty({ description: 'Valeur totale (TND)' })
  totalValue: number;

  @ApiProperty({ description: 'Valeur moyenne par conversion' })
  avgConversionValue: number;

  @ApiProperty({ description: 'Par type d\'événement' })
  byEventType: {
    eventType: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }[];

  @ApiProperty({ description: 'Par source' })
  bySource: {
    source: string;
    count: number;
    totalValue: number;
  }[];

  @ApiProperty({ description: 'Temps moyen de conversion (jours)' })
  avgTimeToConversionDays: number;
}

/**
 * Performance des prospects (pipeline CRM)
 */
export class ProspectsPerformanceDto {
  @ApiProperty({ description: 'Total prospects' })
  totalProspects: number;

  @ApiProperty({ description: 'Distribution par statut' })
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Distribution par type' })
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Score moyen des prospects' })
  avgScore: number;

  @ApiProperty({ description: 'Prospects avec matches' })
  prospectsWithMatches: number;

  @ApiProperty({ description: 'Prospects avec RDVs' })
  prospectsWithAppointments: number;

  @ApiProperty({ description: 'Prospects convertis ce mois' })
  convertedThisMonth: number;

  @ApiProperty({ description: 'Taux de conversion global (%)' })
  overallConversionRate: number;
}

// ============================================
// MATCHING / PROPERTIES DTOs
// ============================================

/**
 * Performance du matching (table matches - prospects ↔ properties)
 */
export class CRMMatchingPerformanceDto {
  @ApiProperty({ description: 'Total matches CRM' })
  totalMatches: number;

  @ApiProperty({ description: 'Matches excellents (score >= 80)' })
  excellentMatches: number;

  @ApiProperty({ description: 'Bons matches (score 60-79)' })
  goodMatches: number;

  @ApiProperty({ description: 'Matches moyens (score 40-59)' })
  averageMatches: number;

  @ApiProperty({ description: 'Matches faibles (score < 40)' })
  poorMatches: number;

  @ApiProperty({ description: 'Score moyen' })
  avgScore: number;

  @ApiProperty({ description: 'Distribution par statut' })
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Taux de conversion matches → visites (%)' })
  matchToVisitRate: number;

  @ApiProperty({ description: 'Corrélation score/conversion' })
  scoreConversionCorrelation: {
    scoreRange: string;
    matches: number;
    conversions: number;
    conversionRate: number;
  }[];
}

/**
 * Performance des propriétés
 */
export class PropertiesPerformanceDto {
  @ApiProperty({ description: 'Total propriétés' })
  totalProperties: number;

  @ApiProperty({ description: 'Distribution par statut' })
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Distribution par type' })
  byType: {
    type: string;
    count: number;
    avgPrice: number;
  }[];

  @ApiProperty({ description: 'Distribution par catégorie (vente/location)' })
  byCategory: {
    category: string;
    count: number;
    totalValue: number;
  }[];

  @ApiProperty({ description: 'Prix moyen' })
  avgPrice: number;

  @ApiProperty({ description: 'Propriétés avec matches' })
  propertiesWithMatches: number;

  @ApiProperty({ description: 'Propriétés en vedette' })
  featuredProperties: number;

  @ApiProperty({ description: 'Temps moyen sur marché (jours)' })
  avgDaysOnMarket: number;

  @ApiProperty({ description: 'Taux de vente/location (%)' })
  soldRentedRate: number;
}

/**
 * Top propriétés performantes
 */
export class TopPropertiesDto {
  @ApiProperty({ description: 'Propriétés avec le plus de matches' })
  byMatchCount: {
    id: string;
    title: string;
    type: string;
    city: string;
    price: number;
    matchCount: number;
    avgMatchScore: number;
  }[];

  @ApiProperty({ description: 'Propriétés avec les meilleurs scores de match' })
  byMatchScore: {
    id: string;
    title: string;
    type: string;
    city: string;
    price: number;
    avgMatchScore: number;
    matchCount: number;
  }[];

  @ApiProperty({ description: 'Propriétés récemment vendues/louées' })
  recentlySold: {
    id: string;
    title: string;
    type: string;
    city: string;
    price: number;
    soldDate: string;
    daysOnMarket: number;
  }[];
}

// ============================================
// UNIFIED ROI DTOs
// ============================================

/**
 * ROI unifié multi-modules
 */
export class UnifiedROIDto {
  @ApiProperty({ description: 'Coûts IA totaux' })
  totalAICost: number;

  @ApiProperty({ description: 'Coûts par module' })
  costByModule: {
    prospecting: number;
    matching: number;
    validation: number;
    other: number;
  };

  @ApiProperty({ description: 'Revenus générés' })
  totalRevenue: number;

  @ApiProperty({ description: 'ROI global (%)' })
  overallROI: number;

  @ApiProperty({ description: 'Coût par lead' })
  costPerLead: number;

  @ApiProperty({ description: 'Coût par prospect' })
  costPerProspect: number;

  @ApiProperty({ description: 'Coût par conversion' })
  costPerConversion: number;

  @ApiProperty({ description: 'Valeur moyenne par conversion' })
  avgRevenuePerConversion: number;

  @ApiProperty({ description: 'ROI par source' })
  roiBySource: {
    source: string;
    cost: number;
    revenue: number;
    roi: number;
    conversions: number;
  }[];

  @ApiProperty({ description: 'Tendance ROI (derniers 30 jours)' })
  roiTrend: {
    date: string;
    cost: number;
    revenue: number;
    roi: number;
  }[];

  @ApiProperty({ description: 'Période' })
  period: { from: string; to: string };
}

/**
 * Dashboard unifié AI Metrics
 */
export class UnifiedDashboardDto {
  @ApiProperty({ description: 'Vue d\'ensemble prospecting' })
  prospecting: ProspectingOverviewDto;

  @ApiProperty({ description: 'Funnel de vente' })
  salesFunnel: SalesFunnelDto;

  @ApiProperty({ description: 'Performance matching CRM' })
  crmMatching: CRMMatchingPerformanceDto;

  @ApiProperty({ description: 'Performance propriétés' })
  properties: PropertiesPerformanceDto;

  @ApiProperty({ description: 'ROI unifié' })
  roi: UnifiedROIDto;

  @ApiProperty({ description: 'Alertes et recommandations' })
  alerts: {
    type: 'warning' | 'info' | 'success';
    message: string;
    metric: string;
    value: number;
  }[];
}
