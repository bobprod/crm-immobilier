# Guide Pratique d'Implémentation - SaaS Core

## 🎯 Objectif

Ce guide fournit des **étapes concrètes et actionnables** pour extraire les modules SaaS Core du CRM Immobilier et les utiliser pour créer une application de Gestion d'Avances de Voyage.

---

## 📋 Prérequis

### Outils nécessaires
- Node.js 18+
- npm ou yarn
- PostgreSQL 14+
- Git
- IDE (VS Code recommandé)

### Connaissances requises
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL

---

## 🚀 Phase 1: Préparation (1 semaine)

### Étape 1.1: Analyse des Dépendances

```bash
# Dans le dossier backend
cd /home/runner/work/crm-immobilier/crm-immobilier/backend

# Analyser les dépendances entre modules
npm run build
npm run test

# Identifier les imports circulaires
npx madge --circular --extensions ts src/
```

**Résultat attendu**: Liste des dépendances circulaires à résoudre

### Étape 1.2: Créer la Structure Monorepo

```bash
# À la racine du projet
mkdir -p crm-platform
cd crm-platform

# Initialiser monorepo avec npm workspaces
npm init -y

# Créer la structure
mkdir -p packages/saas-core
mkdir -p packages/real-estate
mkdir -p packages/travel-management
mkdir -p apps/real-estate-api
mkdir -p apps/travel-api
```

**Structure finale**:
```
crm-platform/
├── package.json                 # Root package avec workspaces
├── packages/
│   ├── saas-core/              # ✅ Package réutilisable
│   │   ├── src/
│   │   │   ├── core/           # Auth, Users, Settings
│   │   │   ├── infrastructure/ # Notifs, Docs, Tasks
│   │   │   ├── intelligence/   # AI modules
│   │   │   └── index.ts        # Exports publics
│   │   └── package.json
│   │
│   ├── real-estate/            # 🏠 Domain immobilier
│   │   ├── src/
│   │   │   ├── properties/
│   │   │   ├── prospects/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── travel-management/      # ✈️ Nouveau domain
│       ├── src/
│       │   ├── travel-requests/
│       │   ├── expenses/
│       │   └── index.ts
│       └── package.json
│
└── apps/
    ├── real-estate-api/        # API immobilier
    │   ├── src/
    │   └── package.json
    │
    └── travel-api/             # API voyage
        ├── src/
        └── package.json
```

### Étape 1.3: Configuration Workspaces

**Root package.json**:
```json
{
  "name": "crm-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 🔧 Phase 2: Extraction des Modules Core (3 semaines)

### Semaine 1: Modules Core Basiques

#### Étape 2.1: Extraire Auth Module

```bash
cd packages/saas-core
npm init -y
npm install @nestjs/common @nestjs/core @nestjs/jwt @nestjs/passport passport passport-jwt passport-google-oauth20 passport-facebook
npm install -D @types/passport-jwt @types/passport-google-oauth20 @types/passport-facebook
```

**Copier les fichiers**:
```bash
# Depuis backend/src/modules/core/auth vers packages/saas-core/src/core/auth
cp -r ../../backend/src/modules/core/auth ./src/core/
```

**Nettoyer les dépendances**:
```typescript
// src/core/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get('JWT_EXPIRATION') || '1h' 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, FacebookStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

**Créer index.ts public**:
```typescript
// src/core/index.ts
export * from './auth/auth.module';
export * from './auth/auth.service';
export * from './auth/guards/jwt-auth.guard';
export * from './users/users.module';
export * from './users/users.service';
export * from './settings/settings.module';
export * from './settings/settings.service';
```

#### Étape 2.2: Extraire Users Module

```bash
# Copier les fichiers
cp -r ../../backend/src/modules/core/users ./src/core/
```

**Adapter le service**:
```typescript
// src/core/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  
  async findAll(tenantId?: string) {
    return this.prisma.users.findMany({
      where: tenantId ? { agencyId: tenantId } : undefined
    });
  }
  
  async findOne(id: string) {
    return this.prisma.users.findUnique({ where: { id } });
  }
  
  async create(data: CreateUserDto) {
    return this.prisma.users.create({ data });
  }
  
  async update(id: string, data: UpdateUserDto) {
    return this.prisma.users.update({ where: { id }, data });
  }
  
  async delete(id: string) {
    return this.prisma.users.delete({ where: { id } });
  }
}
```

