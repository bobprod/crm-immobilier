/**
 * Statut d'une prospection
 */
export enum ProspectionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

/**
 * Lead généré par la prospection
 */
export interface ProspectionLead {
  /**
   * Nom du contact
   */
  name: string;

  /**
   * Email (si disponible)
   */
  email?: string;

  /**
   * Téléphone (si disponible)
   */
  phone?: string;

  /**
   * Entreprise / Agence
   */
  company?: string;

  /**
   * Rôle / Poste
   */
  role?: string;

  /**
   * Contexte / Description
   */
  context: string;

  /**
   * URL source
   */
  source: string;

  /**
   * Score de confiance (0-1)
   */
  confidence?: number;
}

/**
 * Résultat d'une prospection
 */
export interface ProspectionResult {
  /**
   * ID unique de la prospection
   */
  id: string;

  /**
   * Statut
   */
  status: ProspectionStatus;

  /**
   * Leads générés
   */
  leads: ProspectionLead[];

  /**
   * Statistiques
   */
  stats: {
    totalLeads: number;
    withEmail: number;
    withPhone: number;
    avgConfidence: number;
  };

  /**
   * Métadonnées
   */
  metadata: {
    zone: string;
    targetType: string;
    propertyType?: string;
    budget?: string;
    keywords?: string[];
    executionTimeMs: number;
    cost?: number;
    /** Nombre d'URLs scrapées avec succès (mode URL) */
    urlsScraped?: number;
    /** Nombre total d'URLs fournies (mode URL) */
    urlsTotal?: number;
    /** Erreurs de scraping par URL (mode URL) */
    scrapingErrors?: string[];
  };

  /**
   * Erreurs éventuelles
   */
  errors?: string[];

  /**
   * Date de création
   */
  createdAt: Date;

  /**
   * Date de fin
   */
  completedAt?: Date;
}
