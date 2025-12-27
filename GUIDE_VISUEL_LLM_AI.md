# 📊 Guide Visuel : LLM Router & AI Orchestrator

**Référence rapide avec diagrammes et exemples**

---

## 🗺️ Vue d'Ensemble de l'Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRM IMMOBILIER - ARCHITECTURE AI                  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼───────┐        ┌───────▼────────┐
            │   FRONTEND    │        │    BACKEND     │
            │   (Next.js)   │◄──────►│    (NestJS)    │
            └───────────────┘        └────────────────┘
                    │                         │
            ┌───────┴───────┐        ┌───────┴────────┐
            │               │        │                │
    ┌───────▼────┐  ┌──────▼─────┐  │  ┌──────────┐ │
    │LLM Config  │  │ Dashboard  │  │  │LLM Router│ │
    │   Page     │  │ Métriques  │  │  │ Factory  │ │
    └────────────┘  └────────────┘  │  └────┬─────┘ │
                                    │       │       │
                                    │  ┌────▼────┐  │
                                    │  │Provider │  │
                                    │  │ Claude  │  │
                                    │  ├─────────┤  │
                                    │  │Provider │  │
                                    │  │  GPT-4  │  │
                                    │  ├─────────┤  │
                                    │  │Provider │  │
                                    │  │ Gemini  │  │
                                    │  ├─────────┤  │
                                    │  │Provider │  │
                                    │  │DeepSeek │  │
                                    │  ├─────────┤  │
                                    │  │Provider │  │
                                    │  │OpenRoute│  │
                                    │  └────┬────┘  │
                                    │       │       │
                            ┌───────┴───────┴───────┴──────┐
                            │   AI ORCHESTRATOR            │
                            │  (Services Distribués)       │
                            ├──────────────────────────────┤
                            │ • SEO AI Service             │
                            │ • LLM Prospecting Service    │
                            │ • AI Metrics Service         │
                            │ • Validation AI Service      │
                            │ • Cost Tracker Service       │
                            └──────────────────────────────┘
```

---

## 🔀 Flux LLM Router

```
┌─────────────────────────────────────────────────────────────┐
│              COMMENT LE ROUTER FONCTIONNE                   │
└─────────────────────────────────────────────────────────────┘

1️⃣ Service demande une génération IA
         │
         ▼
    [LLM Router Factory]
         │
         ├──> Récupère config utilisateur depuis DB
         │    (provider: "anthropic", model: "claude-sonnet-4")
         │
         ▼
    [Sélection Provider]
         │
    ┌────┴────┬─────┬─────┬─────┬─────┐
    │         │     │     │     │     │
    ▼         ▼     ▼     ▼     ▼     ▼
 Claude    GPT-4 Gemini Deep  Open
                         Seek  Router
    │
    └──> Provider sélectionné
         │
         ▼
    [Validation Config]
         │
         ├──> Clé API valide?
         │    Modèle supporté?
         │
         ▼
    [Appel API LLM]
         │
         ▼
    [Réponse IA]
         │
         ▼
    [Tracking Usage]
         │
         ├──> Enregistrement :
         │    - Tokens utilisés
         │    - Coût calculé
         │    - Métadonnées
         │
         ▼
    [Retour au Service]
```

---

## 🎭 Flux AI Orchestrator - SEO

```
┌─────────────────────────────────────────────────────────────┐
│         OPTIMISATION SEO AUTOMATIQUE D'UN BIEN              │
└─────────────────────────────────────────────────────────────┘

Utilisateur publie un bien
         │
         ▼