#### Étape 2.3: Extraire Database Service (Prisma)

```bash
# Copier le service Prisma
cp -r ../../backend/src/shared/database ./src/shared/
cp ../../backend/prisma/schema.prisma ./prisma/
```

**Adapter le schema Prisma pour être générique**:
```prisma
// prisma/schema.prisma - Version Core

// Garder seulement les modèles génériques
model users {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  firstName    String?
  lastName     String?
  role         String   @default("user")
  agencyId     String?  // Multi-tenant
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations génériques
  documents    documents[]
  tasks        tasks[]
  notifications Notification[]
}

model documents {
  id            String   @id @default(cuid())
  userId        String
  name          String
  fileUrl       String
  mimeType      String
  fileSize      Int
  // Relations polymorphes
  relatedType   String?
  relatedId     String?
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          users    @relation(fields: [userId], references: [id])
}

model tasks {
  id           String   @id @default(cuid())
  userId       String
  title        String
  description  String?
  status       String   @default("todo")
  priority     String   @default("medium")
  dueDate      DateTime?
  metadata     Json?    // Flexible data
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user         users    @relation(fields: [userId], references: [id])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  data      Json?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      users    @relation(fields: [userId], references: [id])
}

// Ajouter d'autres modèles génériques...
```

### Semaine 2: Modules Infrastructure

#### Étape 2.4: Extraire Notifications Module

```bash
cp -r ../../backend/src/modules/notifications ./src/infrastructure/
```

**Généraliser le service**:
```typescript
// src/infrastructure/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway
  ) {}
  
  async send(payload: NotificationPayload) {
    // Créer en base
    const notification = await this.prisma.notification.create({
      data: payload
    });
    
    // Envoyer en temps réel via WebSocket
    this.gateway.sendToUser(payload.userId, notification);
    
    return notification;
  }
  
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { read: true }
    });
  }
  
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false }
    });
  }
}
```

#### Étape 2.5: Extraire Documents Module

```bash
cp -r ../../backend/src/modules/content/documents ./src/infrastructure/
```

**Service générique**:
```typescript
// src/infrastructure/documents/documents.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface DocumentCreateDto {
  userId: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  relatedType?: string;  // "property", "travel_request", etc.
  relatedId?: string;
  metadata?: any;
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}
  
  async create(data: DocumentCreateDto) {
    return this.prisma.documents.create({ data });
  }
  
  async findByRelated(relatedType: string, relatedId: string) {
    return this.prisma.documents.findMany({
      where: { relatedType, relatedId }
    });
  }
  
  async findByUser(userId: string) {
    return this.prisma.documents.findMany({
      where: { userId }
    });
  }
  
  async delete(id: string, userId: string) {
    return this.prisma.documents.delete({
      where: { id, userId }
    });
  }
}
```

#### Étape 2.6: Extraire Tasks Module

```bash
cp -r ../../backend/src/modules/business/tasks ./src/infrastructure/
```

**Refactorer pour être générique**:
```typescript
// src/infrastructure/tasks/tasks.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface TaskCreateDto {
  userId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: Date;
  assignedTo?: string;
  metadata?: any;  // Flexible: peut contenir n'importe quelle info métier
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}
  
  async create(data: TaskCreateDto) {
    return this.prisma.tasks.create({ data });
  }
  
  async findByUser(userId: string, filters?: any) {
    return this.prisma.tasks.findMany({
      where: {
        OR: [
          { userId },
          { assignedTo: userId }
        ],
        ...filters
      },
      orderBy: { dueDate: 'asc' }
    });
  }
  
  async updateStatus(id: string, status: string, userId: string) {
    return this.prisma.tasks.update({
      where: { id, userId },
      data: { status }
    });
  }
}
```

### Semaine 3: Modules Intelligence

#### Étape 2.7: Extraire AI Chat Assistant

```bash
cp -r ../../backend/src/modules/intelligence/ai-chat-assistant ./src/intelligence/
```

