# 🔍 Phase 0.1 - Analyse Modules Backend Prospection

**Date:** 11 janvier 2026
**Branch:** `phase0-backend-critical-fixes`
**Objectif:** Analyser et consolider les modules prospecting/prospecting-ai

---

## 📊 État Actuel

### Module `prospecting/` - PRINCIPAL (COMPLET)

**Localisation:** `backend/src/modules/prospecting/`

**Fichiers principaux:**
```
prospecting/
├── prospecting.controller.ts               (15KB - 40+ endpoints)
├── prospecting.service.ts                  (59KB - Service principal)
├── llm-prospecting.service.ts              (35KB - Pipeline LLM/IA)
├── prospecting-integration.service.ts      (40KB - Intégrations externes)
├── scraping-queue.service.ts               (15KB - Queue asynchrone)
├── behavioral-prospecting.controller.ts    (13KB - Signaux comportementaux)
├── behavioral-signals.service.ts           (15KB - Détection signaux)
└── browserless.service.ts                  (12KB - Scraping headless)
```

**Endpoints disponibles (40+):**

#### 1. Campagnes (8 endpoints)
- POST `/campaigns` - Créer campagne
- GET `/campaigns` - Lister campagnes
- GET `/campaigns/:id` - Détails campagne
- PUT `/campaigns/:id` - Modifier campagne
- DELETE `/campaigns/:id` - Supprimer campagne
- POST `/campaigns/:id/start` - Démarrer campagne
- POST `/campaigns/:id/pause` - Pause campagne
- GET `/campaigns/:id/stats` - Stats campagne

#### 2. Leads (9 endpoints)
- GET `/campaigns/:campaignId/leads` - Lister leads
- GET `/leads/:id` - Détails lead
- PUT `/leads/:id` - Modifier lead
- DELETE `/leads/:id` - Supprimer lead
- POST `/leads/:id/convert` - Convertir en prospect
- POST `/leads/:id/qualify` - Qualifier avec IA
- POST `/leads/:id/enrich` - Enrichir données
- POST `/leads/:id/find-matches` - Trouver correspondances
- GET `/leads/:id/matches` - Lister correspondances

#### 3. Scraping (5 endpoints)
- POST `/scrape/serp` - Scraper via SERP API
- POST `/scrape/firecrawl` - Scraper via Firecrawl
- POST `/scrape/pica` - Scraper via Pica AI
- POST `/scrape/social` - Scraper réseaux sociaux
- POST `/scrape/websites` - Scraper sites web

#### 4. AI Analysis (6 endpoints)
- POST `/ai/detect-opportunities` - Détecter opportunités
- POST `/ai/analyze-content` - Analyser contenu
- POST `/ai/classify-lead` - Classifier lead
- POST `/llm/analyze-item` - Analyser item scrapé
- POST `/llm/build-lead` - Construire lead structuré
- POST `/llm/analyze-batch` - Analyser batch

#### 5. Ingestion Pipeline (2 endpoints)
- POST `/campaigns/:campaignId/ingest` - Ingérer items scrapés
- POST `/campaigns/:campaignId/scrape-and-ingest` - Scraper + Ingérer

#### 6. Statistiques (4 endpoints)
- GET `/stats` - Stats globales
- GET `/stats/sources` - Stats par source
- GET `/stats/conversion` - Stats conversion
- GET `/stats/roi` - ROI

#### 7. Utilitaires (6 endpoints)
- POST `/validate-emails` - Valider emails
- POST `/validate-phones` - Valider téléphones
- GET `/locations` - Localisations disponibles
- POST `/deduplicate` - Dédupliquer leads
- GET `/export/:campaignId` - Exporter leads
- POST `/import` - Importer leads

**✅ Points Forts:**
- Architecture complète et robuste
- Services bien séparés
- Queue asynchrone pour scraping
- Pipeline LLM intégré
- Tests unitaires présents

---

### Module `prospecting-ai/` - WRAPPER (PROBLÉMATIQUE)

**Localisation:** `backend/src/modules/prospecting-ai/`

**Fichiers principaux:**
```
prospecting-ai/
├── prospecting-ai.controller.ts            (6KB - 4 endpoints)
├── prospecting-ai.module.ts                (0.8KB)
└── services/
    ├── prospection.service.ts              (7KB - Wrapper AI Orchestrator)
    └── prospection-export.service.ts       (4KB - Export)
```

