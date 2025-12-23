# 🎯 Guide LLM Router Intelligent

## Vue d'ensemble

Le **LLM Router** est un système intelligent de routage des appels LLM qui permet à chaque utilisateur de :
- ✅ Configurer **plusieurs providers** (plusieurs clés API)
- ✅ **Sélection automatique** du meilleur provider selon le type d'opération
- ✅ **Override manuel** pour forcer un provider spécifique
- ✅ **Tracking complet** des coûts et performances
- ✅ **Budget mensuel** par provider avec fallback automatique
- ✅ **Analytics en temps réel**

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│           Frontend (User)                   │
│  - Sélecteur de provider (Auto ou Manuel)  │
│  - Stats en temps réel                      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│       LLM Router Service 🧠                 │
│  1. Récupère les providers du user          │
│  2. Applique les règles de routing          │
│  3. Vérifie le budget                       │
│  4. Sélectionne le meilleur provider        │
│  5. Track les métriques                     │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   Anthropic   DeepSeek    Qwen
   (Qualité)   (Coût)      (Vitesse)
```

## 🎯 Matrice de Routing Intelligente

| Type d'opération | Providers prioritaires | Critère | Description |
|------------------|------------------------|---------|-------------|
| **seo** | Anthropic > OpenAI > Gemini | Qualité | Qualité maximale pour le SEO |
| **prospecting_mass** | DeepSeek > Qwen > Mistral | Coût | Traitement en masse économique |
| **prospecting_qualify** | Gemini > Mistral > Qwen | Équilibré | Bon rapport qualité/prix |
| **analysis_quick** | Gemini > Qwen > DeepSeek | Vitesse | Analyse rapide |
| **content_generation** | Anthropic > Mistral > OpenAI | Qualité | Génération de contenu |
| **long_context** | Kimi > Anthropic > OpenAI | Contexte | Documents longs (jusqu'à 128k tokens) |
| **scraping_analysis** | Mistral > Gemini > DeepSeek | Équilibré | Analyse de données scrapées |

## 🛠️ Utilisation Backend

### 1. Injection du LLMRouterService

```typescript
import { LLMRouterService, OperationType } from '@/modules/intelligence/llm-config/llm-router.service';

@Injectable()
export class MonService {
  constructor(private llmRouter: LLMRouterService) {}

  async generateContent(userId: string) {
    // Sélection automatique du meilleur provider pour SEO
    const provider = await this.llmRouter.selectBestProvider(
      userId,
      'seo', // Type d'opération
    );

    // Utiliser le provider
    const result = await provider.generate('Mon prompt...', {
      systemPrompt: 'Tu es un expert SEO',
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Tracker l'utilisation (important!)
    await this.llmRouter.trackUsage(
      userId,
      provider.name.toLowerCase(),
      'seo',
      500, // tokens input
      200, // tokens output
      1200, // latency ms
      true, // success
    );

    return result;
  }
}
```

### 2. Override Manuel

```typescript
// L'utilisateur peut forcer un provider spécifique
const provider = await this.llmRouter.selectBestProvider(
  userId,
  'seo',
  'deepseek', // Override manuel
);
```

### 3. Utilisation avec Helper (recommandé)

```typescript
import { LLMRouterHelper } from '@/modules/intelligence/llm-config/llm-router.helper';

@Injectable()
export class MonService {
  private helper: LLMRouterHelper;

  constructor(private llmRouter: LLMRouterService) {
    this.helper = new LLMRouterHelper(llmRouter);
  }

  async generateContent(userId: string, prompt: string) {
    // Tout est automatique : sélection + tracking
    return this.helper.generateWithTracking(
      userId,
      'seo',
      prompt,
      { maxTokens: 1000, temperature: 0.7 },
    );
  }
}
```

## 🎨 Utilisation Frontend

### 1. Composant de Sélection

```tsx
import { LLMProviderSelector } from '@/components/LLMProviderSelector';

function MaPage() {
  const [selectedProvider, setSelectedProvider] = useState('auto');

  return (
    <LLMProviderSelector
      operationType="seo"
      value={selectedProvider}
      onChange={setSelectedProvider}
      showStats={true}
    />
  );
}
```

### 2. Envoi au Backend

```typescript
// Envoyer le provider sélectionné à l'API
const response = await fetch('/api/mon-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '...',
    llmProvider: selectedProvider, // 'auto' ou nom du provider
  }),
});
```

## 📡 Endpoints API

### Gestion des Providers

```bash
# Lister les providers configurés du user (avec stats)
GET /api/llm-config/user-providers

