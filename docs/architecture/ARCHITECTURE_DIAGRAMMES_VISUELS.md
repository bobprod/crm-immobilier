# 🎪 FLUX VISUEL COMPLET: Web Data + AI Orchestrator + LLM Router

## Diagramme 1: Architecture en couches

```
┌────────────────────────────────────────────────────────────────────────┐
│                         🎯 PROSECTING-AI API                           │
│  POST /api/prospecting-ai/start {zone, targetType, propertyType}     │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│               🎪 AI-ORCHESTRATOR (Orchestration Moteur)                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1] INTENT ANALYSIS              → Comprendre l'objectif             │
│      "Trouver vendeurs + scraper leurs annonces"                      │
│                                                                         │
│  [2] EXECUTION PLANNING            → Planifier les outils             │
│      Tool1: SerpAPI.search()                                           │
│      Tool2: WebData.scrape()                                           │
│      Tool3: LLM.extract()                                              │
│                                                                         │
│  [3] TOOL EXECUTION                → Exécuter les outils              │
│      ├─ Search: 50 vendeurs trouvés                                    │
│      ├─ Scrape: 50 pages téléchargées                                  │
│      └─ Extract: 50 leads extraits                                     │
│                                                                         │
│  [4] BUDGET TRACKING               → Vérifier les coûts               │
│      Dépenses: $0.05 (acceptable)                                      │
│                                                                         │
│  [5] RESULT SYNTHESIS              → Synthétiser les résultats        │
│      50 leads avec emails, téléphones, adresses                        │
│                                                                         │
└────────────────────┬──────────────────────┬──────────────────┬────────┘
                     │                      │                  │
         ┌───────────▼────────┐  ┌──────────▼──────┐  ┌────────▼──────┐
         │  🔍 LLM-ROUTER     │  │  📡 WEB-DATA    │  │  💰 BUDGET    │
         │  (Provider Select) │  │  (Scraping)     │  │  (Tracker)    │
         └────────┬───────────┘  └────────┬────────┘  └───────────────┘
                  │                       │
                  │                       ├─ Cheerio (Sites statiques)
                  │                       ├─ Puppeteer (JavaScript)
                  │                       └─ Firecrawl (IA + Complex)
                  │
                  ▼
        ┌──────────────────────────────────────┐
        │  🔧 LLM-PROVIDER-FACTORY             │
        │  (Crée instances avec BYOK)          │
        ├──────────────────────────────────────┤
        │                                       │
        │  [1] Chercher clé BYOK               │
        │      UserLlmProvider.apiKey          │
        │                                       │
        │  [2] Fallback ApiKeysService         │
        │      User → Agency → Global          │
        │                                       │
        │  [3] Créer l'instance                │
        │      GeminiProvider(apiKey)          │
        │                                       │
        └─────────────┬────────────────────────┘
                      │
        ┌─────────────▼────────────────────────────────────────┐
        │  🚀 LLM PROVIDERS (Instances)                        │
        ├─────────────────────────────────────────────────────┤
        │                                                      │
        │  [Gemini] ← BYOK    [OpenAI]      [Anthropic]      │
        │  [DeepSeek]         [Qwen]        [Mistral]        │
        │  [Kimi]             [OpenRouter]                   │
        │                                                      │
        │  Chacun utilise sa clé API pour générer du texte   │
        │                                                      │
        └──────────────────────────────────────────────────────┘
```

---

## Diagramme 2: Flux détaillé d'une prospection

