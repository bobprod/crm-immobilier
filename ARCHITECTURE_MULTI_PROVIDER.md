/**
 * ARCHITECTURE MULTI-PROVIDER - Résumé d'implémentation
 *
 * Crée: January 8, 2026
 * Objectif: Permettre à l'utilisateur de choisir les providers de scraping/recherche
 *          selon la disponibilité des clés API en mode BYOK
 */

=============================================================================
1. STRUCTURE À DEUX NIVEAUX
=============================================================================

Niveau 1: RECHERCHE & ORCHESTRATION (ai-orchestrator module)
─────────────────────────────────────
  ├─ ProviderSelectorService (NOUVEAU)
  │  ├─ Vérifie la disponibilité des clés API
  │  ├─ Sélectionne la stratégie optimale de provider
  │  ├─ Retourne les tools disponibles pour IntentAnalyzer
  │  └─ Supporte dynamiquement: SerpAPI, Firecrawl, Puppeteer, Cheerio
  │
  ├─ IntentAnalyzerService (À MODIFIER)
  │  ├─ Actuellement: Force toujours ['serpapi', 'firecrawl', 'llm']
  │  └─ À faire: Utiliser ProviderSelectorService.getAvailableTools()
  │
  ├─ ExecutionPlannerService (À MODIFIER)
  │  ├─ Actuellement: Force toujours tool: 'serpapi'
  │  └─ À faire: Utiliser ProviderSelectorService.selectOptimalStrategy()
  │
  └─ ToolExecutorService (À MODIFIER)
     ├─ Actuellement: Exécute SerpAPI, Firecrawl, LLM en dur
     └─ À faire: Supporter dynamiquement Puppeteer, Cheerio

Niveau 2: SCRAPING SIMPLE (scraping module)
─────────────────────────
  ├─ WebDataService
  │  ├─ Sélectionne le meilleur provider pour scraper une URL
  │  ├─ Stratégie:
  │  │  - Sites complexes → Firecrawl > Puppeteer
  │  │  - Sites simples → Cheerio
  │  │  - JS requis → Puppeteer
  │  └─ Fallback automatique si un provider échoue
  │
  └─ Providers:
     ├─ FirecrawlService (API payante)
     ├─ PuppeteerService (gratuit, gourmand en CPU)
     └─ CheerioService (gratuit, rapide)

=============================================================================
2. NOUVELLES CLASSES/ENUMS (provider-selector.service.ts)
=============================================================================

enum ScrapingProvider {
  SERPAPI = 'serpapi',      // Recherche Google
  FIRECRAWL = 'firecrawl',  // Scraping IA
  PUPPETEER = 'puppeteer',  // Browser automation
  CHEERIO = 'cheerio',      // HTML parsing
}

interface ProviderConfig {
  provider: ScrapingProvider;
  available: boolean;
  requiresApiKey: boolean;
  priority: number;        // 1 = meilleur, 10 = moins bon
  description: string;
  tier: 'search' | 'scraping' | 'enrichment'; // Niveau fonctionnel
}

interface ProviderStrategy {
  search: ScrapingProvider[];      // Quoi utiliser pour chercher
  scrape: ScrapingProvider[];      // Quoi utiliser pour scraper
  enrichment: ScrapingProvider[];  // Quoi utiliser pour enrichir
  analysis: string[];              // Toujours 'llm'
}

=============================================================================
3. MÉTHODES PRINCIPALES (ProviderSelectorService)
=============================================================================

async getAvailableProviders(userId, agencyId?)
├─ Teste la disponibilité de chaque provider
├─ Retourne une Map<ScrapingProvider, ProviderConfig>
└─ Providers intégrés (Puppeteer, Cheerio) toujours disponibles

async selectOptimalStrategy(userId, agencyId?)
├─ Appelle getAvailableProviders()
├─ Construit une stratégie d'exécution optimale
├─ Respecte la hiérarchie: Firecrawl > Puppeteer > Cheerio
└─ Retourne ProviderStrategy

async getAvailableTools(userId, agencyId?)
├─ Retourne les tools DISPONIBLES pour IntentAnalyzer
├─ Exemple: ['llm', 'serpapi', 'firecrawl']
├─ Exemple: ['llm', 'puppeteer', 'cheerio'] (fallback)
└─ Jamais vide (au minimum LLM + moteurs intégrés)

async getPreferredProvider(task, userId, agencyId?)
├─ task: 'search' | 'scrape' | 'enrichment'
├─ Retourne le premier provider disponible pour cette tâche
└─ Exemple: 'firecrawl' si disponible, sinon 'puppeteer'

async isProviderAvailable(provider, userId, agencyId?)
└─ Vérifie si un provider spécifique est disponible

=============================================================================
4. INTÉGRATION AVEC ApiKeysService
=============================================================================

ApiKeysService est utilisé pour récupérer les clés API:
- 'serp' pour SerpAPI
- 'firecrawl' pour Firecrawl

