# Module Documents - Documentation Complète

## 📋 Vue d'ensemble

Le module Documents a été considérablement amélioré pour gérer spécifiquement les documents immobiliers et s'intégrer de manière transparente avec le module Intelligence pour une génération automatique et contextuelle de documents.

## 🎯 Fonctionnalités Principales

### 1. Gestion des Documents Immobiliers

Le module supporte maintenant 25+ types de documents spécifiques à l'immobilier:

#### Contrats de Vente
- `sales_contract` - Contrat de vente
- `preliminary_sales_agreement` - Promesse de vente
- `sales_mandate` - Mandat de vente

#### Contrats de Commission
- `commission_agreement` - Accord de commission
- `commission_statement` - Relevé de commission

#### Contrats de Promotion
- `promotion_contract` - Contrat de promotion
- `developer_contract` - Contrat de promoteur
- `construction_contract` - Contrat de construction

#### Contrats de Gestion
- `property_management_contract` - Contrat de gestion immobilière
- `rental_management_contract` - Contrat de gestion locative
- `syndic_contract` - Contrat de syndic

#### Documents Administratifs
- `property_deed` - Titre de propriété
- `title_deed` - Acte de propriété
- `cadastral_document` - Document cadastral
- `urban_planning_certificate` - Certificat d'urbanisme

#### Documents Financiers
- `investment_analysis` - Analyse d'investissement
- `financial_projection` - Projection financière
- `appraisal_report` - Rapport d'évaluation

#### Autres
- `lease_agreement` - Contrat de bail
- `insurance_policy` - Police d'assurance
- `inspection_report` - Rapport d'inspection

### 2. Synchronisation avec le Module Intelligence

#### Liaison Bidirectionnelle
- Lier des documents existants à des projets d'investissement
- Association automatique lors de la génération
- Historique complet des liaisons avec métadonnées

#### Génération Automatique
- Génération contextuelle basée sur l'analyse d'investissement
- Intégration avec l'AI Orchestrator
- Variables dynamiques pré-remplies depuis les données du projet

#### Suggestions Intelligentes
- Recommandations de documents selon le statut du projet
- Détection automatique des documents manquants
- Priorisation intelligente des documents à créer

## 🔌 API Endpoints

### Documents Standards

#### Upload d'un document
```http
POST /documents/upload
Content-Type: multipart/form-data

{
  "file": <file>,
  "name": "Mon document",
  "description": "Description",
  "categoryId": "cat_xxx",
  "realEstateDocType": "sales_contract",
  "agencyId": "agency_xxx"
}
```

#### Liste des documents
```http
GET /documents
Query params:
  - categoryId: string
  - realEstateDocType: string
  - status: string
  - search: string
  - limit: number
  - skip: number
```

#### Récupérer un document
```http
GET /documents/:id
```

#### Télécharger un document
```http
GET /documents/:id/download
```

#### Mettre à jour un document
```http
PUT /documents/:id
Body: {
  "name": string,
  "description": string,
  "status": string,
  "categoryId": string
}
```

#### Supprimer un document
```http
DELETE /documents/:id
```

### Intelligence Sync - Nouveaux Endpoints

#### Lier un document à un projet d'investissement
```http
POST /documents/:id/link-investment
Body: {
  "investmentProjectId": "proj_xxx",
  "linkType": "contract" | "analysis_report" | "commission" | "supporting_doc",
  "linkReason": "Contrat principal du projet",
  "metadata": {
    "custom_field": "value"
  }
}

Response: {
  "id": "link_xxx",
  "documentId": "doc_xxx",
  "investmentProjectId": "proj_xxx",
  "linkType": "contract",
  "linkReason": "Contrat principal du projet",
  "metadata": {},
  "document": { ... },
  "investmentProject": { ... },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Délier un document d'un projet
```http
DELETE /documents/:documentId/unlink-investment/:projectId

