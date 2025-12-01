# Intégration Pica API

## Vue d'ensemble

L'intégration Pica permet d'utiliser **SerpApi** et **Firecrawl** via une seule API unifiée. Pica gère l'authentification, les connexions et simplifie l'utilisation de ces services.

## Fonctionnalités

### 1. **SerpApi** - Recherche Google
- Recherche Google en temps réel
- Résultats structurés et parsés
- Support de la localisation et de la langue

### 2. **Firecrawl** - Web Scraping
- Scraping de pages web
- Extraction de contenu principal
- Recherche et scraping combinés

### 3. **Recherche Combinée**
- Utilise SerpApi pour trouver des résultats
- Utilise Firecrawl pour extraire le contenu de chaque résultat
- Idéal pour l'analyse de marché immobilier

## Installation

### 1. Installer les dépendances

Exécutez le script d'installation :

```bash
.\install-axios.bat
```

Ou manuellement :

```bash
# Backend
cd crm-backend
npm install axios

# Frontend
cd ../CRM-IMMO
npm install axios
```

### 2. Configurer Pica

1. **Créez un compte sur [Pica](https://www.picaos.com)**
2. **Connectez SerpApi et Firecrawl** depuis votre tableau de bord Pica
3. **Obtenez vos clés API** :
   - API Key (pk_...)
   - API Secret (sk_...)
   - Connection IDs pour SerpApi et Firecrawl

### 3. Configurer dans le CRM

1. Accédez à **Paramètres** > **Pica**
2. Entrez vos clés API Pica
3. Activez SerpApi et Firecrawl
4. Entrez les Connection IDs
5. Testez les connexions
6. Sauvegardez la configuration

## Utilisation

### Backend API

#### 1. Recherche SerpApi

```bash
POST http://localhost:3000/pica/serp/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "immobilier Tunis",
  "location": "Tunisia",
  "language": "fr",
  "numResults": 10
}
```

#### 2. Scraping Firecrawl

```bash
POST http://localhost:3000/pica/firecrawl/scrape
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com",
  "onlyMainContent": true,
  "includeTags": ["article", "main"],
  "excludeTags": ["nav", "footer"]
}
```

#### 3. Recherche Firecrawl

```bash
POST http://localhost:3000/pica/firecrawl/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "appartement Tunis",
  "limit": 5
}
```

#### 4. Recherche Combinée (SerpApi + Firecrawl)

```bash
GET http://localhost:3000/pica/search/combined?query=immobilier+Tunisie&location=Tunisia&limit=5
Authorization: Bearer <token>
```

Cette recherche :
1. Utilise SerpApi pour trouver les meilleurs résultats
2. Utilise Firecrawl pour extraire le contenu de chaque page
3. Retourne les résultats avec le contenu complet

### Frontend

Le composant `PicaIntegration` est disponible dans les paramètres et permet de :
- Configurer les clés API
- Activer/désactiver SerpApi et Firecrawl
- Tester les connexions
- Tester la recherche combinée

## Cas d'usage pour l'immobilier

### 1. Analyse de marché
```javascript
// Rechercher les annonces immobilières concurrentes
const results = await axios.get(
  'http://localhost:3000/pica/search/combined',
  {
    params: {
      query: 'appartement 3 pièces Tunis',
      location: 'Tunisia',
      limit: 10
    },
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

### 2. Veille concurrentielle
```javascript
// Scraper les sites immobiliers concurrents
const scraped = await axios.post(
  'http://localhost:3000/pica/firecrawl/scrape',
  {
    url: 'https://concurrent-immobilier.com/annonces',
    onlyMainContent: true
  },
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

### 3. Recherche de prospects
```javascript
// Trouver des agences immobilières
const agencies = await axios.post(
  'http://localhost:3000/pica/serp/search',
  {
    query: 'agence immobilière Sousse',
    location: 'Tunisia',
    numResults: 20
  },
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

## Architecture

### Backend

```
crm-backend/src/pica/
├── entities/
│   └── pica-config.entity.ts    # Configuration Pica
├── dto/
│   ├── create-pica-config.dto.ts
│   ├── update-pica-config.dto.ts
│   ├── serp-api-search.dto.ts
│   └── firecrawl.dto.ts
├── pica.controller.ts            # Endpoints API
├── pica.service.ts               # Logique métier
└── pica.module.ts                # Module NestJS
```

### Frontend

```
CRM-IMMO/src/components/settings/integrations/
└── PicaIntegration.tsx           # Interface de configuration
```

## Base de données

La configuration Pica est stockée dans la table `pica_configs` :

```sql
CREATE TABLE pica_configs (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE,
  apiKey VARCHAR,
  apiSecret VARCHAR,
  baseUrl VARCHAR DEFAULT 'https://api.picaos.com',
  serpApiConfig JSONB,
  firecrawlConfig JSONB,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

## Sécurité

- Les clés API sont stockées de manière sécurisée dans la base de données
- Toutes les routes sont protégées par JWT
- Les clés API ne sont jamais exposées au frontend
- Les appels API passent par le backend pour plus de sécurité

## Dépannage

### Erreur "No active Pica configuration found"
- Vérifiez que vous avez créé une configuration dans les paramètres
- Vérifiez que la configuration est active (isActive = true)

### Erreur "SerpApi is not enabled"
- Activez SerpApi dans les paramètres Pica
- Vérifiez que le Connection ID est correct

### Erreur "Firecrawl is not enabled"
- Activez Firecrawl dans les paramètres Pica
- Vérifiez que le Connection ID est correct

### Erreur "Pica API call failed"
- Vérifiez vos clés API Pica
- Vérifiez que vos Connection IDs sont corrects
- Vérifiez votre connexion internet
- Consultez les logs du backend pour plus de détails

## Liens utiles

- [Documentation Pica](https://docs.picaos.com)
- [SerpApi](https://serpapi.com)
- [Firecrawl](https://www.firecrawl.dev)
- [Pica Dashboard](https://www.picaos.com/dashboard)

## Support

Pour toute question ou problème :
1. Consultez la documentation Pica
2. Vérifiez les logs du backend
3. Testez les connexions depuis les paramètres
4. Contactez le support Pica si nécessaire