Cascade de recherche (fallback intelligent):
1. Clé au niveau USER (ai_settings)
2. Clé au niveau AGENCY (AgencyApiKeys)
3. Clé SUPER ADMIN (GlobalSettings)

=============================================================================
5. HIÉRARCHIE DE SÉLECTION
=============================================================================

RECHERCHE (SerpAPI):
  ├─ SerpAPI (si clé disponible)
  └─ ÉCHEC: Aucune alternative
     Note: Les moteurs intégrés ne savent pas chercher sur Google

SCRAPING (pour les URLs trouvées):
  ├─ Firecrawl (si clé disponible) → IA intégrée, sites complexes
  ├─ Puppeteer (toujours disponible) → Sites JS dynamiques
  └─ Cheerio (toujours disponible) → Sites statiques

ENRICHISSEMENT (pour les données):
  ├─ Puppeteer
  └─ Cheerio

ANALYSE (IA):
  └─ LLM (toujours disponible)

=============================================================================
6. SCÉNARIOS D'UTILISATION
=============================================================================

Scénario A: Toutes les clés API disponibles
───────────────────────────────────────────
Clés: SerpAPI + Firecrawl
Stratégie:
  search: [SerpAPI]
  scrape: [Firecrawl, Puppeteer, Cheerio]
  enrichment: [Puppeteer, Cheerio]
Exécution: SerpAPI → Firecrawl → LLM ✅ Optimal

Scénario B: Clés externes indisponibles
─────────────────────────────────────
Clés: aucune
Stratégie:
  search: [] ⚠️ PROBLÈME
  scrape: [Puppeteer, Cheerio]
  enrichment: [Puppeteer, Cheerio]
Exécution: ❌ Impossible de chercher sur Google
Fallback: Utiliser des sources statiques connues

Scénario C: Seulement Firecrawl
────────────────────────────
Clés: Firecrawl seulement
Stratégie:
  search: [] ⚠️ PROBLÈME
  scrape: [Firecrawl, Puppeteer, Cheerio]
  enrichment: [Puppeteer, Cheerio]
Exécution: ❌ Impossible de chercher
Fallback: Scraper des URLs fixes

=============================================================================
7. MODIFICATIONS À FAIRE (PROCHAINES ÉTAPES)
=============================================================================

1. IntentAnalyzerService
   ├─ Injécter ProviderSelectorService
   ├─ Remplacer la liste hardcodée de tools
   ├─ Utiliser: await providerSelector.getAvailableTools(userId, agencyId)
   └─ Adapter les règles de validation selon les tools disponibles

2. ExecutionPlannerService
   ├─ Injécter ProviderSelectorService
   ├─ Remplacer tool: 'serpapi' hardcodé
   ├─ Utiliser: await providerSelector.selectOptimalStrategy()
   └─ Adapter les ToolCalls selon la stratégie

3. ToolExecutorService
   ├─ Supporter les nouveaux tools: 'puppeteer', 'cheerio'
   ├─ Implémenter l'exécution de ces tools
   └─ Utiliser WebDataService pour les appels

4. Ajouter ToolCall pour WebDataService
   ├─ tool: 'web-data' (orchestrateur)
   ├─ Déléguer à WebDataService qui choisit le meilleur provider
   └─ Support fallback automatique

=============================================================================
8. AVANTAGES DE CETTE ARCHITECTURE
=============================================================================

✅ FLEXIBILITÉ:
   - L'utilisateur peut configurer les clés API qu'il veut
   - Le système s'adapte automatiquement

✅ RESILIENCE:
   - Fallback automatique entre providers
   - Pas d'erreur si un provider échoue

✅ COÛT OPTIMISÉ:
   - Préfère les providers gratuits (Puppeteer, Cheerio) si possibles
   - Utilise les APIs payantes (SerpAPI, Firecrawl) seulement quand nécessaire

✅ MAINTAINABILITÉ:
   - Ajout facile de nouveaux providers
   - Logique centralisée dans ProviderSelectorService

✅ COMPATIBILITÉ:
   - Supporte à la fois le scraping simple (WebDataService)
   - Et l'orchestration IA complexe (ExecutionPlanner)

=============================================================================
9. FICHIERS MODIFIÉS
=============================================================================

CRÉÉ:
  ✅ backend/src/modules/intelligence/ai-orchestrator/services/provider-selector.service.ts

MODIFIÉ:
  ✅ backend/src/modules/intelligence/ai-orchestrator/services/index.ts
  ✅ backend/src/modules/intelligence/ai-orchestrator/ai-orchestrator.module.ts

À MODIFIER (PROCHAINES ÉTAPES):
  ❌ backend/src/modules/intelligence/ai-orchestrator/services/intent-analyzer.service.ts
  ❌ backend/src/modules/intelligence/ai-orchestrator/services/execution-planner.service.ts
  ❌ backend/src/modules/intelligence/ai-orchestrator/services/tool-executor.service.ts

=============================================================================