**Configuration multi-domaines**:
```typescript
// src/intelligence/ai-chat-assistant/ai-chat-assistant.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

export interface ChatConfig {
  provider: 'openai' | 'gemini' | 'claude';
  model: string;
  systemPrompt: string;  // Configurable par domaine
  temperature?: number;
}

@Injectable()
export class AIChatAssistantService {
  async chat(
    message: string, 
    userId: string, 
    config: ChatConfig
  ) {
    const conversation = await this.getOrCreateConversation(userId);
    
    // Utiliser le system prompt configuré
    const messages = [
      { role: 'system', content: config.systemPrompt },
      ...conversation.messages,
      { role: 'user', content: message }
    ];
    
    // Appeler l'API selon le provider
    const response = await this.callLLM(messages, config);
    
    // Sauvegarder la conversation
    await this.saveMessage(conversation.id, 'user', message);
    await this.saveMessage(conversation.id, 'assistant', response);
    
    return response;
  }
  
  private async callLLM(messages: any[], config: ChatConfig) {
    switch (config.provider) {
      case 'openai':
        return this.callOpenAI(messages, config);
      case 'gemini':
        return this.callGemini(messages, config);
      case 'claude':
        return this.callClaude(messages, config);
    }
  }
}
```

**Configuration par domaine**:
```typescript
// config/chat-prompts.ts
export const chatPrompts = {
  'real-estate': `Tu es un assistant spécialisé en immobilier. 
    Tu aides les agents à gérer leurs propriétés et prospects.`,
  
  'travel-management': `Tu es un assistant pour la gestion des voyages d'entreprise.
    Tu aides les employés avec leurs demandes d'avance de voyage et leurs notes de frais.`,
  
  'generic': `Tu es un assistant virtuel professionnel.`
};
```

#### Étape 2.8: Package Final

**src/index.ts** - Exports publics:
```typescript
// Core
export * from './core/auth/auth.module';
export * from './core/auth/auth.service';
export * from './core/users/users.module';
export * from './core/users/users.service';
export * from './core/settings/settings.module';
export * from './core/settings/settings.service';

// Infrastructure
export * from './infrastructure/notifications/notifications.module';
export * from './infrastructure/notifications/notifications.service';
export * from './infrastructure/documents/documents.module';
export * from './infrastructure/documents/documents.service';
export * from './infrastructure/tasks/tasks.module';
export * from './infrastructure/tasks/tasks.service';
export * from './infrastructure/communications/communications.module';
export * from './infrastructure/communications/communications.service';

// Intelligence
export * from './intelligence/ai-chat-assistant/ai-chat-assistant.module';
export * from './intelligence/ai-chat-assistant/ai-chat-assistant.service';
export * from './intelligence/analytics/analytics.module';
export * from './intelligence/analytics/analytics.service';
export * from './intelligence/llm-config/llm-config.module';
export * from './intelligence/llm-config/llm-config.service';

