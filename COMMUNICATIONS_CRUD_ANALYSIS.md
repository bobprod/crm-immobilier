# Analyse CRUD Complète - Module Communications

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Backend - API REST](#backend---api-rest)
3. [Frontend - Services & API](#frontend---services--api)
4. [Opérations CRUD](#opérations-crud)
5. [Tests Playwright](#tests-playwright)
6. [Scripts de Test](#scripts-de-test)

---

## 🎯 Vue d'ensemble

Le module **Communications** gère l'envoi et le suivi de tous les canaux de communication:
- 📧 **Email** (via SMTP avec Nodemailer)
- 📱 **SMS** (via Twilio)
- 💬 **WhatsApp** (via Twilio/WhatsApp Business API)

### Architecture
```
Backend (NestJS)                  Frontend (Next.js/React)
├── Controller                    ├── API Client
├── Service                       ├── Service Layer
├── AI Service                    └── Components
└── DTOs                              ├── Forms
                                      └── History
```

---

## 🔧 Backend - API REST

### Endpoints Disponibles

#### 📤 **Envoi de Messages**

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/communications/email` | POST | Envoyer un email | ✅ JWT |
| `/communications/sms` | POST | Envoyer un SMS | ✅ JWT |
| `/communications/whatsapp` | POST | Envoyer un WhatsApp | ✅ JWT |

#### 📜 **Historique & Consultation**

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/communications/history` | GET | Historique complet | ✅ JWT |
| `/communications/history/:id` | GET | Récupérer une communication | ✅ JWT |
| `/communications/history?type=email` | GET | Filtrer par type | ✅ JWT |
| `/communications/history?prospectId=xxx` | GET | Filtrer par prospect | ✅ JWT |
| `/communications/stats` | GET | Statistiques globales | ✅ JWT |

#### 📄 **Templates**

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/communications/templates` | GET | Liste des templates | ✅ JWT |
| `/communications/templates/:id` | GET | Récupérer un template | ✅ JWT |
| `/communications/templates` | POST | Créer un template | ✅ JWT |
| `/communications/templates/:id` | PUT | Modifier un template | ✅ JWT |
| `/communications/templates/:id` | DELETE | Supprimer un template (soft) | ✅ JWT |

#### 🧪 **Tests & Configuration**

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/communications/smtp/test-connection` | POST | Tester SMTP | ✅ JWT |
| `/communications/smtp/test-email` | POST | Email de test | ✅ JWT |

#### 🤖 **IA Communications**

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/communications/ai/generate-email` | POST | Générer email avec IA | ✅ JWT |
| `/communications/ai/generate-sms` | POST | Générer SMS avec IA | ✅ JWT |
| `/communications/ai/suggest-templates` | POST | Suggérer templates | ✅ JWT |
| `/communications/ai/auto-complete` | POST | Auto-complétion | ✅ JWT |
| `/communications/ai/improve-text` | POST | Améliorer texte | ✅ JWT |
| `/communications/ai/translate` | POST | Traduire message | ✅ JWT |

---

## 💻 Frontend - Services & API

### Fichiers Principaux

```
frontend/src/
├── modules/communications/
│   └── communications.service.ts       # Service principal
└── shared/utils/
    └── communications-api.ts           # Client API complet
```

### API Client (`communications-api.ts`)

#### Types TypeScript
```typescript
interface Communication {
  id: string;
  type: 'email' | 'sms' | 'whatsapp';
  to: string;
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sentAt: string;
  prospectId?: string;
  propertyId?: string;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  variables: string[];
}
```

#### Méthodes Disponibles
```typescript
communicationsAPI = {
  sendEmail(data: SendEmailData): Promise<any>
  sendSms(data: SendSmsData): Promise<any>
  sendWhatsApp(data: SendWhatsAppData): Promise<any>

  getHistory(filters?: HistoryFilters): Promise<Communication[]>
  getById(id: string): Promise<Communication>

  getTemplates(type?: string): Promise<CommunicationTemplate[]>
  createTemplate(data: CreateTemplateData): Promise<CommunicationTemplate>
  updateTemplate(id: string, data: Partial<CreateTemplateData>): Promise<any>
  deleteTemplate(id: string): Promise<any>

  getStats(): Promise<CommunicationStats>
}
```

#### Helpers
```typescript
formatDate(date: string): string                  // Formater date
getStatusBadge(status: string): { label, color }  // Badge de statut
getTypeIcon(type: string): string                 // Icône du type
replaceVariables(content: string, vars): string   // Variables template
```

---

## 🔄 Opérations CRUD

### ✅ **CREATE**

#### 1. Envoyer un Email
```bash
POST /communications/email
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "prospect@example.com",
  "subject": "Nouveau bien disponible",
  "body": "<h1>Bonjour</h1><p>Nous avons un bien pour vous...</p>",
  "prospectId": "uuid-prospect",
  "propertyId": "uuid-property",
  "templateId": "uuid-template"
}
```

**Réponse:**
```json
{
  "success": true,
  "messageId": "comm-uuid",
  "communication": { ... }
}
```

#### 2. Envoyer un SMS
```bash
POST /communications/sms
Authorization: Bearer <token>

{
  "to": "+21655123456",
  "message": "RDV demain 14h. Confirmez SVP.",
  "prospectId": "uuid-prospect"
}
```

#### 3. Envoyer WhatsApp
```bash
POST /communications/whatsapp
Authorization: Bearer <token>

{
  "to": "+21655123456",
  "message": "Bonjour, voici le bien...",
  "mediaUrl": "https://example.com/image.jpg",
  "propertyId": "uuid-property"
}
```

#### 4. Créer un Template
```bash
POST /communications/templates
Authorization: Bearer <token>

{
  "name": "Visite planifiée",
  "type": "email",
  "subject": "Confirmation RDV - {{propertyTitle}}",
  "content": "Bonjour {{prospectName}}, votre RDV est confirmé...",
  "variables": ["propertyTitle", "prospectName", "date"]
}
```

---

### 📖 **READ**

#### 1. Historique Complet
```bash
GET /communications/history
Authorization: Bearer <token>
```

#### 2. Filtrer par Type
```bash
GET /communications/history?type=email&limit=20
```

#### 3. Filtrer par Prospect
```bash
GET /communications/history?prospectId=uuid-prospect
```

#### 4. Filtrer par Statut
```bash
GET /communications/history?status=sent
```

#### 5. Liste Templates
```bash
GET /communications/templates
GET /communications/templates?type=email
```

#### 6. Récupérer un Template Spécifique
```bash
GET /communications/templates/:id
Authorization: Bearer <token>
```

#### 7. Récupérer une Communication Spécifique
```bash
GET /communications/history/:id
Authorization: Bearer <token>
```

#### 8. Statistiques
```bash
GET /communications/stats
```

**Réponse:**
```json
{
  "total": 1250,
  "sent": 1180,
  "failed": 70,
  "byType": {
    "email": 800,
    "sms": 350,
    "whatsapp": 100
  }
}
```

---

### ✏️ **UPDATE**

#### Modifier un Template
```bash
PUT /communications/templates/:id
Authorization: Bearer <token>

{
  "name": "Nouveau nom",
  "subject": "Nouveau sujet",
  "content": "Nouveau contenu...",
  "variables": ["var1", "var2"]
}
```

**Réponse:**
```json
{
  "id": "template-uuid",
  "userId": "user-uuid",
  "name": "Nouveau nom",
  "type": "email",
  "subject": "Nouveau sujet",
  "content": "Nouveau contenu...",
  "variables": ["var1", "var2"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

**Note:** Les communications envoyées sont **immuables** (pas de UPDATE). Seuls les templates peuvent être modifiés.

---

### 🗑️ **DELETE**

#### Supprimer un Template (Soft Delete)
```bash
DELETE /communications/templates/:id
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "success": true,
  "message": "Template supprimé avec succès"
}
```

**Important:**
- ⚠️ **Soft Delete**: Le template n'est pas supprimé physiquement mais marqué comme `isActive: false`
- ✅ Les données sont préservées pour l'historique
- ❌ Le template n'apparaît plus dans les listes (filtre `isActive: true`)
- ✅ Peut être réactivé manuellement en base de données si nécessaire

**Note:** Les communications historiques ne peuvent pas être supprimées (immuables pour audit).

---

## 🧪 Tests Playwright

### Configuration
```typescript
// tests/communications.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Module Communications', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'agent@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  // Tests...
});
```

### Tests Principaux

#### 1. Test d'Envoi d'Email
```typescript
test('doit envoyer un email avec succès', async ({ page }) => {
  await page.goto('/communications/send');

  // Sélectionner le type
  await page.click('button[data-type="email"]');

  // Remplir le formulaire
  await page.fill('input[name="to"]', 'test@example.com');
  await page.fill('input[name="subject"]', 'Test Email');
  await page.fill('textarea[name="body"]', 'Ceci est un test');

  // Envoyer
  await page.click('button[type="submit"]');

  // Vérifier succès
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.success-message')).toContainText('Email envoyé');
});
```

#### 2. Test d'Historique
```typescript
test('doit afficher l\'historique des communications', async ({ page }) => {
  await page.goto('/communications/history');

  // Attendre le chargement
  await page.waitForSelector('.communications-list');

  // Vérifier les éléments
  const items = await page.locator('.communication-item').count();
  expect(items).toBeGreaterThan(0);

  // Vérifier les colonnes
  await expect(page.locator('th:has-text("Type")')).toBeVisible();
  await expect(page.locator('th:has-text("Destinataire")')).toBeVisible();
  await expect(page.locator('th:has-text("Statut")')).toBeVisible();
});
```

#### 3. Test de Filtrage
```typescript
test('doit filtrer par type de communication', async ({ page }) => {
  await page.goto('/communications/history');

  // Sélectionner filtre email
  await page.selectOption('select[name="type"]', 'email');
  await page.click('button:has-text("Filtrer")');

  // Vérifier que seuls les emails sont affichés
  const emailItems = await page.locator('.communication-item[data-type="email"]').count();
  const totalItems = await page.locator('.communication-item').count();

  expect(emailItems).toBe(totalItems);
});
```

#### 4. Test de Création de Template
```typescript
test('doit créer un nouveau template', async ({ page }) => {
  await page.goto('/communications/templates');

  // Cliquer sur "Nouveau template"
  await page.click('button:has-text("Nouveau template")');

  // Remplir le formulaire
  await page.fill('input[name="name"]', 'Mon Template Test');
  await page.selectOption('select[name="type"]', 'email');
  await page.fill('input[name="subject"]', 'Sujet du template');
  await page.fill('textarea[name="content"]', 'Contenu avec {{variable}}');

  // Sauvegarder
  await page.click('button[type="submit"]');

  // Vérifier succès
  await expect(page.locator('.success-message')).toContainText('Template créé');

  // Vérifier dans la liste
  await expect(page.locator('text=Mon Template Test')).toBeVisible();
});
```

#### 5. Test des Statistiques
```typescript
test('doit afficher les statistiques', async ({ page }) => {
  await page.goto('/communications/stats');

  // Vérifier les cartes de stats
  await expect(page.locator('.stat-card:has-text("Total")')).toBeVisible();
  await expect(page.locator('.stat-card:has-text("Envoyés")')).toBeVisible();
  await expect(page.locator('.stat-card:has-text("Échoués")')).toBeVisible();

  // Vérifier les nombres
  const totalText = await page.locator('.stat-card:has-text("Total") .stat-value').textContent();
  expect(parseInt(totalText || '0')).toBeGreaterThanOrEqual(0);
});
```

---

## 🔧 Scripts de Test

Voir le fichier `test-communications-crud.sh` pour le script complet de tests CRUD.

---

## 📊 Résumé des Fonctionnalités

### ✅ Implémenté

- [x] Envoi email (SMTP)
- [x] Envoi SMS (stub)
- [x] Envoi WhatsApp (stub)
- [x] Historique complet avec filtres
- [x] Templates (CRUD complet)
- [x] Statistiques globales
- [x] Test connexion SMTP
- [x] Email de test
- [x] IA: Génération email
- [x] IA: Génération SMS
- [x] IA: Suggestion templates
- [x] IA: Auto-complétion
- [x] IA: Amélioration texte
- [x] IA: Traduction

### 🔄 Fonctionnalités CRUD

| Entité | Create | Read | Update | Delete | Notes |
|--------|--------|------|--------|--------|-------|
| **Communications** | ✅ | ✅ | ❌ | ❌ | Immuables (audit) |
| **Templates** | ✅ | ✅ | ✅ | ✅ | Gestion complète |
| **Stats** | - | ✅ | - | - | Lecture seule |

### 📝 Notes Importantes

1. **Communications = Audit Trail**: Les communications envoyées sont stockées pour traçabilité mais ne sont pas modifiables
2. **Templates = Réutilisables**: Les templates peuvent être modifiés et réutilisés
3. **Variables**: Support des variables dynamiques dans les templates (`{{variableName}}`)
4. **Multi-canal**: Email, SMS, WhatsApp via une API unifiée
5. **Statuts**: `sent`, `delivered`, `opened`, `clicked`, `failed`
6. **Relations**: Lien avec Prospects et Properties

---

## 🎯 Points d'Attention pour les Tests

1. **SMTP**: Nécessite configuration SMTP valide dans `.env`
2. **SMS/WhatsApp**: Actuellement en mode stub (pas d'envoi réel)
3. **Authentication**: Tous les endpoints nécessitent un JWT valide
4. **Rate Limiting**: Possibles limites d'envoi (à configurer)
5. **Templates**: Variables doivent être remplacées avant envoi

---

## 📖 Documentation Supplémentaire

- Backend Controller: `backend/src/modules/communications/communications.controller.ts`
- Backend Service: `backend/src/modules/communications/communications.service.ts`
- Frontend API: `frontend/src/shared/utils/communications-api.ts`
- Frontend Service: `frontend/src/modules/communications/communications.service.ts`
