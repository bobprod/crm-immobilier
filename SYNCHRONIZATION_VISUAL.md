# 📐 DIAGRAMME VISUAL - SYNCHRONIZATION MODULES

## Architecture Actuelle (RÉALITÉ)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (User API)                            │
│              POST /api/prospecting-ai/start                     │
│                  { zone, targetType, ... }                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
        ╔═════════════════════════════════╗
        ║  PROSPECTING-AI MODULE          ║
        ║  ProspectionService             ║
        ║                                 ║
        ║  1. Validate input              ║
        ║  2. Enrich context              ║
        ║  3. Call AiOrchestrator         ║
        ║  4. Format results              ║
        ╚═════════════════╤═══════════════╝
                         │
                         │ orchestrate()
                         ↓
     ╔════════════════════════════════════════════════════╗
     ║      AI-ORCHESTRATOR MODULE (4 ÉTAPES)            ║
     ║                                                    ║
     │  ┌──────────────────────────────────────────────┐ │
     │  │ ÉTAPE 1: IntentAnalyzerService              │ │
     │  ├──────────────────────────────────────────────┤ │
     │  │ Input:  objective: "PROSPECTION"             │ │
     │  │         context: { zone, ... }               │ │
     │  │                                              │ │
     │  │ Logic: ❌ HARDCODED                          │ │
     │  │   requiredTools = ['serpapi',                │ │
     │  │                    'firecrawl',              │ │
     │  │                    'llm']                    │ │
     │  │                                              │ │
     │  │ ✅ DEVRAIT CONSULTER: ProviderSelector       │ │
     │  │   availableTools = await                     │ │
     │  │   providerSelector.getAvailableTools()       │ │
     │  │                                              │ │
     │  │ Output: IntentAnalysis                       │ │
     │  │   { objective, requiredTools, ... }          │ │
     │  └──────────────────────────────────────────────┘ │
     │                      ↓                            │
     │  ┌──────────────────────────────────────────────┐ │
     │  │ ÉTAPE 2: ExecutionPlannerService             │ │
     │  ├──────────────────────────────────────────────┤ │
     │  │ Input:  intentAnalysis                       │ │
     │  │         context                              │ │
     │  │                                              │ │
     │  │ Logic: ❌ HARDCODED                          │ │
     │  │   toolCalls = [                              │ │
     │  │     {tool: 'serpapi', ...},                  │ │
     │  │     {tool: 'firecrawl', ...},                │ │
     │  │     {tool: 'llm', ...}                       │ │
     │  │   ]                                          │ │
     │  │                                              │ │
     │  │ ✅ DEVRAIT CONSULTER: ProviderSelector       │ │
     │  │   strategy = await                           │ │
     │  │   providerSelector.selectOptimalStrategy()   │ │
     │  │   toolCalls = [                              │ │
     │  │     {tool: strategy.search[0], ...},         │ │
     │  │     {tool: strategy.scrape[0], ...},         │ │
     │  │     {tool: 'llm', ...}                       │ │
     │  │   ]                                          │ │
     │  │                                              │ │
     │  │ Output: ExecutionPlan                        │ │
     │  │   { toolCalls: [...] }                       │ │
     │  └──────────────────────────────────────────────┘ │
     │                      ↓                            │
     │  ┌──────────────────────────────────────────────┐ │
     │  │ ÉTAPE 3: ToolExecutorService                 │ │
     │  ├──────────────────────────────────────────────┤ │
     │  │ Pour chaque ToolCall:                        │ │
     │  │                                              │ │
     │  │ ToolCall 1: tool='serpapi'                   │ │
     │  │   └─ executeSerpApi()                        │ │
     │  │      └─ SerpApiService.search()              │ │
     │  │         └─ Result: URLs [...]                │ │
     │  │                                              │ │
     │  │ ToolCall 2: tool='firecrawl'                 │ │
     │  │   └─ executeFirecrawl()                      │ │
     │  │      └─ FirecrawlService ❌ DIRECT CALL      │ │
     │  │         │                                    │ │
     │  │         ✅ DEVRAIT ÊTRE:                     │ │
     │  │         └─ WebDataService.fetchHtml()        │ │
     │  │            └─ Avec fallback: Puppeteer, etc. │ │
     │  │                                              │ │
     │  │         Result: HTML contents [...]          │ │
     │  │                                              │ │
     │  │ ToolCall 3: tool='llm'                       │ │
     │  │   └─ executeLlm()                            │ │
     │  │      └─ LlmService.extractLeads()            │ │
     │  │         └─ Result: Leads [...]               │ │
     │  │                                              │ │
     │  │ ❌ MANQUENT handlers pour:                   │ │
     │  │    - tool='puppeteer'                        │ │
     │  │    - tool='cheerio'                          │ │
     │  │                                              │ │
     │  │ Output: ToolCallResult[]                     │ │
     │  └──────────────────────────────────────────────┘ │
     │                      ↓                            │
     │  ┌──────────────────────────────────────────────┐ │
     │  │ ÉTAPE 4: Synthèse                            │ │
     │  ├──────────────────────────────────────────────┤ │
     │  │ Combiner résultats                           │ │
     │  │ Formater pour client                         │ │
     │  │                                              │ │
     │  │ Output: OrchestrationResponse                │ │
     │  └──────────────────────────────────────────────┘ │
     ╚════════════════╤═══════════════════════════════════╝
                      │
                      ↓
        ╔═════════════════════════════════╗
        ║  PROSPECTING-AI MODULE          ║
        ║  Transform results              ║
        ║  Return ProspectionResult       ║
        ╚═════════════════╤═══════════════╝
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Response)                            │
│                 ProspectionResult {                             │
│                   status: "SUCCESS",                            │
│                   leads: [...],                                 │
│                   stats: {...}                                  │
│                 }                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modules avec leurs Responsabilités

