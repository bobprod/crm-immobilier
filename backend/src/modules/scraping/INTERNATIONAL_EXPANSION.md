# 🌍 Expansion Internationale - Scraping 20+ Pays

## 📊 Vue d'Ensemble

Le CRM supporte maintenant le scraping immobilier de **20 pays** répartis sur **4 continents** :

- 🌍 **8 pays africains**
- 🌎 **4 pays d'Amérique Latine**
- 🌐 **4 pays Europe + Canada**
- 🌏 **4 pays asiatiques**

---

## 🗺️ Pays Supportés

### 🌍 AFRIQUE (8 pays)

#### 1. **🇲🇦 Maroc**
- **Sites**: Avito.ma, Mubawab.ma, Sarouty.ma
- **Statut**: ✅ API disponible (Avito)
- **Langue**: Français
- **Devise**: MAD (Dirham marocain)

#### 2. **🇩🇿 Algérie**
- **Sites**: Ouedkniss.com, AlgeriImmo.com
- **Statut**: 🔨 HTML scraping (Cheerio)
- **Langue**: Français
- **Devise**: DZD (Dinar algérien)

#### 3. **🇹🇳 Tunisie**
- **Sites**: Tayara.tn, Mubawab.tn
- **Statut**: ✅ API disponible (Tayara)
- **Langue**: Français
- **Devise**: TND (Dinar tunisien)

#### 4. **🇨🇲 Cameroun**
- **Sites**: Jumia House, Afrimalin.cm
- **Statut**: 🔨 HTML scraping
- **Langue**: Français
- **Devise**: XAF (Franc CFA)

#### 5. **🇨🇮 Côte d'Ivoire**
- **Sites**: Jumia House, Afrimalin.ci, CoinAfrique
- **Statut**: 🔨 HTML scraping
- **Langue**: Français
- **Devise**: XOF (Franc CFA)

#### 6. **🇸🇳 Sénégal**
- **Sites**: Expat-Dakar.com, CoinAfrique, Jumia
- **Statut**: 🔨 HTML scraping
- **Langue**: Français
- **Devise**: XOF (Franc CFA)

#### 7. **🇳🇬 Nigeria**
- **Sites**: PropertyPro.ng, Jiji.ng, ToLet.com.ng
- **Statut**: ✅ API disponible (PropertyPro)
- **Langue**: Anglais
- **Devise**: NGN (Naira)

#### 8. **🇨🇩 Congo (RDC)**
- **Sites**: Jumia House, AnnonceCD.com
- **Statut**: 🔨 HTML scraping
- **Langue**: Français
- **Devise**: CDF (Franc congolais)

---

### 🌎 AMÉRIQUE LATINE (4 pays)

#### 9. **🇧🇷 Brésil**
- **Sites**: VivaReal.com.br, Imovelweb, OLX, ZAP Imóveis
- **Statut**: ✅ API disponible (VivaReal)
- **Langue**: Portugais
- **Devise**: BRL (Real brésilien)

#### 10. **🇨🇴 Colombie**
- **Sites**: Fincaraiz.com.co, Metrocuadrado, Properati
- **Statut**: ✅ API disponible (Fincaraiz)
- **Langue**: Espagnol
- **Devise**: COP (Peso colombien)

#### 11. **🇪🇨 Équateur**
- **Sites**: PlusValia.com, Properati, Mercado Libre
- **Statut**: 🔨 HTML scraping
- **Langue**: Espagnol
- **Devise**: USD (Dollar américain)

#### 12. **🇧🇴 Bolivie**
- **Sites**: Encontacto.bo, Infocasas, Mercado Libre
- **Statut**: 🔨 HTML scraping
- **Langue**: Espagnol
- **Devise**: BOB (Boliviano)

---

### 🌐 EUROPE + CANADA (4 pays)

#### 13. **🇨🇦 Canada**
- **Sites**: Realtor.ca, Centris.ca (Québec), Kijiji, Zolo
- **Statut**: ⚠️ API semi-officielle (anti-bot)
- **Langue**: Anglais/Français
- **Devise**: CAD (Dollar canadien)

#### 14. **🇬🇧 UK (Royaume-Uni)**
- **Sites**: Rightmove.co.uk, Zoopla.co.uk, OnTheMarket
- **Statut**: ⚠️ Anti-bot fort (Cloudflare + DataDome)
- **Langue**: Anglais
- **Devise**: GBP (Livre sterling)

#### 15. **🇩🇪 Allemagne**
- **Sites**: ImmobilienScout24.de, Immowelt.de
- **Statut**: ✅ API officielle disponible (payante)
- **Langue**: Allemand
- **Devise**: EUR (Euro)

#### 16. **🇳🇱 Pays-Bas**
- **Sites**: Funda.nl, Pararius.nl, Jaap.nl
- **Statut**: ✅ API semi-officielle (Funda)
- **Langue**: Néerlandais
- **Devise**: EUR (Euro)

---

### 🌏 ASIE (4 pays)