# Ajouter un nouveau provider
POST /api/llm-config/user-providers
{
  "provider": "deepseek",
  "apiKey": "sk-...",
  "model": "deepseek-chat",
  "isActive": true,
  "priority": 0,
  "monthlyBudget": 50.0
}

# Modifier un provider
PUT /api/llm-config/user-providers/:provider
{
  "isActive": false,
  "monthlyBudget": 100.0
}

# Supprimer un provider
DELETE /api/llm-config/user-providers/:provider
```

### Analytics

```bash
# Suggestion du meilleur provider
GET /api/llm-config/suggest/seo
→ { "provider": "anthropic", "reason": "Qualité maximale", "criteria": "quality" }

# Analytics d'utilisation
GET /api/llm-config/analytics
→ Regroupement par provider et type d'opération

# Migrer l'ancienne config
POST /api/llm-config/migrate
```

## 💾 Structure Base de Données

### UserLlmProvider

```prisma
model UserLlmProvider {
  id            String   @id @default(cuid())
  userId        String
  provider      String   // 'anthropic', 'deepseek', etc.
  apiKey        String
  model         String?
  isActive      Boolean  @default(true)
  priority      Int      @default(0)  // 0 = plus haute priorité
  monthlyBudget Float?

  @@unique([userId, provider])
}
```

### LlmUsageLog

```prisma
model LlmUsageLog {
  id            String   @id @default(cuid())
  userId        String
  provider      String
  operationType String
  tokensInput   Int
  tokensOutput  Int
  cost          Float
  latency       Int
  success       Boolean
  errorMessage  String?
  createdAt     DateTime @default(now())
}
```

### ProviderPerformance

```prisma
model ProviderPerformance {
  id          String   @id @default(cuid())
  userId      String
  provider    String
  avgLatency  Int
  successRate Float
  totalCalls  Int
  totalTokens Int
  totalCost   Float
  lastUsed    DateTime?

  @@unique([userId, provider])
}
```

## 🔧 Migration

Pour migrer les anciennes configurations :

```typescript
// Automatique lors de l'ajout d'un nouveau provider
await llmRouter.migrateOldConfig(userId);

// Ou manuellement via API
POST /api/llm-config/migrate
```

## 📊 Features Intelligentes

### 1. Budget Tracking

- Budget mensuel par provider
- Alerte automatique si dépassement
- Fallback vers provider suivant si budget épuisé

### 2. Performance Tracking

- Latence moyenne par provider
- Taux de succès (% appels réussis)
- Coût total et par opération

### 3. Auto-Fallback

Si un provider atteint son budget, le router bascule automatiquement vers le provider suivant dans l'ordre de priorité.

### 4. Analytics en Temps Réel

- Utilisation par provider et type d'opération
- Coûts détaillés
- Performance comparative

## 🎯 Exemples d'Utilisation

### Exemple 1 : SEO (Qualité Max)

```typescript
// Auto : sélectionne Anthropic ou OpenAI
const provider = await llmRouter.selectBestProvider(userId, 'seo');
```

### Exemple 2 : Prospection en Masse (Coût Min)

```typescript
// Auto : sélectionne DeepSeek ou Qwen
const provider = await llmRouter.selectBestProvider(userId, 'prospecting_mass');
```

### Exemple 3 : Analyse Rapide (Vitesse)

```typescript
// Auto : sélectionne Gemini ou Qwen
const provider = await llmRouter.selectBestProvider(userId, 'analysis_quick');
```

### Exemple 4 : Long Document (Contexte Large)

```typescript
// Auto : sélectionne Kimi (128k contexte)
const provider = await llmRouter.selectBestProvider(userId, 'long_context');
```

## 🚀 Prochaines Améliorations

- [ ] Rate limiting par provider
- [ ] Cache des réponses LLM
- [ ] A/B testing automatique
- [ ] Recommandations ML basées sur historique
- [ ] Alertes email si budget dépassé
- [ ] Dashboard analytics complet

## 📖 Documentation Complète

- **Backend**: `backend/src/modules/intelligence/llm-config/llm-router.service.ts`
- **Frontend**: `frontend/components/LLMProviderSelector.tsx`
- **Page Admin**: `frontend/pages/settings/llm-providers.tsx`

---

**Créé par**: Claude
**Date**: 2025-12-22
**Version**: 1.0.0