Response: {
  "success": true
}
```

#### Récupérer les projets liés à un document
```http
GET /documents/:id/investment-projects

Response: [
  {
    "id": "proj_xxx",
    "title": "Projet Paris 15",
    "linkType": "contract",
    "linkedAt": "2024-01-01T00:00:00Z",
    "latestAnalysis": { ... }
  }
]
```

#### Générer un document depuis un projet d'investissement
```http
POST /documents/generate-from-investment
Body: {
  "investmentProjectId": "proj_xxx",
  "documentType": "investment_analysis",
  "templateId": "template_xxx", // optionnel
  "variables": {
    "custom_var": "value"
  },
  "autoLink": true // lier automatiquement au projet
}

Response: {
  "document": {
    "id": "doc_xxx",
    "name": "investment_analysis_Projet_Paris_15_2024-01-01",
    "aiGenerated": true,
    "intelligenceSyncedAt": "2024-01-01T00:00:00Z",
    ...
  },
  "content": "Contenu généré...",
  "orchestrationResult": {
    "id": "orch_xxx",
    "status": "completed",
    ...
  }
}
```

#### Récupérer tous les documents d'un projet
```http
GET /documents/investment/:projectId/documents

Response: [
  {
    "id": "doc_xxx",
    "name": "Contrat de vente",
    "realEstateDocType": "sales_contract",
    "linkType": "contract",
    "linkedAt": "2024-01-01T00:00:00Z",
    ...
  }
]
```

#### Obtenir des suggestions de documents pour un projet
```http
GET /documents/investment/:projectId/suggestions

Response: {
  "projectId": "proj_xxx",
  "projectStatus": "active",
  "suggestedDocuments": [
    {
      "type": "sales_contract",
      "priority": 1,
      "reason": "Contrat de vente à préparer",
      "canGenerate": true,
      "estimatedTime": "2-5 minutes"
    },
    {
      "type": "commission_agreement",
      "priority": 2,
      "reason": "Accord de commission recommandé",
      "canGenerate": true,
      "estimatedTime": "2-5 minutes"
    }
  ],
  "existingDocuments": 3
}
```

### Templates

#### Créer un template
```http
POST /documents/templates
Body: {
  "name": "Mon Template",
  "description": "Description",
  "content": "{{variable1}} {{variable2}}",
  "variables": {
    "variable1": { "type": "string", "required": true },
    "variable2": { "type": "number", "required": false }
  },
  "category": "contracts",
  "realEstateDocType": "sales_contract",
  "requiresSignature": true,
  "defaultValidity": 90
}
```

#### Liste des templates
```http
GET /documents/templates
Query params:
  - category: string
  - realEstateDocType: string
  - isActive: boolean
```

#### Générer un document depuis un template
```http
POST /documents/templates/:id/generate
Body: {
  "variables": {
    "variable1": "valeur1",
    "variable2": 123
  }
}
```

## 💡 Cas d'Usage

### Cas 1: Génération automatique d'un rapport d'analyse

```javascript
// 1. Créer ou récupérer un projet d'investissement
const project = await createInvestmentProject({
  title: "Appartement Paris 15",
  city: "Paris",
  totalPrice: 350000,
  targetYield: 4.5
});

// 2. Générer automatiquement le rapport d'analyse
const result = await fetch('/documents/generate-from-investment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    investmentProjectId: project.id,
    documentType: 'investment_analysis',
    autoLink: true
  })
});

// 3. Le document est créé et lié au projet automatiquement
const { document, content } = await result.json();
console.log('Document généré:', document.id);
```

### Cas 2: Workflow complet de vente

```javascript
// 1. Obtenir les suggestions de documents
const suggestions = await fetch(`/documents/investment/${projectId}/suggestions`);
const { suggestedDocuments } = await suggestions.json();

// 2. Générer les documents nécessaires
for (const suggestion of suggestedDocuments) {
  if (suggestion.priority <= 2) { // Documents prioritaires
    await generateDocument(projectId, suggestion.type);
  }
}

