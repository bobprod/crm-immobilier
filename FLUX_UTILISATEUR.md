# 🎨 Flux Utilisateur - Configuration Clé Deepseek

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE AI-API-KEYS                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ONGLET "LLM / IA"                                              │
│  • Configuration LLM & Providers                                 │
│  • Sélectionner un Provider LLM                                  │
│  • Modèle à utiliser                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: SÉLECTIONNER LE PROVIDER                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Sélectionner un Provider LLM         [Dropdown ▼]       │ │
│  │ ├─ OpenAI (GPT)                                          │ │
│  │ ├─ Google Gemini                                         │ │
│  │ ├─ DeepSeek          ◄─── ✅ SÉLECTIONNER              │ │
│  │ └─ Anthropic (Claude)                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2: ENTRER LA CLÉ API                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ DeepSeek                                [👁️ ]            │ │
│  │ [                    sk-xxxx...xxxx                    ]   │ │
│  │ Pour DeepSeek Chat et Coder                            │ │
│  │                                                         │ │
│  │ Bouton "Tester" ◄─── ✅ CLIQUE ICI APRÈS ENTRER CLÉ   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3: VALIDER LA CLÉ                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🔄 [Test...]  ◄─── LOADER EN ATTENTE DE VALIDATION      │ │
│  │                                                         │ │
│  │ Les actions:                                            │ │
│  │ 1. Frontend envoie la clé au backend                    │ │
│  │ 2. Backend teste la clé auprès de l'API Deepseek       │ │
│  │ 3. Backend retourne les modèles disponibles             │ │
│  │ 4. Frontend affiche "✓ Validée"                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
   ✅ CLÉ VALIDE                          ❌ CLÉ INVALIDE
        │                                           │
        ▼                                           ▼
