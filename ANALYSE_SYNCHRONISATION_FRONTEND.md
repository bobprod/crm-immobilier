# Analyse de Synchronisation Frontend - Prospection IA et Scraping

## 📋 Date d'Analyse
24 décembre 2025

## 🎯 Objectif
Vérifier que le frontend Next.js est correctement synchronisé avec le backend (ProspectingModule et ScrapingModule).

## ✅ État de la Synchronisation

### 1. Module Prospection IA ✅ **SYNCHRONISÉ**

#### API Client (`prospecting-api.ts`)
**Emplacement:** `frontend/src/shared/utils/prospecting-api.ts`

**Endpoints Backend Utilisés:**
```typescript
// Scraping
POST /prospecting/scrape/serp       → scrapeSERP()
POST /prospecting/scrape/firecrawl  → scrapeFirecrawl()
POST /prospecting/scrape/pica       → scrapePica()
POST /prospecting/scrape/social     → scrapeSocial()
POST /prospecting/scrape/websites   → scrapeWebsites()

// Ingestion
POST /prospecting/campaigns/{id}/scrape-and-ingest → scrapeAndIngest()

// LLM Processing
POST /prospecting/analyze-content   → analyzeContent()
POST /prospecting/classify-lead     → classifyLead()
POST /prospecting/detect-opportunities → detectOpportunities()
```

**État:** ✅ Tous les endpoints backend sont mappés dans le frontend.

#### Hook React (`useProspecting.ts`)
**Emplacement:** `frontend/src/shared/hooks/useProspecting.ts`

**Fonctions de Scraping:**
```typescript
// Ligne 437
const scrapeSERP = useCallback(async (config: ScrapingConfig) => {
  const result = await prospectingAPI.scrapeSERP(config);
  // ...
});

// Ligne 454
const scrapeFirecrawl = useCallback(async (urls: string[], config?: any) => {
  const result = await prospectingAPI.scrapeFirecrawl(urls, config);
  // ...
});

// Ligne 505
const scrapeWebsites = useCallback(async (urls: string[], selectors?: any) => {
  const result = await prospectingAPI.scrapeWebsites(urls, selectors);
  // ...
});
```

**État:** ✅ Hook complet avec gestion d'état et erreurs.

#### Composant UI (`ProspectingDashboard.tsx`)
**Emplacement:** `frontend/src/modules/business/prospecting/components/ProspectingDashboard.tsx`

**Interface Utilisateur:**
- ✅ Onglet "Scraping" avec formulaire
- ✅ Sélection de source (SERP, Firecrawl, Pica, Social, Websites)
- ✅ Configuration par source
- ✅ Boutons d'action pour lancer le scraping
- ✅ Affichage des résultats

**Utilisation des hooks:**
```typescript
const {
  scrapeSERP,
  scrapeFirecrawl,
  scrapePica,
  scrapeSocial,
  scrapeWebsites,
  scrapingInProgress,
} = useProspecting();

// Ligne ~450+
const handleStartScraping = useCallback(async () => {
  switch (scrapingSource) {
    case 'serp':
      await scrapeSERP({ query: scrapingConfig.query, maxResults: scrapingConfig.maxResults });
      break;
    case 'firecrawl':
      await scrapeFirecrawl(scrapingConfig.urls.filter(Boolean));
      break;
    case 'websites':
      await scrapeWebsites(scrapingConfig.urls.filter(Boolean));
      break;
    // ...
  }
}, [scrapingSource, scrapingConfig, /* ... */]);
```

**État:** ✅ UI complète et fonctionnelle.

### 2. Configuration Scraping ✅ **SYNCHRONISÉ**

#### Page de Configuration (`scraping-config.tsx`)
**Emplacement:** `frontend/src/pages/settings/scraping-config.tsx`

**Providers Configurables:**
- ✅ Pica API (scraping combiné)
- ✅ SerpAPI (recherche Google)
- ✅ ScrapingBee (proxy rotatif)
- ✅ Browserless (browser headless)

**Endpoints:**
```typescript
GET  /settings/scraping        → Charger config
POST /settings/scraping/bulk   → Sauvegarder config
POST /settings/scraping/test   → Tester un provider
```

**État:** ✅ Configuration complète avec test des providers.

### 3. Types TypeScript ✅ **SYNCHRONISÉ**

**Types Frontend alignés avec Backend:**
```typescript
// prospecting-api.ts
export type ScrapingSource = 'pica' | 'serp' | 'firecrawl' | 'meta' | 'linkedin' | 'website';
export type LeadType = 'requete' | 'mandat' | 'inconnu';
export type ValidationStatus = 'pending' | 'valid' | 'suspicious' | 'spam';
export type Intention = 'acheter' | 'louer' | 'vendre' | 'investir' | 'inconnu';
export type Urgency = 'basse' | 'moyenne' | 'haute' | 'inconnu';

// Interfaces
export interface ProspectingLead { ... }
export interface ProspectingCampaign { ... }
export interface ScrapingConfig { ... }
export interface RawScrapedItem { ... }
export interface LLMAnalyzedLead { ... }
```

**État:** ✅ Types synchronisés avec backend (`backend/src/modules/prospecting/dto/`).