// 3. Vérifier tous les documents du projet
const documents = await fetch(`/documents/investment/${projectId}/documents`);
console.log('Documents du projet:', await documents.json());
```

### Cas 3: Liaison manuelle d'un document existant

```javascript
// Lier un document déjà existant à un projet
await fetch(`/documents/${documentId}/link-investment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    investmentProjectId: projectId,
    linkType: 'supporting_doc',
    linkReason: 'Document justificatif complémentaire',
    metadata: {
      category: 'legal',
      importance: 'medium'
    }
  })
});
```

## 🗄️ Modèle de Données

### Table `documents`

```prisma
model documents {
  id                    String
  userId                String
  categoryId            String?
  name                  String
  description           String?
  // ... champs standards ...
  
  // Nouveaux champs immobiliers
  realEstateDocType     RealEstateDocumentType?
  agencyId              String?
  contractNumber        String?
  contractDate          DateTime?
  expirationDate        DateTime?
  contractValue         Float?
  commissionRate        Float?
  status                DocumentStatus // draft, pending_review, signed, etc.
  
  // Intelligence sync
  investmentProjectId   String?
  intelligenceSyncedAt  DateTime?
  intelligenceMetadata  Json?
  
  // Relations
  agency                agencies?
  investmentProject     InvestmentProject?
  document_investment_links document_investment_link[]
}
```

### Table `document_investment_link`

```prisma
model document_investment_link {
  id                  String
  documentId          String
  investmentProjectId String
  linkType            String // 'contract', 'analysis_report', etc.
  linkReason          String?
  metadata            Json?
  
  document            documents
  investmentProject   InvestmentProject
}
```

### Enum `DocumentStatus`

```
draft             - Brouillon
pending_review    - En attente de révision
reviewed          - Révisé
pending_signature - En attente de signature
signed            - Signé
active            - Actif
expired           - Expiré
cancelled         - Annulé
archived          - Archivé
```

## 🔧 Configuration

### Variables d'Environnement

```env
# AI Orchestrator (requis pour la génération automatique)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_AI_API_KEY=xxx

# Upload de fichiers
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_DIR=./uploads/documents
```

### Seed des Templates

Pour créer les templates par défaut:

```bash
cd backend
npx ts-node scripts/seed-document-templates.ts
```

## 🧪 Tests

### Test de génération depuis un projet

```bash
# Créer un projet de test
curl -X POST http://localhost:3000/api/investment-intelligence/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Project",
    "city": "Paris",
    "totalPrice": 300000,
    "targetYield": 4.5
  }'

# Générer un document
curl -X POST http://localhost:3000/api/documents/generate-from-investment \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "investmentProjectId": "proj_xxx",
    "documentType": "investment_analysis"
  }'
```

## 📚 Bonnes Pratiques

1. **Toujours lier les documents importants aux projets** pour maintenir la traçabilité
2. **Utiliser les suggestions intelligentes** pour identifier les documents manquants
3. **Valider les documents** avant signature avec le workflow de statuts
4. **Archiver les anciennes versions** au lieu de les supprimer
5. **Enrichir les métadonnées** pour faciliter la recherche et l'organisation

## 🔐 Sécurité

- Tous les endpoints nécessitent une authentification JWT
- Les documents sont isolés par `userId`
- Les projets d'investissement sont isolés par `tenantId`
- Validation stricte des types de documents
- Sanitisation des variables de template

## 🚀 Roadmap

- [ ] Signature électronique intégrée
- [ ] Conversion automatique PDF → Word
- [ ] OCR amélioré pour extraction de données
- [ ] Templates visuels avec éditeur WYSIWYG
- [ ] Workflow d'approbation multi-niveaux
- [ ] Versioning avancé des documents
- [ ] Intégration avec services de stockage cloud (S3, Azure Blob)
