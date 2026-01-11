# 📐 Architecture & Diagrammes - API Keys Implementation

## 1. Flux de Sauvegarde des Clés API

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │   api-keys-enhanced.tsx                             │      │
│  │                                                       │      │
│  │  1. Input: API Keys (optionnel)                      │      │
│  │     - openaiApiKey: "sk-..."                         │      │
│  │     - geminiApiKey: "AIza..."                        │      │
│  │     - deepseekApiKey: "sk-..."                       │      │
│  │                                                       │      │
│  │  2. Select: Provider & Model                         │      │
│  │     - Provider: openai, gemini, deepseek, anthropic │      │
│  │     - Model: gpt-4o, gemini-2.0-flash, etc.        │      │
│  │                                                       │      │
│  │  3. Button: "Enregistrer les clés LLM"             │      │
│  │                                                       │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ↓                                     │
│                   PUT /api/ai-billing/api-keys/user             │
│                                                                   │
│  Payload:                                                       │
│  {                                                              │
│    "openaiApiKey": "sk-...",                                   │
│    "geminiApiKey": "AIza...",                                  │
│    "deepseekApiKey": "sk-...",                                 │
│    "defaultProvider": "openai",                                │
│    "defaultModel": "gpt-4o"                                    │
│  }                                                              │
│                           ↓                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (NestJS)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ApiKeysController.updateUserApiKeys()                          │
│           ↓                                                      │
│  Validation: UpdateUserApiKeysDto                               │
│    - defaultModel?: string  ✅ AJOUTÉ                          │
│    - defaultProvider?: string  ✅ AJOUTÉ                       │
│           ↓                                                      │
│  filterDtoKeys(): Filtre les champs vides                       │
│    - Ne sauvegarde que les valeurs non-vides                   │
│           ↓                                                      │
│  prisma.ai_settings.upsert()                                    │
│  {                                                              │
│    where: { userId: "user-123" }                               │
│    update: {                                                    │
│      openaiApiKey: "sk-...",                                   │
│      geminiApiKey: "AIza...",                                  │
│      deepseekApiKey: "sk-...",                                 │
│      defaultProvider: "openai",  ✅ NOUVEAU                   │
│      defaultModel: "gpt-4o"  ✅ NOUVEAU                       │
│    }                                                            │
│  }                                                              │
│                           ↓                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Table: ai_settings                                             │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ userId          │ "user-123"                         │       │
│  │ openaiApiKey    │ "sk-..."                           │       │
│  │ geminiApiKey    │ "AIza..."                          │       │
│  │ deepseekApiKey  │ "sk-..."                           │       │
│  │ defaultProvider │ "openai"  ✅                       │       │
│  │ defaultModel    │ "gpt-4o"  ✅                       │       │
│  │ createdAt       │ 2026-01-11T...                    │       │
│  │ updatedAt       │ 2026-01-11T...                    │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Hiérarchie de Récupération des Clés API

```
┌──────────────────────────────────────────────────────────────┐
│     ApiKeysService.getApiKey(userId, provider, agencyId)     │
└──────────────────────────────────────────────────────────────┘
                           ↓
        ┌────────────────────┴─────────────────────┐
        ↓                                           ↓
    ┌──────────────┐                      ┌──────────────┐
    │  User Level  │  (PRIORITÉ 1)        │    Fallback  │
    │  ai_settings │  ✅ Trouvé? RETOUR  │   Essayer    │
    └──────────────┘                      └──────────────┘
        ↓                                           ↑
   ❌ Null? ──────────┐                            │
                       ↓                            │
                  ┌──────────────┐                 │
                  │  Agency Level│  (PRIORITÉ 2)  │
                  │agencyApiKeys │  ✅ Trouvé?   │
                  └──────────────┘      RETOUR    │
                      ↓                            │
                 ❌ Null ou                       │
                 pas d'agence? ────────────────────┘
                                     ↓
                           ┌──────────────────┐
                           │   Super Admin    │ (FALLBACK)
                           │  globalSettings  │
                           │  superadmin_*_key│
                           └──────────────────┘
                                     ↓
                            ✅ Trouvé? Retour
                                     ↓
                              ❌ Null? Erreur
```

