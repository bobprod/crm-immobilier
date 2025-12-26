# 🤖 Intégration WebDataService avec AI Orchestrator / LLM Router

## 📋 Vue d'ensemble

Le `WebDataService` s'intègre parfaitement avec l'**AI Orchestrator** et le **LLM Router** pour créer un pipeline intelligent de collecte et d'analyse de données immobilières.

## 🏗️ Architecture Complète

```
┌─────────────────────────────────────────────────────────────────┐
│                     PIPELINE INTELLIGENT                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. SCRAPING ENGINE (WebDataService)                            │
├─────────────────────────────────────────────────────────────────┤
│  Sélection intelligente du provider:                            │
│  • Cheerio → Sites statiques simples (tayara, mubawab)         │
│  • Puppeteer → Sites dynamiques JS (bricks.co, homunity)       │
│  • Firecrawl → Extraction IA + Sites complexes                 │
│                                                                  │
│  Résultat: HTML/Text brut + métadonnées                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. LLM / ORCHESTRATEUR IA (LLMProspectingService)             │
├─────────────────────────────────────────────────────────────────┤
│  Analyse intelligente avec LLM:                                 │
│  • Extraction des informations structurées                      │
│  • Classification (mandat/requête)                              │
│  • Scoring de sérieux (0-100)                                   │
│  • Validation et dédoublonnage                                  │
│  • Normalisation (téléphones, emails, adresses)                 │
│                                                                  │
│  Providers LLM supportés:                                       │
│  - Anthropic Claude (recommandé pour SEO/analyse)               │
│  - OpenAI GPT-4                                                 │
│  - Google Gemini                                                │
│  - DeepSeek (économique)                                        │
│  - OpenRouter (accès à tous les modèles)                        │
│                                                                  │
│  Résultat: Données structurées + analyse                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. VALIDATION & ENRICHISSEMENT                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Validation des emails et téléphones                          │
│  • Détection de spam                                            │
│  • Enrichissement via APIs                                      │
│  • Matching avec la base de données existante                   │
│                                                                  │
│  Résultat: Leads qualifiés prêts pour insertion                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. STOCKAGE & CONVERSION                                       │
├─────────────────────────────────────────────────────────────────┤
│  Base de données:                                               │
│  • prospecting_leads (leads non qualifiés)                      │
│  • prospects (prospects qualifiés)                              │
│  • properties (biens immobiliers)                               │
│  • matching (correspondances IA)                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Scénarios d'Intégration

### Scénario 1: Investment Intelligence v1

**Objectif:** Analyser les opportunités d'investissement en crowdfunding immobilier

```typescript
// 1. Rechercher avec SerpAPI
const serpResults = await serpApi.search(
  'crowdfunding immobilier Tunisie Bricks.co Homunity'
);

// 2. Scraper les URLs avec WebDataService
const scrapedData = await webDataService.fetchMultipleUrls(
  serpResults.map(r => r.link),
  { provider: 'firecrawl' } // Force Firecrawl pour extraction IA
);

// 3. Analyser avec LLM
const investments = await llmRouter.analyze(scrapedData, {
  extractionPrompt: `Extraire les informations d'investissement:
    - Nom du projet
    - Montant cible
    - Montant collecté
    - Rendement annuel attendu
    - Type de bien
    - Localisation
    - Risque
    - Date de fin
  `,
  model: 'claude-sonnet-4' // Meilleur pour l'analyse financière
});

// 4. Créer le benchmark JSON
const benchmark = {
  projects: investments.map(inv => ({
    ...inv,
    roi_score: calculateROI(inv),
    risk_score: assessRisk(inv),
    recommendation: generateRecommendation(inv)
  }))
};
```

### Scénario 2: Prospection IA v1

**Objectif:** Trouver des leads immobiliers (acheteurs et vendeurs)

```typescript
// 1. Recherche multi-sources
const searches = [
  'cherche appartement Tunis achat',
  'villa à vendre La Marsa',
  'location studio Sousse'
];

const allResults = [];

