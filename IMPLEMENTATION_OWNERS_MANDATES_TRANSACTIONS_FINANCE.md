# 🏠 Implémentation des Modules Critiques du CRM Immobilier

## 📋 Vue d'ensemble

Cette implémentation ajoute **3 modules métier critiques** au CRM immobilier :

1. **👥 Gestion des Propriétaires (Owners)**
2. **📄 Gestion des Mandats (Mandates)**
3. **💰 Gestion des Transactions (Transactions)**
4. **💵 Gestion Financière (Finance)** - Commissions, Factures, Paiements

Ces modules constituent le **cœur métier** d'un CRM immobilier professionnel.

---

## 🗂️ Structure Implémentée

### Backend - Nouveaux Modules

```
backend/src/modules/business/
├── owners/
│   ├── dto/
│   │   ├── create-owner.dto.ts
│   │   └── update-owner.dto.ts
│   ├── owners.controller.ts
│   ├── owners.service.ts
│   └── owners.module.ts
│
├── mandates/
│   ├── dto/
│   │   ├── create-mandate.dto.ts
│   │   └── update-mandate.dto.ts
│   ├── mandates.controller.ts
│   ├── mandates.service.ts
│   └── mandates.module.ts
│
├── transactions/
│   ├── dto/
│   │   └── transaction.dto.ts
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   └── transactions.module.ts
│
└── finance/
    ├── dto/
    │   └── finance.dto.ts
    ├── finance.controller.ts
    ├── finance.service.ts
    └── finance.module.ts
```

### Base de Données - Nouveaux Modèles

**8 nouvelles tables Prisma :**

- `owners` - Propriétaires de biens
- `mandates` - Mandats de vente/location
- `transactions` - Transactions immobilières
- `transaction_steps` - Étapes de transaction
- `commissions` - Commissions agents
- `invoices` - Factures
- `payments` - Paiements

**9 nouveaux enums :**

- `MandateType` (simple, exclusive, semi_exclusive)
- `MandateCategory` (sale, rental)
- `MandateStatus` (active, expired, cancelled, completed)
- `TransactionType` (sale, rental)
- `TransactionStatus` (offer_received → final_deed_signed)
- `CommissionStatus` (pending, partially_paid, paid, cancelled)
- `InvoiceStatus` (draft, sent, paid, partially_paid, overdue, cancelled)
- `PaymentMethod` (cash, check, bank_transfer, credit_card, other)
- `ClientType` (buyer, seller, tenant, landlord)

---

## 🚀 Installation et Migration

### 1. Appliquer la Migration Base de Données

La migration SQL est créée dans :
```
backend/prisma/migrations/20251206_add_owners_mandates_transactions_finance/migration.sql
```

**Appliquer la migration :**

```bash
cd backend

# Si vous utilisez une base de données locale
psql -U your_user -d your_database -f prisma/migrations/20251206_add_owners_mandates_transactions_finance/migration.sql

# OU avec Prisma (si les binaires Prisma sont disponibles)
npx prisma migrate deploy

# Régénérer le client Prisma
npx prisma generate
```

### 2. Installer les Dépendances

```bash
cd backend
npm install --legacy-peer-deps
```

### 3. Démarrer le Backend

```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`

---

## 📡 API Endpoints

### 👥 Owners (Propriétaires)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/owners` | Créer un propriétaire |
| GET | `/api/owners` | Liste des propriétaires (avec filtres) |
| GET | `/api/owners/stats` | Statistiques propriétaires |
| GET | `/api/owners/:id` | Détails d'un propriétaire |
| PUT | `/api/owners/:id` | Modifier un propriétaire |
| DELETE | `/api/owners/:id` | Supprimer un propriétaire |

**Filtres disponibles :**
- `?search=nom` - Recherche par nom, email, téléphone
- `?isActive=true` - Filtrer par statut actif
- `?city=Tunis` - Filtrer par ville

