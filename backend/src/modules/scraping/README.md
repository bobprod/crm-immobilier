# Module de Scraping Web - Architecture Unifiée

## 📋 Vue d'ensemble

Ce module fournit une architecture propre et unifiée pour le scraping web dans le CRM Immobilier. Il encapsule plusieurs providers de scraping et sélectionne automatiquement le meilleur selon les besoins.

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│              WebDataService (Orchestrateur)            │
│                                                        │
│  Sélection automatique du meilleur provider selon:    │
│  - Type d'URL (site simple vs complexe)               │
│  - Disponibilité des clés API                         │
│  - Besoins (extraction IA, screenshots, etc.)         │
└────────────────┬───────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┐
        ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Cheerio    │  │  Puppeteer   │  │  Firecrawl   │
│   Service    │  │   Service    │  │   Service    │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ ✅ Gratuit   │  │ ✅ Gratuit   │  │ 💰 API       │
│ ⚡ Rapide    │  │ 🔧 JS support│  │ 🤖 IA        │
│ 📄 HTML      │  │ 🖼️ Screenshots│  │ 📊 Structuré │
│    statique  │  │ 🌐 Dynamique │  │ 🔒 Anti-bot  │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 🎯 Providers Disponibles

### 1. CheerioService (Tier 2)
**Idéal pour:** Sites HTML simples et statiques

- ✅ **100% gratuit**
- ⚡ **Très rapide** (quelques millisecondes)
- 🪶 **Léger** en ressources
- 📄 Parsing HTML avec sélecteurs CSS
- 🔍 Extraction automatique: emails, téléphones, liens

**Cas d'usage:**
- Annonces immobilières basiques
- Sites statiques
- Parsing de résultats SerpAPI
- Extraction rapide de contacts

**Limitations:**
- ❌ Ne supporte pas JavaScript
- ❌ Pas d'interaction avec la page

### 2. PuppeteerService (Tier 2)
**Idéal pour:** Sites avec JavaScript dynamique

- ✅ **100% gratuit**
- 🔧 **Supporte JavaScript** (rendu complet)
- 🖼️ **Screenshots** possibles
- 🌐 Interaction avec la page (clicks, scroll, etc.)
- 🎭 Émulation de navigateur réel

**Cas d'usage:**
- Sites React/Vue/Angular (SPA)
- Sites avec contenu chargé dynamiquement
- Besoin de screenshots
- Scroll infini pour charger plus de contenu
- Sites: Bricks.co, Homunity

**Limitations:**
- 🐢 Plus lent que Cheerio (plusieurs secondes)
- 💻 Consomme CPU/RAM (headless browser)

### 3. FirecrawlService (Tier 1)
**Idéal pour:** Sites complexes avec extraction IA

- 🤖 **IA intégrée** (extraction structurée avec LLM)
- 🔒 **Gère les anti-bots** et CAPTCHAs
- 📊 **Extraction structurée** automatique
- 📝 Export en Markdown formaté
- 🌐 Crawling multi-pages

**Cas d'usage:**
- Sites complexes avec anti-scraping
- Besoin d'extraction structurée avec IA
- Sites dynamiques complexes
- Extraction de données spécifiques avec prompt

**Limitations:**
- 💰 Nécessite une clé API (tier gratuit limité)
- 💵 ~$0.001 par page après le quota gratuit
- 🔑 Configuration requise par utilisateur

## 🚀 Utilisation

### Configuration des Clés API

Les clés API se configurent de 2 façons:

1. **Variables d'environnement** (global):
```env
FIRECRAWL_API_KEY=fc-xxx
```

2. **Paramètres utilisateur** (par tenant) - TODO:
```typescript
// À implémenter dans SettingsModule
await settingsService.update(userId, {
  key: 'api_firecrawl',
  value: { apiKey: 'fc-xxx' }
});
```

### Endpoints API

#### 1. Scraper une URL
```bash
POST /api/scraping/scrape
```

**Body:**
```json
{
  "url": "https://example.com",
  "provider": "cheerio",  // optionnel: auto-sélection si omis
  "waitFor": 2000,        // optionnel: attendre X ms
  "screenshot": false,    // optionnel: capture d'écran (Puppeteer)
  "forceProvider": false  // optionnel: pas de fallback
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "provider": "cheerio",
    "url": "https://example.com",
    "html": "<html>...",
    "text": "Contenu texte...",
    "title": "Titre de la page",
    "metadata": {
      "title": "...",
      "description": "...",
      "links": [...],
      "emails": [...],
      "phones": [...]
    }
  }
}
```

#### 2. Scraper plusieurs URLs
```bash
POST /api/scraping/scrape-multiple
```

**Body:**
```json
{
  "urls": [
    "https://example.com",
    "https://example.org"
  ],
  "provider": "cheerio"
}
```

> 🔒 **Notes sécurité**
>
> - Les champs `url` et `urls` acceptent uniquement les protocoles `http` et `https`.
> - Les URLs internes (localhost, 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, adresses de métadonnées cloud, etc.) doivent être rejetées par l’implémentation backend.
> - Il est recommandé de mettre en place une liste d’hôtes/domains autorisés plutôt que d’autoriser toute URL arbitraire.
> - Ces endpoints doivent être protégés par authentification et ne pas être exposés publiquement sans contrôle d’accès.
#### 3. Extraction structurée avec IA
```bash
POST /api/scraping/extract
```

