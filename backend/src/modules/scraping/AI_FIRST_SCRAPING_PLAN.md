# Plan d'Amélioration - Scraping Intelligent avec IA

## 🎯 Vision

**Objectif:** Créer un système de prospection où l'utilisateur donne simplement ses objectifs en langage naturel, et l'IA orchestre automatiquement le scraping multi-sources pour trouver les meilleurs leads.

### Exemple d'Utilisation Cible

```
UTILISATEUR: "Je veux 100 appartements à louer à La Marsa,
              budget 1000-2000 TND/mois, minimum 2 chambres"

IA SYSTÈME:  ✅ Objectif compris
             ✅ Recherche sur Tayara.tn → 45 résultats
             ✅ Recherche sur Mubawab.tn → 38 résultats
             ✅ Recherche Google SERP → 22 résultats
             ✅ Total: 105 leads uniques
             ✅ Qualité moyenne: 82/100
             ✅ Prêts à exporter vers Pipeline
```

**OU**

```
UTILISATEUR: [Colle 5 URLs d'annonces Tayara]

IA SYSTÈME:  ✅ 5 URLs détectées → Tayara.tn
             ✅ Extraction intelligente des données
             ✅ Détection automatique des champs
             ✅ 5 leads créés avec enrichissement
```

---

## 🧠 Architecture "IA-First"

### Niveau 1: Interface Utilisateur Intelligente

```typescript
// L'utilisateur donne soit:
interface ProspectionInput {
  // OPTION A: Objectif en langage naturel
  naturalLanguageGoal?: string;
  // Exemple: "Trouve 50 villas à Sousse, budget 500k-1M"

  // OPTION B: URLs directes
  urls?: string[];
  // Exemple: ["https://tayara.tn/...", "https://mubawab.tn/..."]

  // Optionnel: Contraintes
  constraints?: {
    maxLeads?: number;
    maxBudget?: number; // Budget API en USD
    maxTime?: number; // Temps max en secondes
    onlyRecentListings?: boolean; // <7 jours
  };
}
```

---

### Niveau 2: AI Orchestrator (Cerveau du Système)

**Fichier:** `backend/src/modules/scraping/services/ai-scraping-orchestrator.service.ts`

```typescript
@Injectable()
export class AiScrapingOrchestrator {
  /**
   * Point d'entrée principal - Traite n'importe quel input
   */
  async processProspectionRequest(
    input: ProspectionInput,
    userId: string,
  ): Promise<ProspectionResult> {

    // 1. Analyser l'input avec l'IA
    const intent = await this.analyzeIntent(input);

    // 2. Générer la stratégie de scraping
    const strategy = await this.generateScrapingStrategy(intent);

    // 3. Exécuter le scraping multi-sources
    const rawLeads = await this.executeStrategy(strategy);

    // 4. Enrichir et valider
    const enrichedLeads = await this.enrichLeads(rawLeads);

    // 5. Retourner les résultats
    return {
      leads: enrichedLeads,
      stats: this.calculateStats(enrichedLeads),
      strategy: strategy,
    };
  }

  /**
   * Étape 1: Analyser l'intention de l'utilisateur
   */
  private async analyzeIntent(input: ProspectionInput): Promise<SearchIntent> {
    if (input.urls && input.urls.length > 0) {
      // Mode URLs directes
      return {
        mode: 'direct_urls',
        urls: input.urls,
        detectedSites: this.detectSitesFromUrls(input.urls),
      };
    }

    // Mode langage naturel → Analyser avec LLM
    const llmResponse = await this.llmRouter.generate(
      userId,
      'prospecting_planning', // Use case dédié
      `Analyse cet objectif de prospection et extrait les critères structurés:

"${input.naturalLanguageGoal}"