### SCRAPING MODULE (Web Data)

```
┌────────────────────────────────┐
│  WEB DATA SERVICE              │
│  /modules/scraping/            │
│                                │
│  Responsabilité:               │
│  └─ Orchestrer scraping        │
│     └─ Choisir provider        │
│     └─ Fallback auto           │
│     └─ Normaliser résultats    │
│                                │
│  Providers:                    │
│  ├─ Tier 1: Firecrawl          │
│  ├─ Tier 2: Cheerio            │
│  └─ Tier 3: Puppeteer          │
│                                │
│  Fallback Logic:               │
│  1. Essayer provider choisi    │
│  2. Si échoue:                 │
│     └─ Cascader: FCrawl→       │
│            Cheerio→Puppeteer   │
│  3. Si tout échoue:            │
│     └─ Erreur                  │
│                                │
│  Utilisation Actuelle:         │
│  ❌ Pas utilisé par            │
│     ToolExecutor directement   │
│  ✅ DEVRAIT être utilisé       │
│     pour ALL scraping          │
└────────────────────────────────┘
```

### LLM MODULE

```
┌────────────────────────────────┐
│  LLM SERVICE                   │
│  /modules/intelligence/        │
│  /ai-orchestrator/services/    │
│                                │
│  Responsabilité:               │
│  └─ Appeler LLMs               │
│     └─ Claude, GPT, Gemini     │
│     └─ Extraction data         │
│     └─ Synthèse résultats      │
│                                │
│  Utilisation:                  │
│  ✅ Bien intégré dans          │
│     ToolExecutor               │
│  ✅ Appelé à l'Étape 3         │
│                                │
│  État: ✅ OK                   │
└────────────────────────────────┘
```

---

## État Synchronisation par Module

```
PROSPECTING-AI MODULE
────────────────────────────────────
│
├─ ✅ Appelle AiOrchestrator
├─ ✅ Enrichit contexte
├─ ✅ Formate résultats
│
└─ ❌ N'utilise pas ProviderSelector
   └─ Ne sait pas quels providers sont dispo


AI-ORCHESTRATOR MODULE (4 étapes)
────────────────────────────────────
│
├─ Étape 1: IntentAnalyzer
│  ├─ ✅ Identifie l'objectif
│  ├─ ❌ Tools HARDCODÉS
│  └─ ❌ N'utilise pas ProviderSelector
│
├─ Étape 2: ExecutionPlanner
│  ├─ ✅ Crée plan d'exécution
│  ├─ ❌ Tools HARDCODÉS
│  └─ ❌ N'utilise pas ProviderSelector
│
├─ Étape 3: ToolExecutor
│  ├─ ✅ Exécute SerpAPI
│  ├─ ✅ Exécute Firecrawl
│  ├─ ✅ Exécute LLM
│  ├─ ❌ N'utilise pas WebDataService
│  └─ ❌ Manquent handlers (puppeteer/cheerio)
│
└─ Étape 4: Synthèse
   └─ ✅ Combine résultats


WEB DATA SERVICE
────────────────────────────────────
│
├─ ✅ Fallback auto très bien
├─ ✅ Tous providers intégrés
├─ ✅ Gestion erreurs solide
│
└─ ❌ N'est pas appelé par ToolExecutor
   └─ ToolExecutor appelle FirecrawlService directement


LLM SERVICE
────────────────────────────────────
│
├─ ✅ Bien intégré
├─ ✅ Support multi-modèles
│
└─ ✅ État: OK


PROVIDER SELECTOR SERVICE (NEW!)
────────────────────────────────────
│
├─ ✅ Créé et fonctionnel
├─ ✅ Intégré au module
│
└─ ❌ N'EST APPELÉ NULLE PART!
   └─ Service zombie!
```

