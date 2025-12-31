# 🗺️ Feuille de Route - Implémentation WhatsApp Module

## Vue d'Ensemble

**Status Actuel** :
- ✅ Frontend complet (~11,800 lignes)
- ⚠️ Backend partiel (Config, Conversations, Messages)
- ❌ Backend manquant (Templates, Contacts, Campaigns, Analytics)
- ⚠️ Base de données partielle

## Phase 1 : Backend Templates (Priorité 🔴 CRITIQUE)

### Objectif
Implémenter le backend pour la gestion des templates WhatsApp

### Livrables

#### 1.1 Contrôleur Templates
```typescript
// backend/src/modules/communication/whatsapp/templates/templates.controller.ts
@Controller('whatsapp/templates')
export class TemplatesController {
  @Post()           createTemplate()
  @Get()            getTemplates()
  @Get(':id')       getTemplate()
  @Put(':id')       updateTemplate()
  @Delete(':id')    deleteTemplate()
  @Post(':id/duplicate') duplicateTemplate()
}
```

#### 1.2 Service Templates
```typescript
// backend/src/modules/communication/whatsapp/templates/templates.service.ts
export class TemplatesService {
  async createTemplate(userId, dto)
  async getTemplates(userId, filters)  // filters: status, category, language
  async getTemplate(userId, id)
  async updateTemplate(userId, id, dto)
  async deleteTemplate(userId, id)
  async duplicateTemplate(userId, id)
  async getTemplateStats(userId, id)
}
```

#### 1.3 DTOs
```typescript
// backend/src/modules/communication/whatsapp/templates/dto/
- create-template.dto.ts
- update-template.dto.ts
- template-response.dto.ts
- template-filters.dto.ts
```

#### 1.4 Tests
```typescript
// backend/src/modules/communication/whatsapp/templates/
- templates.controller.spec.ts
- templates.service.spec.ts
```

**Estimation** : 2-3 jours
**Fichiers** : ~800 lignes

---

## Phase 2 : Backend + DB Contacts (Priorité 🔴 CRITIQUE)

### Objectif
Créer le système complet de gestion des contacts WhatsApp

### Livrables

#### 2.1 Migration Prisma
```prisma
// backend/prisma/schema.prisma
model WhatsAppContact {
  id                String   @id @default(cuid())
  configId          String
  phoneNumber       String
  name              String?
  email             String?
  profilePicture    String?
  tags              String[]
  groups            String[]
  notes             String?  @db.Text
  customFields      Json?
  isBlocked         Boolean  @default(false)
  // Stats
  totalMessages     Int      @default(0)
  sentMessages      Int      @default(0)
  receivedMessages  Int      @default(0)
  totalConversations Int     @default(0)
  activeConversations Int    @default(0)
  avgResponseTime   Float?
  lastInteraction   DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([configId, phoneNumber])
  @@index([phoneNumber])
  @@index([configId])
}
```

Commandes :
```bash
npx prisma migrate dev --name add-whatsapp-contacts
npx prisma generate
```

#### 2.2 Contrôleur Contacts
```typescript
// backend/src/modules/communication/whatsapp/contacts/contacts.controller.ts
@Controller('whatsapp/contacts')
export class ContactsController {
  @Post()           createContact()
  @Get()            getContacts()      // filters: tags, groups, search, isBlocked
  @Get(':id')       getContact()
  @Put(':id')       updateContact()
  @Delete(':id')    deleteContact()
  @Put(':id/block') toggleBlock()
  @Post('import')   importCSV()
  @Get('export')    exportCSV()
}
```

#### 2.3 Service Contacts
```typescript
export class ContactsService {
  async createContact(configId, dto)
  async getContacts(configId, filters)
  async getContact(configId, id)
  async updateContact(configId, id, dto)
  async deleteContact(configId, id)
  async toggleBlock(configId, id, isBlocked)
  async importFromCSV(configId, file)
  async exportToCSV(configId)
  async updateContactStats(contactId)  // appelé automatiquement
}
```

#### 2.4 Import/Export CSV
```typescript
// backend/src/modules/communication/whatsapp/contacts/csv/
- csv-parser.service.ts
- csv-exporter.service.ts
```

