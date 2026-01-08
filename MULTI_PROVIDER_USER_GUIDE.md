# 🎯 Guide d'Utilisation - Stratégie Multi-Providers

## Vue d'ensemble

Le système de prospection CRM Immobilier utilise une architecture **multi-providers** intelligente qui s'adapte automatiquement selon:
- Les clés API disponibles dans votre compte
- Vos préférences de providers (si configurées)
- Une chaîne de secours automatique

## Workflow complet

### 1️⃣ **Configuration des clés API** (Étape 1)
Accédez à: **Settings > Mes Clés API (BYOK)**

Configurez vos clés pour:
- **Recherche**: SerpAPI (trouve des prospects)
- **Scraping**: Firecrawl (extrait données des sites)
- **Fallback**: Puppeteer, Cheerio (outils gratuits, intégrés)

### 2️⃣ **Sélectionner votre stratégie** (Étape 2)
Accédez à: **Settings > Stratégie des Providers**

Sur cette page:
- ✅ Voir les providers **disponibles** (avec clés configurées)
- 🔴 Voir les providers **indisponibles** (sans clés)
- ⚙️ **Choisir** le provider préféré pour:
  - **Recherche** (SerpAPI recommandé)
  - **Scraping** (Firecrawl recommandé)
- 💾 **Sauvegarder** vos préférences

### 3️⃣ **Utiliser la prospection**
Une fois configuré:

**La prospection automatique:**
1. Utilise votre provider **préféré**
2. Si indisponible → bascule au **provider suivant**
3. Continue la **chaîne de secours** si besoin

**Chaîne de secours par défaut:**
```
Recherche:  SerpAPI → Firecrawl → (Manquant)
Scraping:   Firecrawl → Puppeteer → Cheerio
```

## Architecture technique

### Layers

#### Level 1: Web Data Service (Scraping)
- Intelligent orchestrator avec fallback auto
- Providers: Firecrawl, Puppeteer, Cheerio
- Gère l'extraction de données

#### Level 2: AI Orchestrator (Recherche + Stratégie)
- Orchestre la recherche ET le scraping
- Utilise `ProviderSelectorService` pour adapter dynamiquement
- Respecte les préférences utilisateur

### Services clés

#### `ProviderSelectorService` (NEW)
**Responsabilités:**
- Vérifier disponibilité des API keys (BYOK)
- Sélectionner le provider optimal
- Gérer la chaîne de secours

**API:**
```typescript
// Récupère la liste des providers disponibles
getAvailableProviders(userId, agencyId): Promise<Map<string, ProviderInfo>>

// Retourne la stratégie à utiliser
selectOptimalStrategy(userId, agencyId): Promise<ProviderStrategy>

// Retourne les outils dynamiques disponibles
getAvailableTools(userId, agencyId): Promise<string[]>

// Teste un provider spécifique
isProviderAvailable(provider, userId, agencyId): Promise<boolean>
```

### Endpoints API

#### GET `/api/ai/orchestrate/providers/available`
**Description:** Récupère les providers disponibles et la stratégie
**Réponse:**
```json
{
  "available": [
    {
      "provider": "serpapi",
      "available": true,
      "requiresApiKey": true,
      "priority": 1,
      "description": "Google Search API pour trouver des prospects",
      "tier": "search"
    },
    ...
  ],
  "strategy": {
    "search": ["serpapi"],
    "scrape": ["firecrawl"]
  }
}
```

#### POST `/api/ai/orchestrate/providers/preferences`
**Description:** Sauvegarde les préférences de providers
**Body:**
```json
{
  "searchProviders": ["serpapi"],
  "scrapingProviders": ["firecrawl"],
  "autoFallback": true
}
```

## Workflow Utilisateur - Étape par Étape

### Scénario 1: Utilisateur avec SerpAPI + Firecrawl

```
1. Va à Settings > Mes Clés API
   → Configure: SerpAPI key + Firecrawl key

2. Va à Settings > Stratégie des Providers
   → Choisit SerpAPI pour recherche ✅
   → Choisit Firecrawl pour scraping ✅
   → Clique "Sauvegarder les préférences"

3. Lance une prospection
   → Utilise SerpAPI pour trouver prospects
   → Utilise Firecrawl pour extraire données
   → ✅ Prospection réussie
```