Réponds en JSON:
{
  "propertyType": "appartement|villa|terrain|...",
  "transactionType": "vente|location",
  "location": {
    "city": "...",
    "neighborhood": "...",
    "governorate": "..."
  },
  "budget": {
    "min": number,
    "max": number,
    "currency": "TND"
  },
  "features": {
    "rooms": number,
    "surface": number,
    "...": "..."
  },
  "quantity": number,
  "urgency": "immediate|normal|low"
}`,
    );

    const criteria = JSON.parse(llmResponse);

    return {
      mode: 'criteria_based',
      criteria: criteria,
      originalGoal: input.naturalLanguageGoal,
    };
  }

  /**
   * Étape 2: Générer la stratégie de scraping
   */
  private async generateScrapingStrategy(
    intent: SearchIntent,
  ): Promise<ScrapingStrategy> {

    if (intent.mode === 'direct_urls') {
      // Simple: scraper les URLs données
      return {
        sources: intent.detectedSites.map(site => ({
          type: 'url',
          provider: this.selectProviderForSite(site),
          urls: intent.urls.filter(url => url.includes(site)),
        })),
      };
    }

    // Mode critères → L'IA décide des meilleures sources
    const strategyPrompt = `
Tu es un expert en scraping immobilier en Tunisie.

OBJECTIF: ${intent.originalGoal}

CRITÈRES EXTRAITS:
${JSON.stringify(intent.criteria, null, 2)}

SOURCES DISPONIBLES:
1. Tayara.tn - Leader tunisien, toutes catégories
2. Mubawab.tn - Spécialisé immobilier
3. Afariat.com - Annonces locales
4. Immobilier.tn - Site dédié
5. Google SERP - Recherche large
6. Facebook Marketplace - Particuliers
7. LinkedIn - Professionnels (agences)

INSTRUCTIONS:
Sélectionne les 3-5 meilleures sources pour cet objectif.
Pour chaque source, génère la requête de recherche optimale.

