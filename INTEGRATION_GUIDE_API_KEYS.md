# 🚀 Guide d'Intégration du Nouveau Composant API Keys

## Objectif
Remplacer ou améliorer la page Settings pour API Keys avec la nouvelle version `api-keys-enhanced.tsx` qui supporte la sélection de modèles LLM et la sauvegarde complète.

## Option 1: Remplacer Directement (Recommandé)

### Étape 1: Sauvegarder l'ancienne version
```bash
cp frontend/src/pages/settings/ai-api-keys.tsx frontend/src/pages/settings/ai-api-keys.backup.tsx
```

### Étape 2: Remplacer par la version améliorée
```bash
# Copier le nouveau composant vers le bon emplacement
cp frontend/pages/settings/api-keys-enhanced.tsx frontend/src/pages/settings/ai-api-keys.tsx
```

### Étape 3: Tester
```bash
# Lancer le frontend
cd frontend
npm run dev

# Aller sur http://localhost:3000/settings et vérifier que l'onglet API Keys fonctionne
```

---

## Option 2: Créer une Nouvelle Route (Alternative)

### Étape 1: Créer la nouvelle page
```bash
cp frontend/pages/settings/api-keys-enhanced.tsx frontend/src/pages/settings/api-keys-enhanced.tsx
```

### Étape 2: Ajouter un lien dans le menu Settings

Ouvrez `frontend/src/pages/settings/index.tsx` et cherchez le TabsList:

```typescript
// Avant:
<TabsList className="grid w-full grid-cols-2">
  <TabsTrigger value="profile">Profil</TabsTrigger>
  <TabsTrigger value="api-keys">Clés API</TabsTrigger>
</TabsList>

// Après:
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="profile">Profil</TabsTrigger>
  <TabsTrigger value="api-keys">Clés API (Simple)</TabsTrigger>
  <TabsTrigger value="api-keys-advanced">Clés API (Avancé)</TabsTrigger>
</TabsList>
```

### Étape 3: Ajouter le TabsContent

```typescript
<TabsContent value="api-keys-advanced">
  <AIApiKeysEnhancedComponent />
</TabsContent>
```

Et importer le composant:
```typescript
import AIApiKeysEnhancedComponent from './ai-api-keys-enhanced';
```

---

## Vérification Post-Intégration

### 1. Tester la UI
- [ ] Les onglets LLM/IA et Scraping & Data s'affichent
- [ ] Sélection du provider fonctionne
- [ ] Les modèles se changent selon le provider
- [ ] Les clés peuvent être masquées/révélées
- [ ] Le bouton "Enregistrer" fonctionne

### 2. Tester la Sauvegarde
```bash
# Ouvrir browser console
# Aller sur Settings > API Keys
# Remplir une clé (ex: sk-test-gemini)
# Sélectionner Provider: Gemini
# Sélectionner Model: gemini-2.0-flash
# Cliquer "Enregistrer les clés LLM"
# Vérifier le message de succès
```

### 3. Vérifier la Base de Données
```bash
# Terminal
cd backend
npx prisma studio

# Dans l'interface Prisma Studio:
# 1. Aller à ai_settings
# 2. Chercher l'utilisateur testé
# 3. Vérifier les champs:
#    - geminiApiKey: "sk-test-gemini"
#    - defaultProvider: "gemini"
#    - defaultModel: "gemini-2.0-flash"
```

### 4. Tester les Endpoints Directement
```javascript
// Depuis browser console (après login)
const token = localStorage.getItem('token');

// GET clés actuelles
fetch('http://localhost:3001/api/ai-billing/api-keys/user', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(d));

// PUT nouvelles clés
fetch('http://localhost:3001/api/ai-billing/api-keys/user', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    openaiApiKey: 'sk-123',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o'
  })
}).then(r => r.json()).then(d => console.log(d));
```

---

## Dépannage

### Problème: "Cannot POST /settings/api-keys-enhanced"
**Solution**: Assurez-vous que le fichier est bien dans `frontend/src/pages/settings/` ou `frontend/pages/settings/`

### Problème: "Module not found"
**Solution**: Vérifiez les imports dans le fichier - adjustez les chemins si nécessaire
```typescript
// Si erreur sur imports, ajuster les chemins
import { Card } from '@/shared/components/ui/card';
// OU
import { Card } from '../../../shared/components/ui/card';
```

### Problème: "Clés API sauvegardées..." n'apparaît pas
**Solution**:
1. Vérifier que le token JWT est valide
2. Vérifier les logs du backend (npm run start:dev)
3. Vérifier que NEXT_PUBLIC_API_URL est bien configuré dans .env.local

### Problème: Les modèles ne changent pas selon le provider
**Solution**: Rafraîchir la page (Ctrl+F5) pour recharger le JavaScript

---

## Configuration d'Environnement

Assurez-vous que `frontend/.env.local` contient:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# OU pour production
NEXT_PUBLIC_API_URL=https://votre-api.com/api
```

---

## Rollback

Si quelque chose se passe mal:
```bash
# Restaurer l'ancienne version
cp frontend/src/pages/settings/ai-api-keys.backup.tsx frontend/src/pages/settings/ai-api-keys.tsx
# Relancer le frontend
npm run dev
```

---

## Points de Vérification Final

✅ Frontend se lance sans erreur
✅ Page Settings s'ouvre
✅ Onglet API Keys visible
✅ Sélection provider/modèle fonctionne
✅ Sauvegarde des clés fonctionne
✅ Backend reçoit les données correctement
✅ BD sauvegarde defaultModel et defaultProvider
✅ Messages de succès/erreur s'affichent

---

**Durée estimée d'intégration**: 5-10 minutes
**Complexité**: ⭐⭐ (Simple)
