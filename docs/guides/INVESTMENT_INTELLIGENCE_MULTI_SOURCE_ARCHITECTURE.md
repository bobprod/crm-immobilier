# Architecture Multi-Sources - Investment Intelligence Module

## 🌍 Vue d'Ensemble

Le module Investment Intelligence doit supporter **plusieurs plateformes d'investissement immobilier** de différents pays/régions, avec un système flexible permettant d'ajouter de nouvelles sources facilement.

---

## 📍 Plateformes Supportées (Roadmap)

### Phase 1 - France (MVP)
- ✅ **Bricks.co** - Crowdfunding immobilier résidentiel
- ✅ **Homunity** - Investissement participatif immobilier
- ✅ **Anaxago** - Crowdfunding equity & immobilier

### Phase 2 - France (Extension)
- 🔄 **Fundimmo** - SCPI & crowdfunding
- 🔄 **Lymo** - Investissement fractionné
- 🔄 **Raizers** - Crowdfunding immobilier & énergies renouvelables
- 🔄 **Wiseed** - Crowdfunding startup & immobilier

### Phase 3 - Europe
- 🔄 **Estateguru** (Europe) - Prêts garantis par l'immobilier
- 🔄 **Reinvest24** (Estonie) - Investissement immobilier fractionné
- 🔄 **Crowdestate** (Estonie) - Crowdfunding immobilier européen

### Phase 4 - Tunisie & MENA
- 🔄 Plateformes tunisiennes locales (à identifier)
- 🔄 Plateformes MENA (Dubai, Abu Dhabi, etc.)

### Phase 5 - Manuel / Universel
- 🔄 **Import manuel** (formulaire pour tout projet)
- 🔄 **URL générique** (scraping intelligent sans plateforme connue)

---

## 🏗️ Architecture Multi-Sources

### 1. Pattern: Source Adapter

Chaque plateforme a son propre **Adapter** qui implémente une interface commune:

```typescript
// backend/src/modules/investment-intelligence/adapters/base-source.adapter.ts

export interface InvestmentSourceAdapter {
  // Métadonnées de la source
  readonly sourceName: string;
  readonly sourceType: InvestmentProjectSource;
  readonly supportedCountries: string[];
  readonly baseUrl: string;

  // Détection
  canHandle(url: string): boolean;

  // Extraction
  extractProjectId(url: string): string | null;

  // Import (2 méthodes selon disponibilité API)
  importFromUrl(url: string, context: ImportContext): Promise<RawProjectData>;
  importFromApi?(projectId: string, context: ImportContext): Promise<RawProjectData>;

  // Mapping vers format unifié
  mapToUnifiedFormat(rawData: any): UnifiedProjectData;

  // Validation
  validateData(data: UnifiedProjectData): ValidationResult;
}

export interface UnifiedProjectData {
  // Format standardisé indépendant de la source
  title: string;
  description?: string;

  // Localisation
  location: {
    city: string;
    country: string;
    region?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };

  // Financiers
  financial: {
    totalPrice: number;
    minInvestment: number;
    currency: string;
    fundingGoal?: number;
    fundingProgress?: number; // %
  };

  // Rendements
  yields: {
    gross?: number;
    net?: number;
    target?: number;
    type?: 'annual' | 'total';
  };

  // Durée
  duration: {
    months?: number;
    startDate?: Date;
    endDate?: Date;
  };

  // Type
  property: {
    type: PropertyType; // 'residential', 'commercial', 'mixed', 'land'
    subtype?: string; // 'apartment', 'house', 'office', 'retail'
    surface?: number; // m²
    units?: number; // nombre de logements/bureaux
  };

  // Statut
  status: {
    current: ProjectStatus;
    fundingDeadline?: Date;
  };

  // Média
  media: {
    images: string[];
    videos?: string[];
    documents?: string[];
  };

  // Source
  source: {
    platform: InvestmentProjectSource;
    projectId: string;
    url: string;
  };

  // Extra (données spécifiques à la plateforme)
  extra?: Record<string, any>;
}
```

### 2. Adapters Implémentés

#### 2.1 Bricks.co Adapter