for (const query of searches) {
  // Recherche avec SerpAPI
  const serpResults = await serpApi.search(query);
  
  // Scraping intelligent des résultats
  // WebDataService sélectionne automatiquement le provider
  const scrapedPages = await webDataService.fetchMultipleUrls(
    serpResults.map(r => r.link)
  );
  
  allResults.push(...scrapedPages);
}

// 2. Analyser avec LLM pour extraire les leads
const rawLeads = await llmProspectingService.buildProspectingLeadsFromRawBatch(
  allResults.map(page => ({
    id: generateId(),
    source: 'serp+webscrape',
    url: page.url,
    title: page.title,
    text: page.text,
    rawMetadata: page.metadata
  }))
);

// 3. Filtrer et insérer dans la base
const validLeads = rawLeads.filter(
  lead => lead.validationStatus !== 'spam' && lead.score > 40
);

await prospectingIntegrationService.ingestScrapedItems(
  userId,
  campaignId,
  validLeads
);
```

### Scénario 3: Monitoring de Propriétés Concurrentes

**Objectif:** Suivre les prix et disponibilités des biens concurrents

```typescript
// 1. Scraper les sites concurrents périodiquement (cron job)
@Cron('0 */6 * * *') // Toutes les 6 heures
async monitorCompetitors() {
  const competitorUrls = [
    'https://www.immobilier.com/tunis',
    'https://tayara.tn/immobilier',
    'https://www.mubawab.tn'
  ];

  // Scraping avec Cheerio (rapide, gratuit)
  const listings = await webDataService.fetchMultipleUrls(
    competitorUrls,
    { provider: 'cheerio' }
  );

  // Extraction des annonces avec LLM
  const properties = await llmRouter.extractProperties(listings);

  // Analyse des tendances
  const analysis = await aiAnalytics.analyzePriceTrends(properties);

  // Alertes si changements significatifs
  if (analysis.priceChange > 5) {
    await notificationsService.sendAlert(
      'Prix en hausse de 5% détecté dans votre zone'
    );
  }
}
```

## 🎯 Configuration de l'AI Orchestrator

### 1. Configurer les Providers LLM

```typescript
// Dans les paramètres utilisateur ou variables d'environnement
{
  "llm_config": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "apiKey": "sk-ant-...",
    "temperature": 0.3,
    "maxTokens": 2000
  },
  
  "scraping_config": {
    "firecrawl": {
      "apiKey": "fc-...",
      "tier": "free", // ou "paid"
      "monthlyBudget": 20 // USD
    }
  }
}
```

### 2. Stratégie de Routing Intelligente

Le système choisit automatiquement la meilleure combinaison:

```typescript
// WebDataService Router
function selectScrapingProvider(url: string, context: any) {
  // Sites complexes → Firecrawl (si budget disponible)
  if (isComplexSite(url) && hasBudget(context.userId, 'firecrawl')) {
    return 'firecrawl';
  }
  
  // Sites JS dynamiques → Puppeteer (gratuit mais plus lent)
  if (requiresJavaScript(url)) {
    return 'puppeteer';
  }
  
  // Sites simples → Cheerio (rapide et gratuit)
  return 'cheerio';
}

// LLM Router
function selectLLMProvider(task: string, context: any) {
  // Analyse financière → Claude (meilleur raisonnement)
  if (task === 'investment_analysis') {
    return 'anthropic/claude-sonnet-4';
  }
  
  // Extraction simple → DeepSeek (ultra économique)
  if (task === 'simple_extraction') {
    return 'deepseek/deepseek-chat';
  }
  
  // SEO / Contenu → Claude ou GPT-4
  if (task === 'content_generation') {
    return context.userPreference || 'anthropic/claude-sonnet-4';
  }
  
  return 'anthropic/claude-sonnet-4'; // Défaut
}
```

## 📊 Monitoring et Coûts

### Tracking des Coûts

```typescript
// API Cost Tracker (déjà implémenté)
const costs = await apiCostTracker.getUsageStats(userId);