**Endpoints (4 seulement):**
- POST `/prospecting-ai/start` - Lancer prospection
- GET `/prospecting-ai/:id` - Récupérer résultat
- GET `/prospecting-ai/:id/export` - Exporter
- POST `/prospecting-ai/:id/convert-to-prospects` - Convertir

**❌ PROBLÈMES CRITIQUES:**

#### 1. Cache In-Memory (PERTE DE DONNÉES)
**Fichier:** `prospecting-ai.controller.ts` (lignes 33-68)

```typescript
// ❌ PROBLÈME: Stockage en mémoire volatile
private readonly resultsCache = new Map<string, any>();

async startProspection(...) {
  const result = await this.prospectionService.startProspection(...);

  // Stocker en cache (volatile!)
  this.resultsCache.set(result.id, result);

  // ❌ SUPPRESSION AUTOMATIQUE APRÈS 1H
  setTimeout(() => {
    this.resultsCache.delete(result.id);
  }, 3600000);
}

async getProspectionResult(id: string) {
  const result = this.resultsCache.get(id);

  // ❌ ERREUR si expiré ou serveur redémarré
  if (!result) {
    throw new HttpException('Prospection not found or expired', 404);
  }
}
```

**Conséquences:**
- 🔴 Perte de données si serveur redémarre
- 🔴 Perte de données après 1h
- 🔴 Pas de persistance
- 🔴 Impossible de récupérer l'historique

#### 2. Duplication de Fonctionnalités
Le module `prospecting-ai` fait exactement ce que `prospecting` fait déjà:
- Lancer prospection → `prospecting` a `POST /campaigns/:id/start`
- Récupérer résultat → `prospecting` a `GET /campaigns/:id`
- Exporter → `prospecting` a `GET /export/:campaignId`
- Convertir → `prospecting` a `POST /leads/:id/convert`

#### 3. Architecture Incohérente
- `prospecting-ai` appelle `AiOrchestratorService` directement
- `prospecting` utilise ses propres services + LLM pipeline
- Deux chemins différents pour la même fonctionnalité

---

## 🎯 Plan d'Action - Consolidation

### Objectif
Migrer les 4 endpoints de `prospecting-ai` vers `prospecting` avec persistance DB.

### Étapes

#### Étape 1: Ajouter Persistance DB
**Créer:** Migration Prisma pour table `prospecting_results`

```prisma
model prospecting_results {
  id              String   @id @default(cuid())
  userId          String
  tenantId        String
  campaignId      String?

  // Configuration
  zone            String
  targetType      String
  propertyType    String
  budget          Json?
  keywords        String[]

  // Résultats
  status          String   // pending, running, completed, failed
  leads           Json     // Array de leads
  stats           Json     // Statistiques
  metadata        Json     // Métadonnées
  errors          String[]

  // Timestamps
  createdAt       DateTime @default(now())
  completedAt     DateTime?

  // Relations
  user            users    @relation(fields: [userId], references: [id])
  campaign        prospecting_campaigns? @relation(fields: [campaignId], references: [id])

  @@index([userId])
  @@index([tenantId])
  @@index([campaignId])
  @@index([status])
  @@index([createdAt])
}
```

#### Étape 2: Migrer Endpoints vers `prospecting`
Ajouter dans `prospecting.controller.ts`:

