/**
 * Types d'outils disponibles pour l'orchestrateur IA
 */
export type ToolType =
  | 'serpapi'           // Recherche Google via SerpAPI
  | 'firecrawl'         // Scraping web via Firecrawl
  | 'puppeteer'         // Scraping via Puppeteer (built-in)
  | 'cheerio'           // Scraping via Cheerio (built-in)
  | 'llm'               // Appel à un LLM (extraction, analyse, etc.)
  | 'investment-import' // Import de projet d'investissement
  | 'prospection-internal' // Moteur de prospection interne
  | 'prospecting'       // Outils du module Prospecting (scraping, qualification, matching, validation)
  | 'custom';           // Outil custom (pour extensions futures)

/**
 * Représente un appel à un outil dans le plan d'exécution
 */
export interface ToolCall {
  /**
   * Identifiant unique de cet appel (utilisé pour les dépendances)
   */
  id: string;

  /**
   * Type d'outil à appeler
   */
  tool: ToolType;

  /**
   * Action spécifique à effectuer avec cet outil
   * Ex: 'search' pour serpapi, 'scrape' pour firecrawl, 'extract' pour llm
   */
  action: string;

  /**
   * Paramètres spécifiques à l'outil et à l'action
   */
  params: Record<string, any>;

  /**
   * Identifiant d'un autre ToolCall dont les résultats sont nécessaires
   * Permet de créer des dépendances entre appels
   */
  dependsOn?: string;

  /**
   * Métadonnées optionnelles
   */
  metadata?: {
    description?: string;
    priority?: number;
    timeout?: number;
    // internal retry metadata (not part of public API)
    _retryCount?: number;
  };
}

/**
 * Résultat de l'exécution d'un ToolCall
 */
export interface ToolCallResult {
  /**
   * ID du ToolCall exécuté
   */
  toolCallId: string;

  /**
   * Succès ou échec
   */
  success: boolean;

  /**
   * Données retournées par l'outil
   */
  data?: any;

  /**
   * Message d'erreur en cas d'échec
   */
  error?: string;

  /**
   * Métriques d'exécution
   */
  metrics?: {
    durationMs: number;
    tokensUsed?: number;
    cost?: number;
  };
}

/**
 * Plan d'exécution généré par le planner
 */
export interface ExecutionPlan {
  /**
   * Liste ordonnée des appels d'outils à effectuer
   */
  toolCalls: ToolCall[];

  /**
   * Estimation du coût total (optionnel)
   */
  estimatedCost?: number;

  /**
   * Description du plan
   */
  description?: string;
}
