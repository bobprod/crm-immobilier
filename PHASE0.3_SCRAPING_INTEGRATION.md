# ✅ Phase 0.3 - Connecter Scraping avec Settings

**Date:** 11 janvier 2026
**Branch:** `phase0-backend-critical-fixes`
**Status:** 🚧 EN COURS (Firecrawl connecté, autres services à finaliser)

---

## 🎯 Objectif

Connecter les services de scraping avec le système de settings pour:
1. **Utiliser les API keys configurées** par l'utilisateur dans Settings
2. **Respecter la hiérarchie** User → Agency → Super Admin
3. **Utiliser les moteurs internes** (Cheerio/Puppeteer) basés sur la configuration

---

## 📊 État Actuel des Services

| Service | API Keys Source | Status | Priorité |
|---------|----------------|--------|----------|
| **SerpApiService** | ✅ ApiKeysService | ✅ DÉJÀ CONNECTÉ | N/A |
| **FirecrawlService** | ❌ ConfigService (.env) | ✅ CONNECTÉ | ⭐⭐⭐⭐⭐ |
| **Cheerio/Puppeteer** | Settings DB (cheerioEnabled/puppeteerEnabled) | ✅ CONFIGURATION EXISTANTE | ⭐⭐⭐⭐⭐ |
| **PicaAiService** | À vérifier | 🔄 À IMPLÉMENTER | ⭐⭐⭐ |
| **JinaReaderService** | À vérifier | 🔄 À IMPLÉMENTER | ⭐⭐ |
| **ScrapingBeeService** | À vérifier | 🔄 À IMPLÉMENTER | ⭐⭐ |
| **BrowserlessService** | À vérifier | 🔄 À IMPLÉMENTER | ⭐⭐ |

---

## ✅ Changements Effectués

### 1. FirecrawlService - Connecté à ApiKeysService

**Fichier:** `backend/src/modules/scraping/services/firecrawl.service.ts`

#### Avant:
```typescript
import { ConfigService } from '@nestjs/config';

export class FirecrawlService {
  constructor(private configService: ConfigService) {}

  private getApiKey(tenantId?: string): string {
    // NOTE: La récupération depuis les settings du tenant n'est pas encore implémentée
    const apiKey = this.configService.get<string>('FIRECRAWL_API_KEY');

    if (!apiKey) {
      throw new Error('Clé API Firecrawl non configurée');
    }

    return apiKey;
  }
}
```

#### Après:
```typescript
import { ApiKeysService } from '../../../shared/services/api-keys.service';

export class FirecrawlService {
  constructor(private apiKeysService: ApiKeysService) {}

  /**
   * Obtenir la clé API Firecrawl
   *
   * Stratégie hiérarchique:
   * 1. Clé au niveau USER (ai_settings) - PRIORITÉ 1
   * 2. Clé au niveau AGENCY (agencyApiKeys) - PRIORITÉ 2
   * 3. Clé SUPER ADMIN (globalSettings) - FALLBACK
   *
   * @param userId ID de l'utilisateur
   * @param agencyId ID de l'agence (optionnel)
   */
  private async getApiKey(userId: string, agencyId?: string): Promise<string> {
    this.logger.log(`🔑 Getting Firecrawl API key for userId=${userId}, agencyId=${agencyId}`);

    try {
      const apiKey = await this.apiKeysService.getApiKey(userId, 'firecrawl', agencyId);

      if (!apiKey) {
        throw new Error(
          'Clé API Firecrawl non configurée. ' +
          'Veuillez configurer votre clé Firecrawl dans les paramètres (Settings > API Keys) ' +
          'ou contactez votre administrateur d\'agence.',
        );
      }

      this.logger.log(`✅ Firecrawl API key retrieved successfully`);
      return apiKey;
    } catch (error) {
      this.logger.error(`❌ Error getting Firecrawl API key: ${error.message}`);
      throw error;
    }
  }
}
```

#### Signature mise à jour pour scrapeUrl():
```typescript
async scrapeUrl(
  url: string,
  options?: FirecrawlScrapingOptions & { userId?: string; agencyId?: string },
  tenantId?: string, // Deprecated: use options.userId instead
): Promise<FirecrawlScrapingResult> {
  // Extract userId and agencyId from options or use tenantId as fallback
  const userId = options?.userId || tenantId;
  const agencyId = options?.agencyId;

  if (!userId) {
    throw new Error('userId is required to fetch API key from settings');
  }

  const apiKey = await this.getApiKey(userId, agencyId);
  // ... reste du code
}
```

---

### 2. ApiKeysService - Support des Clés Scraping

**Fichier:** `backend/src/shared/services/api-keys.service.ts`

**Providers supportés:**
```typescript
export type ProviderType =
  | 'llm' | 'anthropic' | 'openai' | 'gemini' | 'deepseek' | 'openrouter'
  | 'qwen' | 'kimi' | 'mistral'
  | 'serp'          // ✅ Google SERP API
  | 'firecrawl'     // ✅ Firecrawl
  | 'pica'          // ✅ Pica AI
  | 'jina'          // ✅ Jina Reader
  | 'scrapingbee'   // ✅ ScrapingBee
  | 'browserless'   // ✅ Browserless
  | 'rapidapi';     // ✅ RapidAPI
```

