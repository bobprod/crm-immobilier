# 🚀 Améliorations Module Scraping - Mars 2026

## 📊 Vue d'ensemble

Le module de scraping a été considérablement amélioré avec :
- **4 nouveaux services** (Apify, Bright Data, Anti-Detection, LeBonCoin)
- **Techniques anti-détection avancées**
- **API externes pour scraping scalable**
- **Scrapers spécifiques sites français**

---

## ✨ Nouveaux Services

### 1. ApifyService

**Description**: Accès à la plateforme Apify avec des scrapers pré-construits

**Avantages**:
- ✅ Scrapers maintenus (Zillow, Realtor, Google Maps)
- ✅ Infrastructure scalable
- ✅ Pas de gestion des proxies
- ✅ Free tier: $5/mois

**Utilisation**:
```typescript
// Scraper Zillow
const results = await apifyService.scrapeZillow({
  location: 'San Francisco, CA',
  maxItems: 100,
  listingType: 'for_sale',
  tenantId: 'user-123',
});

// Scraper Realtor.com
const results = await apifyService.scrapeRealtor({
  location: 'New York, NY',
  maxItems: 50,
});

// Scraper Google Maps (agents immobiliers)
const agents = await apifyService.scrapeGoogleMaps({
  searchQuery: 'real estate agent Paris',
  maxItems: 50,
});
```

**Configuration**:
```env
# .env
APIFY_API_KEY=apify_api_xxx
```

---

### 2. BrightDataService

**Description**: Proxies résidentiels premium + scrapers Bright Data (ex-Luminati)

**Avantages**:
- ✅ Proxies résidentiels (contournement anti-bot)
- ✅ Infrastructure ultra-scalable
- ✅ Support tous les sites
- ✅ Free trial: $50

**Utilisation**:
```typescript
// Scraper avec proxy résidentiel (anti-bot)
const result = await brightDataService.scrapeWithProxy(
  'https://www.seloger.com/...',
  'user-123',
);

// Scraper multiple URLs
const results = await brightDataService.scrapeUrls(
  ['https://example.com/1', 'https://example.com/2'],
  'collector-id',
  'user-123',
);
```

**Configuration**:
```env
# .env
BRIGHTDATA_API_KEY=bd_xxx
```

---

### 3. AntiDetectionService

**Description**: Techniques avancées d'évitement de détection

**Fonctionnalités**:
- ✅ Rotation User-Agent (desktop, mobile, tablet)
- ✅ Headers HTTP réalistes
- ✅ Rate limiting intelligent
- ✅ Détection anti-bot (Cloudflare, reCAPTCHA, etc.)
- ✅ Configuration Puppeteer stealth

**Utilisation**:
```typescript
// Headers réalistes
const headers = antiDetection.generateRealisticHeaders({
  device: 'desktop',
  language: 'fr',
  referer: 'https://www.google.com',
});

// Headers spécifiques pour un site
const lbcHeaders = antiDetection.getSiteSpecificHeaders('leboncoin.fr');

// Rate limiting humain
await antiDetection.waitRandomDelay(1000, 5000); // 1-5 secondes

// Détecter l'anti-bot dans le HTML
const detection = antiDetection.detectAntiBot(html);
if (detection.hasAntiBot) {
  console.log(`Anti-bot détecté: ${detection.type}`);
}

// Configuration Puppeteer stealth
const config = antiDetection.getPuppeteerStealthConfig();
const browser = await puppeteer.launch(config);
```

**User-Agents inclus** (2024-2026):
- Chrome Windows/Mac (dernières versions)
- Firefox Windows
- Safari Mac
- Edge
- Mobile (iPhone, Android)

---

### 4. LeBonCoinService

**Description**: Scraper dédié pour LeBonCoin.fr (API non-officielle)

**Avantages**:
- ✅ API plus stable que le scraping HTML
- ✅ Anti-détection intégré
- ✅ Données structurées
- ✅ Statistiques de prix

**Utilisation**:
```typescript
// Recherche d'annonces
const ads = await leboncoinService.searchProperties({
  location: 'Paris',
  locationType: 'city',
  priceMin: 200000,
  priceMax: 500000,
  propertyType: 'apartment',
  rooms: 3,
  surfaceMin: 60,
  limit: 100,
});

// Annonces récentes (24h)
const recentAds = await leboncoinService.getRecentAds({
  location: 'Lyon',
  priceMax: 300000,
  limit: 50,
});

// Statistiques de prix
const stats = await leboncoinService.getPriceStats({
  location: 'Marseille',
  propertyType: 'house',
});
// Retourne: { average, median, min, max, count }

// Détails d'une annonce
const ad = await leboncoinService.getAdDetails('1234567890');
```

**Format de données normalisé**:
```typescript
{
  // IDs
  id: '1234567890',
  url: 'https://www.leboncoin.fr/...',

  // Informations générales
  title: 'Appartement 3 pièces',
  description: '...',
  price: 250000,
  currency: 'EUR',

  // Localisation
  city: 'Paris',
  zipCode: '75015',
  latitude: 48.8566,
  longitude: 2.3522,

  // Caractéristiques
  propertyType: 'apartment',
  surface: 65,
  rooms: 3,
  bedrooms: 2,

  // Images
  images: ['url1', 'url2'],
  thumbnail: 'thumb_url',

  // Dates
  publishedAt: '2026-03-04T10:00:00Z',
  updatedAt: '2026-03-04T12:00:00Z',

  // Contact
  ownerType: 'private', // ou 'pro'
  ownerName: 'Jean Dupont',

  // Métadonnées
  source: 'leboncoin',
  adType: 'offer',
}
```

