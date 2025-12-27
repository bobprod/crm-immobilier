# 🚀 Comment Utiliser le LLM Router - Guide Rapide

## ✅ Ce qui a été fait

Le LLM Router intelligent est **complètement intégré** dans tous les services du projet:

### Services Mis à Jour
- ✅ **LLMProspectingService** (5 méthodes)
- ✅ **ProspectingIntegrationService** (3 méthodes)
- ✅ **Tous les modules importent LLMConfigModule**

---

## 🎯 Utilisation Immédiate

### 1. Migrer la Base de Données

```bash
cd backend
npx prisma migrate dev --name llm_router_multi_providers
```

Cela créera les 3 nouvelles tables:
- `user_llm_providers` - Multi-providers par user
- `llm_usage_logs` - Tracking des appels
- `provider_performance` - Analytics

### 2. Configurer Vos Providers (UI)

1. Aller sur `/settings/llm-providers`
2. Cliquer "Ajouter un provider"
3. Choisir le provider (DeepSeek, Qwen, Anthropic, etc.)
4. Entrer la clé API
5. Définir un budget mensuel (optionnel)
6. Sauvegarder

**Vous pouvez ajouter autant de providers que vous voulez !**

### 3. Utiliser dans Votre Code

#### Option 1: Auto (Recommandé)
```typescript
// Le router choisit automatiquement le meilleur provider
const result = await this.llmProspectingService.analyzeRawItem(
  rawData,
  userId,
  'auto' // ou undefined
);
```

#### Option 2: Manuel
```typescript
// Forcer un provider spécifique
const result = await this.llmProspectingService.analyzeRawItem(
  rawData,
  userId,
  'deepseek' // Force DeepSeek
);
```

---

## 📊 Types d'Opérations Disponibles

| Type | Providers Prioritaires | Usage |
|------|------------------------|-------|
| `prospecting_mass` | DeepSeek > Qwen > Mistral | Analyse en masse (coût min) |
| `prospecting_qualify` | Gemini > Mistral > Qwen | Qualification leads (équilibré) |
| `seo` | Anthropic > OpenAI > Gemini | Génération SEO (qualité max) |
| `analysis_quick` | Gemini > Qwen > DeepSeek | Analyse rapide |
| `content_generation` | Anthropic > Mistral > OpenAI | Contenu de qualité |
| `long_context` | Kimi > Anthropic > OpenAI | Documents longs |
| `scraping_analysis` | Mistral > Gemini > DeepSeek | Analyse scraping |

---

## 🎨 Frontend - Composant de Sélection

```tsx
import { LLMProviderSelector } from '@/components/LLMProviderSelector';

function MaPage() {
  const [provider, setProvider] = useState('auto');

  return (
    <div>
      {/* Sélecteur avec suggestion intelligente */}
      <LLMProviderSelector
        operationType="prospecting_mass"
        value={provider}
        onChange={setProvider}
        showStats={true}
      />

      {/* Bouton d'action */}
      <button onClick={() => analyzeData(provider)}>
        Analyser
      </button>
    </div>
  );
}

async function analyzeData(provider: string) {
  await fetch('/api/prospecting/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: rawData,
      llmProvider: provider, // 'auto', 'deepseek', 'anthropic', etc.
    }),
  });
}
```

---

## 💰 Suivi des Coûts

### API Endpoints

```bash
# Voir les providers configurés avec stats
GET /api/llm-config/user-providers

# Analytics d'utilisation
GET /api/llm-config/analytics

# Suggestion pour une opération
GET /api/llm-config/suggest/prospecting_mass
```

### Exemple de Réponse

```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "monthlyBudget": 50.0,
  "monthlyUsage": 12.34,
  "budgetRemaining": 37.66,
  "performance": {
    "avgLatency": 1200,
    "successRate": 98.5,
    "totalCalls": 1523,
    "totalCost": 12.34
  }
}
```

---

## 🔧 Features Automatiques

✅ **Sélection intelligente** - Le meilleur provider selon l'opération
✅ **Budget tracking** - Vérification avant chaque appel
✅ **Auto-fallback** - Bascule si budget dépassé
✅ **Tracking complet** - Tokens, coût, latence, succès/échec
✅ **Analytics temps réel** - Dashboard d'utilisation
✅ **Multi-providers** - Plusieurs clés API par user

---

## 🚦 Prochaines Étapes

1. ✅ **Migration Prisma** → `npx prisma migrate dev`
2. ✅ **Configurer providers** → `/settings/llm-providers`
3. ✅ **Tester** → Faire un appel avec provider='auto'
4. ✅ **Monitorer** → Voir les analytics dans `/llm-config/analytics`

---

## 📚 Documentation Complète

- **Guide complet** : `docs/LLM_ROUTER_GUIDE.md`
- **Code Backend** : `backend/src/modules/intelligence/llm-config/`
- **Composants Frontend** : `frontend/components/LLMProviderSelector.tsx`

---

**Créé par**: Claude
**Date**: 2025-12-23
**Status**: ✅ Production Ready