---

## Flux d'Erreur Actuel vs Idéal

### ❌ Flux ACTUEL (Sans ProviderSelector)

```
Client lance prospection
          ↓
   AiOrchestrator

   Step 1: RequiredTools = ['serpapi', 'firecrawl', 'llm'] ← EN DUR
           └─ Pas de fallback identifié

   Step 2: Plan = [SerpAPI, Firecrawl, LLM] ← EN DUR
           └─ Pas d'alternative prévue

   Step 3: Execute
           ├─ Execute SerpAPI
           │  │
           │  ├─ ✅ Si succès → URLs
           │  │
           │  └─ ❌ Si échoue → ERREUR IMMÉDIATE
           │     └─ Prospecton complètement échouée
           │        (Même si Firecrawl serait dispo)
           │
           └─ (N'atteint jamais cette étape si SerpAPI échoue)

RÉSULTAT: ❌ ÉCHOUÉE
```

### ✅ Flux IDÉAL (Avec ProviderSelector)

```
Client lance prospection
          ↓
   ProviderSelectorService.selectOptimalStrategy()
   └─ Récupère: { search: ['serpapi', 'firecrawl'],
                  scrape: ['firecrawl', 'puppeteer', 'cheerio'] }

   AiOrchestrator

   Step 1: RequiredTools = ['serpapi', 'firecrawl', 'llm'] ← DYNAMIQUE!
           └─ Peut utiliser fallback si besoin

   Step 2: Plan = [SerpAPI (ou Firecrawl), Firecrawl (ou Puppeteer), LLM]
           └─ Alternatives prévues

   Step 3: Execute
           ├─ Execute SerpAPI
           │  │
           │  ├─ ✅ Si succès → URLs
           │  │
           │  └─ ❌ Si échoue:
           │     ├─ Reconsulter ProviderSelector
           │     ├─ Utiliser strategy.search[1] = 'firecrawl'
           │     ├─ Replanner ToolCall avec Firecrawl
           │     └─ Réessayer
           │        ├─ ✅ Si succès → Continue
           │        └─ ❌ Si échoue → ERREUR MINEURE
           │           (Pas de recherche, mais peut continuer sans)
           │
           └─ Execute Firecrawl (ou Puppeteer fallback)
              │
              ├─ ✅ Si succès → HTML contents
              │
              └─ ❌ Si échoue:
                 ├─ WebDataService.fallback auto
                 ├─ Essayer Cheerio
                 ├─ Si échoue → Puppeteer
                 └─ ✅ Quelque chose réussira

RÉSULTAT: ✅ RÉUSSIE (Avec fallback intelligent)
```

---

## Tableau État Synchronisation

```
┌─────────────────────┬──────────┬─────────────────────┐
│ Module              │ État     │ Problème Principal  │
├─────────────────────┼──────────┼─────────────────────┤
│ Prospection-AI      │ ✅ OK    │ N'utilise pas       │
│                     │          │ ProviderSelector    │
├─────────────────────┼──────────┼─────────────────────┤
│ IntentAnalyzer      │ ⚠️  SEMI | Tools HARDCODÉS     │
│                     │          │ N'utilise pas       │
│                     │          │ ProviderSelector    │
├─────────────────────┼──────────┼─────────────────────┤
│ ExecutionPlanner    │ ⚠️  SEMI | Tools HARDCODÉS     │
│                     │          │ N'utilise pas       │
│                     │          │ ProviderSelector    │
├─────────────────────┼──────────┼─────────────────────┤
│ ToolExecutor        │ ⚠️  SEMI | Manquent handlers   │
│                     │          │ Pas WebDataService  │
├─────────────────────┼──────────┼─────────────────────┤
│ WebDataService      │ ✅ OK    │ N'est pas utilisé   │
│                     │          │ par ToolExecutor    │
├─────────────────────┼──────────┼─────────────────────┤
│ LLMService          │ ✅ OK    │ Aucun              │
├─────────────────────┼──────────┼─────────────────────┤
│ ProviderSelector    │ 🚫 ZOMBIE│ Créé mais jamais   │
│                     │          │ appelé!            │
└─────────────────────┴──────────┴─────────────────────┘
```

