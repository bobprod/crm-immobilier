# 🔧 Correction de l'Erreur 400 - UpdateLead

## 🐛 Problème

```
Request failed with status code 400
at updateLead
```

**Cause:** Le backend rejetait les nouvelles propriétés (`validated`, `qualified`, `spam`, `company`) car elles n'étaient pas définies dans le schéma Prisma et le DTO.

---

## ✅ Solution Appliquée

### 1. **Mise à jour du DTO Backend** ✔️

**Fichier:** `backend/src/modules/prospecting/dto/index.ts`

Ajout des propriétés au `UpdateLeadDto`:
```typescript
@ApiPropertyOptional({ description: 'Lead validé' })
@IsOptional()
@IsBoolean()
validated?: boolean;

@ApiPropertyOptional({ description: 'Lead qualifié' })
@IsOptional()
@IsBoolean()
qualified?: boolean;

@ApiPropertyOptional({ description: 'Lead marqué comme spam' })
@IsOptional()
@IsBoolean()
spam?: boolean;

@ApiPropertyOptional({ description: 'Nom de l\'entreprise' })
@IsOptional()
@IsString()
company?: string;
```

### 2. **Mise à jour du Schéma Prisma** ✔️

**Fichier:** `backend/prisma/schema.prisma`

Ajout des champs au modèle `prospecting_leads`:
```prisma
model prospecting_leads {
  // ... champs existants ...

  validated    Boolean?  @default(false)
  qualified    Boolean?  @default(false)
  spam         Boolean?  @default(false)
  company      String?

  // ... autres champs ...
}
```

---

## 🚀 Étapes pour Appliquer la Correction

### **Option 1: Script Automatique (Recommandé)**

```bash
# Depuis la racine du projet
chmod +x update-prisma-schema.sh
./update-prisma-schema.sh
```

### **Option 2: Commandes Manuelles**

```bash
cd backend

# 1. Générer la migration
npx prisma migrate dev --name add_lead_qualification_fields

# 2. Régénérer le client Prisma
npx prisma generate

# 3. Redémarrer le backend
npm run dev
```

---

## 🔍 Vérification

### **1. Vérifier la Migration**

```bash
cd backend
npx prisma migrate status
```

Vous devriez voir:
```
✅ Migration "add_lead_qualification_fields" applied
```

### **2. Tester l'API**

Depuis le frontend, essayez à nouveau d'utiliser les boutons de qualification:
- ✅ Vérifier Emails
- ✅ Vérifier Téléphones
- ✅ Détecter Spams
- ✅ Supprimer Doublons

L'erreur 400 ne devrait plus apparaître.

---

## 📝 Détails Techniques

### **Champs Ajoutés**

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `validated` | Boolean | false | Indique si le lead a été validé |
| `qualified` | Boolean | false | Indique si le lead a été qualifié comme bon |
| `spam` | Boolean | false | Indique si le lead est marqué comme spam |
| `company` | String | null | Nom de l'entreprise du lead |

### **Migration SQL Générée**

```sql
-- AlterTable prospecting_leads
ALTER TABLE "prospecting_leads"
ADD COLUMN "validated" BOOLEAN DEFAULT false,
ADD COLUMN "qualified" BOOLEAN DEFAULT false,
ADD COLUMN "spam" BOOLEAN DEFAULT false,
ADD COLUMN "company" TEXT;
```

### **Impact sur les Données Existantes**

- Les leads existants auront automatiquement:
  - `validated = false`
  - `qualified = false`
  - `spam = false`
  - `company = null`
- Aucune perte de données
- Migration réversible si nécessaire

---

## 🔄 En Cas de Problème

### **Problème: Migration échoue**

```bash
# Forcer la synchronisation du schéma (développement uniquement)
cd backend
npx prisma db push --accept-data-loss
npx prisma generate
```

⚠️ **Attention:** `db push` peut causer une perte de données. Utilisez uniquement en développement.

### **Problème: Client Prisma obsolète**

```bash
cd backend
rm -rf node_modules/.prisma
npx prisma generate
```

### **Problème: Backend ne démarre pas**

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

---

## 📊 État des Corrections

- [x] DTO UpdateLeadDto mis à jour
- [x] Schéma Prisma mis à jour
- [x] Script de migration créé
- [x] Documentation créée
- [ ] Migration appliquée (à faire)
- [ ] Backend redémarré (à faire)

---

## 🎯 Prochaines Étapes

1. **Appliquer la migration** (voir commandes ci-dessus)
2. **Redémarrer le backend**
3. **Tester le frontend** - L'erreur 400 devrait être résolue
4. **Utiliser les nouvelles fonctionnalités** de qualification

---

## 💡 Conseils

- Toujours appliquer les migrations Prisma après avoir modifié le schéma
- En production, utilisez `npx prisma migrate deploy` au lieu de `migrate dev`
- Gardez une sauvegarde de la base de données avant les migrations importantes
- Testez toujours en développement avant de déployer en production

---

**Status:** ✅ Corrections appliquées, migration à exécuter

**Date:** 20 Janvier 2026
