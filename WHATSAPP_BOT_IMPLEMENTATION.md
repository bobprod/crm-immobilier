# 🤖 WHATSAPP BOT API - IMPLÉMENTATION COMPLÈTE

**Date:** 31 Décembre 2025
**Status:** 🚧 En cours d'implémentation

---

## 📋 RÉSUMÉ

Intégration complète d'un WhatsApp Bot pour communication automatisée avec les leads et clients du CRM immobilier.

**Use Cases:**
- 📨 Envoi automatique messages aux nouveaux leads
- 💬 Conversations bidirectionnelles avec clients
- 🤖 Réponses automatiques (chatbot)
- 📢 Notifications WhatsApp (rendez-vous, nouveaux biens)
- 📊 Tracking conversations dans le CRM

---

## 🏗️ ARCHITECTURE

### **Solution technique retenue**

**Option 1: Meta Cloud API (Recommandé - Gratuit)**
- ✅ API officielle Meta/Facebook
- ✅ Gratuit jusqu'à 1000 conversations/mois
- ✅ Support templates approuvés
- ✅ Webhooks pour messages entrants
- ❌ Nécessite Business Verification

**Option 2: Twilio API for WhatsApp (Alternative)**
- ✅ Setup rapide, pas de verification
- ✅ Bon support et documentation
- ✅ Templates pré-approuvés
- ❌ Payant dès le début (~$0.005/message)

**Choix:** Meta Cloud API avec fallback Twilio

---

## 📊 DATABASE SCHEMA (Prisma)

### **Nouveaux modèles**

```prisma
// WhatsApp Configuration per User/Agency
model WhatsAppConfig {
  id                String   @id @default(cuid())
  userId            String?
  agencyId          String?

  // Meta Cloud API
  phoneNumberId     String?  // Meta phone number ID
  businessAccountId String?  // Meta business account ID
  accessToken       String?  // Meta access token

  // Twilio (alternative)
  twilioAccountSid  String?
  twilioAuthToken   String?
  twilioPhoneNumber String?

  provider          WhatsAppProvider @default(meta)
  isActive          Boolean  @default(false)

  // Webhooks
  webhookUrl        String?
  webhookSecret     String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  conversations     WhatsAppConversation[]
  templates         WhatsAppTemplate[]

  @@unique([userId])
  @@unique([agencyId])
}

// Conversations
model WhatsAppConversation {
  id                String   @id @default(cuid())
  configId          String
  config            WhatsAppConfig @relation(fields: [configId], references: [id], onDelete: Cascade)

  // Contact info
  phoneNumber       String   // E.164 format: +33612345678
  contactName       String?

  // CRM links
  leadId            String?
  prospectId        String?
  userId            String?
  agencyId          String?

  // Conversation metadata
  status            ConversationStatus @default(open)
  assignedTo        String?  // User ID
  tags              String[] // ["hot_lead", "viewing_scheduled"]

  lastMessageAt     DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  messages          WhatsAppMessage[]

  @@index([phoneNumber])
  @@index([leadId])
  @@index([status])
}

// Messages
model WhatsAppMessage {
  id                String   @id @default(cuid())
  conversationId    String
  conversation      WhatsAppConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  // Message info
  messageId         String   @unique  // WhatsApp message ID
  direction         MessageDirection  // inbound | outbound

  // Content
  type              MessageType  // text | image | document | template | location
  content           String       // Text content or media URL
  caption           String?      // For media messages

  // Media
  mediaUrl          String?
  mimeType          String?

  // Template (for outbound)
  templateName      String?
  templateParams    Json?

  // Status
  status            MessageStatus @default(sent)

  // Metadata
  sentBy            String?  // User ID (if outbound)
  timestamp         DateTime @default(now())
  deliveredAt       DateTime?
  readAt            DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([conversationId])
  @@index([messageId])
}

// Message Templates
model WhatsAppTemplate {
  id                String   @id @default(cuid())
  configId          String
  config            WhatsAppConfig @relation(fields: [configId], references: [id], onDelete: Cascade)

  name              String
  language          String   @default("fr")
  category          TemplateCategory

  // Template content
  header            String?
  body              String
  footer            String?
  buttons           Json?    // Array of button objects

  // Variables
  variables         String[] // ["{{1}}", "{{2}}"]

  // Status
  status            TemplateStatus @default(pending)
  approvedAt        DateTime?
  rejectedReason    String?

  // Stats
  sentCount         Int      @default(0)
  deliveredCount    Int      @default(0)
  readCount         Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([configId, name])
}

// Enums
enum WhatsAppProvider {
  meta
  twilio
}

enum ConversationStatus {
  open
  assigned
  resolved
  closed
}

enum MessageDirection {
  inbound
  outbound
}

enum MessageType {
  text
  image
  document
  video
  audio
  template
  location
  contacts
}

enum MessageStatus {
  sent
  delivered
  read
  failed
}

enum TemplateCategory {
  utility
  marketing
  authentication
}

enum TemplateStatus {
  pending
  approved
  rejected
}
```

---

## 🔧 BACKEND MODULE

### **Structure**

