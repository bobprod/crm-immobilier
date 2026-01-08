# 🔧 PLAN D'ACTION - CORRECTION SYNCHRONISATION MODULES

## Vue d'Ensemble

**Objectif**: Synchroniser complètement les 4 modules pour que ProviderSelector dirige intelligemment la prospection.

**État actuel**: 60% implémenté
**État cible**: 100% intégré
**Effort**: ~2 heures de développement

---

## 🎯 ACTIONS REQUISES

### ACTION 1: Intégrer ProviderSelector dans IntentAnalyzer

**Priorité**: P4 (Basse) - Info seulement
**Impact**: Informe correctement sur tools disponibles
**Temps**: ~20 min
**Fichier**: `intent-analyzer.service.ts`

#### Changement requis

```typescript
// AVANT
private analyzeProspectionIntent(context: Record<string, any>): IntentAnalysis {
  return {
    objective: OrchestrationObjective.PROSPECTION,
    requiredTools: ['serpapi', 'firecrawl', 'llm'],  // ❌ HARDCODÉ
    extractedParams: { ... },
    confidence: 0.95,
  };
}

// APRÈS
private async analyzeProspectionIntent(
  context: Record<string, any>
): Promise<IntentAnalysis> {
  // ✅ Récupérer tools disponibles
  const availableTools = await this.providerSelector.getAvailableTools(
    context.userId,
    context.agencyId
  );

  // ✅ Filtrer pour prospection
  const prospectionTools = availableTools.filter(tool =>
    ['serpapi', 'firecrawl', 'llm', 'puppeteer', 'cheerio'].includes(tool)
  );

  return {
    objective: OrchestrationObjective.PROSPECTION,
    requiredTools: prospectionTools,  // ✅ DYNAMIQUE
    extractedParams: { ... },
    confidence: prospectionTools.length >= 2 ? 0.95 : 0.7,  // ✅ Adaptation confiance
  };
}
```

#### Code à ajouter au constructor

```typescript
constructor(
  private readonly llmService: LlmService,
  private readonly providerSelector: ProviderSelectorService,  // ✅ AJOUTER
) {}
```

---

### ACTION 2: Intégrer ProviderSelector dans ExecutionPlanner

**Priorité**: P1 (CRITIQUE) - Dynamise le plan
**Impact**: LE changement clé pour fallback
**Temps**: ~30 min
**Fichier**: `execution-planner.service.ts`

#### Changement requis

Modifiez la méthode `planProspection()`:

```typescript
// AVANT - Étape 1: Recherche HARDCODÉE
toolCalls.push({
  id: 'search-prospects',
  tool: 'serpapi',  // ❌ EN DUR
  action: 'search',
  params: { ... },
  metadata: { description: 'Rechercher des prospects potentiels', priority: 1 },
});

// APRÈS - Étape 1: Recherche DYNAMIQUE
const strategy = await this.providerSelector.selectOptimalStrategy(
  userId,
  context.agencyId || context.tenantId
);

const searchProvider = strategy.search[0] || 'serpapi';
toolCalls.push({
  id: 'search-prospects',
  tool: searchProvider,  // ✅ DYNAMIQUE!
  action: 'search',
  params: { ... },
  metadata: {
    description: `Rechercher des prospects potentiels (${searchProvider})`,
    priority: 1,
  },
});
```

Similairement pour Étape 2:

```typescript
// AVANT - Étape 2: Scraping HARDCODÉ
toolCalls.push({
  id: 'scrape-pages',
  tool: 'firecrawl',  // ❌ EN DUR
  action: 'scrapeBatch',
  params: { ... },
  dependsOn: 'search-prospects',
  metadata: { description: 'Scraper les pages trouvées', priority: 2 },
});

// APRÈS - Étape 2: Scraping DYNAMIQUE
const scrapeProvider = strategy.scrape[0] || 'firecrawl';
toolCalls.push({
  id: 'scrape-pages',
  tool: scrapeProvider,  // ✅ DYNAMIQUE!
  action: 'scrapeBatch',
  params: { ... },
  dependsOn: 'search-prospects',
  metadata: {
    description: `Scraper les pages trouvées (${scrapeProvider})`,
    priority: 2,
  },
});
```