// Shared
export * from './shared/database/prisma.module';
export * from './shared/database/prisma.service';
export * from './shared/guards/jwt-auth.guard';
export * from './shared/decorators/current-user.decorator';
export * from './shared/utils';
```

**package.json**:
```json
{
  "name": "@crm-platform/saas-core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "peerDependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

## 🏠 Phase 3: Migration Real Estate (1 semaine)

### Étape 3.1: Créer Package Real Estate

```bash
cd packages/real-estate
npm init -y
npm install @crm-platform/saas-core
```

**Structure**:
```
packages/real-estate/
├── src/
│   ├── properties/
│   │   ├── properties.module.ts
│   │   ├── properties.service.ts
│   │   ├── properties.controller.ts
│   │   └── dto/
│   ├── prospects/
│   │   ├── prospects.module.ts
│   │   ├── prospects.service.ts
│   │   └── prospects.controller.ts
│   ├── prospecting/
│   │   ├── prospecting.module.ts
│   │   ├── prospecting.service.ts
│   │   └── prospecting.controller.ts
│   └── index.ts
└── package.json
```

### Étape 3.2: Properties Module

```typescript
// src/properties/properties.module.ts
import { Module } from '@nestjs/common';
import { 
  PrismaModule,
  DocumentsModule,
  TasksModule,
  NotificationsModule 
} from '@crm-platform/saas-core';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';

@Module({
  imports: [
    PrismaModule,
    DocumentsModule,    // Réutilisé du Core
    TasksModule,        // Réutilisé du Core
    NotificationsModule // Réutilisé du Core
  ],
  providers: [PropertiesService],
  controllers: [PropertiesController],
  exports: [PropertiesService]
})
export class PropertiesModule {}
```

**Service**:
```typescript
// src/properties/properties.service.ts
import { Injectable } from '@nestjs/common';
import { 
  PrismaService,
  DocumentsService,
  TasksService,
  NotificationsService 
} from '@crm-platform/saas-core';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,         // Core
    private documents: DocumentsService,    // Core
    private tasks: TasksService,           // Core
    private notifications: NotificationsService // Core
  ) {}
  
  async create(data: CreatePropertyDto, userId: string) {
    const property = await this.prisma.properties.create({
      data: { ...data, userId }
    });
    
    // Utiliser les services Core
    await this.tasks.create({
      userId,
      title: `Compléter annonce - ${property.title}`,
      metadata: { propertyId: property.id }
    });
    
    return property;
  }
  
  async uploadPhotos(propertyId: string, files: Express.Multer.File[]) {
    for (const file of files) {
      await this.documents.create({
        userId: property.userId,
        name: file.originalname,
        fileUrl: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        relatedType: 'property',
        relatedId: propertyId
      });
    }
  }
}
```

---

## ✈️ Phase 4: Nouveau Domain - Travel Management (2 semaines)

### Étape 4.1: Créer Package Travel Management

```bash
cd packages/travel-management
npm init -y
npm install @crm-platform/saas-core
```

### Étape 4.2: Schéma Prisma Domain-Specific

```prisma
// packages/travel-management/prisma/schema.prisma
// Extend le schéma Core

model TravelRequest {
  id              String    @id @default(cuid())
  userId          String
  purpose         String
  destination     String
  startDate       DateTime
  endDate         DateTime
  estimatedAmount Float
  currency        String    @default("TND")
  status          String    @default("pending")
  managerId       String?
  hrApproverId    String?
  
  // Relations avec Core modules
  user            users     @relation(fields: [userId], references: [id])
  expenses        Expense[]
  
  // Métadonnées
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([startDate])
}

model Expense {
  id              String        @id @default(cuid())
  travelRequestId String
  userId          String
  category        String        // transport, hotel, meal, other
  description     String?
  amount          Float
  currency        String        @default("TND")
  date            DateTime
  receiptId       String?       // ID du document (Core)
  
  travelRequest   TravelRequest @relation(fields: [travelRequestId], references: [id])
  user            users         @relation(fields: [userId], references: [id])
  
  metadata        Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([travelRequestId])
  @@index([userId])
}

model TravelPolicy {
  id              String   @id @default(cuid())
  name            String
  maxDailyAmount  Float
  categories      Json     // Limites par catégorie
  approvalFlow    Json     // Workflow d'approbation
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Étape 4.3: Travel Requests Module

```typescript
// src/travel-requests/travel-requests.module.ts
import { Module } from '@nestjs/common';
import { 
  PrismaModule,
  NotificationsModule,
  DocumentsModule,
  TasksModule,
  CommunicationsModule,
  AIChatAssistantModule
} from '@crm-platform/saas-core';
import { TravelRequestsService } from './travel-requests.service';
import { TravelRequestsController } from './travel-requests.controller';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,   // Core
    DocumentsModule,       // Core
    TasksModule,          // Core
    CommunicationsModule, // Core
    AIChatAssistantModule // Core
  ],
  providers: [TravelRequestsService],
  controllers: [TravelRequestsController],
  exports: [TravelRequestsService]
})
export class TravelRequestsModule {}
```

**Service complet**:
```typescript
// src/travel-requests/travel-requests.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { 
  PrismaService,
  NotificationsService,
  TasksService,
  CommunicationsService,
  DocumentsService
} from '@crm-platform/saas-core';

export interface CreateTravelRequestDto {
  purpose: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  estimatedAmount: number;
  managerId: string;
}