[Vitrine Service] ──> Vérif SEO existe?
         │                    │
         │                    │ Non
         │                    ▼
         │            [SEO AI Service]
         │                    │
         │                    ├──> getProvider(userId)
         │                    │         │
         │                    │         ▼
         │                    │    [LLM Router]
         │                    │         │
         │                    │         ▼
         │                    │    Provider IA
         │                    │    (ex: Claude)
         │                    │
         │                    ├──> Promise.all([
         │                    │      generateMetaTitle(),
         │                    │      generateMetaDescription(),
         │                    │      generateKeywords(),
         │                    │      generateFAQ(),
         │                    │      generateDescription(),
         │                    │    ])
         │                    │
         │                    ├──> 5 appels IA en parallèle
         │                    │    ⚡ Temps : ~3 secondes
         │                    │    💰 Coût : ~0.003€
         │                    │
         │                    ▼
         │            [Calcul Score SEO]
         │                    │
         │                    ├──> Score : 85/100
         │                    │
         │                    ▼
         │            [Enregistrement BD]
         │                    │
         │                    ├──> PropertySEO créé
         │                    │
         ▼                    ▼
[Publication avec SEO] ◄─────┘
         │
         ▼
✅ Bien publié avec SEO optimisé
         │
         ▼
🔍 Référencement Google actif
```

### Exemple Concret

**Entrée (Bien immobilier)** :
```json
{
  "type": "Appartement",
  "city": "La Marsa",
  "price": 450000,
  "area": 120,
  "rooms": 3
}
```

**Sortie (SEO généré par IA)** :
```json
{
  "metaTitle": "Appartement 3 pièces La Marsa 120m² - 450K TND",
  "metaDescription": "Découvrez ce magnifique appartement de 3 pièces à La Marsa. Surface 120m², prix 450000 TND. Bien situé, proche commodités.",
  "keywords": "appartement La Marsa, 3 pièces, 120m2, immobilier Tunisie, achat appartement",
  "faq": [
    {
      "q": "Quel est le prix de cet appartement?",
      "a": "Le prix de vente est de 450 000 TND."
    },
    {
      "q": "Quelle est la surface de l'appartement?",
      "a": "L'appartement dispose d'une surface de 120 m²."
    }
  ],
  "seoScore": 85,
  "lastOptimized": "2025-12-23T12:30:00Z"
}
```

**Temps** : 3 secondes  
**Coût** : 0.003€  
**Gain temps** : 15 minutes économisées ✅

---

## 🔍 Flux AI Orchestrator - Prospecting

```
┌─────────────────────────────────────────────────────────────┐
│          ANALYSE INTELLIGENTE D'UN LEAD SCRAPÉ              │
└─────────────────────────────────────────────────────────────┘

Lead brut depuis source externe
(Facebook, LinkedIn, SERP, etc.)
         │
         ▼
[Integration Service]
         │
         ▼
[LLM Prospecting Service]
         │
         ├──> analyzeRawItem(rawText)
         │
         ├──> Config LLM disponible?
         │         │
         │         │ Oui
         │         ▼
         │    [LLM Router]
         │         │
         │         ▼
         │    Provider IA
         │    (ex: Gemini)
         │         │
         │         ▼
         │    Prompt Système :
         │    "Tu es expert analyse
         │     données immobilières Tunisie"
         │         │
         │         ▼
         │    Prompt Utilisateur :
         │    "Extrait: nom, tel, demande,
         │     budget, localisation"
         │         │
         │         ▼
         │    [Réponse IA JSON]
         │
         ├──> Parse réponse
         │
         ├──> Validation données
         │         │
         │         ├──> Normalisation :
         │         │    - Ville : "la marsa" → "La Marsa"
         │         │    - Tel : "98123456" → "+216 98 123 456"
         │         │    - Budget : "300k" → 300000
         │         │
         │         ▼
         │    [Scoring Qualité]
         │         │
         │         ├──> Score : 0-100
         │         │    (infos complètes, cohérence)
         │         │
         │         ▼
         │    Score : 75/100
         │
         ▼
[Lead Structuré]
         │
         ├──> [Matching avec Biens]
         │         │
         │         ▼
         │    Biens compatibles trouvés
         │
         ▼
[Création Prospect CRM]
         │
         ▼
[Notification Agent]
         │
         ▼