**Stratégie hiérarchique:**
1. **User level** (`ai_settings` table) - PRIORITÉ 1
2. **Agency level** (`agencyApiKeys` table) - PRIORITÉ 2
3. **Super Admin** (`globalSettings` table, key: `superadmin_{provider}_key`) - FALLBACK

**Mapping des clés - Agency Level:**
```typescript
const keyMap: Record<ProviderType, string | null> = {
  serp: agencyKeys.serpApiKey,           // ✅ Configuré via Settings
  firecrawl: agencyKeys.firecrawlApiKey, // ✅ Configuré via Settings
  pica: agencyKeys.picaApiKey,           // ✅ Configuré via Settings
  jina: agencyKeys.jinaReaderApiKey,     // ✅ Configuré via Settings
  scrapingbee: agencyKeys.scrapingBeeApiKey, // ✅ Configuré via Settings
  browserless: agencyKeys.browserlessApiKey, // ✅ Configuré via Settings
  rapidapi: agencyKeys.rapidApiKey,      // ✅ Configuré via Settings
};
```

---

### 3. Moteurs Internes - Configuration Déjà Présente

**Configuration dans Settings:**
- ✅ `cheerioEnabled` - Activer/désactiver Cheerio
- ✅ `puppeteerEnabled` - Activer/désactiver Puppeteer

**Endpoints Backend:**
- ✅ `GET /api/ai-billing/api-keys/scraping-engines` - Récupérer config
- ✅ `PUT /api/ai-billing/api-keys/scraping-engines` - Mettre à jour config

**Frontend UI:**
- ✅ Toggles dans Settings > API Keys > Moteurs Internes
- ✅ Persistance en DB (`ai_settings` table)

**WebDataService - Sélection Automatique:**
```typescript
// backend/src/modules/scraping/services/web-data.service.ts

private selectBestProvider(url: string, options?: WebDataFetchOptions): WebDataProvider {
  // 1. Si provider forcé, utiliser celui-là
  if (options?.provider) {
    return options.provider;
  }

  // 2. Si clé Firecrawl disponible → utiliser Firecrawl (meilleur pour sites complexes)
  if (await this.hasFirecrawlKey(options?.userId, options?.agencyId)) {
    return 'firecrawl';
  }

  // 3. Si site statique → Cheerio (rapide et gratuit)
  if (this.isStaticSite(url)) {
    return 'cheerio';
  }

  // 4. Sinon → Puppeteer (sites JS dynamiques)
  return 'puppeteer';
}
```

**TODO:** Implémenter `hasFirecrawlKey()` check dans WebDataService pour utiliser la logique de sélection basée sur la disponibilité des clés.

---

## 📋 TODO Backend (Complétion Phase 0.3)

### Priorité HAUTE ⭐⭐⭐⭐⭐

#### 1. Mettre à jour toutes les méthodes de FirecrawlService
- [x] `scrapeUrl()` - ✅ FAIT
- [ ] `scrapeMultipleUrls()` - À mettre à jour
- [ ] `crawlWebsite()` - À mettre à jour
- [ ] `mapWebsite()` - À mettre à jour
- [ ] `checkScrapingStatus()` - À mettre à jour

#### 2. Ajouter ApiKeysService à ScrapingModule
```typescript
// backend/src/modules/scraping/scraping.module.ts

@Module({
  imports: [
    SharedModule, // Pour avoir accès à ApiKeysService
    // ... autres imports
  ],
  providers: [
    FirecrawlService,
    CheerioService,
    PuppeteerService,
    WebDataService,
    // ...
  ],
  exports: [
    FirecrawlService,
    WebDataService,
  ],
})
export class ScrapingModule {}
```

#### 3. Mettre à jour WebDataService
- [ ] Ajouter méthode `hasFirecrawlKey(userId, agencyId)`
- [ ] Modifier `selectBestProvider()` pour vérifier la disponibilité des clés
- [ ] Respecter les settings `cheerioEnabled` / `puppeteerEnabled`

