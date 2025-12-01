Failed to resolve import "axios" from "src/components/settings/integrations/PicaIntegration.tsx". Does the file exist?# Tests API Pica

## Configuration

### 1. Créer une configuration Pica

```bash
POST http://localhost:3000/pica/config
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "name": "default",
  "apiKey": "pk_...",
  "apiSecret": "sk_...",
  "baseUrl": "https://api.picaos.com",
  "serpApiConfig": {
    "enabled": true,
    "connectionId": "conn_serp_..."
  },
  "firecrawlConfig": {
    "enabled": true,
    "connectionId": "conn_firecrawl_..."
  },
  "isActive": true
}
```

### 2. Récupérer toutes les configurations

```bash
GET http://localhost:3000/pica/config
Authorization: Bearer <votre_token>
```

### 3. Mettre à jour une configuration

```bash
PATCH http://localhost:3000/pica/config/<config_id>
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "serpApiConfig": {
    "enabled": true,
    "connectionId": "conn_serp_updated..."
  }
}
```

## Tests SerpApi

### Recherche simple

```bash
POST http://localhost:3000/pica/serp/search
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "query": "immobilier Tunis",
  "location": "Tunisia",
  "language": "fr",
  "numResults": 10
}
```

### Recherche d'agences immobilières

```bash
POST http://localhost:3000/pica/serp/search
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "query": "agence immobilière Sousse",
  "location": "Tunisia",
  "language": "fr",
  "numResults": 20
}
```

## Tests Firecrawl

### Scraper une page

```bash
POST http://localhost:3000/pica/firecrawl/scrape
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "url": "https://www.tayara.tn/fr/immobilier",
  "onlyMainContent": true,
  "includeTags": ["article", "main"],
  "excludeTags": ["nav", "footer", "aside"]
}
```

### Recherche et scraping

```bash
POST http://localhost:3000/pica/firecrawl/search
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "query": "appartement 3 pièces Tunis",
  "limit": 5
}
```

## Test Recherche Combinée

### Recherche immobilière complète

```bash
GET http://localhost:3000/pica/search/combined?query=villa+Hammamet&location=Tunisia&limit=5
Authorization: Bearer <votre_token>
```

Cette requête va :
1. Utiliser SerpApi pour trouver les 5 meilleurs résultats pour "villa Hammamet"
2. Utiliser Firecrawl pour extraire le contenu de chaque page
3. Retourner les résultats avec le contenu complet

### Analyse de marché

```bash
GET http://localhost:3000/pica/search/combined?query=prix+immobilier+Tunis+2025&location=Tunisia&limit=10
Authorization: Bearer <votre_token>
```

## Exemples avec cURL

### Windows PowerShell

```powershell
# Recherche SerpApi
$token = "votre_token_jwt"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    query = "immobilier Tunis"
    location = "Tunisia"
    numResults = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/pica/serp/search" -Method POST -Headers $headers -Body $body

# Recherche combinée
Invoke-RestMethod -Uri "http://localhost:3000/pica/search/combined?query=appartement+Tunis&limit=5" -Headers $headers
```

### Linux/Mac (bash)

```bash
# Recherche SerpApi
TOKEN="votre_token_jwt"
curl -X POST http://localhost:3000/pica/serp/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "immobilier Tunis",
    "location": "Tunisia",
    "numResults": 10
  }'

# Recherche combinée
curl -X GET "http://localhost:3000/pica/search/combined?query=appartement+Tunis&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

## Cas d'usage réels

### 1. Veille concurrentielle

```bash
# Trouver et analyser les sites concurrents
GET http://localhost:3000/pica/search/combined?query=agence+immobilière+Tunis&location=Tunisia&limit=10
Authorization: Bearer <votre_token>
```

### 2. Analyse de prix

```bash
# Rechercher les prix du marché
GET http://localhost:3000/pica/search/combined?query=prix+appartement+3+pièces+Tunis&location=Tunisia&limit=15
Authorization: Bearer <votre_token>
```

### 3. Génération de leads

```bash
# Trouver des prospects potentiels
POST http://localhost:3000/pica/serp/search
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "query": "cherche appartement Tunis",
  "location": "Tunisia",
  "numResults": 50
}
```

### 4. Scraping de sites immobiliers

```bash
# Extraire les annonces d'un site concurrent
POST http://localhost:3000/pica/firecrawl/scrape
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "url": "https://www.mubawab.tn/fr/ct/tunis/a-vendre",
  "onlyMainContent": true
}
```

## Réponses attendues

### SerpApi Response

```json
{
  "organic_results": [
    {
      "position": 1,
      "title": "Immobilier Tunis - Annonces",
      "link": "https://example.com",
      "snippet": "Description...",
      "date": "2025-01-11"
    }
  ],
  "search_metadata": {
    "total_results": "1,234,567"
  }
}
```

### Firecrawl Response

```json
{
  "success": true,
  "data": {
    "markdown": "# Contenu de la page...",
    "html": "<html>...</html>",
    "metadata": {
      "title": "Titre de la page",
      "description": "Description..."
    }
  }
}
```

### Combined Search Response

```json
{
  "query": "immobilier Tunis",
  "serpResults": [
    {
      "position": 1,
      "title": "...",
      "link": "https://example.com"
    }
  ],
  "scrapedContent": [
    {
      "url": "https://example.com",
      "success": true,
      "data": {
        "markdown": "...",
        "html": "..."
      }
    }
  ],
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

## Codes d'erreur

- `400` : Requête invalide (paramètres manquants ou incorrects)
- `401` : Non authentifié (token JWT manquant ou invalide)
- `404` : Configuration Pica non trouvée
- `500` : Erreur serveur (problème avec l'API Pica)

## Notes

1. **Rate Limiting** : Pica applique des limites de taux. Consultez votre plan Pica pour les détails.
2. **Coûts** : SerpApi et Firecrawl sont des services payants. Vérifiez vos crédits avant de lancer des tests massifs.
3. **Cache** : Considérez l'ajout d'un système de cache pour éviter les appels API redondants.
4. **Async** : Pour de grandes quantités de données, utilisez des jobs asynchrones.