```typescript
// backend/src/modules/investment-intelligence/adapters/bricks.adapter.ts

@Injectable()
export class BricksAdapter implements InvestmentSourceAdapter {
  readonly sourceName = 'Bricks.co';
  readonly sourceType = InvestmentProjectSource.BRICKS;
  readonly supportedCountries = ['FR', 'BE', 'ES', 'IT'];
  readonly baseUrl = 'https://bricks.co';

  constructor(
    private readonly firecrawlService: FirecrawlService,
    private readonly llmService: LlmService,
  ) {}

  canHandle(url: string): boolean {
    return url.includes('bricks.co');
  }

  extractProjectId(url: string): string | null {
    // https://bricks.co/project/123-nom-projet
    const match = url.match(/project\/(\d+)/);
    return match ? match[1] : null;
  }

  async importFromUrl(url: string, context: ImportContext): Promise<RawProjectData> {
    // 1. Scraper la page avec Firecrawl
    const scraped = await this.firecrawlService.scrape({
      tenantId: context.tenantId,
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
    });

    // 2. Extraire les données structurées avec LLM
    const schema = {
      title: 'string',
      description: 'string',
      city: 'string',
      country: 'string',
      totalPrice: 'number',
      minTicket: 'number',
      grossYield: 'number',
      netYield: 'number',
      durationMonths: 'number',
      propertyType: 'string',
      fundingProgress: 'number',
      images: 'string[]',
    };

    const extracted = await this.llmService.extractStructuredData({
      userId: context.userId,
      content: scraped.markdown,
      schema,
      instructions: 'Extract Bricks.co project data',
    });

    return extracted;
  }

  mapToUnifiedFormat(rawData: any): UnifiedProjectData {
    return {
      title: rawData.title,
      description: rawData.description,
      location: {
        city: rawData.city,
        country: rawData.country || 'France',
      },
      financial: {
        totalPrice: rawData.totalPrice,
        minInvestment: rawData.minTicket || 10,
        currency: 'EUR',
        fundingProgress: rawData.fundingProgress,
      },
      yields: {
        gross: rawData.grossYield,
        net: rawData.netYield,
        type: 'annual',
      },
      duration: {
        months: rawData.durationMonths,
      },
      property: {
        type: this.mapPropertyType(rawData.propertyType),
      },
      status: {
        current: this.mapStatus(rawData.fundingProgress),
      },
      media: {
        images: rawData.images || [],
      },
      source: {
        platform: InvestmentProjectSource.BRICKS,
        projectId: rawData.projectId || '',
        url: rawData.sourceUrl,
      },
    };
  }

  private mapPropertyType(type: string): PropertyType {
    const mapping: Record<string, PropertyType> = {
      'résidentiel': 'residential',
      'commercial': 'commercial',
      'mixte': 'mixed',
    };
    return mapping[type.toLowerCase()] || 'residential';
  }

  private mapStatus(fundingProgress: number): ProjectStatus {
    if (fundingProgress >= 100) return 'funded';
    if (fundingProgress > 0) return 'active';
    return 'draft';
  }

  validateData(data: UnifiedProjectData): ValidationResult {
    const errors: string[] = [];

    if (!data.title) errors.push('Title is required');
    if (!data.location.city) errors.push('City is required');
    if (!data.financial.totalPrice) errors.push('Total price is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

#### 2.2 Homunity Adapter

```typescript
// backend/src/modules/investment-intelligence/adapters/homunity.adapter.ts

@Injectable()
export class HomunityAdapter implements InvestmentSourceAdapter {
  readonly sourceName = 'Homunity';
  readonly sourceType = InvestmentProjectSource.HOMUNITY;
  readonly supportedCountries = ['FR'];
  readonly baseUrl = 'https://homunity.com';

  canHandle(url: string): boolean {
    return url.includes('homunity.com');
  }

  // ... Même structure que BricksAdapter mais avec logique spécifique Homunity

  async importFromUrl(url: string, context: ImportContext): Promise<RawProjectData> {
    // Homunity a une structure HTML différente
    // Adapter la logique de scraping/extraction
  }

  mapToUnifiedFormat(rawData: any): UnifiedProjectData {
    // Mapping spécifique Homunity
    // Par exemple, Homunity utilise "rendement prévisionnel" au lieu de "gross yield"
    return {
      title: rawData.projectName, // Différent de Bricks
      // ...
      yields: {
        target: rawData.rendementPrevisionnel, // Spécifique Homunity
        type: 'annual',
      },
      // ...
    };
  }
}
```

#### 2.3 Anaxago Adapter

```typescript
// backend/src/modules/investment-intelligence/adapters/anaxago.adapter.ts

@Injectable()
export class AnaxagoAdapter implements InvestmentSourceAdapter {
  readonly sourceName = 'Anaxago';
  readonly sourceType = InvestmentProjectSource.ANAXAGO;
  readonly supportedCountries = ['FR', 'BE', 'LU'];
  readonly baseUrl = 'https://anaxago.com';