✅ Lead qualifié prêt à convertir
```

### Exemple Concret

**Entrée (Post Facebook brut)** :
```
"slt jcherche appart 2 pièces la marsa 
max 300k urgent contact 98123456 merci"
```

**Traitement IA** :

1️⃣ **Envoi au LLM** :
```typescript
systemPrompt: "Tu es expert analyse immobilière Tunisie"
userPrompt: "Extrait les infos structurées du texte suivant..."
```

2️⃣ **Réponse IA** :
```json
{
  "type": "requête",
  "bienRecherche": "appartement",
  "pieces": 2,
  "localisation": "La Marsa",
  "budgetMax": 300000,
  "devise": "TND",
  "urgence": "élevée",
  "telephone": "+216 98 123 456",
  "email": null,
  "nom": null
}
```

3️⃣ **Validation & Scoring** :
```json
{
  "qualityScore": 75,
  "validationStatus": "valid",
  "completeness": {
    "type": true,
    "localisation": true,
    "budget": true,
    "contact": true,
    "nom": false,
    "email": false
  },
  "recommendations": [
    "Demander le nom du prospect",
    "Demander l'email pour suivi"
  ]
}
```

**Temps** : 2 secondes  
**Coût** : 0.005€  
**Gain temps** : 5 minutes économisées ✅

---

## 💰 Flux Cost Tracker

```
┌─────────────────────────────────────────────────────────────┐
│           TRACKING AUTOMATIQUE DES COÛTS AI                 │
└─────────────────────────────────────────────────────────────┘

Chaque requête IA
         │
         ▼
[Cost Tracker Service]
         │
         ├──> trackUsage({
         │      userId: "user-123",
         │      provider: "anthropic",
         │      model: "claude-sonnet-4",
         │      inputTokens: 450,
         │      outputTokens: 250,
         │      requestType: "seo_optimization"
         │    })
         │
         ├──> calculateCost()
         │         │
         │         ├──> Input : 450 tokens × $3/1M = $0.00135
         │         ├──> Output: 250 tokens × $15/1M = $0.00375
         │         └──> Total : $0.0051
         │
         ├──> Enregistrement BD
         │         │
         │         ▼
         │    [ai_usage_metrics]
         │    {
         │      id: "uuid...",
         │      userId: "user-123",
         │      provider: "anthropic",
         │      model: "claude-sonnet-4",
         │      tokensUsed: 700,
         │      cost: 0.0051,
         │      requestType: "seo_optimization",
         │      timestamp: "2025-12-23T12:30:00Z",
         │      metadata: {
         │        inputTokens: 450,
         │        outputTokens: 250
         │      }
         │    }
         │
         ▼
[Agrégation Métriques]
         │
         ├──> Par période (jour/semaine/mois)
         ├──> Par provider (anthropic, openai, etc.)
         ├──> Par modèle (claude-4, gpt-4, etc.)
         ├──> Par type (seo, prospecting, etc.)
         │
         ▼
[Dashboard Métriques]
         │
         ├──> Aujourd'hui : 45 requêtes, 0.38€
         ├──> Cette semaine : 287 requêtes, 2.14€
         ├──> Ce mois : 1234 requêtes, 10.47€
         │
         ▼
[Calcul ROI]
         │
         ├──> Coûts IA : 10.47€
         ├──> Conversions : 28 prospects
         ├──> ROI : 2.67x
         │
         ▼
[Alertes Budget]
         │
         ├──> Budget mensuel : 50€
         ├──> Utilisé : 10.47€ (20.9%)
         ├──> Restant : 39.53€
         │
         ▼