@Injectable()
export class TravelRequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private tasks: TasksService,
    private communications: CommunicationsService,
    private documents: DocumentsService
  ) {}
  
  async create(data: CreateTravelRequestDto, userId: string) {
    // 1. Valider les dates
    if (data.startDate >= data.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    
    // 2. Créer la demande
    const request = await this.prisma.travelRequest.create({
      data: {
        ...data,
        userId,
        status: 'pending'
      }
    });
    
    // 3. Créer une tâche d'approbation (Core Task Module)
    await this.tasks.create({
      userId: data.managerId,
      title: `Approuver demande de voyage - ${data.destination}`,
      description: `${data.purpose}\nMontant: ${data.estimatedAmount} TND`,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
      priority: 'high',
      metadata: {
        type: 'travel_approval',
        requestId: request.id
      }
    });
    
    // 4. Notifier le manager (Core Notification Module)
    await this.notifications.send({
      userId: data.managerId,
      type: 'travel_approval_required',
      title: 'Nouvelle demande de voyage',
      message: `${data.purpose} - ${data.destination}`,
      data: {
        requestId: request.id,
        amount: data.estimatedAmount
      }
    });
    
    // 5. Envoyer email (Core Communications Module)
    await this.communications.sendEmail({
      to: await this.getUserEmail(data.managerId),
      subject: 'Nouvelle demande de voyage à approuver',
      template: 'travel_approval_request',
      variables: {
        requesterName: await this.getUserName(userId),
        purpose: data.purpose,
        destination: data.destination,
        amount: data.estimatedAmount,
        approvalLink: `${process.env.APP_URL}/travel/approve/${request.id}`
      }
    });
    
    return request;
  }
  
  async approve(requestId: string, managerId: string, comments?: string) {
    // 1. Vérifier que c'est bien le manager
    const request = await this.prisma.travelRequest.findUnique({
      where: { id: requestId }
    });
    
    if (request.managerId !== managerId) {
      throw new BadRequestException('Not authorized');
    }
    
    // 2. Mettre à jour le statut
    const updated = await this.prisma.travelRequest.update({
      where: { id: requestId },
      data: { 
        status: 'manager_approved',
        metadata: {
          ...request.metadata as any,
          managerComments: comments,
          managerApprovedAt: new Date()
        }
      }
    });
    
    // 3. Créer tâche pour RH (Core)
    const hrUsers = await this.getHRUsers();
    for (const hr of hrUsers) {
      await this.tasks.create({
        userId: hr.id,
        title: `Validation finale - Voyage ${request.destination}`,
        description: `Approuvé par le manager\n${comments || ''}`,
        metadata: {
          type: 'travel_final_approval',
          requestId: request.id
        }
      });
    }
    
    // 4. Notifier l'employé (Core)
    await this.notifications.send({
      userId: request.userId,
      type: 'travel_manager_approved',
      title: 'Demande approuvée par le manager',
      message: `Votre demande pour ${request.destination} est en attente de validation RH`,
      data: { requestId: request.id }
    });
    
    // 5. Notifier RH (Core)
    for (const hr of hrUsers) {
      await this.notifications.send({
        userId: hr.id,
        type: 'travel_hr_approval_required',
        title: 'Validation RH requise',
        message: `Demande de voyage pour ${request.destination}`,
        data: { requestId: request.id }
      });
    }
    
    return updated;
  }
  
  async reject(requestId: string, managerId: string, reason: string) {
    const request = await this.prisma.travelRequest.findUnique({
      where: { id: requestId }
    });
    
    if (request.managerId !== managerId) {
      throw new BadRequestException('Not authorized');
    }
    
    // 1. Mettre à jour
    const updated = await this.prisma.travelRequest.update({
      where: { id: requestId },
      data: { 
        status: 'rejected',
        metadata: {
          ...request.metadata as any,
          rejectionReason: reason,
          rejectedAt: new Date()
        }
      }
    });
    
    // 2. Notifier l'employé (Core)
    await this.notifications.send({
      userId: request.userId,
      type: 'travel_rejected',
      title: 'Demande de voyage refusée',
      message: reason,
      data: { requestId: request.id }
    });
    
    // 3. Email (Core)
    await this.communications.sendEmail({
      to: await this.getUserEmail(request.userId),
      subject: 'Demande de voyage refusée',
      template: 'travel_rejection',
      variables: {
        destination: request.destination,
        reason: reason
      }
    });
    
    return updated;
  }
  
  async addExpense(
    requestId: string, 
    data: CreateExpenseDto, 
    userId: string,
    receiptFile?: Express.Multer.File
  ) {
    // 1. Vérifier que c'est l'utilisateur de la demande
    const request = await this.prisma.travelRequest.findUnique({
      where: { id: requestId }
    });
    
    if (request.userId !== userId) {
      throw new BadRequestException('Not authorized');
    }
    
    // 2. Uploader le reçu (Core Documents Module)
    let receiptId: string | null = null;
    if (receiptFile) {
      const receipt = await this.documents.create({
        userId,
        name: `Reçu - ${data.category}`,
        fileUrl: receiptFile.path,
        mimeType: receiptFile.mimetype,
        fileSize: receiptFile.size,
        relatedType: 'travel_request',
        relatedId: requestId,
        metadata: {
          category: data.category,
          amount: data.amount
        }
      });
      receiptId = receipt.id;
    }
    
    // 3. Créer la dépense
    const expense = await this.prisma.expense.create({
      data: {
        ...data,
        userId,
        travelRequestId: requestId,
        receiptId
      }
    });
    
    // 4. Notifier si dépassement budget
    const totalExpenses = await this.getTotalExpenses(requestId);
    if (totalExpenses > request.estimatedAmount * 1.1) {
      await this.notifications.send({
        userId: request.managerId,
        type: 'travel_budget_exceeded',
        title: 'Dépassement de budget',
        message: `Dépenses: ${totalExpenses} TND > Budget: ${request.estimatedAmount} TND`,
        data: { requestId, totalExpenses }
      });
    }
    
    return expense;
  }
  
  async getMyRequests(userId: string, filters?: any) {
    return this.prisma.travelRequest.findMany({
      where: {
        userId,
        ...filters
      },
      include: {
        expenses: true
      },
      orderBy: { startDate: 'desc' }
    });
  }
  
  async getPendingApprovals(managerId: string) {
    return this.prisma.travelRequest.findMany({
      where: {
        managerId,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
  
  // Helpers
  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.users.findUnique({ 
      where: { id: userId },
      select: { email: true }
    });
    return user.email;
  }
  
  private async getUserName(userId: string): Promise<string> {
    const user = await this.prisma.users.findUnique({ 
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });
    return `${user.firstName} ${user.lastName}`;
  }
  
  private async getHRUsers() {
    return this.prisma.users.findMany({
      where: { role: 'hr' }
    });
  }
  
  private async getTotalExpenses(requestId: string): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      where: { travelRequestId: requestId },
      _sum: { amount: true }
    });
    return result._sum.amount || 0;
  }
}
```

### Étape 4.4: Controller

```typescript
// src/travel-requests/travel-requests.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  UseGuards,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser } from '@crm-platform/saas-core';
import { TravelRequestsService } from './travel-requests.service';