Réponds en JSON:
{
  "sources": [
    {
      "name": "tayara.tn",
      "priority": 1,
      "reason": "Plus grand volume d'annonces",
      "searchQuery": "appartement location la marsa",
      "expectedResults": 50,
      "filters": {
        "priceMin": 1000,
        "priceMax": 2000,
        "category": "immobilier/location/appartements"
      }
    },
    // ...
  ],
  "estimatedTotal": 100,
  "confidence": 0.85
}`;

    const llmResponse = await this.llmRouter.generate(
      userId,
      'prospecting_planning',
      strategyPrompt,
    );

    const aiStrategy = JSON.parse(llmResponse);

    // Convertir en stratégie exécutable
    return this.convertToExecutableStrategy(aiStrategy, intent.criteria);
  }

  /**
   * Étape 3: Exécuter la stratégie
   */
  private async executeStrategy(
    strategy: ScrapingStrategy,
  ): Promise<RawScrapedItem[]> {

    const allResults: RawScrapedItem[] = [];

    // Exécuter en parallèle toutes les sources
    const tasks = strategy.sources.map(source =>
      this.executeSingleSource(source)
    );

    const results = await Promise.allSettled(tasks);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        this.logger.warn(`Source failed: ${result.reason}`);
      }
    }

    // Dédupliquer
    return this.deduplicateRawItems(allResults);
  }

  /**
   * Exécuter une seule source
   */
  private async executeSingleSource(
    source: SourceConfig,
  ): Promise<RawScrapedItem[]> {

    switch (source.type) {
      case 'url':
        return await this.scrapeDirectUrls(source.urls, source.provider);

      case 'search':
        return await this.scrapeSearchQuery(
          source.siteName,
          source.searchQuery,
          source.filters,
        );

      case 'api':
        return await this.scrapeViaApi(source.apiConfig);

      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  }

  /**
   * Scraping intelligent avec détection automatique de structure
   */
  private async scrapeDirectUrls(
    urls: string[],
    preferredProvider?: WebDataProvider,
  ): Promise<RawScrapedItem[]> {

    const results: RawScrapedItem[] = [];

    for (const url of urls) {
      try {
        // 1. Récupérer le contenu
        const webData = await this.webDataService.fetchHtml(url, {
          provider: preferredProvider,
        });

        // 2. Extraire les données avec l'IA
        const extracted = await this.extractWithAI(url, webData);

        results.push({
          source: 'web',
          url: url,
          title: extracted.title,
          text: extracted.description,
          rawData: extracted,
          scrapedAt: new Date(),
        });

      } catch (error) {
        this.logger.error(`Failed to scrape ${url}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * 🔥 INNOVATION: Extraction avec IA au lieu de sélecteurs CSS
   */
  private async extractWithAI(
    url: string,
    webData: WebDataResult,
  ): Promise<ExtractedListing> {

    // Utiliser Firecrawl avec extraction LLM si disponible
    if (await this.firecrawlService.isAvailable()) {
      const extracted = await this.firecrawlService.extractWithLLM(
        url,
        `Extrait les informations immobilières de cette page:
- Type de bien (appartement, villa, etc.)
- Prix et monnaie
- Localisation (ville, quartier, adresse)
- Surface en m²
- Nombre de pièces
- Contact (téléphone, email, nom)
- Description
- Date de publication
- Toutes autres infos pertinentes

Retourne en JSON structuré.`,
      );

      return this.parseAIExtraction(extracted);
    }

    // Sinon, utiliser notre propre LLM avec le HTML/text
    const prompt = `Analyse cette page web et extrait les informations immobilières.

URL: ${url}
CONTENU (premiers 2000 caractères):
${webData.text.substring(0, 2000)}

Extrait et structure les données en JSON:
{
  "title": "...",
  "price": number,
  "currency": "TND",
  "location": {
    "city": "...",
    "neighborhood": "...",
    "address": "..."
  },
  "propertyType": "appartement|villa|terrain|...",
  "surface": number,
  "rooms": number,
  "bathrooms": number,
  "features": ["..."],
  "contact": {
    "phone": "...",
    "email": "...",
    "name": "..."
  },
  "description": "...",
  "publishedAt": "ISO date",
  "confidence": 0-100
}`;

    const llmResponse = await this.llmRouter.generate(
      'system', // userId pour extraction
      'data_extraction',
      prompt,
    );

    return JSON.parse(llmResponse);
  }

  /**
   * Scraping via recherche sur un site
   */
  private async scrapeSearchQuery(
    siteName: string,
    query: string,
    filters?: any,
  ): Promise<RawScrapedItem[]> {

    // Construire l'URL de recherche selon le site
    const searchUrl = this.buildSearchUrl(siteName, query, filters);

    // Récupérer la page de résultats
    const resultsPage = await this.webDataService.fetchHtml(searchUrl, {
      provider: 'cheerio', // Les pages de résultats sont souvent statiques
    });

    // Extraire les URLs des annonces avec l'IA
    const listingUrls = await this.extractListingUrls(
      siteName,
      resultsPage,
    );

    // Scraper chaque annonce
    return await this.scrapeDirectUrls(listingUrls.slice(0, 20)); // Limite 20 par recherche
  }

  /**
   * Extraire les URLs des annonces d'une page de résultats
   */
  private async extractListingUrls(
    siteName: string,
    resultsPage: WebDataResult,
  ): Promise<string[]> {

    // Patterns connus par site
    const patterns = {
      'tayara.tn': /https:\/\/www\.tayara\.tn\/.*\/item\/\d+/g,
      'mubawab.tn': /https:\/\/www\.mubawab\.tn\/.*\/\d+/g,
      'afariat.com': /https:\/\/www\.afariat\.com\/annonce-\d+/g,
    };

    const pattern = patterns[siteName];
    if (!pattern) {
      // Fallback: extraire avec l'IA
      return await this.extractUrlsWithAI(resultsPage);
    }

    // Extraction par regex
    const urls = resultsPage.html.match(pattern) || [];
    return [...new Set(urls)]; // Dédupliquer
  }

  /**
   * Extraire URLs avec l'IA (fallback)
   */
  private async extractUrlsWithAI(
    resultsPage: WebDataResult,
  ): Promise<string[]> {

    const prompt = `Cette page contient une liste d'annonces immobilières.
Extrait toutes les URLs des annonces individuelles.

LIENS TROUVÉS:
${resultsPage.metadata?.links?.slice(0, 50).join('\n')}

Retourne uniquement les URLs des annonces (pas les liens de navigation, etc.)
Format: tableau JSON de strings`;

    const llmResponse = await this.llmRouter.generate(
      'system',
      'data_extraction',
      prompt,
    );

    return JSON.parse(llmResponse);
  }

  /**
   * Étape 4: Enrichir les leads
   */
  private async enrichLeads(
    rawLeads: RawScrapedItem[],
  ): Promise<EnrichedLead[]> {

    // Analyser avec LLM en batch (économie)
    const analyzed = await this.llmProspecting.analyzeRawItemsBatch(
      rawLeads,
      'system',
    );

    // Enrichir chaque lead
    const enriched: EnrichedLead[] = [];

    for (const lead of analyzed) {
      try {
        // Géolocalisation
        const geocoded = await this.enrichmentService.geocodeAddress(
          lead.location?.city || '',
        );

        // Score de qualité
        const qualityScore = this.enrichmentService.calculateQualityScore(lead);

        // Détection doublons
        const duplicates = await this.enrichmentService.findDuplicates(lead);

        enriched.push({
          ...lead,
          coordinates: geocoded,
          qualityScore: qualityScore,
          isDuplicate: duplicates.length > 0,
          duplicateOf: duplicates[0]?.id,
        });

      } catch (error) {
        this.logger.warn(`Enrichment failed for lead: ${error.message}`);
        enriched.push(lead as any); // Push sans enrichissement
      }
    }

    return enriched;
  }
}
```

---

## 🚀 Moteurs de Scraping Améliorés

### 1. Firecrawl Service (IA Intégrée)

**Amélioration:** Utiliser l'extraction LLM de Firecrawl au maximum

```typescript
@Injectable()
export class FirecrawlServiceEnhanced extends FirecrawlService {
  /**
   * Extraction structurée avec prompt personnalisé
   */
  async extractWithLLM(
    url: string,
    extractionPrompt: string,
    tenantId?: string,
  ): Promise<any> {

    const apiKey = await this.getApiKey(tenantId);

    const response = await axios.post(
      'https://api.firecrawl.dev/v0/scrape',
      {
        url: url,
        formats: ['markdown', 'html'],
        actions: [
          { type: 'wait', milliseconds: 2000 },
        ],
        extract: {
          prompt: extractionPrompt,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              price: { type: 'number' },
              location: { type: 'object' },
              propertyType: { type: 'string' },
              surface: { type: 'number' },
              contact: { type: 'object' },
              // ...
            },
          },
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.extract;
  }

  /**
   * Crawl multi-pages avec limites
   */
  async crawlWebsite(
    startUrl: string,
    options: {
      maxPages?: number;
      includePattern?: string;
      excludePattern?: string;
    },
    tenantId?: string,
  ): Promise<WebDataResult[]> {

    const apiKey = await this.getApiKey(tenantId);

    const response = await axios.post(
      'https://api.firecrawl.dev/v0/crawl',
      {
        url: startUrl,
        limit: options.maxPages || 10,
        scrapeOptions: {
          formats: ['markdown'],
          includePaths: [options.includePattern || '.*'],
          excludePaths: [options.excludePattern || ''],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      },
    );

    // Poll le job jusqu'à complétion
    return await this.pollCrawlJob(response.data.jobId, apiKey);
  }
}
```

---

### 2. Jina Reader Service (Markdown Propre)

**Nouveau service:** Conversion HTML → Markdown propre pour LLM

```typescript
@Injectable()
export class JinaReaderService {
  /**
   * Jina Reader API - Convertit n'importe quelle URL en markdown
   * https://jina.ai/reader
   */
  async readUrl(url: string): Promise<{
    markdown: string;
    title: string;
    description: string;
  }> {

    // Jina Reader: https://r.jina.ai/{URL}
    const jinaUrl = `https://r.jina.ai/${url}`;

    const response = await axios.get(jinaUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    return {
      markdown: response.data.content,
      title: response.data.title,
      description: response.data.description,
    };
  }

  /**
   * Version avec recherche intégrée
   */
  async search(query: string, options?: {
    site?: string; // Limiter à un site spécifique
    maxResults?: number;
  }): Promise<SearchResult[]> {

    // Jina Search: https://s.jina.ai/{query}
    let searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;

    if (options?.site) {
      searchUrl += `+site:${options.site}`;
    }

    const response = await axios.get(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    return response.data.results.slice(0, options?.maxResults || 10);
  }
}
```

---

### 3. SERP API Service (Recherche Google)

**Amélioration:** Recherches Google automatiques selon les critères

```typescript
@Injectable()
export class SerpApiService {
  /**
   * Recherche Google avec filtrage géographique
   */
  async searchRealEstate(criteria: {
    query: string;
    location?: string;
    priceRange?: { min: number; max: number };
    propertyType?: string;
  }): Promise<SerpResult[]> {

    // Construire la requête Google optimale
    let searchQuery = criteria.query;

    if (criteria.location) {
      searchQuery += ` ${criteria.location}`;
    }

    if (criteria.propertyType) {
      searchQuery += ` ${criteria.propertyType}`;
    }

    if (criteria.priceRange) {
      searchQuery += ` ${criteria.priceRange.min}-${criteria.priceRange.max}`;
    }

    // Ajouter des termes spécifiques tunisiens
    searchQuery += ' Tunisie immobilier';

    const apiKey = this.configService.get('SERPAPI_KEY');

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: searchQuery,
        location: 'Tunisia',
        hl: 'fr',
        gl: 'tn',
        api_key: apiKey,
        num: 20, // 20 résultats
      },
    });

    return response.data.organic_results.map(result => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      position: result.position,
    }));
  }

  /**
   * Recherche sur un site spécifique
   */
  async searchOnSite(site: string, query: string): Promise<SerpResult[]> {

    const searchQuery = `site:${site} ${query}`;

    const apiKey = this.configService.get('SERPAPI_KEY');

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: searchQuery,
        api_key: apiKey,
        num: 50,
      },
    });

    return response.data.organic_results;
  }
}
```

---

## 🎨 Interface Utilisateur Simplifiée

### Frontend: Prospection IA Améliorée

**Fichier:** `frontend/src/modules/business/prospecting/components/ai-prospection/SmartProspectionPanel.tsx`

```typescript
export const SmartProspectionPanel: React.FC = () => {
  const [inputMode, setInputMode] = useState<'natural' | 'urls'>('natural');
  const [naturalGoal, setNaturalGoal] = useState('');
  const [urls, setUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProspectionResult | null>(null);

  const handleSubmit = async () => {
    setIsProcessing(true);

    const input: ProspectionInput = {
      naturalLanguageGoal: inputMode === 'natural' ? naturalGoal : undefined,
      urls: inputMode === 'urls' ? urls.split('\n').filter(u => u.trim()) : undefined,
      constraints: {
        maxLeads: 100,
        maxBudget: 5, // $5 max
        onlyRecentListings: true,
      },
    };

    const result = await apiClient.post('/api/prospecting/smart-search', input);
    setResults(result.data);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Toggle Mode */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setInputMode('natural')}
          className={`px-6 py-3 rounded-xl font-medium transition ${
            inputMode === 'natural'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💬 Décrire mon objectif
        </button>
        <button
          onClick={() => setInputMode('urls')}
          className={`px-6 py-3 rounded-xl font-medium transition ${
            inputMode === 'urls'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🔗 Coller des liens
        </button>
      </div>

      {/* Input Area */}
      {inputMode === 'natural' ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Décrivez ce que vous cherchez (en langage naturel)
          </label>
          <textarea
            value={naturalGoal}
            onChange={(e) => setNaturalGoal(e.target.value)}
            rows={4}
            placeholder="Exemple: Je veux 50 villas à vendre à Sousse, budget 500k-1M TND, avec piscine, minimum 3 chambres, récentes (moins de 7 jours)"
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
          />
          <div className="text-xs text-gray-500">
            💡 Plus vous êtes précis, meilleurs seront les résultats
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Collez les URLs des annonces (une par ligne)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={6}
            placeholder="https://tayara.tn/item/123&#10;https://mubawab.tn/annonce/456&#10;https://afariat.com/item/789"
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm"
          />
          <div className="text-xs text-gray-500">
            💡 L'IA va automatiquement extraire toutes les données pertinentes
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || (!naturalGoal && !urls)}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin text-xl">⚙️</div>
            <span>Recherche en cours...</span>
          </>
        ) : (
          <>
            <span>🚀</span>
            <span>Lancer la Prospection Intelligente</span>
          </>
        )}
      </button>

      {/* Results */}
      {results && (
        <div className="mt-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon="👥"
              label="Leads trouvés"
              value={results.stats.totalLeads}
              color="purple"
            />
            <StatCard
              icon="⭐"
              label="Qualité moyenne"
              value={`${results.stats.avgQuality}/100`}
              color="blue"
            />
            <StatCard
              icon="📍"
              label="Sources utilisées"
              value={results.stats.sourcesUsed}
              color="green"
            />
            <StatCard
              icon="⚡"
              label="Temps"
              value={`${results.stats.timeSeconds}s`}
              color="orange"
            />
          </div>

          {/* Strategy Info */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-2">
              Stratégie utilisée par l'IA:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {results.strategy.sources.map((source, i) => (
                <li key={i}>
                  ✓ {source.name}: {source.expectedResults} résultats attendus - {source.reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Leads Table */}
          <LeadsTable leads={results.leads} />
        </div>
      )}
    </div>
  );
};
```

---

## 📊 Avantages vs Plan Précédent

| Aspect | Plan Précédent (CSS) | Nouveau Plan (IA-First) |
|--------|---------------------|------------------------|
| **Maintenance** | Sélecteurs CSS à maintenir par site | ✅ Auto-adaptatif, pas de maintenance |
| **Nouveaux sites** | Config manuelle nécessaire | ✅ Fonctionne automatiquement |
| **UX Utilisateur** | Config complexe par site | ✅ Simple: objectif en langage naturel |
| **Précision** | 90% si sélecteurs à jour | ✅ 85-95% avec IA (apprend) |
| **Coût** | Gratuit (sauf LLM léger) | ✅ $0.01-0.02/lead (Firecrawl + LLM) |
| **Flexibilité** | Limité aux sites configurés | ✅ N'importe quel site web |
| **Scalabilité** | Difficile (1 site = 1 jour config) | ✅ Facile (ajout source = 0 config) |

---

## 🎯 Roadmap d'Implémentation

### Phase 1: Fondations IA (Semaine 1-2)
- [ ] Créer `AiScrapingOrchestrator`
- [ ] Implémenter analyse intention (LLM)
- [ ] Implémenter génération stratégie (LLM)
- [ ] Tests avec objectifs simples

### Phase 2: Moteurs Améliorés (Semaine 3)
- [ ] Améliorer `FirecrawlServiceEnhanced`
- [ ] Créer `JinaReaderService`
- [ ] Améliorer `SerpApiService`
- [ ] Tests extraction IA

### Phase 3: Enrichissement (Semaine 4)
- [ ] Service géolocalisation
- [ ] Scoring qualité automatique
- [ ] Détection doublons intelligente

### Phase 4: Frontend Smart (Semaine 5)
- [ ] Créer `SmartProspectionPanel`
- [ ] Mode langage naturel
- [ ] Mode URLs directes
- [ ] Tests end-to-end

### Phase 5: Optimisations (Semaine 6)
- [ ] Cache intelligent
- [ ] Batch processing
- [ ] Rate limiting
- [ ] Monitoring & alertes

---

## 💰 Estimation Coûts Réels

### Scénario: 1000 leads/mois

**Coûts API:**
- Firecrawl: $0.001/page × 1000 = $1
- LLM (DeepSeek/Qwen batch): $0.0001/lead × 1000 = $0.10
- Google Maps Geocoding: $0 (1000 gratuits)
- SERP API: $0.005/recherche × 50 = $0.25
- **TOTAL: ~$1.35/mois = $0.00135/lead**

**ROI:**
- 1 lead converti = 500-1000 TND commission
- Coût/lead = $0.00135 ≈ 0.004 TND
- **ROI = 125,000x**

---

## 🚀 Prochaines Étapes

**Je recommande:**

1. **Prototype rapide** (3-5 jours):
   - Implémenter `AiScrapingOrchestrator` basique
   - Mode "URLs directes" seulement
   - Test avec 10 URLs Tayara

2. **Validation** (1-2 jours):
   - Tester extraction IA vs réalité
   - Mesurer précision
   - Ajuster prompts LLM

3. **Extension** (1 semaine):
   - Ajouter mode "langage naturel"
   - Intégrer tous les moteurs
   - Frontend complet

**Voulez-vous que je commence le prototype maintenant?** 🎯

J'implémenterais d'abord la classe `AiScrapingOrchestrator` avec le mode URLs directes pour avoir un POC fonctionnel rapidement.