#### 17. **🇯🇵 Japon**
- **Sites**: Suumo.jp, Homes.co.jp, AtHome.co.jp
- **Statut**: ⚠️ Très complexe (langue japonaise + anti-bot)
- **Langue**: Japonais
- **Devise**: JPY (Yen)

#### 18. **🇰🇷 Corée du Sud**
- **Sites**: Zigbang.com, Dabang.com, Naver Real Estate
- **Statut**: ✅ API mobile disponible
- **Langue**: Coréen
- **Devise**: KRW (Won)

#### 19. **🇹🇼 Taiwan**
- **Sites**: 591.com.tw, Sinyi.com.tw, Rakuya
- **Statut**: 🔨 HTML scraping (chinois traditionnel)
- **Langue**: Chinois traditionnel
- **Devise**: TWD (Dollar taiwanais)

#### 20. **🇮🇳 Inde**
- **Sites**: 99acres.com, MagicBricks.com, Housing.com, NoBroker
- **Statut**: ✅ API disponible (99acres)
- **Langue**: Anglais/Hindi
- **Devise**: INR (Roupie indienne)

---

## 🚀 Utilisation

### **Liste des pays disponibles**
```typescript
const countries = await internationalScraperService.getSupportedCountries();

// Retourne:
[
  {
    code: 'morocco',
    name: 'Maroc',
    sites: ['avito.ma', 'mubawab.ma', 'sarouty.ma'],
    primary: 'avito.ma',
    language: 'fr',
    currency: 'MAD',
  },
  // ... 19 autres pays
]
```

### **Scraper un pays**
```typescript
// Maroc (Avito.ma)
const ads = await internationalScraperService.scrapeCountry({
  country: 'morocco',
  location: 'Casablanca',
  priceMin: 500000,
  priceMax: 2000000,
  propertyType: 'apartment',
  limit: 100,
});

// Brésil (VivaReal)
const properties = await internationalScraperService.scrapeCountry({
  country: 'brazil',
  location: 'São Paulo',
  priceMax: 1000000,
  limit: 50,
});

// Inde (99acres)
const listings = await internationalScraperService.scrapeCountry({
  country: 'india',
  location: 'Mumbai',
  priceMin: 5000000,
  limit: 100,
});
```

### **Format de données normalisé**
Tous les pays retournent le même format :
```typescript
{
  // IDs
  id: 'unique-id',
  externalUrl: 'https://...',

  // Informations générales
  title: 'Appartement 3 pièces',
  description: '...',
  price: 250000,
  currency: 'MAD',

  // Localisation
  country: 'Maroc',
  countryCode: 'morocco',
  city: 'Casablanca',
  address: '123 Rue ...',
  latitude: 33.5731,
  longitude: -7.5898,

  // Caractéristiques
  propertyType: 'apartment',
  surface: 85,
  rooms: 3,
  bedrooms: 2,
  bathrooms: 1,

  // Images
  images: ['url1', 'url2', ...],
  thumbnail: 'thumb_url',

  // Dates
  publishedAt: '2026-03-04T12:00:00Z',

  // Métadonnées
  source: 'avito.ma',
  language: 'fr',

  // Raw data (pour debug)
  _raw: { ... }
}
```

---

## 📊 Statut d'Implémentation

### ✅ **Fonctionnels** (8 pays - APIs disponibles)
1. 🇲🇦 **Maroc** - Avito API
2. 🇹🇳 **Tunisie** - Tayara API
3. 🇳🇬 **Nigeria** - PropertyPro API
4. 🇧🇷 **Brésil** - VivaReal API
5. 🇨🇴 **Colombie** - Fincaraiz API
6. 🇩🇪 **Allemagne** - ImmobilienScout24 API
7. 🇰🇷 **Corée du Sud** - Zigbang API
8. 🇮🇳 **Inde** - 99acres API

### 🔨 **En cours** (6 pays - HTML scraping)
1. 🇩🇿 **Algérie** - Ouedkniss (Cheerio)
2. 🇨🇲 **Cameroun** - Jumia House
3. 🇨🇮 **Côte d'Ivoire** - Afrimalin
4. 🇸🇳 **Sénégal** - Expat-Dakar
5. 🇪🇨 **Équateur** - PlusValia
6. 🇧🇴 **Bolivie** - Encontacto

### ⚠️ **Complexes** (6 pays - Anti-bot ou langue)
1. 🇨🇦 **Canada** - Realtor.ca (anti-bot)
2. 🇬🇧 **UK** - Rightmove (Cloudflare + DataDome)
3. 🇳🇱 **Pays-Bas** - Funda API
4. 🇯🇵 **Japon** - Suumo (japonais + anti-bot)
5. 🇹🇼 **Taiwan** - 591.com.tw (chinois)
6. 🇨🇩 **Congo** - Jumia House

---

## 🎯 Stratégie par Niveau

### **Niveau 1: API Officielles** (recommandé)
- Utiliser l'API quand disponible
- Plus stable, moins de maintenance
- Exemples: Maroc (Avito), Brésil (VivaReal), Inde (99acres)