```
                    USER REQUEST
                        │
                        ▼
        ┌───────────────────────────────────┐
        │ POST /prospecting-ai/start         │
        │ { zone: "Paris 15",                │
        │   targetType: "vendeurs",          │
        │   propertyType: "appartement" }   │
        └───────────┬───────────────────────┘
                    │
                    ▼ ProspectionService
        ┌───────────────────────────────────┐
        │ DECIDE ENGINE                      │
        │ Choose: 'internal' or 'pica-ai'   │
        └───────────┬───────────────────────┘
                    │
                    ▼ (internal)
        ┌──────────────────────────────────────────────┐
        │ ORCHESTRATOR.orchestrate({                   │
        │   objective: 'prospection',                  │
        │   context: { zone, targetType, ... }        │
        │ })                                            │
        └─────────┬────────────────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │ STEP 1: INTENT     │
        │ Analyze            │
        │ ✅ prospect finds  │
        │    Required tools: │
        │    - search        │
        │    - scrape        │
        │    - extract       │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────────────┐
        │ STEP 2: PLAN               │
        │ ExecutionPlanner           │
        │ ✅ Create tool sequence    │
        │    [Tool1] [Tool2] [Tool3] │
        └─────────┬──────────────────┘
                  │
        ┌─────────▼──────────────────────────┐
        │ STEP 3: EXECUTE                    │
        │ ToolExecutor                       │
        │                                    │
        │ ┌──────────────────────────────┐   │
        │ │ Tool 1: SerpAPI.search()     │   │
        │ │ Query: "vendeurs Paris 15"   │   │
        │ │ Result: [ URL1, URL2, ... ]  │   │
        │ └──────────┬───────────────────┘   │
        │            │                        │
        │ ┌──────────▼──────────────────┐   │
        │ │ Tool 2: WebData.scrape()    │   │
        │ │ ┌─ URL1 → Cheerio → HTML1  │   │
        │ │ ├─ URL2 → Puppeteer → HTML2│   │
        │ │ └─ URL3 → Firecrawl → HTML3│   │
        │ │ Result: [ HTML1, HTML2, ... ]   │
        │ └──────────┬──────────────────┘   │
        │            │                       │
        │ ┌──────────▼────────────────────┐ │
        │ │ Tool 3: LLM.extract()        │ │
        │ │                               │ │
        │ │ ┌─ LLMRouter.select()        │ │
        │ │ │  → 'mistral' (balanced)    │ │
        │ │ │                             │ │
        │ │ ├─ Factory.create()          │ │
        │ │ │  → MistralProvider(apiKey) │ │
        │ │ │                             │ │
        │ │ └─ Generate(extractPrompt)   │ │
        │ │    Result: [                 │ │
        │ │      {                       │ │
        │ │        name: "Jean Dupont",  │ │
        │ │        email: "...",         │ │
        │ │        phone: "...",         │ │
        │ │        confidence: 0.95      │ │
        │ │      }, ...                  │ │
        │ │    ]                         │ │
        │ └────────────────────────────┘ │
        │                                 │
        └─────────┬──────────────────────┘
                  │
        ┌─────────▼────────────────┐
        │ STEP 4: SYNTHESIZE       │
        │ - Merge results          │
        │ - Calculate stats        │
        │ - Determine status       │
        │ - Return ProspectionResult
        └─────────┬────────────────┘
                  │
                  ▼
        ┌────────────────────────────┐
        │ RESPONSE                   │
        │ {                          │
        │   id: "prosp-...",         │
        │   status: "COMPLETED",     │
        │   leads: [ {...}, {...} ], │
        │   stats: {                 │
        │     totalLeads: 50,        │
        │     withEmail: 48,         │
        │     withPhone: 42,         │
        │     avgConfidence: 0.92    │
        │   }                        │
        │ }                          │
        └────────────────────────────┘
```

---

## Diagramme 3: Sélection intelligente du Provider LLM