---

## 🔧 Migration & Intégration

### Avant (code existant)
```typescript
// Scraping simple avec Puppeteer
const result = await puppeteerService.scrapeUrl(url);
```

### Après (avec anti-détection)
```typescript
// 1. Injecter AntiDetectionService
constructor(
  private puppeteerService: PuppeteerService,
  private antiDetection: AntiDetectionService,
) {}

// 2. Utiliser les headers réalistes
const headers = this.antiDetection.generateRealisticHeaders();

// 3. Rate limiting
await this.antiDetection.waitRandomDelay(2000, 5000);

// 4. Scraping
const result = await puppeteerService.scrapeUrl(url, { headers });
```

---

## 📈 Cas d'Usage

### Cas 1: Scraping massif avec Apify (sites US)
```typescript
// Scraper 1000 listings Zillow
const results = await apifyService.scrapeZillow({
  location: 'Los Angeles, CA',
  maxItems: 1000,
  listingType: 'for_sale',
});

// Import dans le CRM
for (const property of results) {
  await propertiesService.create({
    title: property.address,
    price: property.price,
    source: 'zillow',
    ...
  });
}
```

### Cas 2: Scraping sites français avec anti-bot
```typescript
// LeBonCoin (API non-officielle)
const lbcAds = await leboncoinService.searchProperties({
  location: 'Paris 15e',
  priceMax: 400000,
});

// SeLoger (avec Bright Data pour anti-bot)
const selogerHtml = await brightDataService.scrapeWithProxy(
  'https://www.seloger.com/...',
);

// PAP (simple avec Cheerio + Anti-Detection)
const headers = antiDetection.getSiteSpecificHeaders('pap.fr');
await antiDetection.waitRandomDelay(2000, 4000);
const papResult = await cheerioService.scrape(url, { headers });
```

### Cas 3: Prospection agents immobiliers (Google Maps)
```typescript
// Scraper agents sur Google Maps
const agents = await apifyService.scrapeGoogleMaps({
  searchQuery: 'agent immobilier Paris 16e',
  maxItems: 100,
});

// Importer dans le CRM comme prospects
for (const agent of agents) {
  await prospectsService.create({
    name: agent.name,
    phone: agent.phone,
    email: agent.email,
    address: agent.address,
    source: 'google_maps',
    type: 'agent',
  });
}
```

---

## 🧪 Tests

Des tests unitaires complets ont été ajoutés pour tous les services.

**Lancer les tests**:
```bash
# Tous les tests scraping
npm test -- scraping

# Tests spécifiques
npm test -- apify.service.spec.ts
npm test -- anti-detection.service.spec.ts
npm test -- leboncoin.service.spec.ts
```

---

## 🔐 Configuration BYOK (Bring Your Own Key)

Tous les services supportent le système BYOK à 3 niveaux :

```
1. Clé Utilisateur (priorité haute)
   APIFY_API_KEY_user-123

2. Clé Agence (priorité moyenne)
   APIFY_API_KEY_agency-456

3. Clé Globale (priorité basse)
   APIFY_API_KEY
```

**Exemple de configuration** :
```typescript
// L'utilisateur peut configurer sa propre clé
await settingsService.set(
  'user-123',
  'APIFY_API_KEY',
  'apify_api_xxxxx',
);

// Le service utilisera automatiquement cette clé
const results = await apifyService.scrapeZillow({
  location: 'Miami, FL',
  tenantId: 'user-123', // ← Utilise la clé de user-123
});
```

---

## 📝 Variables d'Environnement

Ajouter à `.env` :

```env
# Apify (scrapers pré-construits)
APIFY_API_KEY=apify_api_xxxxx

# Bright Data (proxies résidentiels)
BRIGHTDATA_API_KEY=bd_xxxxx

# LeBonCoin (API key publique - déjà incluse dans le code)
# Aucune configuration nécessaire
```

---

## 🎯 Roadmap

### À venir
- [ ] **SeLogerService**: Scraper dédié pour SeLoger.com
- [ ] **PAPService**: Scraper dédié pour PAP.fr
- [ ] **Logic-ImmoService**: Scraper Logic-Immo
- [ ] **Proxies rotatifs** intégrés (Bright Data pool)
- [ ] **CAPTCHA solver** intégré (2captcha, Anti-Captcha)
- [ ] **Scraping scheduler** (cron jobs automatiques)
- [ ] **Webhooks** pour nouvelles annonces

---

## 📞 Support

Pour toute question sur les nouveaux services de scraping :
- Voir la documentation complète dans chaque fichier service
- Exemples dans `/examples/scraping/`
- Tests dans `/src/modules/scraping/services/*.spec.ts`

---

**Créé par**: Bob NanoClaw
**Date**: 4 Mars 2026
**Version**: 2.0.0