### **Niveau 2: Scraping Simple**
- HTML statique avec Cheerio
- Sites sans JavaScript complexe
- Exemples: Algérie (Ouedkniss), pays africains (Jumia)

### **Niveau 3: Scraping Avancé**
- Puppeteer + Anti-detection
- Sites avec JavaScript
- Exemples: Cameroun, Sénégal

### **Niveau 4: Proxies Résidentiels**
- Bright Data pour anti-bot fort
- Sites protégés (Cloudflare, DataDome)
- Exemples: UK (Rightmove), Canada (Realtor.ca)

### **Niveau 5: APIs Commerciales**
- Apify pour scrapers pré-construits
- Pas de maintenance
- Exemples: UK, Canada, Japon

---

## 🔧 Configuration

### **Variables d'environnement**
Aucune configuration supplémentaire requise pour la plupart des pays.

### **Utilisation avec autres services**
```typescript
// Combiner avec Bright Data pour pays difficiles
if (country === 'uk' || country === 'canada') {
  // Utiliser Bright Data (proxies résidentiels)
  const html = await brightDataService.scrapeWithProxy(url);
}

// Combiner avec Apify pour scrapers pré-construits
if (country === 'uk') {
  const results = await apifyService.runActor(
    'apify/rightmove-scraper',
    { location: 'London' },
  );
}
```

---

## 📈 Cas d'Usage

### **Cas 1: Prospection Multi-Pays**
```typescript
// Scraper 5 pays simultanément
const countries = ['morocco', 'tunisia', 'brazil', 'colombia', 'india'];

const results = await Promise.all(
  countries.map(country =>
    internationalScraperService.scrapeCountry({
      country,
      location: 'capital', // Capitale de chaque pays
      priceMax: 500000,
      limit: 50,
    }),
  ),
);

// Import dans le CRM
for (const [index, countryResults] of results.entries()) {
  const country = countries[index];

  for (const property of countryResults) {
    await propertiesService.create({
      ...property,
      country: property.country,
      source: property.source,
    });
  }
}
```

### **Cas 2: Monitoring Prix par Pays**
```typescript
// Comparer les prix immobiliers entre pays
const priceComparison = [];

for (const country of ['morocco', 'tunisia', 'brazil', 'india']) {
  const ads = await internationalScraperService.scrapeCountry({
    country,
    location: 'capital',
    limit: 200,
  });

  const avgPrice = ads.reduce((sum, ad) => sum + (ad.price || 0), 0) / ads.length;

  priceComparison.push({
    country: ads[0].country,
    averagePrice: avgPrice,
    currency: ads[0].currency,
    sampleSize: ads.length,
  });
}

console.table(priceComparison);
```

### **Cas 3: Lead Generation International**
```typescript
// Générer des leads sur plusieurs marchés
const targetCountries = [
  { country: 'morocco', city: 'Casablanca' },
  { country: 'tunisia', city: 'Tunis' },
  { country: 'brazil', city: 'Rio de Janeiro' },
  { country: 'india', city: 'Mumbai' },
];

for (const { country, city } of targetCountries) {
  const ads = await internationalScraperService.scrapeCountry({
    country,
    location: city,
    priceMin: 100000,
    limit: 100,
  });

  // Importer comme prospects
  for (const ad of ads) {
    await prospectsService.create({
      name: `Propriétaire - ${ad.city}`,
      country: ad.country,
      city: ad.city,
      propertyUrl: ad.externalUrl,
      source: `international_scraping_${country}`,
      type: 'seller',
    });
  }
}
```

---

## 🔮 Roadmap

### Phase 1: APIs (Q1 2026) ✅
- Maroc (Avito)
- Tunisie (Tayara)
- Brésil (VivaReal)
- Colombie (Fincaraiz)
- Nigeria (PropertyPro)
- Inde (99acres)

### Phase 2: HTML Simple (Q2 2026)
- Algérie (Ouedkniss)
- Cameroun (Jumia)
- Côte d'Ivoire (Afrimalin)
- Sénégal (Expat-Dakar)
- Équateur, Bolivie

### Phase 3: Avancé (Q3 2026)
- Canada (Realtor.ca)
- Pays-Bas (Funda)
- Congo (Jumia)
- Taiwan (591.com.tw)

### Phase 4: Très Complexe (Q4 2026)
- UK (Rightmove, Zoopla)
- Allemagne (ImmobilienScout24)
- Japon (Suumo)
- Corée du Sud (Zigbang)

---

## 📝 Notes Techniques

### **Encodage**
- Afrique/Europe/Amér. Latine: UTF-8
- Japon: UTF-8 (Shift-JIS legacy)
- Corée: UTF-8 (EUC-KR legacy)
- Taiwan: UTF-8 (Big5 legacy)

### **Timezones**
- Les dates sont normalisées en UTC
- Conversion automatique depuis timezone locale

### **Rate Limiting**
- 1-3 secondes entre requêtes (anti-détection)
- Adaptable par pays (plus rapide pour Afrique)

---

**Créé par**: Bob NanoClaw
**Date**: 4 Mars 2026
**Version**: 1.0.0