### Scénario 2: Utilisateur avec SEULEMENT Puppeteer

```
1. Va à Settings > Mes Clés API
   → Configure: Aucune clé externe
   → Puppeteer + Cheerio sont intégrés ✅

2. Va à Settings > Stratégie des Providers
   → Aucun provider payant disponible 🔴
   → Système utilise Puppeteer + Cheerio auto
   → Message: "Utilise les fallback gratuits"

3. Lance une prospection
   → Utilise Puppeteer pour recherche (plus lent mais gratuit)
   → Utilise Cheerio pour scraping (très rapide)
   → ✅ Prospection réussie (plus lente)
```

### Scénario 3: Utilisateur avec SerpAPI mais PAS Firecrawl

```
1. Va à Settings > Stratégie des Providers
   → SerpAPI disponible ✅
   → Firecrawl indisponible ❌
   → Choisit SerpAPI pour recherche

2. Système crée la chaîne:
   → Recherche: SerpAPI
   → Scraping: Puppeteer (fallback auto)

3. Prospection:
   → ✅ Recherche avec SerpAPI
   → ✅ Scraping avec Puppeteer (fallback)
   → Extraction réussie mais plus lente
```

## Composants Frontend

### Page: `/settings/provider-strategy.tsx`
- Affiche les providers disponibles
- Permet de sélectionner provider préféré
- Montre la stratégie résultante
- Sauvegarde les préférences

### Component: `ProspectionProviderSelector.tsx`
- Composant réutilisable
- Peut être intégré partout
- Exemple: Dans les settings, paramètres de campagne, etc.

## Database (Futur)

Ajouter table pour persistence:
```sql
CREATE TABLE user_provider_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  search_provider VARCHAR,
  scraping_provider VARCHAR,
  auto_fallback BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
```

## Intégration Backend (À compléter)

### 1. ExecutionPlannerService
```typescript
// À remplacer:
this.providerSelector.selectOptimalStrategy(userId, agencyId)
// Récupère la stratégie réelle au lieu de tool: 'serpapi' en dur
```

### 2. IntentAnalyzerService
```typescript
// À remplacer:
const availableTools = await this.providerSelector.getAvailableTools(userId, agencyId)
// Utilise les outils RÉELLEMENT disponibles
```

### 3. ToolExecutorService
```typescript
// À ajouter:
case 'puppeteer':
  return this.webDataService.scrapePuppeteer(...)
case 'cheerio':
  return this.webDataService.scrapeCherio(...)
```

## Testing

### Test API
```bash
# Récupérer providers disponibles
curl -X GET http://localhost:3001/api/ai/orchestrate/providers/available \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: cmi57ycue0000w3vunopeduv6" \
  -H "X-Agency-Id: cmk5fdg2f0000v5qcmie0wjpn"

# Sauvegarder préférences
curl -X POST http://localhost:3001/api/ai/orchestrate/providers/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cmi57ycue0000w3vunopeduv6" \
  -H "X-Agency-Id: cmk5fdg2f0000v5qcmie0wjpn" \
  -d '{
    "searchProviders": ["serpapi"],
    "scrapingProviders": ["firecrawl"],
    "autoFallback": true
  }'
```

### Test Frontend
1. Aller à: `http://localhost:3000/settings/provider-strategy`
2. Vérifier que les providers s'affichent
3. Sélectionner une stratégie
4. Cliquer "Sauvegarder"
5. Vérifier que succès s'affiche

## Avantages de cette approche

✅ **Flexibilité totale** - Les utilisateurs choisissent leurs providers
✅ **Coût adapté** - Utilisé que ce qu'on paye
✅ **Fallback auto** - Ne bloque pas si une API échoue
✅ **BYOK supporté** - Utilisateurs peuvent configurer leurs propres clés
✅ **Gratuit possible** - Puppeteer + Cheerio toujours disponibles
✅ **Scalable** - Ajouter new providers est simple

## Prochaines étapes

1. ✅ Backend API implémentée
2. ✅ Frontend page créée
3. ⏳ Tester avec données réelles
4. ⏳ Intégrer dans ExecutionPlanner
5. ⏳ Intégrer dans IntentAnalyzer
6. ⏳ Ajouter handlers puppeteer/cheerio à ToolExecutor
7. ⏳ Sauvegarder prefs en DB
