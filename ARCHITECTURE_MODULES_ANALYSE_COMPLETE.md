# 📊 ANALYSE COMPLÈTE : Architecture Web Data + AI Orchestrator + LLM Router

## 🏗️ Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROSPECTING-AI MODULE                          │
│  (Utilise AI Orchestrator pour générer des leads automatiquement)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AI-ORCHESTRATOR MODULE                           │
│                 (Orchestre le workflow complet)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Intent Analyzer    → Comprend l'objectif (prospection...)   │
│  2. Execution Planner  → Planifie les outils à utiliser          │
│  3. Tool Executor      → Exécute les appels (search, scrape...)  │
│  4. Budget Tracker     → Contrôle les dépenses et limites        │
└──────────────────┬──────────────────────────┬────────────────────┘
                   │                          │
                   ▼                          ▼
        ┌──────────────────┐      ┌──────────────────────┐
        │  LLM-ROUTER      │      │   WEB-DATA SERVICE   │
        │  (Sélectionne    │      │   (Moteur scraping)  │
        │   le meilleur    │      │                      │
        │   provider LLM)  │      │  - Firecrawl        │
        │                  │      │  - Cheerio          │
        │ - BYOK support   │      │  - Puppeteer        │
        │ - Routing        │      └──────────────────────┘
        │   intelligent    │
        │ - Performance    │
        │   tracking       │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────────────────────────────┐
        │    LLM-PROVIDER-FACTORY                   │
        │  (Crée instances de providers avec BYOK)  │
        │                                            │
        │  - ApiKeysService injection               │
        │  - Fallback: user→agency→global           │
        │  - Support 8 providers                    │
        └────────┬─────────────────────────────────┘
                 │
        ┌────────┴──────────────────────────────┐
        │                                         │
        ▼                                         ▼
    ┌──────────────┐      ┌──────────────────────────────────┐
    │  GEMINI      │      │  OPENAI  ANTHROPIC  DEEPSEEK ... │
    │  (BYOK)      │      │  (Avec support BYOK et global)   │
    └──────────────┘      └──────────────────────────────────┘