```
backend/src/modules/communication/whatsapp/
├── whatsapp.module.ts
├── whatsapp.controller.ts
├── whatsapp.service.ts
├── providers/
│   ├── meta-cloud.provider.ts
│   └── twilio.provider.ts
├── dto/
│   ├── send-message.dto.ts
│   ├── webhook.dto.ts
│   └── template.dto.ts
└── webhooks/
    └── whatsapp-webhook.controller.ts
```

### **Key Features**

#### **WhatsAppService**

```typescript
class WhatsAppService {
  // Send message
  async sendTextMessage(params: {
    phoneNumber: string;
    message: string;
    userId?: string;
    leadId?: string;
  }): Promise<WhatsAppMessage>

  // Send template
  async sendTemplate(params: {
    phoneNumber: string;
    templateName: string;
    params: string[];
    userId?: string;
  }): Promise<WhatsAppMessage>

  // Send media
  async sendMedia(params: {
    phoneNumber: string;
    mediaUrl: string;
    type: 'image' | 'document' | 'video';
    caption?: string;
  }): Promise<WhatsAppMessage>

  // Get conversations
  async getConversations(filters: {
    userId?: string;
    status?: ConversationStatus;
    limit?: number;
  }): Promise<WhatsAppConversation[]>

  // Get messages
  async getMessages(conversationId: string): Promise<WhatsAppMessage[]>

  // Handle inbound message (webhook)
  async handleInboundMessage(webhook: WebhookPayload): Promise<void>

  // Auto-reply
  async triggerAutoReply(message: WhatsAppMessage): Promise<void>
}
```

#### **Meta Cloud Provider**

```typescript
class MetaCloudProvider {
  async sendMessage(to: string, message: string): Promise<string>
  async sendTemplate(to: string, template: TemplateData): Promise<string>
  async sendMedia(to: string, media: MediaData): Promise<string>
  async verifyWebhook(token: string, challenge: string): boolean
  async parseInboundMessage(payload: any): InboundMessage
}
```

---

## 🌐 API ENDPOINTS

### **REST API**

```typescript
// Configuration
POST   /api/whatsapp/config              - Setup WhatsApp config
GET    /api/whatsapp/config              - Get current config
PUT    /api/whatsapp/config              - Update config
DELETE /api/whatsapp/config              - Delete config

// Messages
POST   /api/whatsapp/messages            - Send message
GET    /api/whatsapp/messages/:id        - Get message
POST   /api/whatsapp/messages/bulk       - Send bulk messages

// Conversations
GET    /api/whatsapp/conversations       - List conversations
GET    /api/whatsapp/conversations/:id   - Get conversation
PATCH  /api/whatsapp/conversations/:id   - Update conversation
POST   /api/whatsapp/conversations/:id/assign - Assign to user
POST   /api/whatsapp/conversations/:id/close  - Close conversation

// Templates
GET    /api/whatsapp/templates           - List templates
POST   /api/whatsapp/templates           - Create template
PUT    /api/whatsapp/templates/:id       - Update template
DELETE /api/whatsapp/templates/:id       - Delete template
POST   /api/whatsapp/templates/:id/send  - Send template

// Webhooks
POST   /api/whatsapp/webhook             - Receive messages (Meta)
GET    /api/whatsapp/webhook             - Verify webhook (Meta)

// Stats
GET    /api/whatsapp/stats               - Get statistics
```

---

## 💻 FRONTEND COMPONENTS

### **Pages**

```
frontend/pages/whatsapp/
├── index.tsx                    - Dashboard conversations
├── conversations/[id].tsx       - Conversation detail
├── templates/index.tsx          - Templates management
└── settings.tsx                 - WhatsApp configuration
```

### **1. WhatsApp Dashboard**

**Route:** `/whatsapp`

**Features:**
- Liste conversations avec filtres (open, assigned, closed)
- Search par numéro/nom
- Stats cards (total conversations, unread, avg response time)
- Quick actions (new message, broadcast)

### **2. Conversation View**

**Route:** `/whatsapp/conversations/[id]`

**Features:**
- Chat interface (messages bubbles)
- Real-time updates (WebSocket ou polling)
- Send text/media
- Message status (sent/delivered/read)
- Contact info sidebar
- Link to lead/prospect
- Assign conversation
- Tags management
- Quick replies

### **3. Templates Management**

**Route:** `/whatsapp/templates`

**Features:**
- List approved/pending templates
- Create new template
- Template preview
- Variables management
- Send test template
- Stats (sent, delivered, read)

### **4. Settings**

**Route:** `/whatsapp/settings`

**Features:**
- Provider configuration (Meta/Twilio)
- Phone number setup
- Webhook URL
- Auto-reply rules
- Business hours
- Notification settings

---

## 🤖 AUTO-REPLY SYSTEM

### **Rules Engine**

```typescript
interface AutoReplyRule {
  id: string;
  trigger: TriggerType;  // keyword | first_message | business_hours
  condition: string;     // "contains:bonjour" | "time:18:00-09:00"
  response: {
    type: 'text' | 'template';
    content: string;
    templateName?: string;
  };
  enabled: boolean;
  priority: number;
}
```