console.log({
  scraping: {
    firecrawl: {
      requests: costs.firecrawl.requests,
      cost: costs.firecrawl.cost,
      remaining: costs.firecrawl.remaining
    },
    cheerio: { requests: costs.cheerio.requests, cost: 0 },
    puppeteer: { requests: costs.puppeteer.requests, cost: 0 }
  },
  llm: {
    total_tokens: costs.llm.total_tokens,
    total_cost: costs.llm.total_cost,
    by_provider: costs.llm.by_provider
  }
});
```

### Budget Alerts

```typescript
// Vérifier le budget avant chaque appel coûteux
const canUsePaidService = await apiCostTracker.checkBudgetAlert(
  userId,
  userSettings.monthlyBudget
);

if (!canUsePaidService) {
  // Fallback sur services gratuits
  return await webDataService.fetchHtml(url, {
    provider: 'cheerio', // ou 'puppeteer'
    forceProvider: true
  });
}
```

## 🔗 Endpoints d'Orchestration

### Endpoint Unifié: Scraping + IA

```typescript
@Post('prospecting/intelligent-search')
async intelligentSearch(@Body() dto: {
  query: string;
  sources: string[];
  maxResults: number;
}) {
  // 1. Recherche multi-sources
  const searchResults = await this.searchService.multiSourceSearch(
    dto.query,
    dto.sources
  );

  // 2. Scraping intelligent
  const scrapedData = await this.webDataService.fetchMultipleUrls(
    searchResults.urls
  );

  // 3. Analyse LLM
  const analyzedLeads = await this.llmProspectingService
    .buildProspectingLeadsFromRawBatch(scrapedData);

  // 4. Scoring et matching
  const qualifiedLeads = await this.matchingService
    .scoreAndMatch(analyzedLeads);

  return {
    success: true,
    found: qualifiedLeads.length,
    leads: qualifiedLeads,
    metadata: {
      scrapingProvider: 'mixed',
      llmProvider: 'anthropic',
      totalCost: calculateCost(scrapedData, analyzedLeads)
    }
  };
}
```

## 💡 Best Practices

### 1. Économiser les Coûts

```typescript
// ✅ BON: Utiliser Cheerio pour parsing de résultats SerpAPI
const serpResults = await serpApi.search('...');
const parsed = await webDataService.fetchHtml(serpResults.html, {
  provider: 'cheerio'
});

// ❌ MAUVAIS: Utiliser Firecrawl pour du HTML simple
const serpResults = await serpApi.search('...');
const parsed = await webDataService.fetchHtml(serpResults.url, {
  provider: 'firecrawl' // Gaspille des crédits!
});
```

### 2. Caching Intelligent

```typescript
// Cacher les résultats de scraping pendant 1 heure
const cacheKey = `scraping:${url}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await webDataService.fetchHtml(url);
await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
```

### 3. Rate Limiting

```typescript
// Respecter les limites de rate des APIs
await rateLimiter.throttle('firecrawl', {
  maxRequests: 10,
  perSeconds: 60
});
```

## 📈 Métriques de Performance

```typescript
// Dashboard métriques
{
  "scraping": {
    "total_pages": 1250,
    "by_provider": {
      "cheerio": 800,    // 64% - rapide et gratuit
      "puppeteer": 350,  // 28% - sites JS
      "firecrawl": 100   // 8% - sites complexes
    },
    "success_rate": 0.94,
    "avg_time": {
      "cheerio": "0.5s",
      "puppeteer": "3.2s",
      "firecrawl": "2.1s"
    }
  },
  "llm_analysis": {
    "total_leads_analyzed": 1250,
    "valid_leads": 580,
    "spam_filtered": 120,
    "avg_score": 65,
    "cost": "$1.20"
  }
}
```

## 🚀 Prochaines Évolutions

- [ ] Cache distribué pour le scraping (Redis)
- [ ] Queue system pour scraping asynchrone (Bull)
- [ ] Webhook pour résultats de crawling Firecrawl
- [ ] Dashboard temps réel des coûts
- [ ] Auto-tuning des providers selon performance
- [ ] ML pour prédire le meilleur provider par URL