Format CSV :
```csv
phoneNumber,name,email,tags,notes
+33612345678,Jean Dupont,jean@example.com,"client,vip",Notes importantes
```

**Estimation** : 3-4 jours
**Fichiers** : ~1200 lignes

---

## Phase 3 : Backend + DB Campaigns (Priorité 🟡 MOYENNE)

### Objectif
Système de broadcasting et campagnes WhatsApp

### Livrables

#### 3.1 Migrations Prisma
```prisma
model WhatsAppCampaign {
  id                String   @id @default(cuid())
  configId          String
  name              String
  description       String?  @db.Text
  type              CampaignType
  status            CampaignStatus
  templateId        String
  recipients        WhatsAppCampaignRecipient[]
  scheduledAt       DateTime?
  startedAt         DateTime?
  completedAt       DateTime?
  // Stats
  totalRecipients   Int      @default(0)
  sent              Int      @default(0)
  delivered         Int      @default(0)
  read              Int      @default(0)
  failed            Int      @default(0)
  pending           Int      @default(0)
  createdBy         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model WhatsAppCampaignRecipient {
  id                String   @id @default(cuid())
  campaignId        String
  contactId         String?
  phoneNumber       String
  name              String?
  variables         Json?
  status            RecipientStatus
  messageId         String?
  errorMessage      String?
  sentAt            DateTime?
  deliveredAt       DateTime?
  readAt            DateTime?
}
```

#### 3.2 Contrôleur Campaigns
```typescript
@Controller('whatsapp/campaigns')
export class CampaignsController {
  @Post()                  createCampaign()
  @Get()                   getCampaigns()
  @Get(':id')              getCampaign()
  @Put(':id')              updateCampaign()
  @Delete(':id')           deleteCampaign()
  @Post(':id/launch')      launchCampaign()
  @Post(':id/pause')       pauseCampaign()
  @Post(':id/resume')      resumeCampaign()
  @Post(':id/cancel')      cancelCampaign()
  @Get(':id/recipients')   getRecipients()
}
```

#### 3.3 Service Campaigns + Scheduler
```typescript
export class CampaignsService {
  async createCampaign(userId, dto)
  async launchCampaign(userId, id)
  async processCampaign(campaignId)  // Bull Queue processor
  async sendToRecipient(recipientId)
  async updateCampaignStats(campaignId)
}
```

#### 3.4 Bull Queue pour envois programmés
```typescript
// backend/src/modules/communication/whatsapp/campaigns/queues/
- campaign.processor.ts
- campaign.queue.ts
```

Configuration :
```typescript
@InjectQueue('whatsapp-campaigns')
private campaignQueue: Queue
```

**Estimation** : 4-5 jours
**Fichiers** : ~1500 lignes

---

## Phase 4 : Backend Analytics (Priorité 🟡 MOYENNE)

### Objectif
Analytics, métriques et exports de rapports

### Livrables

#### 4.1 Contrôleur Analytics
```typescript
@Controller('whatsapp/analytics')
export class AnalyticsController {
  @Get('metrics')              getMetrics()
  @Get('charts')               getChartData()
  @Get('templates')            getTemplatePerformance()
  @Get('conversations-by-hour') getConversationsByHour()
  @Post('reports')             generateReport()
  @Post('export/pdf')          exportPDF()
  @Post('export/csv')          exportCSV()
  @Post('export/excel')        exportExcel()
  @Post('compare')             comparePeriods()
}
```

#### 4.2 Service Analytics
```typescript
export class AnalyticsService {
  async getMetrics(userId, period)
  async getChartData(userId, period)
  async getTemplatePerformance(userId, period)
  async aggregateData(userId, startDate, endDate)
}
```

#### 4.3 Exporters
```typescript
// backend/src/modules/communication/whatsapp/analytics/exporters/
- pdf.exporter.ts    // PDFKit ou Puppeteer
- excel.exporter.ts  // ExcelJS
- csv.exporter.ts    // csv-writer
```

**Estimation** : 3-4 jours
**Fichiers** : ~1000 lignes

---

## Phase 5 : Tests & Documentation (Priorité 🟢 NORMALE)

### Objectif
Suite complète de tests et documentation

### Livrables