## 🔄 Architecture Frontend → Backend

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  ProspectingDashboard.tsx                                    │
│         ↓                                                    │
│  useProspecting() hook                                       │
│         ↓                                                    │
│  prospecting-api.ts                                          │
│         ↓                                                    │
│  HTTP POST /prospecting/scrape/*                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                          │
├─────────────────────────────────────────────────────────────┤
│  ProspectingController                                       │
│         ↓                                                    │
│  ProspectingIntegrationService                               │
│         ↓                                                    │
│  WebDataService (nouveau!)                                   │
│         ↓                                                    │
│  CheerioService / PuppeteerService / FirecrawlService        │
│         ↓                                                    │
│  LLMProspectingService (analyse IA)                          │
│         ↓                                                    │
│  Database (prospecting_leads)                                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Tableau Récapitulatif

| Composant Frontend | Backend Associé | Endpoint | Statut |
|-------------------|-----------------|----------|--------|
| `ProspectingDashboard` | ProspectingController | `/prospecting/*` | ✅ Sync |
| `useProspecting.scrapeSERP` | ProspectingIntegrationService | `POST /prospecting/scrape/serp` | ✅ Sync |
| `useProspecting.scrapeFirecrawl` | ProspectingIntegrationService | `POST /prospecting/scrape/firecrawl` | ✅ Sync |
| `useProspecting.scrapeWebsites` | ProspectingIntegrationService | `POST /prospecting/scrape/websites` | ✅ Sync |
| `scraping-config.tsx` | SettingsController | `POST /settings/scraping/*` | ✅ Sync |
| Types TypeScript | Backend DTOs | N/A | ✅ Sync |

## ⚠️ Note Importante

### Frontend N'appelle PAS `/api/scraping` Directement

**C'est NORMAL et CORRECT:**

Le frontend passe par la couche métier (`/prospecting/*`) plutôt que d'appeler directement le module de scraping (`/api/scraping`). C'est une **architecture en couches** appropriée:

1. **Frontend** → Appelle `/prospecting/*`
2. **ProspectingIntegrationService** → Utilise `WebDataService` en interne
3. **WebDataService** → Orchestre les providers (Cheerio, Puppeteer, Firecrawl)
4. **LLMProspectingService** → Analyse les données scrappées

**Avantages:**
- ✅ Séparation des responsabilités
- ✅ Business logic centralisée dans ProspectingIntegrationService
- ✅ Frontend découplé des détails d'implémentation
- ✅ Facilite les tests et la maintenance

### Module `/api/scraping` - Usage Direct

Le nouveau module `/api/scraping` est **disponible** mais **optionnel** pour:
- Tests directs des providers
- Outils internes
- Debugging

**Endpoints disponibles (non utilisés par le frontend actuellement):**
```typescript
POST /api/scraping/scrape          // Scraper une URL
POST /api/scraping/scrape-multiple // Scraper plusieurs URLs
POST /api/scraping/extract         // Extraction IA
POST /api/scraping/test-provider   // Tester un provider
GET  /api/scraping/providers       // Liste des providers
```

## 💡 Améliorations Futures (Optionnelles)

### 1. Ajouter Test de Providers dans UI
**Composant:** `scraping-config.tsx`

**Amélioration:**
```typescript
// Ajouter bouton "Tester WebDataService"
const testWebDataService = async (provider: 'cheerio' | 'puppeteer' | 'firecrawl') => {
  const result = await apiClient.post('/scraping/test-provider', { provider });
  // Afficher résultat
};
```

**Effort:** ~2 heures
**Priorité:** Basse

### 2. Dashboard de Monitoring des Providers
**Nouveau composant:** `providers-dashboard.tsx`

**Fonctionnalités:**
- Voir quels providers sont disponibles
- Statistiques d'utilisation par provider
- Coûts par provider (Firecrawl)
- Taux de succès

**Effort:** ~4-6 heures
**Priorité:** Basse

### 3. Mode Debug Scraping
**Dans:** `ProspectingDashboard.tsx`

**Fonctionnalité:**
```typescript
// Ajouter toggle "Mode Debug"
// Afficher les résultats bruts du scraping
// Voir le provider utilisé (Cheerio/Puppeteer/Firecrawl)
// Temps d'exécution
```

**Effort:** ~2-3 heures
**Priorité:** Basse

## ✅ Conclusion

### Synchronisation Frontend-Backend: **100% Complète** ✅

**Résumé:**
1. ✅ Frontend utilise correctement `/prospecting/*` endpoints
2. ✅ Backend ProspectingIntegrationService utilise WebDataService
3. ✅ WebDataService orchestre les 3 providers (Cheerio, Puppeteer, Firecrawl)
4. ✅ Types TypeScript synchronisés
5. ✅ UI complète et fonctionnelle
6. ✅ Configuration des API keys disponible
7. ✅ Architecture en couches respectée

**Aucune modification frontend requise.**

Le pipeline complet fonctionne:
```
UI (ProspectingDashboard) 
  → useProspecting hook 
    → prospecting-api 
      → Backend /prospecting/* 
        → ProspectingIntegrationService 
          → WebDataService 
            → Cheerio/Puppeteer/Firecrawl
              → LLMProspectingService
                → Base de données
```

## 📚 Fichiers Frontend Analysés

**Pages:**
- `src/pages/prospecting/index.tsx` - Page principale
- `src/pages/settings/scraping-config.tsx` - Configuration

**Composants:**
- `src/modules/business/prospecting/components/ProspectingDashboard.tsx` - Dashboard principal
- `src/modules/business/prospecting/components/GeographicTargeting.tsx`
- `src/modules/business/prospecting/components/DemographicTargeting.tsx`
- `src/modules/business/prospecting/components/SalesFunnel.tsx`
- `src/modules/business/prospecting/components/LeadValidator.tsx`

**Hooks:**
- `src/shared/hooks/useProspecting.ts` - Hook principal (27KB, ~850 lignes)

**API:**
- `src/shared/utils/prospecting-api.ts` - Client API complet

**Total:** 191 fichiers TypeScript/React dans le frontend.