#### Code à ajouter au constructor

```typescript
constructor(
  private readonly providerSelector: ProviderSelectorService,  // ✅ AJOUTER
) {}
```

#### Rendre la méthode async

```typescript
// AVANT
private planProspection(
  tenantId: string,
  userId: string,
  analysis: IntentAnalysis,
  context: Record<string, any>,
): ExecutionPlan {

// APRÈS
private async planProspection(  // ✅ async!
  tenantId: string,
  userId: string,
  analysis: IntentAnalysis,
  context: Record<string, any>,
): Promise<ExecutionPlan> {  // ✅ Promise!
```

Aussi à mettre à jour dans `createPlan()`:

```typescript
// AVANT
case OrchestrationObjective.PROSPECTION:
  return this.planProspection(...);

// APRÈS
case OrchestrationObjective.PROSPECTION:
  return await this.planProspection(...);  // ✅ await!
```

---

### ACTION 3: Ajouter handlers puppeteer/cheerio

**Priorité**: P2 (HAUTE) - Complète fallback
**Impact**: Permet fallback à outils gratuits
**Temps**: ~20 min
**Fichier**: `tool-executor.service.ts`

#### Ajouter injection de WebDataService

```typescript
constructor(
  private readonly llmService: LlmService,
  private readonly serpApiService: SerpApiService,
  private readonly firecrawlService: FirecrawlService,
  private readonly webDataService: WebDataService,  // ✅ AJOUTER
) {}
```

#### Ajouter cases dans executeToolCall()

```typescript
async executeToolCall(
  toolCall: ToolCall,
  previousResults: Map<string, ToolCallResult>,
): Promise<ToolCallResult> {
  // ... code existant ...

  try {
    let data: any;

    switch (toolCall.tool) {
      case 'serpapi':
        data = await this.executeSerpApi(toolCall.action, resolvedParams);
        break;

      case 'firecrawl':
        data = await this.executeFirecrawl(toolCall.action, resolvedParams);
        break;

      case 'puppeteer':  // ✅ NOUVEAU!
        data = await this.executePuppeteer(toolCall.action, resolvedParams);
        break;

      case 'cheerio':  // ✅ NOUVEAU!
        data = await this.executeCheerio(toolCall.action, resolvedParams);
        break;

      case 'llm':
        data = await this.executeLlm(toolCall.action, resolvedParams, previousResults);
        break;

      default:
        throw new Error(`Unknown tool: ${toolCall.tool}`);
    }
    // ... reste du code ...
  } catch (error) {
    // ... gestion erreur ...
  }
}
```

#### Ajouter nouvelles méthodes

```typescript
private async executePuppeteer(action: string, params: any): Promise<any> {
  this.logger.log(`Exécution: puppeteer:${action}`);

  switch (action) {
    case 'scrape':
    case 'scrapeBatch':
      // Pour URLs uniques
      if (params.url) {
        const result = await this.webDataService.fetchHtml(params.url, {
          provider: 'puppeteer',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });
        return result;
      }
      // Pour URLs multiples
      if (params.urls && Array.isArray(params.urls)) {
        const results = await this.webDataService.fetchMultipleUrls(params.urls, {
          provider: 'puppeteer',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });
        return results;
      }
      break;

    default:
      throw new Error(`Puppeteer action not supported: ${action}`);
  }
}

private async executeCheerio(action: string, params: any): Promise<any> {
  this.logger.log(`Exécution: cheerio:${action}`);

  switch (action) {
    case 'scrape':
    case 'scrapeBatch':
      // Pour URLs uniques
      if (params.url) {
        const result = await this.webDataService.fetchHtml(params.url, {
          provider: 'cheerio',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });
        return result;
      }
      // Pour URLs multiples
      if (params.urls && Array.isArray(params.urls)) {
        const results = await this.webDataService.fetchMultipleUrls(params.urls, {
          provider: 'cheerio',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });
        return results;
      }
      break;

    default:
      throw new Error(`Cheerio action not supported: ${action}`);
  }
}
```