  canHandle(url: string): boolean {
    return url.includes('anaxago.com');
  }

  // Anaxago fait aussi equity, donc filtrer uniquement immobilier
  async importFromUrl(url: string, context: ImportContext): Promise<RawProjectData> {
    const rawData = await this.scrapeAndExtract(url, context);

    // Vérifier que c'est bien un projet immobilier
    if (rawData.category !== 'immobilier') {
      throw new Error('Only real estate projects are supported');
    }

    return rawData;
  }

  // ...
}
```

#### 2.4 Generic/Manual Adapter

```typescript
// backend/src/modules/investment-intelligence/adapters/generic.adapter.ts

@Injectable()
export class GenericAdapter implements InvestmentSourceAdapter {
  readonly sourceName = 'Generic/Manual';
  readonly sourceType = InvestmentProjectSource.OTHER;
  readonly supportedCountries = ['*']; // Tous pays
  readonly baseUrl = '';

  canHandle(url: string): boolean {
    // Accepte toutes les URLs non reconnues
    return true;
  }

  async importFromUrl(url: string, context: ImportContext): Promise<RawProjectData> {
    // Scraping générique + extraction LLM sans schéma prédéfini
    // L'IA essaie de détecter automatiquement les champs
    const scraped = await this.firecrawlService.scrape({
      tenantId: context.tenantId,
      url,
      formats: ['markdown'],
    });

    const prompt = `Analyze this investment project page and extract ALL relevant data.
Try to identify: title, location, price, yield, duration, property type, etc.
Even if some fields are missing, extract what you can.

Content:
${scraped.markdown}`;

    const extracted = await this.llmService.chat({
      userId: context.userId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    // Parser la réponse LLM (probablement JSON)
    return JSON.parse(extracted);
  }

  mapToUnifiedFormat(rawData: any): UnifiedProjectData {
    // Mapping best-effort
    // Certains champs peuvent être null/undefined
    return {
      title: rawData.title || 'Untitled Project',
      location: {
        city: rawData.city || rawData.location || 'Unknown',
        country: rawData.country || this.detectCountry(rawData),
      },
      financial: {
        totalPrice: rawData.price || rawData.totalPrice || 0,
        minInvestment: rawData.minInvestment || rawData.minTicket || 0,
        currency: rawData.currency || 'EUR',
      },
      // ... Best effort mapping
    };
  }

  private detectCountry(data: any): string {
    // Heuristique pour détecter le pays depuis le texte
    if (data.description?.includes('Tunisia') || data.description?.includes('Tunis')) {
      return 'Tunisia';
    }
    return 'Unknown';
  }
}
```

### 3. Adapter Registry (Factory Pattern)

```typescript
// backend/src/modules/investment-intelligence/services/adapter-registry.service.ts

@Injectable()
export class AdapterRegistry {
  private adapters: InvestmentSourceAdapter[] = [];

  constructor(
    private readonly bricksAdapter: BricksAdapter,
    private readonly homunityAdapter: HomunityAdapter,
    private readonly anaxagoAdapter: AnaxagoAdapter,
    private readonly genericAdapter: GenericAdapter,
  ) {
    // Enregistrer les adapters dans l'ordre de priorité
    this.adapters = [
      this.bricksAdapter,
      this.homunityAdapter,
      this.anaxagoAdapter,
      // GenericAdapter en dernier (fallback)
      this.genericAdapter,
    ];
  }

  /**
   * Trouve l'adapter approprié pour une URL donnée
   */
  getAdapterForUrl(url: string): InvestmentSourceAdapter {
    const adapter = this.adapters.find(a => a.canHandle(url));

    if (!adapter) {
      // Ne devrait jamais arriver car GenericAdapter accepte tout
      throw new Error('No adapter found for URL');
    }

    return adapter;
  }

  /**
   * Récupère un adapter par type de source
   */
  getAdapterBySource(source: InvestmentProjectSource): InvestmentSourceAdapter {
    const adapter = this.adapters.find(a => a.sourceType === source);

    if (!adapter) {
      throw new Error(`No adapter found for source: ${source}`);
    }

    return adapter;
  }

  /**
   * Liste tous les adapters disponibles
   */
  getAllAdapters(): InvestmentSourceAdapter[] {
    return this.adapters.filter(a => a.sourceType !== InvestmentProjectSource.OTHER);
  }

  /**
   * Ajoute un nouvel adapter dynamiquement (pour extensions futures)
   */
  registerAdapter(adapter: InvestmentSourceAdapter): void {
    // Insérer avant le GenericAdapter (qui doit rester en dernier)
    this.adapters.splice(this.adapters.length - 1, 0, adapter);
  }
}
```

### 4. Import Service Refactoré

```typescript
// backend/src/modules/investment-intelligence/services/investment-import.service.ts

@Injectable()
export class InvestmentImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapterRegistry: AdapterRegistry,
    private readonly logger: Logger,
  ) {}