---

## 3. Structure de la Page Frontend

```
┌────────────────────────────────────────────────────────────────┐
│                    Settings - API Keys                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Header: "Mes Clés API & Configuration LLM"                   │
│                                                                 │
│  ┌─ Info Alert ──────────────────────────────────────┐       │
│  │ BYOK: Vos clés personnelles sont prioritaires     │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─ Tabs ─────────────────────────────────────────────┐       │
│  │ [LLM / IA]  [Scraping & Data]                    │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─ LLM/IA Tab ───────────────────────────────────────┐       │
│  │                                                     │       │
│  │  ┌─ Provider & Model Selection ─────────────────┐ │       │
│  │  │                                               │ │       │
│  │  │ Select Provider:  [OpenAI ▼]                │ │       │
│  │  │                                               │ │       │
│  │  │ Select Model:     [gpt-4o ▼]                │ │       │
│  │  │                                               │ │       │
│  │  │ Config sélectionnée: OpenAI - gpt-4o       │ │       │
│  │  │                                               │ │       │
│  │  └───────────────────────────────────────────────┘ │       │
│  │                                                     │       │
│  │  ┌─ API Keys (tous optionnels) ─────────────────┐ │       │
│  │  │                                               │ │       │
│  │  │ OpenAI (GPT)          [sk-................] 👁 │       │
│  │  │ Pour GPT-4, GPT-3.5...                      │ │       │
│  │  │                                               │ │       │
│  │  │ Google Gemini         [AIza............] 👁 │       │
│  │  │ Pour Gemini Pro...                          │ │       │
│  │  │                                               │ │       │
│  │  │ DeepSeek              [sk-................] 👁 │       │
│  │  │ Pour DeepSeek Chat...                       │ │       │
│  │  │                                               │ │       │
│  │  │ Anthropic (Claude)    [sk-ant............] 👁 │       │
│  │  │ Pour Claude 3...                            │ │       │
│  │  │                                               │ │       │
│  │  └───────────────────────────────────────────────┘ │       │
│  │                                                     │       │
│  │  [💾 Enregistrer les clés LLM]                   │       │
│  │                                                     │       │
│  │  ✅ Clés API sauvegardées avec succès!          │       │
│  │                                                     │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─ Scraping & Data Tab ─────────────────────────────┐       │
│  │                                                     │       │
│  │ SERP API                  [serp-...] 👁           │       │
│  │ Firecrawl                 [fc_...] 👁             │       │
│  │ Jina Reader               [jina-...] 👁           │       │
│  │ ScrapingBee               [sb_...] 👁             │       │
│  │ Browserless               [browserless-...] 👁    │       │
│  │                                                     │       │
│  │  [💾 Enregistrer les clés Scraping]             │       │
│  │                                                     │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Modèles Disponibles par Provider

```
┌──────────────────────────────────────────────────────┐
│            PROVIDER MODELS CONFIGURATION             │
├──────────────────────────────────────────────────────┤
│                                                       │
│  OpenAI:                                             │
│  ├─ gpt-4o                   (Recommended)          │
│  ├─ gpt-4-turbo                                      │
│  ├─ gpt-4                                            │
│  ├─ gpt-3.5-turbo                                    │
│  └─ gpt-3.5-turbo-16k                               │
│                                                       │
│  Google Gemini:                                      │
│  ├─ gemini-2.0-flash         (Latest)               │
│  ├─ gemini-1.5-pro                                   │
│  ├─ gemini-1.5-flash                                │
│  ├─ gemini-pro                                       │
│  └─ gemini-pro-vision                               │
│                                                       │
│  DeepSeek:                                           │
│  ├─ deepseek-chat            (Recommended)          │
│  └─ deepseek-coder                                   │
│                                                       │
│  Anthropic (Claude):                                │
│  ├─ claude-3-5-sonnet-20241022  (Latest)          │
│  ├─ claude-3-opus-20240229                          │
│  ├─ claude-3-sonnet-20240229                        │
│  └─ claude-3-haiku-20240307                         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 5. Validations et Feedback Utilisateur