```
USER REQUEST: "Faire une prospection en masse (500 leads)"
        │
        ▼
LLMRouter.selectBestProvider(userId, 'prospecting_mass')
        │
        ├─ [1] Check override?   → No
        │
        ├─ [2] Get active providers from user
        │   └─ [GEMINI, OpenAI, DeepSeek, Mistral]
        │
        ├─ [3] Get ROUTING_RULES['prospecting_mass']
        │   │
        │   └─ Priority: [DeepSeek > Qwen > Mistral > Gemini]
        │      Criteria: COST (minimize)
        │
        ├─ [4] Check performance history
        │   └─ DeepSeek: 95% success, avg 1.2s, cost $0.14/1M tokens
        │
        ├─ [5] SELECT PROVIDER
        │   └─ 🎯 DeepSeek selected
        │      (Priorité 1 + Coût bas + Bon succès)
        │
        └─ [6] Create instance
            └─ Factory.createProviderForUser(userId, 'deepseek')
                │
                ├─ Check UserLlmProvider['deepseek'] → Pas de BYOK
                │
                ├─ ApiKeysService.getApiKey('deepseek', userId)
                │   │
                │   ├─ Check user config → Not found
                │   ├─ Check agency config → Not found
                │   ├─ Check global config → Found! ✅
                │   └─ Return: 'sk-xxx...'
                │
                └─ DeepSeekProvider(apiKey) instance ready
                   → Cost: $0.02 for 1M tokens (super cheap!)
                   → Ready to generate 500 leads at $5 total budget
```

---

## Diagramme 4: BYOK Fallback Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                                 │
│                 Generate text with best provider                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │ LLMProviderFactory.createProviderFor  │
        │          User(userId, 'GEMINI')       │
        └──────────────┬───────────────────────┘
                       │
      ┌────────────────▼─────────────────┐
      │  TIER 1: UserLlmProvider BYOK    │
      │                                   │
      │  SELECT * FROM userLlmProvider    │
      │  WHERE userId=xyz AND            │
      │        provider='GEMINI'          │
      │                                   │
      │  Result: {                        │
      │    apiKey: 'AIzaSy...'  🔑       │
      │    isActive: true                 │
      │    priority: 1                    │
      │  }                                │
      │                                   │
      │  ✅ Found! Use user's BYOK key   │
      │  └─ GeminiProvider(userApiKey)   │
      │                                   │
      └────────────────┬──────────────────┘
                       │
                       │ (if NOT found, fallback to TIER 2)
                       │
      ┌────────────────▼─────────────────────────────┐
      │  TIER 2: ApiKeysService Cascade             │
      │                                              │
      │  [1] Check USER config                      │
      │      SELECT * FROM llmConfig                 │
      │      WHERE userId=xyz AND                   │
      │            provider='GEMINI'                 │
      │      → Not found                            │
      │                                              │
      │  [2] Check AGENCY config                    │
      │      SELECT * FROM agencyLlmConfig           │
      │      WHERE agencyId=xyz AND                 │
      │            provider='GEMINI'                 │
      │      → Not found                            │
      │                                              │
      │  [3] Check GLOBAL config                    │
      │      SELECT * FROM globalLlmConfig           │
      │      WHERE provider='GEMINI'                 │
      │      → Found! 🔑 sk-global-gemini...        │
      │                                              │
      │  ✅ Use global fallback key                 │
      │  └─ GeminiProvider(globalApiKey)            │
      │                                              │
      └────────────────┬──────────────────────────────┘
                       │
                       │ (if still no key found, ERROR)
                       │
      ┌────────────────▼──────────────────────┐
      │  🚀 PROVIDER READY TO USE             │
      │                                       │
      │  GeminiProvider instance with:        │
      │  ├─ apiKey: (from user OR global)    │
      │  ├─ model: 'gemini-1.5-pro'          │
      │  └─ generate() method ready           │
      │                                       │
      │  💬 Generate text:                    │
      │  provider.generate(prompt)            │
      │  → Returns text generated with       │
      │     Gemini API                        │
      │                                       │
      └───────────────────────────────────────┘
