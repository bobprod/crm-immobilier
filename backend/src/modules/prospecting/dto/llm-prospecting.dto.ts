/**
 * DTOs pour le service LLM Prospecting
 * Gere l'analyse IA des donnees scrappees
 */

// ============================================
// INPUT: Donnees brutes du scraping
// ============================================

/**
 * Represente un element brut scrappe par une source externe
 */
export interface RawScrapedItem {
  id?: string; // id technique optionnel cote scraping
  source: string; // 'pica' | 'serp' | 'meta' | 'linkedin' | 'firecrawl' | 'website' | ...
  url?: string; // URL de la page / post
  title?: string; // Titre de l'annonce / post si dispo
  text: string; // Texte brut scrappe (obligatoire)
  authorName?: string; // Nom affiche de l'auteur si dispo
  publishedAt?: Date; // Date de publication si connue
  rawMetadata?: any; // Tout ce qui est utile mais pas structure
}

// ============================================
// OUTPUT: Resultat de l'analyse LLM
// ============================================

/**
 * Ce que le LLM doit retourner apres analyse d'un RawScrapedItem
 */
export interface LLMAnalyzedLead {
  isLead: boolean; // vrai lead immobilier ou pas
  leadType: 'mandat' | 'requete' | 'inconnu';

  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  city?: string; // ville/zone normalisee (ex: "Tunis", "La Marsa")
  country?: string; // optionnel, ex: "Tunisie"

  budget?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null; // ex: "TND"
  };

  propertyTypes?: string[]; // ['appartement', 'maison', 'terrain', ...]
  intention?: 'acheter' | 'louer' | 'vendre' | 'investir' | 'inconnu';
  urgency?: 'basse' | 'moyenne' | 'haute' | 'inconnu';

  surfaceM2?: number | null;
  rooms?: number | null;

  seriousnessScore?: number; // 0-100 estimation du serieux
  notes?: string; // resume textuel lisible par l'agent
}

// ============================================
// STORAGE: Ce qu'on stocke dans Prisma
// ============================================

/**
 * Ce qu'on stockera dans la table prospecting_leads
 */
export interface ProspectingLeadCreateInput {
  source: string; // 'pica' | 'serp' | 'meta' | ...
  rawText: string; // texte original scrappe
  url?: string;
  title?: string;

  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  city?: string;
  country?: string;

  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetCurrency?: string | null;

  propertyTypes?: string[]; // array
  leadType: 'mandat' | 'requete' | 'inconnu';
  intention?: string | null;
  urgency?: string | null;

  surfaceM2?: number | null;
  rooms?: number | null;

  seriousnessScore?: number | null;

  validationStatus: 'pending' | 'valid' | 'suspicious' | 'spam';
  score: number; // score global 0-100
  status: 'nouveau' | 'contacte' | 'qualifie' | 'converti' | 'rejete';

  metadata?: any; // JSON complet avec tout ce que le LLM a rendu
}

// ============================================
// BATCH PROCESSING
// ============================================

export interface BatchAnalysisResult {
  total: number;
  analyzed: number;
  leads: number;
  nonLeads: number;
  errors: number;
  items: {
    raw: RawScrapedItem;
    analyzed: LLMAnalyzedLead | null;
    error?: string;
  }[];
}

export interface AnalysisConfig {
  model?: string; // ex: 'gpt-4', 'claude-3-sonnet'
  temperature?: number; // 0-1
  maxTokens?: number;
  batchSize?: number; // nombre d'items a traiter en parallele
  retryOnError?: boolean;
}

// ============================================
// VALIDATION
// ============================================

export type ValidationStatus = 'pending' | 'valid' | 'suspicious' | 'spam';
export type LeadType = 'mandat' | 'requete' | 'inconnu';
export type LeadStatus = 'nouveau' | 'contacte' | 'qualifie' | 'converti' | 'rejete';
export type Intention = 'acheter' | 'louer' | 'vendre' | 'investir' | 'inconnu';
export type Urgency = 'basse' | 'moyenne' | 'haute' | 'inconnu';

export interface ValidationResult {
  status: ValidationStatus;
  score: number;
  reasons: string[];
  flags: {
    hasValidEmail: boolean;
    hasValidPhone: boolean;
    hasName: boolean;
    hasBudget: boolean;
    hasLocation: boolean;
    isSpam: boolean;
    isDuplicate: boolean;
  };
}