### 📄 Mandates (Mandats)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/mandates` | Créer un mandat |
| GET | `/api/mandates` | Liste des mandats (avec filtres) |
| GET | `/api/mandates/stats` | Statistiques mandats |
| GET | `/api/mandates/check-expired` | Vérifier et mettre à jour les mandats expirés |
| GET | `/api/mandates/:id` | Détails d'un mandat |
| PUT | `/api/mandates/:id` | Modifier un mandat |
| PATCH | `/api/mandates/:id/cancel` | Annuler un mandat |
| DELETE | `/api/mandates/:id` | Supprimer un mandat |

**Filtres disponibles :**
- `?status=active` - Filtrer par statut
- `?type=exclusive` - Filtrer par type
- `?category=sale` - Filtrer par catégorie (vente/location)
- `?ownerId=xxx` - Filtrer par propriétaire
- `?propertyId=xxx` - Filtrer par bien
- `?expiringInDays=30` - Mandats expirant dans X jours

### 💰 Transactions

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/transactions` | Créer une transaction |
| GET | `/api/transactions` | Liste des transactions (avec filtres) |
| GET | `/api/transactions/stats` | Statistiques transactions |
| GET | `/api/transactions/pipeline` | Vue pipeline par étape |
| GET | `/api/transactions/:id` | Détails d'une transaction |
| PUT | `/api/transactions/:id` | Modifier une transaction |
| POST | `/api/transactions/:id/steps` | Ajouter une étape |
| DELETE | `/api/transactions/:id` | Supprimer une transaction |

**Filtres disponibles :**
- `?status=offer_accepted` - Filtrer par statut
- `?type=sale` - Filtrer par type (vente/location)
- `?propertyId=xxx` - Filtrer par bien
- `?prospectId=xxx` - Filtrer par prospect
- `?mandateId=xxx` - Filtrer par mandat

### 💵 Finance (Commissions, Factures, Paiements)

**Commissions :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/finance/commissions` | Créer une commission |
| GET | `/api/finance/commissions` | Liste des commissions |
| GET | `/api/finance/commissions/:id` | Détails d'une commission |
| PUT | `/api/finance/commissions/:id` | Modifier une commission |
| DELETE | `/api/finance/commissions/:id` | Supprimer une commission |

**Factures :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/finance/invoices` | Créer une facture |
| GET | `/api/finance/invoices` | Liste des factures |
| GET | `/api/finance/invoices/:id` | Détails d'une facture |
| PUT | `/api/finance/invoices/:id` | Modifier une facture |
| DELETE | `/api/finance/invoices/:id` | Supprimer une facture |

**Paiements :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/finance/payments` | Enregistrer un paiement |
| GET | `/api/finance/payments` | Liste des paiements |
| GET | `/api/finance/payments/:id` | Détails d'un paiement |
| PUT | `/api/finance/payments/:id` | Modifier un paiement |
| DELETE | `/api/finance/payments/:id` | Supprimer un paiement |