@Controller('travel-requests')
@UseGuards(JwtAuthGuard)
export class TravelRequestsController {
  constructor(private service: TravelRequestsService) {}
  
  @Post()
  async create(
    @Body() data: CreateTravelRequestDto,
    @CurrentUser() user: any
  ) {
    return this.service.create(data, user.id);
  }
  
  @Get('my-requests')
  async getMyRequests(@CurrentUser() user: any) {
    return this.service.getMyRequests(user.id);
  }
  
  @Get('pending-approvals')
  async getPendingApprovals(@CurrentUser() user: any) {
    return this.service.getPendingApprovals(user.id);
  }
  
  @Put(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser() user: any
  ) {
    return this.service.approve(id, user.id, comments);
  }
  
  @Put(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any
  ) {
    return this.service.reject(id, user.id, reason);
  }
  
  @Post(':id/expenses')
  @UseInterceptors(FileInterceptor('receipt'))
  async addExpense(
    @Param('id') id: string,
    @Body() data: CreateExpenseDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any
  ) {
    return this.service.addExpense(id, data, user.id, file);
  }
}
```

### Étape 4.5: Application API

```bash
cd apps/travel-api
npm init -y
npm install @crm-platform/saas-core @crm-platform/travel-management
```

**main.ts**:
```typescript
// apps/travel-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  await app.listen(3001);
  console.log('Travel Management API running on http://localhost:3001');
}
bootstrap();
```

**app.module.ts**:
```typescript
// apps/travel-api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { 
  AuthModule,
  UsersModule,
  PrismaModule,
  NotificationsModule,
  DocumentsModule,
  TasksModule,
  CommunicationsModule,
  AIChatAssistantModule
} from '@crm-platform/saas-core';
import { 
  TravelRequestsModule,
  ExpensesModule,
  TravelPoliciesModule
} from '@crm-platform/travel-management';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Core modules (réutilisés)
    AuthModule,
    UsersModule,
    PrismaModule,
    NotificationsModule,
    DocumentsModule,
    TasksModule,
    CommunicationsModule,
    AIChatAssistantModule,
    
    // Domain-specific modules
    TravelRequestsModule,
    ExpensesModule,
    TravelPoliciesModule
  ]
})
export class AppModule {}
```

**.env**:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/travel_management"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="24h"

# App
APP_URL="http://localhost:3000"
NODE_ENV="development"

# Email (pour CommunicationsModule)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"
```