✅ Monitoring temps réel actif
```

---

## 📊 Dashboard Métriques (Visuel)

```
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD AI METRICS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 UTILISATION AUJOURD'HUI                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  45 requêtes  │  125,000 tokens  │  0.38€          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📊 RÉPARTITION PAR PROVIDER                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ████████████████████ Claude (45%)    2.14€        │   │
│  │  ███████████ Gemini (25%)             0.85€        │   │
│  │  ████████ GPT-4 (20%)                 1.89€        │   │
│  │  ████ DeepSeek (10%)                  0.12€        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💰 BUDGET CE MOIS                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Budget : 50.00€                                    │   │
│  │  Utilisé : 10.47€  █████░░░░░░░░░░░░░ (20.9%)      │   │
│  │  Restant : 39.53€                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📈 ÉVOLUTION (30 JOURS)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 15€ ┤                                            ╭─  │   │
│  │ 12€ ┤                                      ╭────╯    │   │
│  │  9€ ┤                            ╭────────╯         │   │
│  │  6€ ┤                  ╭────────╯                   │   │
│  │  3€ ┤        ╭────────╯                             │   │
│  │  0€ └────────┴────────┴────────┴────────┴──────────│   │
│  │     Sem1   Sem2   Sem3   Sem4   Aujourd'hui        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🎯 ROI (RETOUR SUR INVESTISSEMENT)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Coûts IA :        10.47€                           │   │
│  │  Conversions :     28 prospects                     │   │
│  │  ROI :             2.67x                            │   │
│  │  Coût/conversion : 0.37€                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚡ TOP UTILISATIONS                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. SEO Optimization       456 requêtes   4.23€    │   │
│  │  2. Lead Analysis          387 requêtes   2.14€    │   │
│  │  3. Content Generation     234 requêtes   2.89€    │   │
│  │  4. Matching               157 requêtes   1.21€    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Comparaison Providers (Tableau Visuel)

```
┌────────────────────────────────────────────────────────────────────┐
│                   COMPARAISON PROVIDERS LLM                        │
├────────────┬─────────┬────────┬─────────┬──────────────────────────┤
│ Provider   │ Prix/1M │ Vitesse│ Qualité │ Cas d'Usage             │
├────────────┼─────────┼────────┼─────────┼──────────────────────────┤
│ Claude     │ ~3€     │ ⚡⚡⚡   │ ⭐⭐⭐⭐⭐  │ SEO, Rédaction          │
│ Sonnet 4   │         │        │         │ Content de qualité      │
├────────────┼─────────┼────────┼─────────┼──────────────────────────┤
│ GPT-4      │ ~10€    │ ⚡⚡    │ ⭐⭐⭐⭐⭐  │ Polyvalent              │
│ Turbo      │         │        │         │ Génération complexe     │
├────────────┼─────────┼────────┼─────────┼──────────────────────────┤
│ Gemini     │ ~1.25€  │ ⚡⚡⚡⚡  │ ⭐⭐⭐⭐   │ Volume élevé            │
│ 1.5 Pro    │         │        │         │ Analyse rapide          │
├────────────┼─────────┼────────┼─────────┼──────────────────────────┤
│ DeepSeek   │ ~0.14€  │ ⚡⚡⚡   │ ⭐⭐⭐⭐   │ Ultra économique        │
│ Chat       │         │        │         │ Budget limité           │
├────────────┼─────────┼────────┼─────────┼──────────────────────────┤
│ OpenRouter │ Variable│ ⚡⚡⚡   │ Variable│ Flexibilité             │
│ Multi      │         │        │         │ Tous modèles            │
└────────────┴─────────┴────────┴─────────┴──────────────────────────┘

💡 RECOMMANDATIONS :

┌─────────────────────────────────────────────────────────────┐
│ Si priorité = QUALITÉ        →  Claude Sonnet 4            │
│ Si priorité = ÉCONOMIE       →  DeepSeek ou Gemini         │
│ Si priorité = FLEXIBILITÉ    →  OpenRouter                 │
│ Si priorité = VOLUME ÉLEVÉ   →  Gemini                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration Rapide (Étape par Étape)

```
┌─────────────────────────────────────────────────────────────┐
│           CONFIGURER L'IA EN 5 MINUTES                      │
└─────────────────────────────────────────────────────────────┘

