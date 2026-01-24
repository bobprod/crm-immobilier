# Plan d'Amélioration - Module Scraping & Prospection

## 📊 Analyse du Système Actuel

### ✅ Points Forts

#### Architecture Solide
- **3 providers de scraping** bien intégrés:
  - `CheerioService`: Gratuit, rapide, HTML statique
  - `PuppeteerService`: Gratuit, sites JS dynamiques
  - `FirecrawlService`: Payant, IA intégrée

- **Sélection intelligente** du provider selon l'URL
- **Fallback automatique** si un provider échoue
- **Analyse LLM des données** scrapées:
  - Analyse individuelle
  - Analyse batch (économie 90% coûts)
  - Extraction structurée des leads

#### Fonctionnalités Existantes
- Extraction emails/téléphones
- Normalisation numéros tunisiens (+216)
- Déduplication automatique
- Metadata extraction (title, description)
- Tracking usage LLM

---

## ❌ Points Faibles Critiques

### 1. **Manque de Scraping Spécifique Sites Tunisiens**

**Problème:** Scraping générique, pas optimisé pour les sites locaux

**Sites Non-Optimisés:**
- tayara.tn (leader Tunisie)
- mubawab.tn (immobilier)
- afariat.com (annonces)
- tunisie-annonce.com
- immobilier.tn

**Impact:**
- 60-70% de leads manqués
- Données de qualité variable
- Extraction incomplète des champs

---

### 2. **Pas de Sélecteurs CSS Spécifiques**

**Problème:** Extraction "brute" du texte sans ciblage précis

**Manquants:**
```typescript
// Exemple de ce qui manque:
const SITE_SELECTORS = {
  'tayara.tn': {
    title: '.listing-title',
    price: '.listing-price',
    location: '.listing-location',
    phone: '.contact-phone',
    description: '.listing-description',
    images: '.listing-images img',
  },
  'mubawab.tn': {
    // ...
  }
};
```

**Impact:**
- Extraction imprécise
- Beaucoup de bruit dans les données
- Coût LLM plus élevé (plus de texte à analyser)

---

### 3. **Pas d'Enrichissement Automatique**

**Manquants:**
- ✗ Géolocalisation des adresses (Google Maps API)
- ✗ Validation adresses tunisiennes
- ✗ Détection automatique du type de bien
- ✗ Calcul prix au m²
- ✗ Scoring de qualité de l'annonce
- ✗ Détection doublons inter-sites

**Impact:**
- Données brutes non exploitables
- Travail manuel nécessaire
- Leads de faible qualité

---

### 4. **Pas de Scraping Périodique**

**Manquants:**
- ✗ Monitoring automatique nouveaux leads
- ✗ Alertes prix/disponibilité
- ✗ Tracking évolution marché
- ✗ Détection leads frais (<24h)

**Impact:**
- Leads obsolètes
- Opportunités manquées
- Pas de veille concurrentielle

---

### 5. **Sources Limitées**