---

## 🧪 Phase 5: Tests (1 semaine)

### Tests Unitaires

```typescript
// packages/saas-core/src/infrastructure/notifications/notifications.service.spec.ts
import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../shared/database/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn()
            }
          }
        }
      ]
    }).compile();
    
    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });
  
  it('should create notification', async () => {
    const payload = {
      userId: 'user1',
      type: 'info',
      title: 'Test',
      message: 'Test message'
    };
    
    jest.spyOn(prisma.notification, 'create').mockResolvedValue({
      id: '1',
      ...payload,
      read: false,
      createdAt: new Date()
    });
    
    const result = await service.send(payload);
    
    expect(result).toBeDefined();
    expect(result.userId).toBe('user1');
  });
});
```

### Tests E2E

```typescript
// apps/travel-api/test/travel-requests.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TravelRequests (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Login pour obtenir token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.accessToken;
  });
  
  it('/travel-requests (POST)', async () => {
    return request(app.getHttpServer())
      .post('/api/travel-requests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        purpose: 'Conférence Paris',
        destination: 'Paris',
        startDate: '2025-02-01',
        endDate: '2025-02-03',
        estimatedAmount: 1500,
        managerId: 'manager-id'
      })
      .expect(201)
      .expect(res => {
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe('pending');
      });
  });
  
  afterAll(async () => {
    await app.close();
  });
});
```

---

## 📊 Métriques de Succès

### Code Reusability
```bash
# Analyser la réutilisation
cd crm-platform
npx cloc packages/saas-core packages/travel-management

# Résultat attendu:
# saas-core: ~15000 lignes
# travel-management: ~1500 lignes
# Ratio: 90% réutilisé!
```

### Performance
```bash
# Load testing
npm install -g artillery
artillery quick --duration 60 --rate 10 http://localhost:3001/api/travel-requests
```

---

## 🎓 Formation Équipe

### Documentation à créer:
1. **Guide d'Architecture** (fait ✓)
2. **API Documentation** (Swagger)
3. **Examples de Code**
4. **Video tutorials**

### Sessions de formation:
- Semaine 1: Overview Architecture SaaS Core
- Semaine 2: Hands-on - Créer un module
- Semaine 3: Best practices & Patterns
- Semaine 4: Debug & Troubleshooting

---

## ✅ Checklist de Déploiement

### Pré-production
- [ ] Tests unitaires 100% passants
- [ ] Tests E2E passants
- [ ] Code review complet
- [ ] Documentation à jour
- [ ] Migrations DB testées
- [ ] Performance benchmarks OK
- [ ] Sécurité audit (OWASP)

### Production
- [ ] Backup DB
- [ ] Déploiement progressif (canary)
- [ ] Monitoring actif
- [ ] Rollback plan prêt
- [ ] Support 24/7 disponible

---

## 🚨 Troubleshooting

### Problème: Imports circulaires
```bash
# Détecter
npx madge --circular --extensions ts src/

# Solution: Réorganiser les imports avec index.ts
```

### Problème: Performance lente
```typescript
// Ajouter du caching
import { CacheModule } from '@crm-platform/saas-core';

@Module({
  imports: [CacheModule]
})
```

### Problème: Database schema conflicts
```bash
# Reset et migrations
npx prisma migrate reset
npx prisma migrate deploy
```

---

## 📞 Support

- Documentation: https://docs.your-company.com
- Slack: #saas-core-support
- Email: tech-support@your-company.com

---

**🎉 Félicitations! Vous avez maintenant un SaaS Core prêt à l'emploi!**

**Prochaine étape**: Choisir votre prochain domaine métier et répéter le processus! 🚀