**Body:**
```json
{
  "url": "https://example.com/contact",
  "extractionPrompt": "Extraire le nom, email, téléphone et adresse du contact"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "provider": "firecrawl",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+216 XX XXX XXX",
      "address": "Tunis, Tunisie"
    }
  }
}
```

#### 4. Tester un provider
```bash
POST /api/scraping/test-provider
```

**Body:**
```json
{
  "provider": "firecrawl"
}
```

#### 5. Liste des providers disponibles
```bash
GET /api/scraping/providers
```

**Réponse:**
```json
{
  "success": true,
  "providers": [
    {
      "name": "cheerio",
      "available": true,
      "description": "Parsing HTML simple et rapide",
      "cost": "0€ (gratuit)"
    },
    {
      "name": "puppeteer",
      "available": true,
      "description": "Browser automation - Sites JS",
      "cost": "0€ (gratuit, consomme CPU)"
    },
    {
      "name": "firecrawl",
      "available": false,
      "description": "IA intégrée - Sites complexes",
      "cost": "~$0.001 par page"
    }
  ]
}
```

### Utilisation Programmatique

```typescript
import { WebDataService } from '@/modules/scraping';

@Injectable()
export class MyService {
  constructor(private webDataService: WebDataService) {}

  async scrapeSite() {
    // Auto-sélection du provider
    const result = await this.webDataService.fetchHtml(
      'https://example.com'
    );

    // Forcer un provider spécifique
    const result2 = await this.webDataService.fetchHtml(
      'https://complex-site.com',
      { provider: 'puppeteer' }
    );

    // Extraction avec IA
    const data = await this.webDataService.extractStructuredData(
      'https://contact-page.com',
      'Extraire nom, email, téléphone'
    );
  }
}
```

## 🔄 Intégration avec LLM Router / AI Orchestrator

Le WebDataService s'intègre naturellement avec l'AI Orchestrator:

```typescript
// Scénario: Prospection IA
// 1. SerpAPI → recherche Google
// 2. WebDataService → scraping des résultats
// 3. LLM Router → analyse avec IA
// 4. Structured Data → leads propres

const serpResults = await serpApi.search('immobilier Tunis');
const scrapedData = await webDataService.fetchMultipleUrls(
  serpResults.map(r => r.link)
);
const analyzedLeads = await llmRouter.analyze(scrapedData);
```

## 📊 Sélection Automatique du Provider

Le `WebDataService` sélectionne automatiquement le meilleur provider:

### Sites Complexes → Puppeteer (ou Firecrawl si clé API)
- bricks.co
- homunity.com
- facebook.com, linkedin.com, twitter.com
- Sites avec JavaScript lourd

### Sites Simples → Cheerio
- immobilier.com
- tayara.tn, mubawab.tn
- Sites statiques
- Par défaut

### Extraction IA → Firecrawl
- Quand `extractionPrompt` est fourni
- Besoin d'extraction structurée

## 🔧 Fallback Automatique

Si un provider échoue, le système fait automatiquement un fallback:

1. **Firecrawl** → Puppeteer → Cheerio
2. **Puppeteer** → Cheerio
3. **Cheerio** → Puppeteer (en dernier recours)

Pour désactiver le fallback:
```typescript
{ forceProvider: true }
```

## 💡 Recommandations

### Pour Économiser Firecrawl
1. **Utiliser Cheerio** pour les sites simples
2. **Parser les résultats SerpAPI** avec Cheerio (déjà du HTML)
3. **Réserver Firecrawl** pour les sites complexes ou extraction IA

### Optimisation des Coûts
- ✅ **Tier gratuit Firecrawl**: ~500 pages/mois
- ✅ **Cheerio illimité**: 0€
- ✅ **Puppeteer illimité**: 0€ (coût CPU uniquement)

### Scénarios d'Usage

#### Scénario 1: Investment Intelligence
```
SerpAPI → Chercher "crowdfunding immobilier Tunisie"
  ↓
Cheerio → Parser les résultats simples (liens, titres)
  ↓
Firecrawl → Scraper Bricks.co avec extraction IA
  ↓
LLM Router → Analyser les opportunités
  ↓
JSON InvestmentBenchmark
```

#### Scénario 2: Prospection Automatique
```
SerpAPI → "cherche appartement Tunis"
  ↓
Cheerio → Parser les annonces simples
  ↓
Puppeteer → Scraper Facebook Marketplace
  ↓
LLM Router → Extraire les leads
  ↓
Prospecting Leads (structured)
```

## 🧪 Tests

```bash
# Tester Cheerio
npm test -- cheerio.service.spec.ts

# Tester Puppeteer
npm test -- puppeteer.service.spec.ts

# Tester WebDataService
npm test -- web-data.service.spec.ts
```

## 📝 TODO

- [ ] Implémenter PlaywrightService (alternative moderne à Puppeteer)
- [ ] Ajouter configuration des clés API par tenant dans SettingsModule
- [ ] Intégrer avec ProspectingIntegrationService
- [ ] Ajouter cache pour éviter de re-scraper les mêmes URLs
- [ ] Ajouter rate limiting par provider
- [ ] Monitoring des coûts Firecrawl par utilisateur
- [ ] Webhook pour crawling asynchrone (Firecrawl)

## 📚 Ressources

- [Cheerio Documentation](https://cheerio.js.org/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Firecrawl API](https://docs.firecrawl.dev/)
- [Web Scraping Best Practices](https://www.scraperapi.com/blog/web-scraping-best-practices/)