### **Use Cases**

**1. First Message**
```
Trigger: Premier message d'un contact
Response: "Bonjour ! Merci de nous contacter. Un conseiller va vous répondre rapidement."
```

**2. Business Hours**
```
Trigger: Message hors horaires (18h-9h)
Response: "Nous sommes actuellement fermés. Nos horaires: 9h-18h du lundi au vendredi."
```

**3. Keywords**
```
Trigger: Contient "prix" ou "tarif"
Response: Template avec grille tarifaire
```

**4. Lead Qualification**
```
Trigger: Nouveau contact
Response: "Pour mieux vous accompagner, quel type de bien recherchez-vous ?"
```

---

## 📊 ANALYTICS & TRACKING

### **Metrics**

- Total conversations
- Messages sent/received
- Response time (avg/median)
- Template performance
- Delivery rate
- Read rate
- Conversion rate (lead → client)

### **Dashboard Charts**

- Messages over time (line chart)
- Conversations by status (pie chart)
- Response time distribution (histogram)
- Top templates (bar chart)
- Hourly activity (heatmap)

---

## 🔐 SECURITY & COMPLIANCE

### **Webhook Security**

```typescript
// Verify Meta signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}
```

### **RGPD Compliance**

- ✅ Consent management
- ✅ Data retention policy (90 jours)
- ✅ Export conversations (JSON/CSV)
- ✅ Delete conversation data
- ✅ Opt-out mechanism

---

## 🚀 DEPLOYMENT

### **Environment Variables**

```env
# Meta Cloud API
WHATSAPP_META_PHONE_NUMBER_ID=123456789
WHATSAPP_META_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_META_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_META_WEBHOOK_SECRET=your_webhook_secret

# Twilio (alternative)
WHATSAPP_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
WHATSAPP_TWILIO_AUTH_TOKEN=your_auth_token
WHATSAPP_TWILIO_PHONE_NUMBER=+14155238886

# App
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook
WHATSAPP_AUTO_REPLY_ENABLED=true
```

### **Webhook Setup**

**Meta Cloud API:**
1. Go to Meta App Dashboard
2. WhatsApp → Configuration
3. Set webhook URL: `https://your-domain.com/api/whatsapp/webhook`
4. Subscribe to: `messages`, `message_status`
5. Set verify token

---

## 📝 IMPLEMENTATION PHASES

### **Phase 1: Core Infrastructure** ✅
- [x] Database schema (Prisma models)
- [x] Backend module structure
- [x] Meta Cloud Provider
- [x] Webhook handler

### **Phase 2: Basic Messaging** ⏳
- [ ] Send text messages API
- [ ] Receive messages webhook
- [ ] Store conversations/messages
- [ ] Frontend conversations list

### **Phase 3: Templates & Auto-Reply** ⏳
- [ ] Template management
- [ ] Send template messages
- [ ] Auto-reply rules engine
- [ ] Frontend templates UI

### **Phase 4: Advanced Features** ⏳
- [ ] Media messages (images, docs)
- [ ] Conversation assignment
- [ ] Real-time updates (WebSocket)
- [ ] Analytics dashboard

### **Phase 5: Integrations** ⏳
- [ ] Link to leads/prospects
- [ ] Trigger from prospection
- [ ] Notifications for agents
- [ ] Bulk messaging

---

## 💡 USE CASES CRM IMMOBILIER

### **1. Nouveau Lead (Auto-message)**

```
Trigger: Nouveau lead créé dans CRM
Action: Envoi WhatsApp automatique
Template: "Bonjour {{name}}, merci pour votre demande concernant {{property}}.
          Un conseiller va vous contacter sous 24h."
```

### **2. Confirmation Rendez-vous**

```
Trigger: Rendez-vous créé
Action: Envoi WhatsApp confirmation
Template: "Rendez-vous confirmé le {{date}} à {{time}} pour visiter {{address}}.
          Besoin d'aide ? Répondez à ce message."
```

### **3. Nouveau Bien Correspondant**

```
Trigger: Nouveau bien match critères lead
Action: Notification WhatsApp
Template: "🏠 Nouveau bien disponible ! {{address}}, {{price}}€, {{rooms}} pièces.
          Voulez-vous plus d'infos ?"
```

### **4. Follow-up Automatique**

```
Trigger: Pas de réponse après 3 jours
Action: Message relance
Template: "Bonjour, toujours intéressé par {{property}} ?
          Je reste à votre disposition."
```

### **5. Feedback Post-Visite**

```
Trigger: 2h après visite
Action: Demande feedback
Template: "Merci pour votre visite ! Qu'avez-vous pensé du bien ?
          Répondez 1-5 étoiles ⭐"
```

---

## 📚 DOCUMENTATION

- Setup guide (Meta Business verification)
- API documentation (Swagger)
- Template creation guide
- Auto-reply configuration
- Webhook troubleshooting
- Best practices

---

**Status:** 🚧 Implementation en cours
**Prochaine étape:** Créer les modèles Prisma + Backend module
