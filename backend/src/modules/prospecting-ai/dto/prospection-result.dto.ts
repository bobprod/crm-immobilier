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
    /** Nombre d'URLs scrappées lors de la prospection (optionnel) */
    urlsScraped?: number;
    /** Nombre total d'URLs trouvées / candidates (optionnel) */
    urlsTotal?: number;
    /** Erreurs de scraping collectées (optionnel) */
    scrapingErrors?: any[];
    executionTimeMs: number;
    cost?: number;
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