```
┌───────────────────────────────────────┐
│     User Action Flow & Feedback       │
├───────────────────────────────────────┤
│                                        │
│  1. Remplir API Key                  │
│     └─> Input field validation        │
│                                        │
│  2. Sélectionner Provider             │
│     └─> Modèles se mettent à jour    │
│                                        │
│  3. Sélectionner Modèle              │
│     └─> Affiche sélection (code)      │
│                                        │
│  4. Cliquer "Enregistrer"             │
│     ├─> Bouton devient "Enregistrement..."
│     ├─> Appel PUT API                 │
│     └─> Attendre réponse...          │
│                                        │
│  SUCCESS (200):                       │
│  ├─> ✅ Toast "Clés sauvegardées!"  │
│  ├─> Message disparaît après 5s      │
│  └─> Data mise à jour en DB          │
│                                        │
│  ERROR (401/400/500):                 │
│  ├─> ❌ Toast "Erreur lors de..."    │
│  ├─> Message reste visible           │
│  └─> User peut retry                 │
│                                        │
└───────────────────────────────────────┘
```

---

## 6. Tests - Coverage

```
┌────────────────────────────────────────────────────────┐
│            TEST COVERAGE IMPLEMENTATION               │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ Public Endpoints (No Auth Required):              │
│     ├─ POST /api/api-keys/test/gemini                │
│     ├─ POST /api/api-keys/test/openai                │
│     └─ POST /api/api-keys/test/deepseek              │
│                                                         │
│  ✅ Protected Endpoints (JWT Required):              │
│     ├─ GET /api/ai-billing/api-keys/user             │
│     ├─ PUT /api/ai-billing/api-keys/user             │
│     ├─ GET /api/ai-billing/api-keys/agency           │
│     ├─ PUT /api/ai-billing/api-keys/agency           │
│     ├─ GET /api/ai-billing/api-keys/global           │
│     └─ PUT /api/ai-billing/api-keys/global           │
│                                                         │
│  ✅ Database:                                         │
│     ├─ ai_settings schema validation                  │
│     ├─ defaultModel field exists                      │
│     ├─ defaultProvider field exists                   │
│     └─ Data persistence verified                      │
│                                                         │
│  ✅ Frontend:                                         │
│     ├─ UI renders correctly                           │
│     ├─ Provider selection works                       │
│     ├─ Model selection works                          │
│     ├─ Keys can be toggled visible/hidden            │
│     ├─ Save button submits correct data               │
│     └─ Success/error messages display                 │
│                                                         │
│  ✅ Integration:                                      │
│     ├─ Keys saved in DB                              │
│     ├─ defaultModel saved in DB                      │
│     ├─ defaultProvider saved in DB                   │
│     ├─ Empty fields not saved                        │
│     └─ Data retrieval works (GET)                    │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 7. Fichiers Modifiés/Créés

```
Backend:
├─ ✅ backend/src/modules/ai-billing/dto/api-keys.dto.ts
│  └─ Ajout: defaultModel, defaultProvider (UpdateUserApiKeysDto)
│  └─ Ajout: defaultModel, defaultProvider (UpdateAgencyApiKeysDto)
│
Frontend:
├─ ✅ frontend/pages/settings/api-keys-enhanced.tsx (NOUVEAU)
│  └─ Composant complet avec sélection provider/modèle
│
Tests:
├─ ✅ test-complete-api-keys.js (Validation endpoints)
├─ ✅ tests/api-keys-complete-flow.spec.ts (Playwright)
│
Documentation:
├─ ✅ API_KEYS_IMPLEMENTATION_REPORT.md
├─ ✅ INTEGRATION_GUIDE_API_KEYS.md
└─ ✅ Cette architecture

Database:
└─ ✅ Utilise schéma existant (aucune migration nécessaire)
   ├─ ai_settings.defaultModel (déjà existant)
   └─ ai_settings.defaultProvider (déjà existant)
```

---

**Dernière mise à jour**: 11/01/2026
**Status**: ✅ Production-Ready