```typescript
private async selectBestProvider(url: string, options?: WebDataFetchOptions): Promise<WebDataProvider> {
  // 1. Vérifier quels moteurs sont activés
  const settings = await this.getScrapingSettings(options?.userId);

  // 2. Si provider forcé, vérifier qu'il est activé
  if (options?.provider) {
    if (options.provider === 'cheerio' && !settings.cheerioEnabled) {
      throw new Error('Cheerio est désactivé dans vos paramètres');
    }
    if (options.provider === 'puppeteer' && !settings.puppeteerEnabled) {
      throw new Error('Puppeteer est désactivé dans vos paramètres');
    }
    return options.provider;
  }

  // 3. Si clé Firecrawl disponible → utiliser Firecrawl (prioritaire)
  const hasFirecrawl = await this.apiKeysService.hasApiKey(
    options?.userId,
    'firecrawl',
    options?.agencyId,
  );

  if (hasFirecrawl) {
    return 'firecrawl';
  }

  // 4. Sinon, choisir entre Cheerio et Puppeteer selon le site
  if (settings.cheerioEnabled && this.isStaticSite(url)) {
    return 'cheerio';
  }

  if (settings.puppeteerEnabled) {
    return 'puppeteer';
  }

  // 5. Fallback: Cheerio si tout est désactivé
  if (settings.cheerioEnabled) {
    return 'cheerio';
  }

  throw new Error('Aucun moteur de scraping disponible. Veuillez activer Cheerio ou Puppeteer dans les paramètres.');
}
```

### Priorité MOYENNE ⭐⭐⭐

#### 4. PicaAiService - Connecter à ApiKeysService
- [ ] Vérifier si `PicaAiService` existe
- [ ] Remplacer ConfigService par ApiKeysService
- [ ] Mettre à jour toutes les méthodes

#### 5. Autres services de scraping
- [ ] JinaReaderService
- [ ] ScrapingBeeService
- [ ] BrowserlessService
- [ ] RapidApiService (si utilisé)

---

## 🧪 Tests À Effectuer

### Test 1: Firecrawl avec clé User
1. Configurer une clé Firecrawl dans Settings > API Keys (niveau User)
2. Lancer une prospection qui utilise Firecrawl
3. ✅ Vérifier que la clé user est utilisée
4. ✅ Vérifier que le scraping fonctionne
5. ✅ Vérifier les logs: "Firecrawl API key retrieved successfully"

### Test 2: Firecrawl avec fallback Agency
1. NE PAS configurer de clé User
2. Configurer une clé Firecrawl au niveau Agency (admin)
3. Lancer une prospection
4. ✅ Vérifier que la clé agency est utilisée (fallback)

### Test 3: Firecrawl avec fallback Super Admin
1. NE PAS configurer de clé User ni Agency
2. Configurer `superadmin_firecrawl_key` dans GlobalSettings
3. Lancer une prospection
4. ✅ Vérifier que la clé super admin est utilisée (fallback ultime)

### Test 4: Aucune clé configurée
1. NE configurer aucune clé Firecrawl
2. Lancer une prospection qui requiert Firecrawl
3. ✅ Vérifier l'erreur claire: "Veuillez configurer votre clé Firecrawl dans les paramètres"

### Test 5: Moteurs internes désactivés
1. Désactiver Cheerio dans Settings
2. Tenter d'utiliser Cheerio
3. ✅ Vérifier qu'il fallback sur Puppeteer ou Firecrawl

---

## 📊 Bénéfices Utilisateur

### Avant (ConfigService)
- ❌ Clés API hardcodées dans `.env`
- ❌ Impossibles à changer sans redémarrer le serveur
- ❌ Pas de gestion multi-tenant
- ❌ Super Admin doit gérer toutes les clés
- ❌ Pas de flexibilité pour les agences

### Après (ApiKeysService)
- ✅ Clés configurables via UI (Settings)
- ✅ Changement à chaud sans redémarrage
- ✅ Hiérarchie User → Agency → Super Admin
- ✅ Chaque utilisateur/agence peut avoir ses propres clés
- ✅ Traçabilité: qui utilise quelle clé

### Impact Business
- **Réduction coûts**: Chaque agency paie ses propres clés API
- **Autonomie**: Users peuvent configurer leurs clés sans admin
- **Scalabilité**: Supporte des milliers d'utilisateurs avec différentes clés
- **Sécurité**: Clés API isolées par user/agency

---

## 🔄 Compatibilité Ascendante

Pour éviter de casser le code existant:

```typescript
// Old way (deprecated mais toujours supporté)
await firecrawlService.scrapeUrl(url, options, tenantId);

// New way (recommandé)
await firecrawlService.scrapeUrl(url, {
  ...options,
  userId: req.user.userId,
  agencyId: req.user.agencyId,
});
```

Le code existant continue de fonctionner avec `tenantId` comme fallback.

---

## ✅ Checklist Phase 0.3

- [x] Analyser les services de scraping
- [x] Connecter FirecrawlService à ApiKeysService
- [x] Mettre à jour signature de `scrapeUrl()`
- [x] Documenter la hiérarchie des clés
- [x] Documenter les changements
- [ ] Mettre à jour toutes les méthodes de FirecrawlService (en cours)
- [ ] Ajouter ApiKeysService à ScrapingModule
- [ ] Mettre à jour WebDataService pour respecter les settings
- [ ] Connecter PicaAiService (si existe)
- [ ] Connecter autres services de scraping
- [ ] Tester avec hiérarchie User → Agency → Super Admin
- [ ] Commit et push

---

**Prochaine étape:** Finaliser Phase 0.3 puis Phase 0.4 - Consolider modules prospecting/prospecting-ai