```typescript
@Post('ai/start')
@ApiOperation({ summary: 'Lancer une prospection IA (avec persistance DB)' })
async startAiProspection(@Request() req, @Body() request: StartProspectionDto) {
  const userId = req.user.userId;
  const tenantId = req.user.tenantId || userId;

  // Créer l'entrée en DB (état: pending)
  const prospectionResult = await this.prisma.prospecting_results.create({
    data: {
      userId,
      tenantId,
      zone: request.zone,
      targetType: request.targetType,
      propertyType: request.propertyType,
      budget: request.budget,
      keywords: request.keywords,
      status: 'pending',
      leads: [],
      stats: {},
      metadata: {},
      errors: [],
    },
  });

  // Lancer l'orchestration en background
  this.aiOrchestratorService.orchestrate({
    prospectionId: prospectionResult.id,
    tenantId,
    userId,
    objective: 'prospection',
    context: request,
  }).then(async (result) => {
    // Mettre à jour en DB quand terminé
    await this.prisma.prospecting_results.update({
      where: { id: prospectionResult.id },
      data: {
        status: 'completed',
        leads: result.leads,
        stats: result.stats,
        metadata: result.metadata,
        errors: result.errors,
        completedAt: new Date(),
      },
    });
  });

  return {
    prospectionId: prospectionResult.id,
    status: 'pending',
    message: 'Prospection lancée en arrière-plan',
  };
}

@Get('ai/:id')
@ApiOperation({ summary: 'Récupérer le résultat d une prospection IA (depuis DB)' })
async getAiProspectionResult(@Request() req, @Param('id') id: string) {
  const result = await this.prisma.prospecting_results.findUnique({
    where: { id },
  });

  if (!result || result.userId !== req.user.userId) {
    throw new HttpException('Prospection not found', 404);
  }

  return result;
}

@Get('ai/:id/export')
@ApiOperation({ summary: 'Exporter une prospection IA' })
async exportAiProspection(
  @Request() req,
  @Param('id') id: string,
  @Query('format') format: 'json' | 'csv' | 'xlsx' = 'json',
  @Res() res: Response,
) {
  const result = await this.prisma.prospecting_results.findUnique({
    where: { id },
  });

  if (!result || result.userId !== req.user.userId) {
    throw new HttpException('Prospection not found', 404);
  }

  const exportData = await this.exportService.export(result, format);

  res.setHeader('Content-Type', exportData.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);

  return res.send(exportData.data);
}

@Post('ai/:id/convert-to-prospects')
@ApiOperation({ summary: 'Convertir les leads d une prospection IA en prospects CRM' })
async convertAiProspectionToProspects(@Request() req, @Param('id') id: string) {
  const result = await this.prisma.prospecting_results.findUnique({
    where: { id },
  });

  if (!result || result.userId !== req.user.userId) {
    throw new HttpException('Prospection not found', 404);
  }

  // Convertir chaque lead en prospect CRM
  const leads = result.leads as any[];
  const converted = [];

  for (const lead of leads) {
    const prospect = await this.prisma.prospects.create({
      data: {
        userId: req.user.userId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: `prospection-ai:${id}`,
        status: 'new',
        // ... autres champs
      },
    });
    converted.push(prospect);
  }

  return {
    prospectionId: id,
    totalLeads: leads.length,
    converted: converted.length,
    leads: converted,
  };
}
```

#### Étape 3: Déprécier `prospecting-ai`
1. Ajouter un warning dans tous les endpoints `prospecting-ai`
2. Rediriger vers les nouveaux endpoints `prospecting/ai/*`
3. Planifier suppression dans 3 mois

```typescript
@Post('start')
@ApiOperation({
  summary: 'DEPRECATED: Use POST /api/prospecting/ai/start instead',
  deprecated: true,
})
async startProspection(...) {
  this.logger.warn('DEPRECATED: /prospecting-ai/start is deprecated. Use /prospecting/ai/start instead');
  // Rediriger vers le nouveau endpoint...
}
```

---

## ✅ Bénéfices de la Consolidation

| Aspect | Avant | Après |
|--------|-------|-------|
| **Persistance** | ❌ In-memory (1h) | ✅ DB permanente |
| **Perte données** | 🔴 Oui (redémarrage) | ✅ Non |
| **Historique** | ❌ Non accessible | ✅ Complet |
| **Modules** | 2 modules séparés | 1 module unifié |
| **Endpoints** | 44 endpoints | 44 endpoints (consolidés) |
| **Cache** | Map in-memory | DB + Redis (optionnel) |
| **Architecture** | Incohérente | Cohérente |

---

## 📋 Checklist Phase 0.1

- [x] Analyser module `prospecting`
- [x] Analyser module `prospecting-ai`
- [x] Identifier problèmes critiques
- [x] Documenter plan de consolidation
- [ ] Implémenter migration Prisma
- [ ] Migrer endpoints vers `prospecting`
- [ ] Ajouter tests
- [ ] Déprécier `prospecting-ai`
- [ ] Commit et push

---

**Prochaine étape:** Phase 0.2 - Implémenter les actions manquantes (Add to CRM, Contact, Reject)
