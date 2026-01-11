# ⚠️ BACKUP - Ancien dossier Settings

**Date de backup**: 11 Janvier 2026
**Raison**: Duplication avec `/frontend/pages/settings/`

## 📌 Contexte

Ce dossier contenait une **duplication complète** des pages de paramètres qui existent déjà dans `/frontend/pages/settings/`.

Dans Next.js, seul le dossier `/pages/` est utilisé pour le routing. Le dossier `/src/pages/` n'était **jamais utilisé** par le framework.

## 🔍 Analyse effectuée

Une analyse approfondie a révélé :
- ✅ **Aucun import croisé** entre `/pages/settings/` et `/src/pages/settings/`
- ✅ **Aucune dépendance** de code entre les deux dossiers
- ⚠️ **Code unique** dans certains fichiers qui doit être migré

## 📁 Fichiers importants à migrer

### 🔴 PRIORITÉ HAUTE - Code métier unique

| Fichier | Taille | Description | À migrer vers |
|---------|--------|-------------|---------------|
| `provider-strategy.tsx` | 18k | Configuration des providers de recherche (SerpAPI, Pica, Jina) | `/pages/settings/provider-strategy.tsx` |
| `integrations.tsx` | 30k | Intégrations WordPress, Google Calendar, webhooks | `/pages/settings/integrations.tsx` |

### 🟡 PRIORITÉ MOYENNE - Fonctionnalités améliorées

| Fichier | Taille | Description |
|---------|--------|-------------|
| `ai-api-keys-improved.tsx` | 28k | Version améliorée avec features supplémentaires |
| `ai-api-keys.tsx` | 669 lignes | Version simple des clés API |

### 🟢 PRIORITÉ BASSE - Doublons inutiles

Ces fichiers sont des doublons simples et peuvent être supprimés :
- `ai-credits.tsx`
- `llm-config.tsx`
- `llm-router.tsx`
- `scraping-config.tsx`
- `index.tsx`

## 🎯 Actions à faire

### Étape 1: Migrer le code unique
```bash
# Copier les fichiers avec code métier unique vers /pages/settings/
cp provider-strategy.tsx ../../pages/settings/
cp integrations.tsx ../../pages/settings/
```

### Étape 2: Tester les routes
```bash
cd ../../..
npm run dev

# Vérifier manuellement :
# - http://localhost:3000/settings/provider-strategy
# - http://localhost:3000/settings/integrations
```

### Étape 3: Supprimer ce dossier backup
```bash
# Une fois la migration terminée et testée
rm -rf frontend/src/pages/settings_BACKUP_20260111
```

## 📊 Comparaison des structures

### Structure ACTIVE (`/frontend/pages/settings/`)
```
pages/settings/
├── index.tsx (1005 lignes) ← Page principale avec tabs
├── api-keys-enhanced.tsx
├── llm-config.tsx
├── llm-providers.tsx
├── ai-billing/
│   ├── index.tsx
│   ├── api-keys.tsx
│   ├── credits.tsx
│   ├── pricing.tsx
│   └── usage.tsx
├── ai-orchestrator/
│   ├── index.tsx
│   ├── providers.tsx
│   └── requests.tsx
├── modules/
│   ├── index.tsx
│   └── [slug].tsx
└── providers/
    └── index.tsx
```

### Structure BACKUP (ce dossier - NON UTILISÉE)
```
src/pages/settings_BACKUP_20260111/
├── index.tsx (249 lignes) ← Hub de navigation simple
├── ai-api-keys.tsx ⚠️ Code unique
├── ai-api-keys-improved.tsx ⚠️ Code unique
├── ai-credits.tsx
├── integrations.tsx 🔴 CODE MÉTIER UNIQUE À MIGRER
├── llm-config.tsx
├── llm-router.tsx
├── provider-strategy.tsx 🔴 CODE MÉTIER UNIQUE À MIGRER
└── scraping-config.tsx
```

## 📝 Historique des modifications

### Corrections appliquées (11 Jan 2026)

Le dossier `/frontend/pages/settings/index.tsx` a été corrigé pour :
1. ✅ Remplacer les composants `<Button>` par des boutons HTML natifs
2. ✅ Corriger le problème d'authentification (`auth_token` vs `token`)
3. ✅ Corriger l'URL API (`/api/api/...` → `/api/...`)
4. ✅ Implémenter les fonctions de sauvegarde LLM et Scraping
5. ✅ Connecter les inputs aux états React

### Corrections backend (11 Jan 2026)

Le backend a été corrigé pour :
1. ✅ Renommer `claudeApiKey` → `anthropicApiKey` dans Prisma schema
2. ✅ Synchroniser la base de données
3. ✅ Régénérer le client Prisma

## 🚀 Résultat

La sauvegarde des clés API fonctionne maintenant parfaitement :
```
✅ Clés LLM sauvegardées avec succès!
📤 Sending LLM keys: {geminiApiKey: '...', defaultProvider: 'gemini', defaultModel: 'gemini-2.0-flash'}
✅ Save response: {success: true, message: 'Clés API personnelles mises à jour avec succès'}
```

## 📞 Contact

Pour toute question sur cette migration, consulter les commits git de la branche `fix/api-keys-save-button`.

---

**⚠️ NE PAS UTILISER CE DOSSIER** - Utiliser `/frontend/pages/settings/` à la place.