ÉTAPE 1 : Choisir un Provider
┌──────────────────────────┐
│ Recommandation débutant: │
│ • OpenRouter             │
│   (accès tous modèles)   │
│                          │
│ Alternative économique:  │
│ • DeepSeek               │
│   (ultra bas coût)       │
└──────────────────────────┘
         │
         ▼
ÉTAPE 2 : Créer un Compte
┌──────────────────────────┐
│ 1. Aller sur le site    │
│    du provider           │
│ 2. S'inscrire            │
│ 3. Vérifier email        │
│ 4. Crédit gratuit : 5€   │
└──────────────────────────┘
         │
         ▼
ÉTAPE 3 : Obtenir Clé API
┌──────────────────────────┐
│ 1. Dashboard → API Keys  │
│ 2. "Create new key"      │
│ 3. Copier la clé         │
│    sk-or-xxxxx...        │
└──────────────────────────┘
         │
         ▼
ÉTAPE 4 : Configuration CRM
┌──────────────────────────┐
│ 1. CRM → Paramètres      │
│ 2. Configuration LLM/IA  │
│ 3. Provider: OpenRouter  │
│ 4. Modèle: claude-3.5    │
│ 5. Coller clé API        │
│ 6. Sauvegarder           │
└──────────────────────────┘
         │
         ▼
ÉTAPE 5 : Tester
┌──────────────────────────┐
│ 1. Cliquer "Tester"      │
│ 2. Attendre...           │
│ 3. ✅ Configuration OK   │
└──────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│   ✅ C'EST PRÊT !        │
│                          │
│ L'IA est maintenant      │
│ active pour :            │
│ • SEO automatique        │
│ • Analyse leads          │
│ • Toutes fonctions IA    │
└──────────────────────────┘
```

---

## 📈 Estimation Coûts par Scénario

```
┌─────────────────────────────────────────────────────────────┐
│              COMBIEN ÇA COÛTE VRAIMENT ?                    │
└─────────────────────────────────────────────────────────────┘

SCÉNARIO 1 : PETIT VOLUME
┌────────────────────────────────────────────────┐
│ • 10 biens/jour optimisés SEO                  │
│   → 10 × 1000 tokens × 30 jours = 300K tokens │
│   → Coût Claude : 0.90€/mois                   │
│                                                │
│ • 20 leads/jour analysés                       │
│   → 20 × 500 tokens × 30 jours = 300K tokens  │
│   → Coût Gemini : 0.38€/mois                   │
│                                                │
│ TOTAL : ~1.28€/mois                            │
│ ════════════════════════════════════════════   │
│ 💰 Moins qu'un café ! ☕                       │
└────────────────────────────────────────────────┘

SCÉNARIO 2 : VOLUME MOYEN
┌────────────────────────────────────────────────┐
│ • 50 biens/jour optimisés SEO                  │
│   → 50 × 1000 tokens × 30 jours = 1.5M tokens │
│   → Coût Claude : 4.50€/mois                   │
│                                                │
│ • 100 leads/jour analysés                      │
│   → 100 × 500 tokens × 30 jours = 1.5M tokens │
│   → Coût Gemini : 1.88€/mois                   │
│                                                │
│ TOTAL : ~6.38€/mois                            │
│ ════════════════════════════════════════════   │
│ 💰 Prix d'un déjeuner ! 🍔                    │
└────────────────────────────────────────────────┘

SCÉNARIO 3 : GROS VOLUME
┌────────────────────────────────────────────────┐
│ • 200 biens/jour optimisés SEO                 │
│   → 200 × 1000 tokens × 30 jours = 6M tokens  │
│   → Coût Claude : 18€/mois                     │
│                                                │
│ • 500 leads/jour analysés                      │
│   → 500 × 500 tokens × 30 jours = 7.5M tokens │
│   → Coût Gemini : 9.38€/mois                   │
│                                                │
│ TOTAL : ~27.38€/mois                           │
│ ════════════════════════════════════════════   │
│ 💰 ROI : 2-3x minimum ! 📈                    │
└────────────────────────────────────────────────┘