```

---

## Diagramme 5: Web Data Scraping Flow

```
WebDataService.fetchHtml(url, options)
        │
        ├─ [1] PROVIDER SELECTION
        │       ├─ Is URL in complexSites? → Puppeteer
        │       ├─ Is URL in simpleSites? → Cheerio
        │       ├─ Has extraction prompt? → Firecrawl
        │       └─ Default: Cheerio
        │
        ├─ [2] TRY PRIMARY PROVIDER
        │   │
        │   ├─ if provider == 'cheerio'
        │   │   └─ CheerioService.scrape(url)
        │   │       ├─ Fetch HTML
        │   │       ├─ Parse with jQuery-like syntax
        │   │       └─ Extract text + metadata
        │   │
        │   ├─ if provider == 'puppeteer'
        │   │   └─ PuppeteerService.scrape(url)
        │   │       ├─ Launch headless browser
        │   │       ├─ Navigate to URL
        │   │       ├─ Wait for JavaScript
        │   │       ├─ Take screenshot
        │   │       └─ Extract content
        │   │
        │   └─ if provider == 'firecrawl'
        │       └─ FirecrawlService.scrape(url)
        │           ├─ Call Firecrawl API
        │           ├─ LLM extracts content
        │           └─ Return structured data
        │
        ├─ [3] SUCCESS?
        │   ├─ YES → Return WebDataResult ✅
        │   └─ NO → Continue to [4]
        │
        ├─ [4] FALLBACK STRATEGY (if not forceProvider)
        │   │
        │   ├─ Was cheerio? → Try puppeteer
        │   ├─ Was puppeteer? → Try firecrawl
        │   ├─ Was firecrawl? → Try cheerio
        │   │
        │   └─ If all fail → Return error ❌
        │
        └─ [5] RETURN RESULT
            └─ WebDataResult {
                provider: 'puppeteer',
                url: 'https://...',
                html: '<html>...</html>',
                text: 'Extracted text...',
                markdown: '# Title\n...',
                metadata: { title, description, ... }
              }