  async importFromUrl(
    url: string,
    userId: string,
    tenantId: string,
    options: ImportOptions = {}
  ): Promise<InvestmentProject> {
    try {
      // 1. Trouver l'adapter approprié
      const adapter = this.adapterRegistry.getAdapterForUrl(url);

      this.logger.log(`Importing from ${adapter.sourceName}: ${url}`);

      // 2. Importer les données brutes
      const rawData = await adapter.importFromUrl(url, { userId, tenantId });

      // 3. Mapper vers format unifié
      const unifiedData = adapter.mapToUnifiedFormat(rawData);

      // 4. Valider
      const validation = adapter.validateData(unifiedData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // 5. Créer le projet en DB
      const project = await this.prisma.investmentProject.create({
        data: {
          userId,
          tenantId,

          // Données unifiées
          title: unifiedData.title,
          description: unifiedData.description,
          sourceUrl: url,
          source: adapter.sourceType,
          sourceProjectId: unifiedData.source.projectId,

          city: unifiedData.location.city,
          country: unifiedData.location.country,
          address: unifiedData.location.address,
          latitude: unifiedData.location.coordinates?.lat,
          longitude: unifiedData.location.coordinates?.lng,

          totalPrice: unifiedData.financial.totalPrice,
          minTicket: unifiedData.financial.minInvestment,
          currency: unifiedData.financial.currency,

          grossYield: unifiedData.yields.gross,
          netYield: unifiedData.yields.net,
          targetYield: unifiedData.yields.target,

          durationMonths: unifiedData.duration.months,
          startDate: unifiedData.duration.startDate,
          endDate: unifiedData.duration.endDate,

          propertyType: unifiedData.property.type,
          status: unifiedData.status.current,
          fundingProgress: unifiedData.financial.fundingProgress,

          images: unifiedData.media.images,
          documents: unifiedData.media.documents || [],

          rawData: { ...rawData, unified: unifiedData }, // Sauvegarder tout

          importedAt: new Date(),
        },
      });

      // 6. Analyser immédiatement si demandé
      if (options.analyzeImmediately) {
        // Lancer analyse en background (non-bloquant)
        this.analysisService.analyze(project.id).catch(err => {
          this.logger.error(`Analysis failed for project ${project.id}:`, err);
        });
      }

      return project;

    } catch (error) {
      this.logger.error(`Import failed for ${url}:`, error);
      throw new Error(`Failed to import project: ${error.message}`);
    }
  }

  /**
   * Import en masse depuis une liste d'URLs
   */
  async importBatch(
    urls: string[],
    userId: string,
    tenantId: string,
    options: ImportOptions = {}
  ): Promise<ImportBatchResult> {
    const results: ImportBatchResult = {
      successful: [],
      failed: [],
      total: urls.length,
    };

    // Importer en parallèle (max 3 simultanés pour éviter rate limiting)
    const chunks = this.chunkArray(urls, 3);

    for (const chunk of chunks) {
      const promises = chunk.map(async (url) => {
        try {
          const project = await this.importFromUrl(url, userId, tenantId, options);
          results.successful.push({ url, project });
        } catch (error) {
          results.failed.push({ url, error: error.message });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Synchroniser un projet existant avec sa source
   */
  async syncProject(projectId: string): Promise<InvestmentProject> {
    const project = await this.prisma.investmentProject.findUnique({
      where: { id: projectId },
    });

    if (!project.sourceUrl) {
      throw new Error('Cannot sync: project has no source URL');
    }

    // Ré-importer et merger les données
    const adapter = this.adapterRegistry.getAdapterBySource(project.source);
    const rawData = await adapter.importFromUrl(project.sourceUrl, {
      userId: project.userId,
      tenantId: project.tenantId,
    });

    const unifiedData = adapter.mapToUnifiedFormat(rawData);

    // Mettre à jour uniquement les champs qui peuvent changer
    return this.prisma.investmentProject.update({
      where: { id: projectId },
      data: {
        fundingProgress: unifiedData.financial.fundingProgress,
        status: unifiedData.status.current,
        lastSyncedAt: new Date(),
        // Ne pas mettre à jour: title, description, prix (immuables)
      },
    });
  }
}
```

---

## 🎯 Enum Source étendu

```prisma
enum InvestmentProjectSource {
  // France
  bricks         // Bricks.co
  homunity       // Homunity.com
  anaxago        // Anaxago.com
  fundimmo       // Fundimmo.com
  lymo           // Lymo.fr
  raizers        // Raizers.com
  wiseed         // Wiseed.com

  // Europe
  estateguru     // Estateguru.co
  reinvest24     // Reinvest24.com
  crowdestate    // Crowdestate.eu

  // Tunisie (à définir)
  tunisia_local  // Plateforme locale tunisienne

  // Autres
  manual         // Ajout manuel
  other          // Autre plateforme (scraping générique)
}
```

---

## 📊 Frontend: Gestion Multi-Sources

### 1. Composant ImportProjectPanel étendu

```typescript
// frontend/src/modules/investment-intelligence/components/ImportProjectPanel.tsx

export const ImportProjectPanel = () => {
  const [importMode, setImportMode] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [detectedSource, setDetectedSource] = useState<string | null>(null);

  // Détecter la source en temps réel
  useEffect(() => {
    if (url) {
      const source = detectSourceFromUrl(url);
      setDetectedSource(source);
    } else {
      setDetectedSource(null);
    }
  }, [url]);

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setImportMode('url')}
          className={importMode === 'url' ? 'active' : ''}
        >
          🔗 Importer depuis URL
        </button>
        <button
          onClick={() => setImportMode('manual')}
          className={importMode === 'manual' ? 'active' : ''}
        >
          ✍️ Ajout manuel
        </button>
      </div>

      {importMode === 'url' ? (
        <div>
          {/* Input URL */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://bricks.co/project/123 ou https://homunity.com/..."
          />

          {/* Source détectée */}
          {detectedSource && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <svg>✓</svg>
              <span>Source détectée: <strong>{detectedSource}</strong></span>
            </div>
          )}

          {/* Plateformes supportées */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Plateformes supportées:</p>
            <div className="flex flex-wrap gap-2">
              <SourceBadge name="Bricks.co" country="FR" />
              <SourceBadge name="Homunity" country="FR" />
              <SourceBadge name="Anaxago" country="FR/BE" />
              <SourceBadge name="Fundimmo" country="FR" coming />
              <SourceBadge name="Estateguru" country="EU" coming />
              <SourceBadge name="Autre" country="Générique" />
            </div>
          </div>

          <button onClick={handleImport} disabled={!url}>
            Importer le projet
          </button>
        </div>
      ) : (
        <ManualProjectForm onSubmit={handleManualSubmit} />
      )}
    </div>
  );
};

const SourceBadge = ({ name, country, coming = false }) => (
  <span className={`px-3 py-1 rounded-full text-xs ${coming ? 'bg-gray-100 text-gray-500' : 'bg-purple-100 text-purple-700'}`}>
    {name} ({country}) {coming && '🔜'}
  </span>
);
```

### 2. Utils de Détection Source

```typescript
// frontend/src/modules/investment-intelligence/utils/source-detection.ts

export function detectSourceFromUrl(url: string): string | null {
  const sources = [
    { pattern: /bricks\.co/i, name: 'Bricks.co' },
    { pattern: /homunity\.com/i, name: 'Homunity' },
    { pattern: /anaxago\.com/i, name: 'Anaxago' },
    { pattern: /fundimmo\.com/i, name: 'Fundimmo' },
    { pattern: /lymo\.fr/i, name: 'Lymo' },
    { pattern: /raizers\.com/i, name: 'Raizers' },
    { pattern: /wiseed\.com/i, name: 'Wiseed' },
    { pattern: /estateguru\./i, name: 'Estateguru' },
    { pattern: /reinvest24\./i, name: 'Reinvest24' },
    { pattern: /crowdestate\./i, name: 'Crowdestate' },
  ];

  for (const source of sources) {
    if (source.pattern.test(url)) {
      return source.name;
    }
  }

  // Si aucune source connue, retourner "Générique"
  return 'Générique (scraping intelligent)';
}
```

### 3. Affichage Source dans ProjectCard

```typescript
// frontend/src/modules/investment-intelligence/components/ProjectCard.tsx

export const ProjectCard = ({ project }: { project: InvestmentProject }) => {
  const sourceConfig = getSourceConfig(project.source);

  return (
    <div className="border rounded-lg p-4">
      {/* Source badge */}
      <div className="flex items-center gap-2 mb-2">
        <img src={sourceConfig.logo} alt={sourceConfig.name} className="w-6 h-6" />
        <span className="text-xs font-medium text-gray-600">{sourceConfig.name}</span>
        {project.sourceUrl && (
          <a href={project.sourceUrl} target="_blank" className="text-xs text-purple-600 hover:underline">
            Voir sur {sourceConfig.name} →
          </a>
        )}
      </div>

      {/* Projet info */}
      <h3>{project.title}</h3>
      <p>{project.city}, {project.country}</p>
      <p>Rendement: {project.netYield}%</p>

      {/* ... */}
    </div>
  );
};

function getSourceConfig(source: string) {
  const configs = {
    bricks: { name: 'Bricks.co', logo: '/logos/bricks.png' },
    homunity: { name: 'Homunity', logo: '/logos/homunity.png' },
    anaxago: { name: 'Anaxago', logo: '/logos/anaxago.png' },
    manual: { name: 'Manuel', logo: '/icons/manual.svg' },
    other: { name: 'Autre', logo: '/icons/generic.svg' },
  };

  return configs[source] || configs.other;
}
```

---

## 🔄 Ajout d'une Nouvelle Source (Guide Dev)

Pour ajouter une nouvelle plateforme (ex: "Fundimmo"):

### Étape 1: Créer l'Adapter

```bash
# Créer le fichier
touch backend/src/modules/investment-intelligence/adapters/fundimmo.adapter.ts
```

```typescript
@Injectable()
export class FundimmoAdapter implements InvestmentSourceAdapter {
  readonly sourceName = 'Fundimmo';
  readonly sourceType = InvestmentProjectSource.FUNDIMMO;
  readonly supportedCountries = ['FR'];
  readonly baseUrl = 'https://fundimmo.com';

  canHandle(url: string): boolean {
    return url.includes('fundimmo.com');
  }

  // Implémenter: extractProjectId, importFromUrl, mapToUnifiedFormat, validateData
}
```

### Étape 2: Enregistrer l'Adapter

```typescript
// Dans adapter-registry.service.ts
constructor(
  // ...
  private readonly fundimmoAdapter: FundimmoAdapter, // Ajouter
) {
  this.adapters = [
    this.bricksAdapter,
    this.homunityAdapter,
    this.anaxagoAdapter,
    this.fundimmoAdapter, // Ajouter
    this.genericAdapter,
  ];
}
```

### Étape 3: Ajouter dans le Module

```typescript
// Dans investment-intelligence.module.ts
@Module({
  providers: [
    // ...
    FundimmoAdapter, // Ajouter
  ],
})
```

### Étape 4: Mettre à jour l'Enum

```prisma
enum InvestmentProjectSource {
  // ...
  fundimmo       // Fundimmo.com (NOUVEAU)
  // ...
}
```

### Étape 5: Frontend - Ajouter dans la détection

```typescript
// Dans source-detection.ts
const sources = [
  // ...
  { pattern: /fundimmo\.com/i, name: 'Fundimmo' }, // Ajouter
];
```

**C'est tout!** La nouvelle source est intégrée. 🎉

---

## 📈 Avantages de cette Architecture

✅ **Extensibilité**: Ajout de nouvelles sources en 5 étapes
✅ **Maintenabilité**: Chaque source est isolée dans son adapter
✅ **Flexibilité**: Support générique pour sources inconnues
✅ **Testabilité**: Chaque adapter peut être testé indépendamment
✅ **Réutilisabilité**: Format unifié pour toutes les sources
✅ **Performance**: Cache par source, scraping optimisé

---

## 🌍 Roadmap d'Expansion

### Q1 2025
- ✅ France: Bricks.co, Homunity, Anaxago
- 🔄 Import manuel
- 🔄 Scraping générique

### Q2 2025
- 🔄 France: Fundimmo, Lymo, Raizers, Wiseed
- 🔄 Europe: Estateguru

### Q3 2025
- 🔄 Europe: Reinvest24, Crowdestate
- 🔄 Tunisie: Identifier et intégrer plateformes locales

### Q4 2025
- 🔄 MENA: Dubai, Abu Dhabi
- 🔄 APIs officielles (si disponibles)
- 🔄 Sync automatique périodique

---

**Architecture modulaire, évolutive et prête pour l'international!** 🚀🌍