💡 À COMPARER AVEC :
┌────────────────────────────────────────────────┐
│ Temps économisé par bien : 15 minutes          │
│ 50 biens × 15 min = 12.5 heures/mois          │
│                                                │
│ Coût d'un employé : ~10€/heure                │
│ Économie : 125€/mois                           │
│                                                │
│ Coût IA : 6.38€/mois                           │
│ ════════════════════════════════════════════   │
│ 📊 ROI : 125€ / 6.38€ = 19.6x                 │
│ ✅ Chaque euro investi = 19€ économisés       │
└────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Démarrage

```
┌─────────────────────────────────────────────────────────────┐
│              CHECKLIST : DÉMARRER AVEC L'IA                 │
└─────────────────────────────────────────────────────────────┘

CONFIGURATION (5 minutes)
 ☐ Choisir un provider IA (recommandé: OpenRouter)
 ☐ Créer un compte et obtenir clé API
 ☐ Entrer la clé dans CRM → Paramètres → LLM Config
 ☐ Tester la connexion (bouton "Tester")
 ☐ ✅ Voir "Configuration valide !"

PREMIER TEST SEO (2 minutes)
 ☐ Créer ou sélectionner 1 bien immobilier
 ☐ Publier le bien (déclenche auto-optimisation)
 ☐ Vérifier le SEO généré (meta title, description)
 ☐ Consulter le score SEO (devrait être > 70)
 ☐ ✅ SEO optimisé automatiquement !

PREMIER TEST PROSPECTING (5 minutes)
 ☐ Avoir quelques leads bruts (posts Facebook, etc.)
 ☐ Lancer l'analyse LLM Prospecting
 ☐ Vérifier l'extraction des données
 ☐ Consulter le score de qualité des leads
 ☐ ✅ Leads analysés et structurés !

MONITORING (1 minute)
 ☐ Aller dans Dashboard → AI Metrics
 ☐ Vérifier les métriques d'utilisation
 ☐ Consulter les coûts (devrait être < 0.10€)
 ☐ Définir un budget mensuel (ex: 50€)
 ☐ ✅ Monitoring actif !

OPTIMISATION (après 1 semaine)
 ☐ Analyser les résultats SEO (score moyen, CTR)
 ☐ Analyser la qualité des leads extraits
 ☐ Consulter le ROI AI (conversions / coûts)
 ☐ Ajuster les paramètres si nécessaire
 ☐ ✅ Système optimisé !
```

---

## 🎯 Points Clés à Retenir

```
┌─────────────────────────────────────────────────────────────┐
│                 L'ESSENTIEL À RETENIR                       │
└─────────────────────────────────────────────────────────────┘

✅ ARCHITECTURE
   • LLM Router = Système de routage intelligent
   • AI Orchestrator = Coordination services IA
   • 5 providers supportés (Claude, GPT, Gemini, etc.)

✅ FONCTIONNALITÉS
   • SEO automatique des biens immobiliers
   • Analyse intelligente des leads scrapés
   • Tracking coûts en temps réel
   • ROI calculé automatiquement

✅ COÛTS
   • 1 bien SEO : ~0.003€
   • 1 lead analysé : ~0.005€
   • Volume moyen : ~6€/mois
   • ROI moyen : 2-3x minimum

✅ QUALITÉ
   • Code professionnel et maintenable
   • Architecture extensible
   • Documentation complète
   • Production ready ✅

✅ CONFIGURATION
   • 5 minutes pour démarrer
   • Interface intuitive
   • Test de connexion automatique
   • Support multi-providers
```

---

**Document :** Guide visuel et référence rapide  
**Durée lecture :** 10 minutes  
**Format :** Diagrammes ASCII et exemples concrets  
**Pour :** Compréhension visuelle et démarrage rapide