---

## Dépendances Modules

### Actuelles (RÉALITÉ)

```
ProspectionService
  ↓ depends on
AiOrchestratorService
  ├─ depends on
  │  ├─ IntentAnalyzerService
  │  │  └─ depends on
  │  │     └─ LlmService
  │  │
  │  ├─ ExecutionPlannerService
  │  │  └─ (no dependencies)
  │  │
  │  ├─ ToolExecutorService
  │  │  └─ depends on
  │  │     ├─ SerpApiService
  │  │     ├─ FirecrawlService (DIRECT!)
  │  │     └─ LlmService
  │  │
  │  └─ BudgetTrackerService
  │
  └─ [UNUSED]
     └─ ProviderSelectorService ❌ Zombie!

WebDataService
  ├─ depends on
  │  ├─ FirecrawlService
  │  ├─ PuppeteerService
  │  └─ CheerioService
  │
  └─ NOT CALLED BY ToolExecutor ❌
```

### Idéales (RECOMMANDÉES)

```
ProspectionService
  ↓ depends on
AiOrchestratorService
  ├─ depends on
  │  ├─ ProviderSelectorService ✅ NEW!
  │  │  └─ depends on
  │  │     └─ ApiKeysService
  │  │
  │  ├─ IntentAnalyzerService
  │  │  └─ depends on
  │  │     ├─ ProviderSelectorService ✅ NEW!
  │  │     └─ LlmService
  │  │
  │  ├─ ExecutionPlannerService
  │  │  └─ depends on
  │  │     └─ ProviderSelectorService ✅ NEW!
  │  │
  │  ├─ ToolExecutorService
  │  │  └─ depends on
  │  │     ├─ SerpApiService
  │  │     ├─ WebDataService ✅ CHANGED!
  │  │     └─ LlmService
  │  │
  │  └─ BudgetTrackerService
  │
  └─ ProviderSelectorService ✅ USED!

WebDataService
  ├─ depends on
  │  ├─ FirecrawlService
  │  ├─ PuppeteerService
  │  └─ CheerioService
  │
  └─ CALLED BY ToolExecutor ✅
```

---

## Matrice Intégration vs Actuellement

```
           │ ProspectionService │ IntentAnalyzer │ ExecPlanner │ ToolExecutor │ WebData
───────────┼────────────────────┼────────────────┼─────────────┼──────────────┼────────
Llamadas   │ ✅ Sí              │ ❌ No          │ ❌ No       │ ✅ Sí        │ ❌ No
existentes │                    │                │             │              │
───────────┼────────────────────┼────────────────┼─────────────┼──────────────┼────────
Debería    │ ✅ Sí              │ ✅ Sí          │ ✅ Sí       │ ✅ Sí        │ ✅ Sí
llamar     │ (indirectly)       │ (tools)        │ (strategy)  │ (all scrape) │ (scrape)
───────────┼────────────────────┼────────────────┼─────────────┼──────────────┼────────
Brecha     │ ⚙️ Media           │ 🔴 ALTA        │ 🔴 ALTA     │ 🟡 Media     │ 🔴 ALTA
───────────┴────────────────────┴────────────────┴─────────────┴──────────────┴────────
```

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────┐
│  ESTADO ACTUAL: FRACCIONADO                             │
│                                                         │
│  Cada módulo funciona independientemente BUT:           │
│  ❌ No se comunican sobre disponibilidad               │
│  ❌ No hay fallback inteligente                         │
│  ❌ ProviderSelector creado pero nunca usado           │
│  ❌ WebDataService ignorado por ToolExecutor          │
│  ❌ Tools hardcodados, no dinámicos                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ESTADO IDEAL: INTEGRADO                               │
│                                                         │
│  ✅ ProviderSelector dirige todo                       │
│  ✅ IntentAnalyzer consulta ProviderSelector           │
│  ✅ ExecutionPlanner respeta estrategia                │
│  ✅ ToolExecutor fallback inteligente                  │
│  ✅ WebDataService usado para todos los scraping       │
│  ✅ Tools dinámicos según disponibilidad              │
└─────────────────────────────────────────────────────────┘

BRECHA A CERRAR: 60% IMPLEMENTADO, 40% FALTA ⚠️
```

---

**Visualización completa de la situación de sincronización! 📊**