```

---

## Diagramme 6: Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                           │
│                      POST /prospecting-ai/start                      │
│  Headers: Authorization: Bearer <JWT>                               │
│  Body: {                                                             │
│    zone: "Paris 15",                                                │
│    targetType: "vendeurs",                                          │
│    propertyType: "appartement",                                     │
│    maxLeads: 20                                                      │
│  }                                                                   │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼ [Authentication verified]
┌────────────────────────────────────────────────────────────────────┐
│ ProspectingAiController.startProspection()                          │
│ userId extracted from JWT                                            │
└────────────────┬─────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ ProspectionService.startProspection({tenantId, userId, request})   │
│ Generate prospectionId                                               │
└────────────────┬─────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ AiOrchestratorService.orchestrate({                                │
│   tenantId, userId,                                                 │
│   objective: 'prospection',                                         │
│   context: {...},                                                   │
│   options: {maxCost: 5}                                            │
│ })                                                                   │
└────────────────┬─────────────────────────────────────────────────────┘
                 │
        ┌────────┴──────────┬──────────────┬─────────────┐
        │                   │              │             │
        ▼                   ▼              ▼             ▼
    [Step0]            [Step1]        [Step2]      [Step3]
    Budget             Intent          Plan        Execute
    Check              Analysis        Creation    Tools
        │                  │              │            │
        ├─→ OK             ├─→ Prospect   ├─→ 3 tools  ├─→ [Tool1]
        │   Remaining      │   Finding    │    to run   │   SerpAPI
        │   $5             │   Required   │            │   search
        │                  │   Tools:     │            ├─→ [Tool2]
        │                  │   - search   │            │   WebData
        │                  │   - scrape   │            │   scrape
        │                  │   - extract  │            └─→ [Tool3]
        │                  │              │            LLMRouter
        │                  │              │            select +
        │                  │              │            LLM generate
        │
        └──────────────────┴──────────────┴────────────┘
                           │
        ┌──────────────────▼──────────────┐
        │  Tool 1: SerpAPI Search         │
        │  - Query: "vendeurs Paris 15"   │
        │  - Cost: $0.005                 │
        │  - Result: [URL1, URL2, ...]    │
        └──────────────────┬───────────────┘
                           │
        ┌──────────────────▼──────────────┐
        │  Tool 2: WebData Scraping       │
        │  ├─ URL1 + Cheerio → HTML1      │
        │  ├─ URL2 + Puppeteer → HTML2    │
        │  ├─ URL3 + Firecrawl → HTML3    │
        │  - Cost: $0.02                  │
        │  - Result: [HTML1, HTML2, ...]  │
        └──────────────────┬───────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │  Tool 3: LLM Extraction             │
        │  1. LLMRouter.selectBestProvider()  │
        │     → Options: [Gemini, OpenAI,     │
        │                 DeepSeek, Mistral]  │
        │     → For 'scraping_analysis'       │
        │     → Select: Mistral (balanced)    │
        │                                      │
        │  2. Factory.createProviderForUser()  │
        │     → Check UserLlmProvider['mis... │
        │     → No BYOK found                  │
        │     → ApiKeysService fallback        │
        │     → Global key found: sk-...       │
        │     → MistralProvider(key) created   │
        │                                      │
        │  3. Provider.generate(extractPrompt)│
        │     → Input: HTML + instruction     │
        │     → API Call to Mistral           │
        │     → Tokens used: 2500 input,      │
        │                    1200 output      │
        │     → Cost: $0.007                  │
        │     → Result: [                     │
        │       {                             │
        │         name: "Jean Dupont",       │
        │         email: "jean@...",         │
        │         phone: "06...",            │
        │         confidence: 0.95           │
        │       },                           │
        │       ... (20 leads total)         │
        │     ]                              │
        │                                      │
        │  Total cost: $0.032 ✅              │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │  Step 4: Synthesize Results        │
        │  - Merge all tool results          │
        │  - Calculate statistics:           │
        │    • totalLeads: 20                │
        │    • withEmail: 19                 │
        │    • withPhone: 18                 │
        │    • avgConfidence: 0.92           │
        │  - Map orchestration status        │
        │    COMPLETED → ProspectionStatus.✅ │
        │  - Build final response            │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────────┐
        │  ProspectionResult                      │
        │  {                                      │
        │    id: "prosp-1767809...",              │
        │    status: "COMPLETED",                 │
        │    leads: [{...}, {...}, ... (20)],    │
        │    stats: {                             │
        │      totalLeads: 20,                    │
        │      withEmail: 19,                     │
        │      withPhone: 18,                     │
        │      avgConfidence: 0.92                │
        │    },                                   │
        │    metadata: {                          │
        │      zone: "Paris 15",                  │
        │      targetType: "vendeurs",            │
        │      propertyType: "appartement",       │
        │      executionTimeMs: 1250,             │
        │      cost: 0.032                        │
        │    },                                   │
        │    createdAt: "2026-01-07T...",        │
        │    completedAt: "2026-01-07T..."       │
        │  }                                      │
        └──────────────────┬───────────────────────┘
                           │
        ┌──────────────────▼──────────────────────┐
        │  Response sent to client                │
        │  HTTP 201 Created                       │
        │  → Client receives 20 high-quality leads │
        │  → Each lead has contact info           │
        │  → Confidence scores provided           │
        │  → Ready to contact vendeurs!           │
        └──────────────────────────────────────────┘
```

---

## Key Metrics & Performance

```
┌─────────────────────────────────────────────────────────┐
│ TYPICAL PROSPECTION METRICS                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Execution Time:                                          │
│  - Orch. setup: 50ms                                     │
│  - SerpAPI search: 300ms                                 │
│  - Web scraping: 500ms (cheerio) - 3s (puppeteer)       │
│  - LLM extraction: 800ms                                 │
│  - TOTAL: ~1.5-4 seconds                                 │
│                                                           │
│ Cost (per 20 leads):                                     │
│  - SerpAPI: $0.005                                       │
│  - WebData (3 pages): $0.02 (if Firecrawl)              │
│  - LLM (Gemini): $0.01                                   │
│  - LLM (Mistral): $0.007                                 │
│  - LLM (DeepSeek): $0.002                                │
│  - TOTAL: $0.02-0.04 per 20 leads                        │
│                                                           │
│ Quality:                                                 │
│  - Leads with email: ~90%                                │
│  - Leads with phone: ~85%                                │
│  - Average confidence: 0.90-0.95                         │
│  - False positive rate: <5%                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-07
**Status**: ✅ COMPLETE VISUAL DOCUMENTATION