#### 5.1 Tests Backend
```typescript
// Tests unitaires (Jest)
- templates.service.spec.ts
- contacts.service.spec.ts
- campaigns.service.spec.ts
- analytics.service.spec.ts

// Tests E2E (Supertest)
- templates.e2e-spec.ts
- contacts.e2e-spec.ts
- campaigns.e2e-spec.ts
- analytics.e2e-spec.ts
```

#### 5.2 Tests Frontend (Playwright)
```typescript
// ✅ Déjà créé
- frontend/tests/whatsapp/whatsapp.spec.ts (46 tests)
```

#### 5.3 Documentation API
```typescript
// Swagger / OpenAPI
- Compléter les décorateurs @ApiOperation, @ApiResponse
- Générer documentation : http://localhost:3001/api/docs
```

#### 5.4 Documentation Technique
```markdown
- Architecture.md
- API.md
- Testing.md
- Deployment.md
```

**Estimation** : 2-3 jours
**Fichiers** : ~2000 lignes tests + docs

---

## Timeline Global

| Phase | Description | Priorité | Durée | Lignes |
|-------|-------------|----------|-------|--------|
| 1 | Backend Templates | 🔴 | 2-3j | ~800 |
| 2 | Backend + DB Contacts | 🔴 | 3-4j | ~1200 |
| 3 | Backend + DB Campaigns | 🟡 | 4-5j | ~1500 |
| 4 | Backend Analytics | 🟡 | 3-4j | ~1000 |
| 5 | Tests & Documentation | 🟢 | 2-3j | ~2000 |

**Total Estimé** : 14-19 jours
**Total Code** : ~6500 lignes backend supplémentaires

---

## Checklist de Validation

### Pour chaque phase :

- [ ] Migration Prisma créée et appliquée
- [ ] Modèles Prisma avec indexes appropriés
- [ ] DTOs de validation créés
- [ ] Contrôleur implémenté avec Swagger
- [ ] Service métier implémenté
- [ ] Tests unitaires > 80% couverture
- [ ] Tests E2E créés
- [ ] Documentation API mise à jour
- [ ] Frontend fonctionne avec le backend
- [ ] Tests Playwright passent
- [ ] Code review fait
- [ ] Merge dans develop

---

## Stack Technique

### Backend
- **Framework** : NestJS 10
- **ORM** : Prisma
- **Queue** : Bull (Redis)
- **Validation** : class-validator
- **Tests** : Jest + Supertest
- **API Docs** : Swagger/OpenAPI

### Frontend
- **Framework** : Next.js 14 (Pages Router)
- **State** : SWR
- **HTTP** : Axios
- **UI** : Tailwind CSS
- **Tests** : Playwright
- **Types** : TypeScript strict

### Providers WhatsApp
- **Meta Cloud API** : Primary
- **Twilio** : Alternative

---

## Métriques de Succès

- ✅ Frontend 100% fonctionnel (~11,800 lignes) ✅
- ⏳ Backend 100% implémenté (~6,500 lignes à ajouter)
- ⏳ Base de données complète (2 modèles à ajouter)
- ⏳ Tests E2E > 90% passent (46 tests créés)
- ⏳ Couverture tests > 80%
- ⏳ Documentation API complète
- ⏳ Performance < 3s chargement pages
- ⏳ Zéro bugs critiques

---

## Risques Identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| API WhatsApp rate limits | Élevé | Moyenne | Implémentation queues + throttling |
| Données manquantes | Élevé | Faible | Validation stricte + tests |
| Performance analytics | Moyen | Moyenne | Indexes DB + cache Redis |
| Complexité campaigns | Moyen | Élevée | Architecture modulaire + tests |

---

## Prochaines Actions Immédiates

1. **Créer branch** : `feature/whatsapp-backend-implementation`
2. **Phase 1** : Implémenter Templates backend (2-3j)
3. **Tests** : Valider avec Playwright
4. **Review** : Code review + merge
5. **Phase 2** : Contacts backend (3-4j)
6. **Continue** : Phases 3, 4, 5

---

**Date de début recommandée** : ASAP
**Date de fin estimée** : +3 semaines
**Équipe** : 1-2 développeurs fullstack

---

**Document créé le** : 2024-01-XX
**Dernière mise à jour** : 2024-01-XX
**Version** : 1.0