```

---

## 1. 🔍 MODULE WEB-DATA (Moteur de Scraping)

### 1.1 Vue d'ensemble

**Fichier**: `backend/src/modules/scraping/services/web-data.service.ts`

**Responsabilité**: Moteur unifié pour scraper des pages web avec sélection intelligente du provider.

### 1.2 Architecture interne

```
WebDataService (Point d'entrée)
├── fetchHtml()              → Récupère contenu HTML d'une URL
├── fetchMultipleUrls()      → Scrape plusieurs URLs en parallèle
├── extractStructuredData()  → Extraction IA avec Firecrawl
├── testProvider()           → Teste la disponibilité d'un provider
└── getAvailableProviders()  → Liste les providers disponibles
```

### 1.3 Les 3 providers de scraping

#### **Provider 1: Firecrawl** (Tier 1 - IA intégrée)
```typescript
- Coût: ~$0.001 par page (freemium)
- Cas d'usage: Sites complexes, extraction IA
- Avantages:
  ✅ IA intégrée (extraction structurée)
  ✅ Gère JavaScript, blocages anti-bot
  ✅ Retourne Markdown structuré
- Limitations:
  ❌ API payante
  ❌ Nécessite clé API
```

#### **Provider 2: Cheerio** (Tier 2 - Rapide & gratuit)
```typescript
- Coût: 0€ (gratuit, local)
- Cas d'usage: Sites statiques simples
- Avantages:
  ✅ Gratuit et rapide
  ✅ Parsing jQuery-like
  ✅ Pas de dépendance externe
- Limitations:
  ❌ Ne supporte pas JavaScript
  ❌ Bloqué par certains sites

Sites ciblés: immobilier.com, tayara.tn, afariat.com, wikipedia.org
```

#### **Provider 3: Puppeteer** (Tier 3 - Complet & gratuit)
```typescript
- Coût: 0€ (gratuit, local - CPU)
- Cas d'usage: Sites dynamiques JavaScript
- Avantages:
  ✅ Support JavaScript complet
  ✅ Peut contourner anti-bots
  ✅ Screenshots, automation
- Limitations:
  ❌ Consomme CPU/RAM
  ❌ Plus lent que Cheerio

Sites ciblés: Facebook, LinkedIn, Instagram, Twitter/X
```

### 1.4 Logique de sélection du provider

```typescript
private selectBestProvider(url, options): WebDataProvider {

  // 1. Sites complexes (JavaScript) → Puppeteer
  if (url.includes('facebook.com') || url.includes('linkedin.com')) {
    return 'puppeteer';
  }

  // 2. Sites simples/statiques → Cheerio (rapide)
  if (url.includes('immobilier.com')) {
    return 'cheerio';
  }

  // 3. Si prompt d'extraction fourni → Firecrawl (IA)
  if (options.extractionPrompt) {
    return 'firecrawl';
  }

  // 4. Défaut: Cheerio puis fallback automatique
  return 'cheerio';
}
```

### 1.5 Stratégie de fallback automatique

```typescript
async fetchHtml(url, options) {
  try {
    // 1. Essayer avec provider sélectionné
    return await fetchWithProvider(url, provider);
  } catch (error) {
    if (options.forceProvider) {
      throw error;  // Ne pas faire de fallback si forcé
    }

    // 2. Fallback automatique: essayer un autre provider
    // cheerio → puppeteer → firecrawl
    return await fallbackFetch(url, provider);
  }
}
```

### 1.6 Méthodes principales

| Méthode | Paramètres | Retour | Cas d'usage |
|---------|-----------|--------|-----------|
| `fetchHtml()` | url, options | WebDataResult | Scraper une page |
| `fetchMultipleUrls()` | urls[], options | WebDataResult[] | Scraper plusieurs URLs |
| `extractStructuredData()` | url, prompt | JSON | Extraire données structurées avec IA |
| `testProvider()` | provider | boolean | Tester si provider disponible |
| `getAvailableProviders()` | tenantId | Provider[] | Lister providers actifs |

### 1.7 Interface WebDataResult

```typescript
interface WebDataResult {
  provider: 'firecrawl' | 'cheerio' | 'puppeteer';
  url: string;
  html?: string;           // HTML brut
  text: string;            // Texte extrait
  markdown?: string;       // Format Markdown (Firecrawl)
  title?: string;          // Titre de la page
  metadata?: any;          // Meta tags, og:, etc.
  extractedData?: any;     // Données structurées (IA)
  screenshot?: string;     // Base64 screenshot (Puppeteer)
}
```

---

## 2. 🎯 MODULE AI-ORCHESTRATOR (Orchestrateur IA)

### 2.1 Vue d'ensemble

**Fichier**: `backend/src/modules/intelligence/ai-orchestrator/services/ai-orchestrator.service.ts`

**Responsabilité**: Orchestre le workflow complet d'une requête IA (prospection, analyse, etc.)

### 2.2 Workflow en 4 étapes

```
User Request (prospection)
        ↓
  [Step 0: Budget Check]
        ↓
  [Step 1: Analyze Intent]
    ↓ (Comprend l'objectif)
  [Step 2: Create Execution Plan]
    ↓ (Planifie les outils)
  [Step 3: Execute Plan]
    ↓ (Lance les appels)
  [Step 4: Synthesize Results]
    ↓ (Résume les résultats)
  Final Response
```

### 2.3 Sous-services de l'orchestrateur

#### **1. IntentAnalyzerService**
```typescript
analyze(request) → IntentAnalysis {
  intention: 'prospection' | 'analysis' | 'lead_enrichment' | ...
  confidence: 0.95
  requiredTools: ['search-prospects', 'scrape-data', 'extract-leads']
  context: { zone, targetType, ... }
}
```

#### **2. ExecutionPlannerService**
```typescript
createPlan(intent) → ExecutionPlan {
  toolCalls: [
    { id: 'search-1', tool: 'serpapi', params: {...} },
    { id: 'scrape-1', tool: 'web-data', params: {...} },
    { id: 'extract-1', tool: 'llm', params: {...} }
  ],
  dependencies: { 'scrape-1': ['search-1'] }  // Ordre d'exécution
}
```

#### **3. ToolExecutorService**
```typescript
executePlan(plan) → ToolCallResult[] {
  - search-prospects: ✅ 5 prospects trouvés
  - scrape-data: ✅ 5 pages récupérées
  - extract-leads: ✅ 5 leads extraits

  Retour: [ { success, data, metrics.cost } ]
}
```

#### **4. BudgetTrackerService**
```typescript
checkBudget(tenantId, maxCost)
  → { allowed: true, remaining: 2.5 }

recordSpending(tenantId, cost, details)
  → Enregistre les dépenses en BD
```

### 2.4 Orchestration Request DTO

```typescript
interface OrchestrationRequestDto {
  tenantId: string;
  userId?: string;
  objective: 'prospection' | 'analysis' | ...;
  context: {
    zone?: string;
    targetType?: string;
    propertyType?: string;
    keywords?: string[];
    ...
  };
  options?: {
    executionMode: 'auto' | 'manual' | 'dry-run';
    maxCost?: number;
    timeout?: number;
  };
}
```

### 2.5 Orchestration Response DTO

```typescript
interface OrchestrationResponseDto {
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'PLANNING';
  plan: ExecutionPlan;
  results: ToolCallResult[];
  finalResult: any;  // Résultats synthétisés
  metrics: {
    totalDurationMs: number;
    totalTokensUsed: number;
    totalCost: number;
    successfulCalls: number;
    failedCalls: number;
  };
  errors?: string[];
}
```

### 2.6 Synthèse des résultats

```typescript
private synthesizeResults(objective, results) {
  switch (objective) {
    case 'prospection':
      return synthesizeProspectionResults(results);
    case 'investment_benchmark':
      return synthesizeInvestmentResults(results);
    case 'property_analysis':
      return synthesizePropertyAnalysisResults(results);
    case 'lead_enrichment':
      return synthesizeLeadEnrichmentResults(results);
  }
}
```

---

## 3. 🚀 MODULE LLM-ROUTER (Sélection intelligente du provider)

### 3.1 Vue d'ensemble

**Fichier**: `backend/src/modules/intelligence/llm-config/llm-router.service.ts`

**Responsabilité**: Sélectionner automatiquement le meilleur provider LLM selon le type d'opération.

### 3.2 Types d'opérations et priorités

| Opération | Critère | Priorité | Cas d'usage |
|-----------|---------|----------|-----------|
| `seo` | Qualité max | Anthropic > OpenAI > Gemini | Génération SEO |
| `prospecting_mass` | Coût min | DeepSeek > Qwen > Mistral | Traitement masse |
| `prospecting_qualify` | Équilibré | Gemini > Mistral > Qwen | Qualification leads |
| `analysis_quick` | Vitesse | Gemini > Qwen > DeepSeek | Analyse rapide |
| `content_generation` | Qualité | Anthropic > Mistral > OpenAI | Contenu |
| `long_context` | Contexte | Kimi > Anthropic > OpenAI | Documents longs |
| `scraping_analysis` | Équilibré | Mistral > Gemini > DeepSeek | Analyse scraping |

### 3.3 Matrice de routing (ROUTING_RULES)

```typescript
const ROUTING_RULES: Record<OperationType, {
  priority: string[];           // Ordre de préférence
  criteria: 'quality' | 'cost' | 'speed' | 'balanced' | 'context_window';
  description: string;
}> = {
  seo: {
    priority: ['anthropic', 'openai', 'gemini', 'mistral'],
    criteria: 'quality',
    description: 'Qualité maximale pour le SEO'
  },
  prospecting_mass: {
    priority: ['deepseek', 'qwen', 'mistral', 'gemini'],
    criteria: 'cost',
    description: 'Coût minimal pour traitement en masse'
  },
  // ... autres opérations
};
```

### 3.4 Algorithme de sélection (selectBestProvider)

```typescript
async selectBestProvider(userId, operationType, providerOverride) {

  // 1. Override manuel → utiliser directement
  if (providerOverride && providerOverride !== 'auto') {
    return getSpecificProvider(userId, providerOverride);
  }

  // 2. Récupérer tous les providers actifs de l'utilisateur
  const userProviders = await getUserActiveProviders(userId);

  if (userProviders.length === 0) {
    throw 'Aucun provider configuré';
  }

  // 3. Appliquer les règles de routing intelligentes
  const rules = ROUTING_RULES[operationType];

  // 4. Vérifier les performances historiques
  const performance = await getPerformanceMetrics(userId, userProviders);

  // 5. Sélectionner le meilleur selon: règles > performances > coût
  const selectedProvider = selectByRules(userProviders, rules, performance);

  // 6. Créer l'instance via Factory
  return providerFactory.createProviderForUser(userId, selectedProvider);
}
```

### 3.5 Méthodes du LLMRouter

```typescript
selectBestProvider(userId, operationType, override?)
  → Sélectionne le meilleur provider

getUserActiveProviders(userId)
  → Liste les providers actifs de l'utilisateur

applyIntelligentRouting(providers, operationType, userId)
  → Applique les règles de routing

getSpecificProvider(userId, providerName)
  → Retourne un provider spécifique

logProviderSelection(userId, provider, operationType)
  → Enregistre la sélection pour analytics

getPerformanceMetrics(userId, providers)
  → Récupère les performances historiques
```

---

## 4. 🔧 MODULE LLM-PROVIDER-FACTORY (Création des providers)

### 4.1 Vue d'ensemble

**Fichier**: `backend/src/modules/intelligence/llm-config/providers/llm-provider.factory.ts`

**Responsabilité**: Factory qui crée des instances de providers LLM avec support BYOK.

### 4.2 Diagramme BYOK (Bring Your Own Key)

```
User Request
    ↓
LLMProviderFactory.createProviderForUser(userId, 'GEMINI')
    ↓
[1] Vérifier UserLlmProvider.GEMINI
    ├─ Si API Key présente → 🔑 BYOK utilisé ✅
    │  (L'utilisateur a fourni sa clé personnelle)
    │
    └─ Si pas de clé → Fallback #2

[2] ApiKeysService.getApiKey('GEMINI', userId)
    ├─ Vérifier clé de l'utilisateur
    ├─ Vérifier clé de l'agence
    ├─ Vérifier clé globale (superadmin)
    └─ Retourner la première trouvée

[3] Créer l'instance du provider avec la clé
    └─ GeminiProvider instance prête à utiliser
```

### 4.3 Méthode createProviderForUser

```typescript
async createProviderForUser(userId: string, providerName: string) {

  // 1. Valider le provider est supporté
  validateProvider(providerName);

  // 2. Chercher la clé BYOK dans UserLlmProvider
  const userProvider = await prisma.userLlmProvider.findUnique({
    where: { userId_provider: { userId, provider: providerName } }
  });

  if (userProvider?.apiKey) {
    console.log(`🔑 Clé BYOK trouvée`);
    return createProviderInstance({
      provider: providerName,
      apiKey: userProvider.apiKey,
      model: userProvider.model
    });
  }

  // 3. Fallback: ApiKeysService (user → agency → global)
  const apiKey = await apiKeysService.getApiKey(providerName, userId);

  if (!apiKey) {
    throw 'Aucune clé API trouvée pour ce provider';
  }

  return createProviderInstance({
    provider: providerName,
    apiKey: apiKey,
    model: getDefaultModel(providerName)
  });
}
```

### 4.4 Providers supportés

```typescript
interface LLMConfig {
  provider: 'anthropic'   // Claude (Qualité)
           | 'openai'      // GPT-4 (Premium)
           | 'gemini'      // Gemini (Équilibré) ← BYOK
           | 'openrouter'  // Multi-models
           | 'deepseek'    // DeepSeek (Pas cher)
           | 'qwen'        // Qwen (Rapide)
           | 'kimi'        // Kimi (Contexte long)
           | 'mistral';    // Mistral (Équilibré)
  apiKey: string;
  model?: string;
}
```

### 4.5 Tarification par provider (pour 1M tokens)

```typescript
const PRICING_PER_1M_TOKENS = {
  anthropic:  { input: 3.0,    output: 15.0 },   // Cher, qualité
  openai:     { input: 10.0,   output: 30.0 },   // Premium
  gemini:     { input: 1.25,   output: 5.0 },    // Bon rapport
  openrouter: { input: 3.0,    output: 15.0 },   // Multi
  deepseek:   { input: 0.14,   output: 0.28 },   // 🔥 Pas cher
  qwen:       { input: 0.5,    output: 1.5 },    // Bon marché
  kimi:       { input: 1.0,    output: 2.0 },    // Pas cher
  mistral:    { input: 2.0,    output: 6.0 }     // Équilibré
};
```

### 4.6 Modèles par défaut

```typescript
const DEFAULT_MODELS = {
  anthropic:  'claude-sonnet-4-20250514',
  openai:     'gpt-4-turbo-preview',
  gemini:     'gemini-1.5-pro',
  openrouter: 'anthropic/claude-3.5-sonnet',
  deepseek:   'deepseek-chat',
  qwen:       'qwen-turbo',
  kimi:       'moonshot-v1-8k',
  mistral:    'mistral-small-latest'
};
```

---

## 5. 🎪 MODULE PROSPECTING-AI (Prospection automatisée)

### 5.1 Vue d'ensemble

**Fichier**: `backend/src/modules/prospecting-ai/services/prospection.service.ts`

**Responsabilité**: Générer automatiquement des leads via l'AI Orchestrator.

### 5.2 Workflow de prospection

```
POST /api/prospecting-ai/start
  ↓
ProspectionService.startProspection({
  tenantId, userId,
  zone: 'Paris 15',
  targetType: 'vendeurs',
  propertyType: 'appartement',
  maxLeads: 20
})
  ↓
Choisir le moteur:
  ├─ 'internal' (par défaut) → AI Orchestrator
  ├─ 'pica-ai' (futur)
  └─ Autres moteurs...
  ↓
runInternalProspection()
  ↓
AiOrchestratorService.orchestrate({
  objective: 'prospection',
  context: { zone, targetType, ... }
})
  ↓
[Step 1] Analyser l'intention
[Step 2] Planifier les outils (search, scrape, extract)
[Step 3] Exécuter: SerpAPI → WebData → LLM
[Step 4] Synthétiser les résultats
  ↓
ProspectionResult {
  id: 'prosp-...',
  status: 'COMPLETED',
  leads: [ { name, email, phone, ... } ],
  stats: { totalLeads, withEmail, withPhone }
}
```

### 5.3 DTO StartProspectionDto

```typescript
interface StartProspectionDto {
  zone: string;              // Exemple: 'Paris 15'
  targetType: 'vendeurs' | 'acheteurs' | 'investisseurs' | 'locataires' | 'proprietaires';
  propertyType: 'appartement' | 'maison' | 'terrain' | 'commercial' | 'bureau' | 'immeuble';
  maxLeads?: number;         // Défaut: 20
  budget?: number;           // Budget max en €
  keywords?: string[];       // Mots-clés additionnels
  options?: {
    engine?: 'internal' | 'pica-ai';  // Moteur
    maxCost?: number;                  // Coût max en $
  };
}
```

### 5.4 Extraction des leads depuis l'orchestration

```typescript
private extractLeadsFromOrchestration(result) {
  // Les leads sont dans le dernier résultat réussi
  const lastSuccess = result.finalResult;

  // Parser les leads retournés par le LLM
  // Format: JSON structuré avec { name, email, phone, source, ... }

  return leads.map(lead => ({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    source: lead.source,
    confidence: lead.confidence,
    metadata: lead.metadata
  }));
}
```

### 5.5 Calcul des statistiques

```typescript
private calculateStats(leads) {
  return {
    totalLeads: leads.length,
    withEmail: leads.filter(l => l.email).length,
    withPhone: leads.filter(l => l.phone).length,
    avgConfidence: leads.reduce((sum, l) => sum + (l.confidence || 0), 0) / leads.length
  };
}
```

---

## 6. 🔌 INTÉGRATIONS ENTRE LES MODULES

### 6.1 Chaîne d'appel complète

```
ProspectingAiController
  ↓
ProspectionService.startProspection()
  ↓
AiOrchestratorService.orchestrate()
  ├─ IntentAnalyzerService.analyze()
  ├─ ExecutionPlannerService.createPlan()
  └─ ToolExecutorService.executePlan()
      ├─ SerpApiService.search()
      │
      ├─ WebDataService.fetchHtml()
      │   └─ Choisit provider (Firecrawl/Cheerio/Puppeteer)
      │
      └─ LLMRouterService.selectBestProvider()
          └─ LLMProviderFactory.createProviderForUser()
              └─ Instance du provider (avec BYOK support)
```

### 6.2 Dépendances d'injection

```typescript
// ProspectingAiModule
@Module({
  imports: [
    AiOrchestratorModule,  // Pour orchestrer
  ],
  providers: [ProspectionService],
  controllers: [ProspectingAiController]
})

// AiOrchestratorModule
@Module({
  imports: [
    ScrapingModule,        // Pour WebDataService
    LLMConfigModule,       // Pour LLMRouterService
  ],
  providers: [
    IntentAnalyzerService,
    ExecutionPlannerService,
    ToolExecutorService,
    BudgetTrackerService,
    AiOrchestratorService
  ]
})

// LLMConfigModule
@Module({
  imports: [
    AiBillingModule,  // ✅ Pour ApiKeysService (support BYOK)
  ],
  providers: [
    LLMRouterService,
    LLMProviderFactory,
    // Tous les providers (GeminiProvider, OpenAIProvider, ...)
  ]
})
```

---

## 7. 💰 BUDGET & COÛTS

### 7.1 Tracking des dépenses

```typescript
BudgetTrackerService {

  checkBudget(tenantId, maxCost)
    → Vérifie si le budget est disponible

  recordSpending(tenantId, cost, details)
    → Enregistre les dépenses en BD
    → Calcule tokens utilisés
    → Stocke dans llmUsageLog
}
```

### 7.2 Coûts estimés par opération

| Opération | Provider | Coût estimé |
|-----------|----------|-----------|
| Prospection (20 leads) | DeepSeek | ~$0.02 |
| Prospection (20 leads) | Gemini | ~$0.05 |
| Prospection (20 leads) | OpenAI | ~$0.50 |
| Scraping + Analyse | Firecrawl | $0.01 × 5 = $0.05 |

---

## 8. 🧪 CAS D'USAGE COMPLETS

### Cas #1: Prospection avec Gemini BYOK

```bash
# 1. Utilisateur configure sa clé Gemini
INSERT INTO userLlmProvider
VALUES (userId, 'GEMINI', 'AIzaSy...', true, 1);

# 2. Lance une prospection
POST /api/prospecting-ai/start
{
  "zone": "Paris 15",
  "targetType": "vendeurs",
  "propertyType": "appartement"
}

# 3. Système utilise automatiquement la clé BYOK de l'utilisateur
LLMProviderFactory.createProviderForUser(userId, 'GEMINI')
  → Trouve la clé dans UserLlmProvider
  → Crée instance GeminiProvider avec clé utilisateur
  → Prospect generated avec Gemini BYOK ✅
```

### Cas #2: Sélection intelligente selon l'opération

```typescript
// Prospection en masse → DeepSeek (pas cher)
LLMRouterService.selectBestProvider(userId, 'prospecting_mass')
  → Regarde ROUTING_RULES['prospecting_mass']
  → Sélectionne DeepSeek (priorité 1, critère 'cost')
  → Cost: $0.02 pour 1M tokens

// Contenu SEO → Anthropic (qualité)
LLMRouterService.selectBestProvider(userId, 'seo')
  → Regarde ROUTING_RULES['seo']
  → Sélectionne Anthropic (priorité 1, critère 'quality')
  → Cost: $3.0 input, $15.0 output pour 1M tokens
```

### Cas #3: Fallback automatique si provider indisponible

```typescript
// Utilisateur configure Gemini et OpenAI
userProviders = [
  { provider: 'GEMINI', priority: 1, isActive: true },
  { provider: 'OPENAI', priority: 2, isActive: true }
]

// Prospection → Sélectionne Gemini
selectBestProvider() → GEMINI

// Si Gemini API en panne → Fallback automatique
try {
  GeminiProvider.generate() → ERREUR
} catch {
  // Essayer le provider suivant (priority 2)
  OpenAIProvider.generate() → SUCCESS ✅
}
```

---

## 9. 📊 FLUX DE DONNÉES - Prospection Complète

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER REQUEST                                             │
│    POST /api/prospecting-ai/start                           │
│    { zone: 'Paris 15', targetType: 'vendeurs', ... }       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ORCHESTRATOR DECIDES                                     │
│    Intent: 'prospection'                                    │
│    Tools: ['search-prospects', 'scrape-listings', 'extract']│
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TOOL EXECUTOR                                            │
│    Tool 1: SerpApiService.search('vendeurs Paris 15')       │
│    → Returns: URLs des annonces                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SCRAPING LAYER                                           │
│    WebDataService.fetchMultipleUrls(urls)                   │
│    → Select best provider per URL (Cheerio/Puppeteer/FC)    │
│    → Returns: HTML content                                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. LLM EXTRACTION                                           │
│    LLMRouterService.selectBestProvider(user, 'scraping_...')│
│    → 'mistral' selected (balanced)                          │
│    → MistralProvider(apiKey).generate(extractionPrompt)     │
│    → Returns: Structured leads                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. RESULTS SYNTHESIS                                        │
│    synthesizeProspectionResults(leads)                      │
│    → { totalLeads, withEmail, avgConfidence }              │
│    → ProspectionResult                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. 📋 RÉSUMÉ TECHNIQUE

| Composant | Responsabilité | Clé | Status |
|-----------|----------------|-----|--------|
| **WebDataService** | Scraping unifié | Sélection intelligente provider | ✅ Prod |
| **AiOrchestratorService** | Orchestre le workflow | Planification + Budget | ✅ Prod |
| **LLMRouterService** | Sélectionne le meilleur LLM | Routing intelligent | ✅ Prod |
| **LLMProviderFactory** | Crée instances avec BYOK | Support BYOK + Fallback | ✅ Prod |
| **ProspectionService** | Génère les leads | Utilise Orchestrator | ✅ Prod |

---

## 11. 🎯 POINTS CLÉS À RETENIR

### ✅ Forces de l'architecture

1. **Modularité**: Chaque composant a une responsabilité unique
2. **BYOK Support**: Utilisateurs peuvent fournir leurs propres clés (Gemini, OpenAI, etc.)
3. **Fallback intelligent**: Si un provider échoue, système essaie le suivant automatiquement
4. **Routing optimisé**: Choisit le meilleur provider selon le type d'opération
5. **Budget contrôlé**: Chaque appel est tracké et limité par budget

### ⚠️ Points d'attention

1. **Dépendances**: LLMConfigModule DOIT importer AiBillingModule pour BYOK
2. **API Keys**: Les clés BYOK se configurent dans `userLlmProvider` table
3. **Performance**: WebData scraping peut être lent (Puppeteer = CPU)
4. **Coûts**: Firecrawl payante, d'autres gratuit mais limité

### 🔮 Prochaines étapes

1. Implémenter Pica.AI comme moteur de prospection alternatif
2. Ajouter caching pour scraping (Redis)
3. Améliorer détection erreurs/fallback
4. Dashboard analytics pour coûts par provider
5. A/B testing automatique (quel provider donne les meilleurs leads)

---

**Generated**: 2026-01-07
**Status**: ✅ COMPLETE ANALYSIS
