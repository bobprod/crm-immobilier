# 📖 GUIDE DE COORDINATION INTER-AGENTS

## 🎯 Objectif
Ce système permet à **GitHub Copilot (Claude)** et **Kilocode Agent** de travailler ensemble sur le même projet sans créer de conflits.

---

## 📁 Fichiers de coordination

### 1. `AGENT_LOG.md` (Journal des actions)
- **Usage**: LOG chronologique de TOUTES les modifications
- **Quand**: Avant ET après chaque modification
- **Format**: Template fourni dans le fichier

### 2. `AGENT_CONFIG.json` (État actuel du système)
- **Usage**: État temps réel des services et configuration
- **Quand**: Après changement de config ou redémarrage service
- **Format**: JSON structuré

### 3. `COORDINATION_GUIDE.md` (ce fichier)
- **Usage**: Instructions et règles de coordination
- **Quand**: Référence quand nécessaire

---

## 🔄 WORKFLOW OBLIGATOIRE

### AVANT de modifier quoi que ce soit

```
1. Lire AGENT_LOG.md (dernières 3-5 entrées minimum)
2. Lire AGENT_CONFIG.json (vérifier état services)
3. Vérifier locks.lockedFiles pour fichiers en cours de modification
4. Si fichier critique → Ajouter à locks.lockedFiles
```

### PENDANT la modification

```
1. Travailler sur vos fichiers
2. Tester localement
3. Noter mentalement ce qui a changé
```

### APRÈS la modification

```
1. Mettre à jour AGENT_LOG.md avec nouvelle entrée
2. Mettre à jour AGENT_CONFIG.json (si config/services changés)
3. Retirer vos locks de locks.lockedFiles
4. Commit avec message clair: "[Agent: NomAgent] Description"
```

---

## 🚦 RÈGLES DE PRIORITÉ

### Fichiers CRITIQUES (⚠️ Coordination obligatoire)
- `backend/.env` - Configuration backend
- `frontend/.env.local` - Configuration frontend
- `backend/src/main.ts` - Point d'entrée backend
- `frontend/package.json` - Scripts et dépendances
- `backend/prisma/schema.prisma` - Schéma base de données

**Action requise**: Ajouter à `locks.lockedFiles` avant modification

### Fichiers SEMI-CRITIQUES (⚡ Notification recommandée)
- Fichiers dans `backend/src/modules/` - Modules métier
- Fichiers dans `frontend/src/` - Composants React
- Fichiers de migration Prisma

**Action requise**: Noter dans AGENT_LOG.md

### Fichiers STANDARD (✅ Modification libre)
- Documentation (README, etc.)
- Scripts utilitaires
- Tests
- Fichiers de config secondaires

**Action requise**: Noter dans AGENT_LOG.md si changement important

---

## 🔒 SYSTÈME DE LOCKS

### Comment verrouiller un fichier

Dans `AGENT_CONFIG.json`, section `locks.lockedFiles`:

```json
{
  "locks": {
    "lockedFiles": [
      {
        "file": "backend/src/main.ts",
        "lockedBy": "GitHub Copilot",
        "since": "2025-12-08T17:45:00Z",
        "reason": "Modification CORS configuration"
      }
    ]
  }
}
```

### Comment déverrouiller

Retirer l'entrée du tableau après modification terminée.

---

## 🚨 GESTION DES CONFLITS

### Si vous détectez un conflit potentiel

1. **NE PAS ÉCRASER** le fichier
2. Ajouter une entrée dans `AGENT_LOG.md` section "CONFLITS DÉTECTÉS"
3. Proposer une résolution dans le log
4. Attendre coordination avec l'autre agent (via l'utilisateur)

### Format pour déclarer un conflit

```markdown
## 🚨 CONFLITS DÉTECTÉS

### [2025-12-08 17:45] - Conflit sur backend/.env
**Détecté par**: GitHub Copilot
**Description**: Kilocode a modifié PORT=3002, j'ai besoin de PORT=3001
**Impact**: Backend ne démarre pas sur le bon port
**Proposition**: Standardiser sur PORT=3001 (déjà en prod)
**Statut**: EN ATTENTE de validation
```

---

## 📊 EXEMPLES D'UTILISATION

### Exemple 1: Modification simple (fichier standard)

**GitHub Copilot** veut ajouter une fonction dans `backend/src/utils/helpers.ts`:

```
1. ✅ Lit AGENT_LOG.md → Aucune mention de ce fichier récemment
2. ✅ Modifie le fichier
3. ✅ Ajoute entrée dans AGENT_LOG.md:
   ### [2025-12-08 17:50] - GitHub Copilot
   **Action**: Ajout fonction formatDate() dans helpers.ts
   **Fichiers modifiés**: backend/src/utils/helpers.ts
   **Prochaine étape suggérée**: Tester les appels API qui utilisent les dates
4. ✅ Commit: "[Agent: Copilot] Add formatDate helper function"
```

### Exemple 2: Modification critique (fichier CRITICAL)

**Kilocode** veut modifier `backend/src/main.ts`:

```
1. ✅ Lit AGENT_LOG.md → Pas de mention récente
2. ✅ Lit AGENT_CONFIG.json → locks.lockedFiles est vide
3. ✅ Ajoute lock:
   {
     "file": "backend/src/main.ts",
     "lockedBy": "Kilocode",
     "since": "2025-12-08T18:00:00Z",
     "reason": "Adding rate limiting middleware"
   }
4. ✅ Modifie le fichier
5. ✅ Teste que le backend démarre correctement
6. ✅ Retire le lock
7. ✅ Met à jour AGENT_LOG.md et AGENT_CONFIG.json
8. ✅ Commit: "[Agent: Kilocode] Add rate limiting to main.ts"
```

### Exemple 3: Détection de conflit

**GitHub Copilot** veut modifier `backend/.env` mais voit:

```json
{
  "locks": {
    "lockedFiles": [
      {
        "file": "backend/.env",
        "lockedBy": "Kilocode",
        "since": "2025-12-08T18:10:00Z"
      }
    ]
  }
}
```

**Action**:
```
1. ⚠️ Fichier verrouillé → Attendre
2. ✅ Ajouter note dans AGENT_LOG.md:
   **Note**: Attente libération backend/.env (locked by Kilocode)
3. ✅ Travailler sur autre tâche
4. ✅ Revenir vérifier plus tard
```

---

## 🎓 BONNES PRATIQUES

### ✅ À FAIRE
- Toujours lire les logs avant de commencer
- Mettre à jour les logs immédiatement après modification
- Tester vos changements avant de logger
- Être explicite sur ce qui a changé
- Proposer la prochaine étape logique
- Documenter les problèmes rencontrés

### ❌ À NE PAS FAIRE
- Modifier sans lire les logs
- Oublier de mettre à jour les logs
- Écraser les modifications d'un autre agent
- Verrouiller un fichier et oublier de déverrouiller
- Supprimer les entrées des autres agents
- Modifier plusieurs fichiers critiques en même temps

---

## 🔧 COMMANDES UTILES

### Vérifier état rapide
```bash
# Lire les 20 dernières lignes du log
tail -20 AGENT_LOG.md

# Vérifier la config actuelle
cat AGENT_CONFIG.json | grep -A 5 "services"

# Voir les locks actifs
cat AGENT_CONFIG.json | grep -A 10 "locks"
```

### Vérifier services actifs
```bash
# Vérifier ports ouverts
netstat -aon | findstr "3001 3004 5432"

# Vérifier processus Node
tasklist | findstr node
```

---

## 📞 COMMUNICATION AVEC L'UTILISATEUR

Quand coordonner via l'utilisateur:
- Conflit non résolvable automatiquement
- Besoin de décision sur architecture
- Changement majeur de configuration
- Redémarrage de services requis

Format recommandé:
```
"⚠️ COORDINATION REQUISE ⚠️
J'ai détecté [problème].
Kilocode a fait [X], je propose de faire [Y].
Peux-tu demander à Kilocode de [action] ou me confirmer que je peux procéder ?"
```

---

## 🎯 CHECKLIST DE COORDINATION

Avant chaque session de travail:
- [ ] Lire `AGENT_LOG.md` (dernières entrées)
- [ ] Vérifier `AGENT_CONFIG.json` (état services)
- [ ] Vérifier locks actifs
- [ ] Identifier ma tâche dans `pendingTasks`

Après chaque modification:
- [ ] Mettre à jour `AGENT_LOG.md`
- [ ] Mettre à jour `AGENT_CONFIG.json` si nécessaire
- [ ] Retirer mes locks
- [ ] Tester les changements
- [ ] Commit avec préfixe `[Agent: MonNom]`

---

## 📌 VERSION & MAINTENANCE

**Version**: 1.0
**Créé par**: GitHub Copilot (Claude Sonnet 4.5)
**Date**: 2025-12-08
**Dernière mise à jour**: 2025-12-08

Si ce guide nécessite des améliorations, ajouter une section "SUGGESTIONS" dans `AGENT_LOG.md`.