┌──────────────────────────┐              ┌──────────────────────┐
│ Toast Succès:            │              │ Toast Erreur:        │
│ "✅ DEEPSEEK - Clé      │              │ "❌ DEEPSEEK -      │
│  valide!"               │              │  Clé invalide"       │
│                         │              │                      │
│ [✓ Validée]             │              │ (L'input reste vide) │
│                         │              │                      │
│ Modèles affichés ✓      │              │                      │
└──────────────────────────┘              └──────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4: SÉLECTIONNER LE MODÈLE (AUTOMATIQUE)                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Modèle à utiliser            [Dropdown ▼]               │ │
│  │ ├─ deepseek-chat             ◄─── ✅ AUTO-SÉLECTIONNÉ   │ │
│  │ └─ deepseek-coder                                        │ │
│  │                                                         │ │
│  │ Configuration sélectionnée:                             │ │
│  │ DEEPSEEK - deepseek-chat                                │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5: ENREGISTRER                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [💾 Enregistrer les clés LLM]  ◄─── CLIQUE POUR SAUVER  │ │
│  │                                                         │ │
│  │ Requête PUT envoyée:                                    │ │
│  │ {                                                       │ │
│  │   "deepseekApiKey": "sk-xxxx...xxxx",                   │ │
│  │   "defaultProvider": "deepseek",                        │ │
│  │   "defaultModel": "deepseek-chat"                       │ │
│  │ }                                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6: CONFIRMATION                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Toast Succès:                                           │ │
│  │ "✅ Clés LLM sauvegardées!                              │ │
│  │  Provider: DEEPSEEK, Modèle: deepseek-chat"            │ │
│  │                                                         │ │
│  │ Page rechargée automatiquement                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 7: VÉRIFICATION (APRÈS RECHARGEMENT)                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ DeepSeek                                [👁️ ] [🧪 Tester]│ │
│  │ [✓ Configurée]  ◄─── ✅ CLÉ VISIBLE APRÈS RELOAD       │ │
│  │ [sk-xxxx...xxxx]                                         │ │
│  │                                                         │ │
│  │ Configuration sélectionnée:                             │ │
│  │ DEEPSEEK - deepseek-chat  ◄─── ✅ MODÈLE SAUVEGARDÉ    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux Technique

```
FRONTEND                    |  BACKEND                    | EXTERNAL
─────────────────────────────────────────────────────────────────────

User clicks "Tester"        |
    │                       |
    ├─ POST /validate       |
    │  (provider, apiKey)   |
    │ ──────────────────────>
    │                       |  validateApiKey()
    │                       ├─ HTTP GET api.deepseek.com/models
    │                       │ ──────────────────────────────────────>
    │                       │                    <── Models List (ou 401)
    │                       │
    │                       │  return { valid: true, models: [...] }
    │  <──────────────────────
    │ { valid, models }     |
    │                       |
    ├─ Update UI            |
    │ ├─ Show badge "✓ Validée"
    │ ├─ Fill model dropdown
    │ └─ Set default model
    │                       |
    │                       |
User clicks "Enregistrer"   |
    │                       |
    ├─ PUT /user           |
    │  (deepseekApiKey,    |
    │   defaultProvider,   |
    │   defaultModel)      |
    │ ──────────────────────>
    │                       |  Prisma upsert
    │                       ├─ Save to ai_settings table
    │                       │ ──────────────────────────────────────>
    │                       │                     Database Update ✓
    │                       │
    │                       │  return { success: true }
    │  <──────────────────────
    │ { success: true }     |
    │                       |
    ├─ Show Toast "✓ Saved" |
    ├─ Reload page          |
    │                       |
    │ GET /user/full       |
    │ ──────────────────────>
    │                       |  Prisma findUnique
    │                       ├─ Get ai_settings
    │                       │ ──────────────────────────────────────>
    │                       │                    Database Query ✓
    │                       │
    │                       │  return { deepseekApiKey, ... }
    │  <──────────────────────
    │ { deepseekApiKey }    |
    │                       |
    └─ Render form with     |
       saved values ✓       |
```

## 📊 États du Formulaire

```
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAT 1: VIDE                                                   │
│  Input:     [ ]  (vide)                                        │
│  Boutons:   - (masqué)                                          │
│  Badge:     - (masqué)                                          │
│  Dropdown:  OPENAI (par défaut)                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAT 2: SAISI                                                  │
│  Input:     [sk-xxxx...xxxx]                                    │
│  Boutons:   [👁️ ] [🧪 Tester]                                   │
│  Badge:     - (masqué)                                          │
│  Dropdown:  DEEPSEEK (changé par l'utilisateur)                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAT 3: EN TEST                                                │
│  Input:     [sk-xxxx...xxxx]                                    │
│  Boutons:   [👁️ ] [🔄 Test...]  (disabled)                      │
│  Badge:     - (masqué)                                          │
│  Toast:     - (en attente)                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAT 4: VALIDÉE                                                │
│  Input:     [sk-xxxx...xxxx]                                    │
│  Badge:     [✓ Validée]                                         │
│  Boutons:   [👁️ ] [🧪 Tester]                                   │
│  Toast:     ✅ DEEPSEEK - Clé valide!                          │
│  Dropdown:  [deepseek-chat] (auto-rempli)                       │
│  Modèles:   deepseek-chat, deepseek-coder                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAT 5: INVALIDE                                               │
│  Input:     [clé-invalide]                                      │
│  Badge:     - (masqué)                                          │
│  Boutons:   [👁️ ] [🧪 Tester]                                   │
│  Toast:     ❌ DEEPSEEK - Clé invalide                          │
│  Dropdown:  [Sélectionner un modèle] (vide)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAT 6: SAUVEGARDÉE                                            │
│  Input:     [sk-xxxx...xxxx]  (récupérée de la BD)             │
│  Badge:     [✓ Configurée]                                      │
│  Boutons:   [👁️ ] [🧪 Tester]                                   │
│  Toast:     ✅ Clés LLM sauvegardées!                          │
│  Dropdown:  [deepseek-chat]  (sauvegardé)                       │
│  Selected:  DEEPSEEK - deepseek-chat                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Points Clés

✅ **Authentification**: Token recherché dans 4 emplacements possibles
✅ **Validation**: Clés testées auprès de l'API réelle du provider
✅ **UX**: Badge de confirmation, loader, toast notifications
✅ **Modèles**: Auto-remplis selon le provider sélectionné
✅ **Persistance**: Clés sauvegardées en base de données
✅ **Affichage**: Clés rechargées au chargement de la page

---

**Maintenant prêt à tester ! 🚀**