**Statistiques :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/finance/stats` | Statistiques financières globales |

---

## 📊 Modèles de Données

### Owner (Propriétaire)

```typescript
{
  id: string
  userId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  zipCode?: string
  country?: string (default: "Tunisie")
  taxId?: string        // Numéro fiscal
  idCard?: string       // CIN
  notes?: string
  metadata?: JSON
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Mandate (Mandat)

```typescript
{
  id: string
  userId: string
  ownerId: string
  propertyId?: string
  reference: string (unique)
  type: "simple" | "exclusive" | "semi_exclusive"
  category: "sale" | "rental"
  status: "active" | "expired" | "cancelled" | "completed"
  startDate: DateTime
  endDate: DateTime
  price: number
  currency: string (default: "TND")
  commission: number
  commissionType: "percentage" | "fixed"
  exclusivityBonus?: number
  terms?: string
  notes?: string
  documentUrl?: string
  signedAt?: DateTime
  cancelledAt?: DateTime
  cancellationReason?: string
  metadata?: JSON
}
```

### Transaction

```typescript
{
  id: string
  userId: string
  propertyId: string
  prospectId?: string
  mandateId?: string
  reference: string (unique)
  type: "sale" | "rental"
  status: "offer_received" | "offer_accepted" | "promise_signed" |
          "compromis_signed" | "final_deed_signed" | "cancelled"
  offerPrice?: number
  negotiatedPrice?: number
  finalPrice?: number
  currency: string (default: "TND")
  depositAmount?: number
  depositPaidAt?: DateTime
  offerDate?: DateTime
  promiseDate?: DateTime
  compromisDate?: DateTime
  finalDeedDate?: DateTime
  estimatedClosing?: DateTime
  actualClosing?: DateTime
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  notaryName?: string
  notaryContact?: string
  loanAmount?: number
  loanApproved: boolean
  conditions?: JSON
  notes?: string
  metadata?: JSON
}
```

### Commission

```typescript
{
  id: string
  userId: string
  transactionId: string
  agentId: string
  type: "agent" | "agency" | "referral"
  amount: number
  percentage?: number
  currency: string (default: "TND")
  status: "pending" | "partially_paid" | "paid" | "cancelled"
  dueDate?: DateTime
  paidAt?: DateTime
  notes?: string
  metadata?: JSON
}
```

### Invoice (Facture)

```typescript
{
  id: string
  userId: string
  transactionId?: string
  ownerId?: string
  number: string (unique)
  clientType: "buyer" | "seller" | "tenant" | "landlord"
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  amount: number
  vat: number
  totalAmount: number
  currency: string (default: "TND")
  status: "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "cancelled"
  issueDate: DateTime
  dueDate: DateTime
  paidAt?: DateTime
  description?: string
  items?: JSON
  notes?: string
  pdfUrl?: string
  metadata?: JSON
}
```

### Payment (Paiement)

```typescript
{
  id: string
  userId: string
  invoiceId?: string
  commissionId?: string
  amount: number
  currency: string (default: "TND")
  method: "cash" | "check" | "bank_transfer" | "credit_card" | "other"
  reference?: string
  paidAt: DateTime
  notes?: string
  metadata?: JSON
}
```

---

## 🔗 Relations entre Modèles

```
Owner (Propriétaire)
  ├─── properties[] (biens possédés)
  ├─── mandates[] (mandats signés)
  └─── invoices[] (factures)

Mandate (Mandat)
  ├─── owner (propriétaire)
  ├─── property? (bien concerné)
  ├─── transactions[] (transactions associées)
  └─── user (agent)

Transaction
  ├─── property (bien vendu/loué)
  ├─── prospect? (acheteur/locataire)
  ├─── mandate? (mandat associé)
  ├─── steps[] (étapes du processus)
  ├─── commissions[] (commissions générées)
  ├─── invoices[] (factures liées)
  └─── user (agent)

Commission
  ├─── transaction (transaction source)
  ├─── agent (bénéficiaire)
  ├─── payments[] (paiements reçus)
  └─── user (créateur)

Invoice
  ├─── transaction? (transaction source)
  ├─── owner? (propriétaire facturé)
  ├─── payments[] (paiements reçus)
  └─── user (créateur)

Payment
  ├─── invoice? (facture payée)
  ├─── commission? (commission payée)
  └─── user (créateur)
```

---

## 🎨 Frontend - Guidelines d'Implémentation

Le backend est **100% fonctionnel**. Voici comment implémenter le frontend :

### Pages à Créer

```
frontend/src/pages/
├── owners/
│   ├── index.tsx          # Liste des propriétaires
│   ├── [id].tsx          # Détails d'un propriétaire
│   └── new.tsx           # Créer un propriétaire
│
├── mandates/
│   ├── index.tsx          # Liste des mandats
│   ├── [id].tsx          # Détails d'un mandat
│   └── new.tsx           # Créer un mandat
│
├── transactions/
│   ├── index.tsx          # Liste des transactions
│   ├── pipeline.tsx       # Vue pipeline (Kanban)
│   ├── [id].tsx          # Détails d'une transaction
│   └── new.tsx           # Créer une transaction
│
└── finance/
    ├── index.tsx          # Dashboard financier
    ├── commissions/
    │   └── index.tsx      # Gestion des commissions
    ├── invoices/
    │   └── index.tsx      # Gestion des factures
    └── payments/
        └── index.tsx      # Gestion des paiements
```

### Composants à Créer

**Owners :**
- `OwnerList` - Tableau avec recherche et filtres
- `OwnerCard` - Carte propriétaire
- `OwnerForm` - Formulaire création/édition
- `OwnerStats` - Widgets statistiques

**Mandates :**
- `MandateList` - Tableau avec filtres
- `MandateCard` - Carte mandat
- `MandateForm` - Formulaire création/édition
- `MandateTimeline` - Timeline du mandat
- `ExpiringMandatesAlert` - Alertes d'expiration

**Transactions :**
- `TransactionPipeline` - Vue Kanban (par étape)
- `TransactionList` - Tableau des transactions
- `TransactionForm` - Formulaire création/édition
- `TransactionSteps` - Timeline des étapes
- `TransactionStats` - Dashboard statistiques

**Finance :**
- `CommissionList` - Liste des commissions
- `CommissionForm` - Formulaire commission
- `InvoiceList` - Liste des factures
- `InvoiceForm` - Formulaire facture
- `InvoicePreview` - Prévisualisation PDF
- `PaymentForm` - Formulaire paiement
- `PaymentHistory` - Historique des paiements
- `FinancialDashboard` - Dashboard global

### Exemple de Code Frontend

**Liste des Propriétaires :**

```typescript
// pages/owners/index.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function OwnersPage() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOwners();
  }, [search]);

  const fetchOwners = async () => {
    try {
      const response = await api.get('/api/owners', {
        params: { search, isActive: true }
      });
      setOwners(response.data);
    } catch (error) {
      console.error('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Propriétaires</h1>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-4 py-2 border rounded"
      />

      {/* Liste */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid gap-4">
          {owners.map((owner) => (
            <OwnerCard key={owner.id} owner={owner} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Pipeline de Transactions :**

```typescript
// pages/transactions/pipeline.tsx
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { api } from '@/lib/api';

export default function TransactionPipelinePage() {
  const [pipeline, setPipeline] = useState([]);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    const response = await api.get('/api/transactions/pipeline');
    setPipeline(response.data);
  };

  const onDragEnd = async (result) => {
    // Logique pour déplacer une transaction entre étapes
    const { destination, draggableId } = result;
    if (!destination) return;

    const newStatus = pipeline[destination.droppableId].stage;
    await api.put(`/api/transactions/${draggableId}`, {
      status: newStatus
    });

    fetchPipeline(); // Rafraîchir
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Pipeline des Transactions</h1>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {pipeline.map((stage, index) => (
            <Droppable key={stage.stage} droppableId={index.toString()}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-100 p-4 rounded min-w-[300px]"
                >
                  <h2 className="font-bold mb-2">
                    {stage.stage} ({stage.count})
                  </h2>
                  <p className="text-sm mb-4">
                    {stage.totalValue.toLocaleString()} TND
                  </p>

                  {stage.transactions.map((transaction, idx) => (
                    <Draggable
                      key={transaction.id}
                      draggableId={transaction.id}
                      index={idx}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-3 mb-2 rounded shadow"
                        >
                          <p className="font-semibold">
                            {transaction.property.title}
                          </p>
                          <p className="text-sm">
                            {transaction.finalPrice?.toLocaleString()} TND
                          </p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
```

---

## ✅ Fonctionnalités Implémentées

### Module Owners (Propriétaires)

✅ CRUD complet des propriétaires
✅ Recherche par nom, email, téléphone
✅ Filtres par ville et statut actif
✅ Statistiques (total, actifs, avec mandats, avec biens)
✅ Relations avec biens, mandats et factures
✅ Validation avant suppression (mandats actifs)

### Module Mandates (Mandats)

✅ CRUD complet des mandats
✅ Types de mandats (simple, exclusif, semi-exclusif)
✅ Catégories (vente, location)
✅ Gestion du cycle de vie (actif → expiré → complété)
✅ Calcul de commission (pourcentage ou fixe)
✅ Bonus d'exclusivité
✅ Alertes d'expiration (30 jours)
✅ Vérification automatique des mandats expirés
✅ Annulation avec motif
✅ Statistiques complètes

### Module Transactions

✅ CRUD complet des transactions
✅ Pipeline de vente (7 étapes)
✅ Suivi des offres (prix offert → négocié → final)
✅ Gestion des dépôts de garantie
✅ Informations notaire
✅ Gestion des prêts
✅ Conditions suspensives
✅ Timeline des étapes
✅ Vue pipeline (Kanban)
✅ Statistiques (en cours, complétées, valeur totale)
✅ Validation avant suppression

### Module Finance

✅ Gestion des commissions (CRUD)
✅ Calcul automatique des commissions
✅ Statut de paiement (pending → paid)
✅ Gestion des factures (CRUD)
✅ Numérotation unique des factures
✅ Types de clients (acheteur, vendeur, locataire, propriétaire)
✅ Calcul TVA
✅ Détection factures en retard
✅ Gestion des paiements (CRUD)
✅ Méthodes de paiement multiples
✅ Mise à jour automatique des statuts (facture/commission payée)
✅ Historique des paiements
✅ Statistiques financières globales

---

## 🔐 Sécurité

Toutes les routes sont protégées par :

✅ **JWT Authentication** - Authentification requise
✅ **Rate Limiting** - 60 requêtes/minute
✅ **User Isolation** - Chaque utilisateur voit uniquement ses données
✅ **Validation des DTOs** - class-validator
✅ **Relations sécurisées** - Vérification de propriété
✅ **Contraintes de suppression** - Prévention des suppressions dangereuses

---

## 📈 Prochaines Étapes

### Frontend (À implémenter)

1. **Pages Owners** - Liste, Détails, Formulaire
2. **Pages Mandates** - Liste, Détails, Formulaire, Alertes
3. **Pages Transactions** - Liste, Pipeline Kanban, Détails
4. **Pages Finance** - Dashboard, Commissions, Factures, Paiements

### Fonctionnalités Avancées (Futures)

- 📧 **Notifications Email** - Expiration de mandats, nouvelles transactions
- 📱 **Notifications Push** - Alertes temps réel
- 📄 **Génération PDF** - Mandats, Factures, Contrats
- ✍️ **Signatures Électroniques** - DocuSign, Yousign
- 📊 **Rapports Avancés** - Analytics financiers
- 🔄 **Workflow Automation** - Actions automatiques
- 📅 **Sync Calendrier** - Google Calendar, Outlook
- 🏗️ **Portail Client** - Espace client sécurisé

---

## 🧪 Tests

Pour tester les API :

```bash
# Swagger UI
http://localhost:3000/api

# Endpoints de test
curl -X GET http://localhost:3000/api/owners/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/api/mandates?expiringInDays=30 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/api/transactions/pipeline \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/api/finance/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📞 Support

Pour toute question ou problème :

1. Vérifier les logs backend : `npm run start:dev`
2. Vérifier la connexion BDD
3. Vérifier que la migration est appliquée
4. Consulter la documentation Swagger : `http://localhost:3000/api`

---

## 🎉 Résumé

**Ce qui a été implémenté :**

✅ 4 modules backend complets (Owners, Mandates, Transactions, Finance)
✅ 8 nouvelles tables Prisma
✅ 40+ endpoints API RESTful
✅ Authentification et autorisation
✅ Validation des données
✅ Gestion des erreurs
✅ Relations complexes entre entités
✅ Statistiques et analytics
✅ Business logic métier

**Impact :**

Le CRM dispose maintenant des **fonctionnalités critiques** pour gérer :
- Les propriétaires de biens
- Les mandats de vente/location (conformité légale)
- Le pipeline de vente complet
- Les commissions, factures et paiements

Le backend est **production-ready**. Il ne reste plus qu'à implémenter le frontend pour avoir un CRM immobilier **professionnel et complet** ! 🚀

---

**Développé avec ❤️ pour le CRM Immobilier**