---

### ACTION 4: Utiliser WebDataService pour Firecrawl

**Priorité**: P3 (MOYENNE) - Unifie scraping
**Impact**: Profite du fallback de WebDataService
**Temps**: ~15 min
**Fichier**: `tool-executor.service.ts`

#### Modifier executeFirecrawl()

```typescript
// AVANT
private async executeFirecrawl(action: string, params: any): Promise<any> {
  this.logger.log(`Exécution: firecrawl:${action}`);

  switch (action) {
    case 'scrapeBatch':
      return await this.firecrawlService.scrapeBatch(params.urls);  // ❌ DIRECT

    case 'scrapeWithAI':
      return await this.firecrawlService.scrapeWithAI(
        params.urls,
        params.extractionPrompt,
      );

    default:
      throw new Error(`Firecrawl action not supported: ${action}`);
  }
}

// APRÈS
private async executeFirecrawl(action: string, params: any): Promise<any> {
  this.logger.log(`Exécution: firecrawl:${action}`);

  switch (action) {
    case 'scrapeBatch':
      // ✅ Utiliser WebDataService pour bénéficier du fallback
      return await this.webDataService.fetchMultipleUrls(params.urls, {
        provider: 'firecrawl',  // ✅ Préférer Firecrawl
        tenantId: params.tenantId,
        extractionPrompt: params.extractionPrompt,
      });

    case 'scrapeWithAI':
      // ✅ Pour une seule URL
      if (params.urls && params.urls.length === 1) {
        return await this.webDataService.fetchHtml(params.urls[0], {
          provider: 'firecrawl',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });
      }
      // ✅ Pour URLs multiples
      return await this.webDataService.fetchMultipleUrls(params.urls, {
        provider: 'firecrawl',
        tenantId: params.tenantId,
        extractionPrompt: params.extractionPrompt,
      });

    default:
      throw new Error(`Firecrawl action not supported: ${action}`);
  }
}
```

---

## 📋 CHECKLIST IMPLÉMENTATION

### Phase 1: Préparation (5 min)

- [ ] Lire cette document complet
- [ ] Vérifier que ProviderSelectorService est bien en place
- [ ] Vérifier que WebDataService est accessible
- [ ] Vérifier build sans erreurs actuelles

### Phase 2: ExecutionPlanner (30 min)

- [ ] Ajouter ProviderSelector au constructor
- [ ] Importer ProviderSelector en haut du fichier
- [ ] Modifier planProspection() pour utiliser selectOptimalStrategy()
- [ ] Tester: build sans erreurs
- [ ] Tester: prospection toujours fonctionne

### Phase 3: ToolExecutor (20 min)

- [ ] Ajouter WebDataService au constructor
- [ ] Ajouter cases 'puppeteer' et 'cheerio'
- [ ] Ajouter méthodes executePuppeteer() et executeCheerio()
- [ ] Modifier executeFirecrawl() pour utiliser WebDataService
- [ ] Tester: build sans erreurs
- [ ] Tester: scraping fonctionne

### Phase 4: IntentAnalyzer (20 min)

- [ ] Ajouter ProviderSelector au constructor
- [ ] Rendre analyzeProspectionIntent() async
- [ ] Modifier pour consulter ProviderSelector
- [ ] Tester: build sans erreurs
- [ ] Tester: analyse fonctionne

### Phase 5: Validation Finale (5 min)

- [ ] Build backend: `npm run build` ✅
- [ ] No TypeScript errors
- [ ] Test endpoint prospection
- [ ] Vérifier fallback marche

---

## 🧪 TESTS À FAIRE

### Test 1: Prospection avec tous les providers