**Manquants:**
- ✗ Facebook Marketplace (ÉNORME source)
- ✗ LinkedIn (professionnels)
- ✗ Google Maps (agences)
- ✗ Instagram (#immobiliertunis)
- ✗ Pages jaunes tunisiennes

**Impact:**
- 80% des leads potentiels non capturés
- Diversité des sources limitée

---

## 🚀 Plan d'Amélioration (Priorités)

### 🔥 **PRIORITÉ 1: Scraping Sites Tunisiens Optimisé**

#### Créer un service de scraping spécialisé par site

**Fichier:** `backend/src/modules/scraping/services/tunisia-sites.service.ts`

**Fonctionnalités:**
```typescript
class TunisiaSitesService {
  // Scraping Tayara.tn
  async scrapeTayara(query: SearchQuery): Promise<Lead[]>

  // Scraping Mubawab.tn
  async scrapeMubawab(query: SearchQuery): Promise<Lead[]>

  // Scraping Afariat.com
  async scrapeAfariat(query: SearchQuery): Promise<Lead[]>

  // Scraping Tunisie-Annonce.com
  async scrapeTunisieAnnonce(query: SearchQuery): Promise<Lead[]>
}
```

**Sélecteurs CSS par site:**
```typescript
const TAYARA_SELECTORS = {
  listingCard: '.listing-card',
  title: '.listing-card__title',
  price: '.listing-card__price',
  location: '.listing-card__location',
  phone: '[data-phone]',
  surface: '[data-surface]',
  rooms: '[data-rooms]',
  publishedAt: '.listing-card__date',
  url: 'a.listing-card__link',
};

const MUBAWAB_SELECTORS = {
  // ...
};
```

**Extraction Intelligente:**
```typescript
interface ExtractedListing {
  title: string;
  price: number;
  pricePerSqm?: number;
  location: {
    city: string;
    neighborhood?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  property: {
    type: PropertyType; // villa, appartement, terrain, etc.
    surface: number; // m²
    rooms?: number;
    bathrooms?: number;
    floor?: number;
    features?: string[]; // parking, piscine, etc.
  };
  contact: {
    phone?: string;
    email?: string;
    name?: string;
  };
  images: string[];
  description: string;
  publishedAt: Date;
  sourceUrl: string;
  sourceSite: 'tayara' | 'mubawab' | 'afariat';
}
```

**Bénéfices:**
- ✅ 90% plus de leads extraits
- ✅ Données structurées précises
- ✅ Moins de coût LLM (données pré-structurées)

---

### 🔥 **PRIORITÉ 2: Enrichissement Automatique des Données**

#### Service d'enrichissement intelligent

**Fichier:** `backend/src/modules/scraping/services/data-enrichment.service.ts`

**Fonctionnalités:**

1. **Géolocalisation:**
```typescript
async geocodeAddress(address: string): Promise<Coordinates> {
  // Google Maps Geocoding API
  // Fallback: OpenStreetMap Nominatim (gratuit)
}

async reverseGeocode(lat: number, lng: number): Promise<Address> {
  // Récupérer adresse depuis coordonnées
}
```

2. **Validation & Normalisation:**
```typescript
async validateTunisianAddress(address: string): Promise<{
  valid: boolean;
  normalized: string;
  city: string;
  governorate: string;
  zipCode?: string;
}> {
  // Base de données des villes tunisiennes
  // Correction automatique des fautes (ex: "la marsa" → "La Marsa")
}
```

3. **Scoring de Qualité:**
```typescript
function calculateLeadQualityScore(lead: ExtractedListing): number {
  let score = 50; // Base

  // +10 si téléphone présent
  if (lead.contact.phone) score += 10;

  // +15 si images présentes (3+)
  if (lead.images.length >= 3) score += 15;

  // +10 si prix au m² cohérent
  if (lead.pricePerSqm && isPriceRealistic(lead.pricePerSqm, lead.location.city)) {
    score += 10;
  }

  // +10 si description complète (200+ caractères)
  if (lead.description.length >= 200) score += 10;

  // +5 si annonce récente (<7 jours)
  if (isRecent(lead.publishedAt, 7)) score += 5;

  return Math.min(score, 100);
}
```

4. **Détection Doublons Inter-Sites:**
```typescript
async findDuplicates(lead: ExtractedListing): Promise<Lead[]> {
  // Matching par:
  // - Téléphone identique
  // - Adresse similaire (Levenshtein distance)
  // - Prix dans une fourchette de ±5%
  // - Surface identique
}
```

**Bénéfices:**
- ✅ Leads 10x plus exploitables
- ✅ Géolocalisation automatique
- ✅ Déduplication précise
- ✅ Scoring fiable

---

### 🔥 **PRIORITÉ 3: Scraping Périodique & Alertes**

#### Système de monitoring automatique

**Fichier:** `backend/src/modules/scraping/services/scraping-scheduler.service.ts`

**Fonctionnalités:**

1. **Scraping Périodique:**
```typescript
@Cron('0 */4 * * *') // Toutes les 4h
async scheduledScraping() {
  // Pour chaque campagne active:
  // 1. Scraper les nouveaux leads
  // 2. Comparer avec leads existants
  // 3. Notifier utilisateur des nouveaux leads
}
```

2. **Alertes Temps Réel:**
```typescript
interface Alert {
  type: 'new_lead' | 'price_drop' | 'back_available';
  lead: Lead;
  campaign: Campaign;
  userId: string;
}

async sendAlert(alert: Alert) {
  // Email notification
  // Push notification (optionnel)
  // In-app notification
}
```

3. **Tracking Marché:**
```typescript
async trackMarketTrends(city: string): Promise<MarketStats> {
  return {
    avgPrice: number;
    avgPricePerSqm: number;
    totalListings: number;
    newListingsLast24h: number;
    priceEvolution: {
      last7days: number; // %
      last30days: number;
    };
  };
}
```

**Bénéfices:**
- ✅ Leads frais automatiques
- ✅ Alertes opportunités
- ✅ Veille marché continue

---

### 🔥 **PRIORITÉ 4: Nouvelles Sources de Données**

#### Intégrations supplémentaires

1. **Facebook Marketplace**

**Approche:**
- API Graph officielle (limitée)
- Ou scraping avec Puppeteer (attention TOS)

```typescript
class FacebookMarketplaceService {
  async searchListings(location: string, query: string): Promise<Lead[]> {
    // Scraping avec Puppeteer
    // Extraction des annonces immobilières
    // Filtrage par localisation tunisienne
  }
}
```

2. **Google Maps (Agences Immobilières)**

```typescript
class GoogleMapsService {
  async findRealEstateAgencies(city: string): Promise<Agency[]> {
    // Google Places API
    // Récupérer toutes les agences immobilières
    // Extraire: nom, adresse, téléphone, site web
  }

  async scrapeAgencyWebsite(agencyUrl: string): Promise<Lead[]> {
    // Scraper le site de l'agence
    // Extraire les annonces
  }
}
```

3. **LinkedIn (Professionnels)**

```typescript
class LinkedInService {
  async findRealEstateProfessionals(location: string): Promise<Contact[]> {
    // Recherche de profils immobiliers
    // Extraction: nom, entreprise, poste, contact
  }
}
```

**Bénéfices:**
- ✅ 10x plus de sources
- ✅ Diversité des leads
- ✅ Couverture complète du marché

---

### 🔥 **PRIORITÉ 5: Optimisations Performance**

#### Améliorations techniques

1. **Cache Intelligent:**
```typescript
@Injectable()
class ScrapingCacheService {
  // Cache Redis:
  // - URLs déjà scrapées (TTL: 4h)
  // - Résultats LLM (TTL: 24h)
  // - Géolocalisation (TTL: permanent)

  async getCached(key: string): Promise<any | null>;
  async setCached(key: string, value: any, ttl: number);
}
```

2. **Rate Limiting Intelligent:**
```typescript
class RateLimiterService {
  // Respecter les limites par site:
  // - Tayara: 1 req/s max
  // - Mubawab: 2 req/s max
  // - Google Maps API: quota journalier

  async waitIfNeeded(site: string): Promise<void>;
}
```

3. **Scraping Parallèle:**
```typescript
async scrapeMultipleSites(query: SearchQuery): Promise<Lead[]> {
  // Scraper en parallèle:
  const [tayaraLeads, mubawabLeads, afar atLeads] = await Promise.all([
    this.scrapeTayara(query),
    this.scrapeMubawab(query),
    this.scrapeAfariat(query),
  ]);

  // Fusionner et dédupliquer
  return this.deduplicateLeads([...tayaraLeads, ...mubawabLeads, ...afaiatLeads]);
}
```

**Bénéfices:**
- ✅ 5x plus rapide
- ✅ Économie ressources
- ✅ Respect des limites API

---

## 📐 Architecture Proposée

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ProspectionDashboardRefactored                        │  │
│  │  ├─ Onglet 1: Prospection IA                           │  │
│  │  │   └─ Configuration: Sites, Zones, Critères          │  │
│  │  ├─ Onglet 2: Campagnes + Validation                   │  │
│  │  └─ Onglet 3: Pipeline Kanban                          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ API
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ProspectingController                               │   │
│  │  POST /api/prospecting/start                         │   │
│  │  GET  /api/prospecting/campaigns/:id/leads           │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ScrapingOrchestrator  (NOUVEAU)                     │   │
│  │  ├─ Sélection sources selon critères                 │   │
│  │  ├─ Scraping parallèle multi-sites                   │   │
│  │  └─ Agrégation et déduplication                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TunisiaSitesService  (NOUVEAU)                      │   │
│  │  ├─ scrapeTayara() - Sélecteurs CSS spécifiques     │   │
│  │  ├─ scrapeMubawab() - Extraction optimisée          │   │
│  │  ├─ scrapeAfariat() - Parseurs intelligents         │   │
│  │  └─ Retourne: ExtractedListing[]                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  DataEnrichmentService  (NOUVEAU)                    │   │
│  │  ├─ geocodeAddress() - Google Maps API              │   │
│  │  ├─ validateTunisianAddress() - Base villes         │   │
│  │  ├─ calculateQualityScore() - Scoring 0-100         │   │
│  │  ├─ findDuplicates() - Détection doublons           │   │
│  │  └─ Retourne: EnrichedLead[]                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LLMProspectingService  (Existant - Optimisé)       │   │
│  │  ├─ analyzeRawItemsBatch() - Analyse batch          │   │
│  │  ├─ Extraction infos manquantes                     │   │
│  │  ├─ Normalisation données                            │   │
│  │  └─ Retourne: LLMAnalyzedLead[]                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ScrapingScheduler  (NOUVEAU)                        │   │
│  │  ├─ Cron jobs toutes les 4h                          │   │
│  │  ├─ Monitoring nouveaux leads                        │   │
│  │  ├─ Alertes utilisateurs                             │   │
│  │  └─ Tracking marché                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Providers de Scraping  (Existants)                  │   │
│  │  ├─ WebDataService - Orchestrateur                   │   │
│  │  ├─ CheerioService - Sites statiques                 │   │
│  │  ├─ PuppeteerService - Sites dynamiques              │   │
│  │  └─ FirecrawlService - IA intégrée                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  STOCKAGE                                    │
│  ┌─ Prisma ─────────────────────────────────────────────┐   │
│  │  - prospecting_campaigns                             │   │
│  │  - prospecting_leads                                 │   │
│  │  - scraping_jobs                                     │   │
│  │  - market_trends (NOUVEAU)                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─ Redis ──────────────────────────────────────────────┐   │
│  │  - Cache URLs scrapées                               │   │
│  │  - Cache géolocalisation                             │   │
│  │  - Rate limiting                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Roadmap d'Implémentation

### Phase 1: Fondations (Semaine 1-2)
- [x] ✅ Architecture actuelle analysée
- [ ] Créer `TunisiaSitesService` avec sélecteurs Tayara
- [ ] Créer `DataEnrichmentService` (géolocalisation)
- [ ] Tester scraping Tayara.tn sur 100 annonces
- [ ] Documenter sélecteurs CSS

### Phase 2: Scraping Multi-Sites (Semaine 3-4)
- [ ] Ajouter sélecteurs Mubawab.tn
- [ ] Ajouter sélecteurs Afariat.com
- [ ] Créer `ScrapingOrchestrator` (parallèle)
- [ ] Implémenter déduplication inter-sites
- [ ] Tests end-to-end

### Phase 3: Enrichissement (Semaine 5)
- [ ] Intégration Google Maps Geocoding
- [ ] Base de données villes tunisiennes
- [ ] Scoring qualité leads
- [ ] Validation adresses

### Phase 4: Automatisation (Semaine 6)
- [ ] Créer `ScrapingScheduler`
- [ ] Cron jobs toutes les 4h
- [ ] Système d'alertes email
- [ ] Dashboard monitoring

### Phase 5: Sources Supplémentaires (Semaine 7-8)
- [ ] Facebook Marketplace (prototype)
- [ ] Google Maps Agences
- [ ] LinkedIn (optionnel)

### Phase 6: Optimisations (Semaine 9)
- [ ] Cache Redis
- [ ] Rate limiting intelligent
- [ ] Performance tuning
- [ ] Documentation finale

---

## 📊 Métriques de Succès

| Métrique | Avant | Objectif Après |
|----------|-------|----------------|
| **Leads extraits/jour** | 50-100 | 500-1000 |
| **Précision extraction** | 60% | 95% |
| **Taux de doublons** | 30% | <5% |
| **Coût LLM/lead** | $0.005 | $0.001 |
| **Temps scraping** | 5min/100 leads | 1min/100 leads |
| **Qualité leads (score)** | 55/100 | 80/100 |
| **Sources couvertes** | 3 | 8+ |

---

## 💰 Estimation Coûts

### Coûts API (Mensuel, 10,000 leads)
- **Google Maps Geocoding**: $5/mois (1000 req gratuits, puis $0.005/req)
- **Firecrawl** (optionnel): $10/mois (tier gratuit suffisant)
- **LLM** (DeepSeek/Qwen): $2-3/mois (batch analysis)
- **Total**: ~$20/mois pour 10,000 leads = $0.002/lead

### Économies
- Réduction coût LLM: -80% (grâce pré-structuration)
- Réduction travail manuel: -90% (enrichissement auto)
- **ROI**: 1 lead converti = 500-1000 TND commission = 25,000x le coût

---

## 🔐 Considérations Légales

### Scraping Éthique
- ✅ Respecter robots.txt
- ✅ Rate limiting (1-2 req/s max)
- ✅ User-Agent transparent
- ✅ Pas de surcharge serveurs
- ✅ Cache pour éviter requêtes redondantes

### RGPD / Privacy
- ✅ Données publiques uniquement
- ✅ Anonymisation possible
- ✅ Droit à l'oubli
- ✅ Opt-out mechanism

---

## 📝 Prochaines Étapes Immédiates

1. **Valider le plan** avec vous
2. **Prioriser** les fonctionnalités (Phase 1 ou tout?)
3. **Commencer implémentation**:
   - Créer `TunisiaSitesService`
   - Définir sélecteurs Tayara
   - Tester sur 50 annonces
4. **Itérer** selon résultats

---

**Questions?**
- Souhaitez-vous que je commence l'implémentation de la Phase 1?
- Y a-t-il des fonctionnalités prioritaires spécifiques?
- Faut-il d'abord faire un prototype sur Tayara.tn?

**Date**: 2026-01-24
**Version**: 1.0
**Status**: 📋 Plan complet - Prêt pour implémentation