**Setup**: SerpAPI + Firecrawl + Anthropic configurés

**Expected**:
```
✅ Recherche avec SerpAPI
✅ Scraping avec Firecrawl
✅ Extraction avec Claude
✅ Résultat: Leads avec confiance 0.9+
```

### Test 2: Prospection sans SerpAPI (Fallback recherche)

**Setup**: Firecrawl + Anthropic (NO SerpAPI)

**Expected**:
```
⚙️ Recherche avec fallback (Firecrawl)
✅ Scraping avec Firecrawl
✅ Extraction avec Claude
✅ Résultat: Leads (plus lent mais fonctionne)
```

### Test 3: Prospection sans Firecrawl (Fallback scraping)

**Setup**: SerpAPI + Anthropic (NO Firecrawl)

**Expected**:
```
✅ Recherche avec SerpAPI
⚙️ Scraping avec Puppeteer (fallback)
✅ Extraction avec Claude
✅ Résultat: Leads (scraping plus lent)
```

### Test 4: Prospection gratuite (Puppeteer + Cheerio)

**Setup**: Aucune clé API (Puppeteer/Cheerio intégrés)

**Expected**:
```
⚙️ Recherche avec fallback (Firecrawl/Puppeteer)
⚙️ Scraping avec fallback (Cheerio)
✅ Extraction avec Claude
✅ Résultat: Leads (très lent mais GRATUIT)
```

### Test 5: Vérifier ProviderSelector utilisé

**Endpoint**: `GET /api/ai/orchestrate/providers/available`

**Expected**:
```json
{
  "available": [
    { "provider": "serpapi", "available": true, "tier": "search" },
    { "provider": "firecrawl", "available": true, "tier": "scraping" },
    { "provider": "puppeteer", "available": true, "tier": "scraping" },
    { "provider": "cheerio", "available": true, "tier": "scraping" }
  ],
  "strategy": {
    "search": ["serpapi"],
    "scrape": ["firecrawl"]
  }
}
```

---

## 📊 AVANT/APRÈS

### AVANT (Actuellement)

```
❌ Tools hardcodés
❌ Pas de fallback si SerpAPI indisponible
❌ Pas de fallback si Firecrawl indisponible
❌ Manquent handlers puppeteer/cheerio
❌ ProviderSelector créé mais jamais utilisé
❌ WebDataService ignoré

RÉSULTAT: Une erreur = prospection complètement échouée
```

### APRÈS (Après implémentation)

```
✅ Tools dynamiques
✅ Fallback intelligents multiples niveaux
✅ Handlers complets pour tous les providers
✅ ProviderSelector vraiment utilisé
✅ WebDataService utilisé pour scraping
✅ Prospection résiliente

RÉSULTAT: Prospection réussit même avec providers limités
```

---

## 🚀 ORDRE D'IMPLÉMENTATION

1. **ExecutionPlanner** (ACTION 2) - Le changement CRITIQUE
2. **ToolExecutor** (ACTIONS 3 + 4) - Les handlers manquants
3. **IntentAnalyzer** (ACTION 1) - L'info dynamique

**Raison**: Cet ordre permet tester au fur et à mesure

---

## 💾 COMPILATION

Après chaque action:

```bash
cd /backend
npm run build

# Doit retourner: SUCCESS (aucune erreur)
```

---

## ⏱️ TEMPS TOTAL

- ACTION 1: 20 min
- ACTION 2: 30 min ← CRITIQUE
- ACTION 3: 20 min
- ACTION 4: 15 min
- Tests: 20 min
- Bugfixes: 15 min

**TOTAL: ~2 heures**

---

## 📞 SUPPORT

Si problèmes lors de l'implémentation:

1. Vérifier que ProviderSelectorService est accessible
2. Vérifier que WebDataService est importable
3. Vérifier les types TypeScript match
4. Vérifier async/await est correct
5. Relancer `npm run build`

---

**Vous êtes prêt pour l'implémentation! 🎯**
