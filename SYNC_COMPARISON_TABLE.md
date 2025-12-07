# Tableau Comparatif Backend-Frontend - Synchronisation des APIs

## Date: 2025-12-07

---

## 1. MODULE CAMPAIGNS

### Tableau de Correspondance

| # | Frontend Client | Méthode HTTP | Endpoint | Backend Controller | Méthode HTTP | Endpoint | Sync | Notes |
|---|----------------|--------------|----------|-------------------|--------------|----------|------|-------|
| 1 | `create()` | POST | `/campaigns` | `create()` | POST | `/campaigns` | ✅ | Parfait |
| 2 | `list()` | GET | `/campaigns` | `findAll()` | GET | `/campaigns` | ✅ | Parfait |
| 3 | `getById()` | GET | `/campaigns/:id` | `findOne()` | GET | `/campaigns/:id` | ✅ | Parfait |
| 4 | `update()` | **PATCH** | `/campaigns/:id` | `update()` | **PUT** | `/campaigns/:id` | ⚠️ | **HTTP method mismatch** |
| 5 | `delete()` | DELETE | `/campaigns/:id` | `delete()` | DELETE | `/campaigns/:id` | ✅ | Parfait |
| 6 | `getStats()` | **GET** | `/campaigns/:id/stats` | `updateStats()` | **PUT** | `/campaigns/:id/stats` | ❌ | **Endpoint mismatch** |
| 7 | `getLeads()` | GET | `/campaigns/:id/leads` | `getCampaignLeads()` | GET | `/campaigns/:id/leads` | ✅ | Parfait |
| 8 | `convertLead()` | POST | `/campaigns/:id/leads/:leadId/convert` | `convertLeadToProspect()` | POST | `/campaigns/leads/convert` | ❌ | **Route structure mismatch** |
| 9 | `start()` | POST | `/campaigns/:id/start` | ❌ N/A | - | - | ❌ | **Backend missing** |
| 10 | `pause()` | POST | `/campaigns/:id/pause` | ❌ N/A | - | - | ❌ | **Backend missing** |
| 11 | `resume()` | POST | `/campaigns/:id/resume` | ❌ N/A | - | - | ❌ | **Backend missing** |
| 12 | `complete()` | POST | `/campaigns/:id/complete` | ❌ N/A | - | - | ❌ | **Backend missing** |
| 13 | `duplicate()` | POST | `/campaigns/:id/duplicate` | ❌ N/A | - | - | ❌ | **Backend missing** |
| 14 | `test()` | POST | `/campaigns/:id/test` | ❌ N/A | - | - | ❌ | **Backend missing** |

### Statistiques
- **Total Endpoints Frontend:** 14
- **Synchronisés:** 5 (36%)
- **Partiellement synchronisés:** 3 (21%)
- **Non synchronisés:** 6 (43%)

### Actions Requises

#### 🔴 CRITIQUE - À corriger immédiatement

1. **Méthode HTTP incohérente (update)**
   ```typescript
   // OPTION A: Changer le frontend
   // frontend/src/shared/utils/campaigns-api.ts
   update: async (id: string, updates: Partial<CreateCampaignDTO>) => {
     const response = await apiClient.put(`/campaigns/${id}`, updates); // PATCH → PUT
     return response.data;
   }
   
   // OPTION B: Changer le backend (préféré si RESTful)
   // backend/src/modules/marketing/campaigns/campaigns.controller.ts
   @Patch(':id')  // PUT → PATCH
   update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
     return this.campaignsService.update(id, req.user.userId, dto);
   }
   ```

2. **getStats endpoint incompatible**
   ```typescript
   // Backend: Ajouter endpoint GET
   @Get(':id/stats')
   @ApiOperation({ summary: 'Obtenir les statistiques' })
   getStats(@Param('id') id: string, @Request() req) {
     return this.campaignsService.getStats(id, req.user.userId);
   }
   ```

3. **convertLead endpoint incompatible**
   ```typescript
   // OPTION A: Aligner le frontend sur le backend (plus simple)
   convertLead: async (campaignId: string, leadId: string) => {
     const response = await apiClient.post(
       `/campaigns/leads/convert`,  // Changer la route
       { campaignId, leadId }  // Passer en body
     );
     return response.data;
   }
   
   // OPTION B: Changer le backend
   @Post(':campaignId/leads/:leadId/convert')
   convertLeadToProspect(@Param('campaignId') campaignId: string, @Param('leadId') leadId: string, @Request() req) {
     return this.campaignsService.convertLeadToProspect(req.user.userId, { campaignId, leadId });
   }
   ```

#### 🟡 IMPORTANT - Actions de campagne

4. **Implémenter les actions manquantes dans le backend**
   ```typescript
   // backend/src/modules/marketing/campaigns/campaigns.controller.ts
   
   @Post(':id/start')
   @ApiOperation({ summary: 'Démarrer une campagne' })
   startCampaign(@Param('id') id: string, @Request() req) {
     return this.campaignsService.start(id, req.user.userId);
   }
   
   @Post(':id/pause')
   @ApiOperation({ summary: 'Mettre en pause' })
   pauseCampaign(@Param('id') id: string, @Request() req) {
     return this.campaignsService.pause(id, req.user.userId);
   }
   
   @Post(':id/resume')
   @ApiOperation({ summary: 'Reprendre' })
   resumeCampaign(@Param('id') id: string, @Request() req) {
     return this.campaignsService.resume(id, req.user.userId);
   }
   
   @Post(':id/complete')
   @ApiOperation({ summary: 'Terminer' })
   completeCampaign(@Param('id') id: string, @Request() req) {
     return this.campaignsService.complete(id, req.user.userId);
   }
   
   @Post(':id/duplicate')
   @ApiOperation({ summary: 'Dupliquer' })
   duplicateCampaign(@Param('id') id: string, @Body() body: { name: string }, @Request() req) {
     return this.campaignsService.duplicate(id, body.name, req.user.userId);
   }
   
   @Post(':id/test')
   @ApiOperation({ summary: 'Tester avec échantillon' })
   testCampaign(@Param('id') id: string, @Body() body: { testEmails: string[] }, @Request() req) {
     return this.campaignsService.test(id, body.testEmails, req.user.userId);
   }
   ```

---

## 2. MODULE SEO AI

### Tableau de Correspondance

| # | Frontend Usage | Méthode HTTP | Endpoint | Backend Controller | Méthode HTTP | Endpoint | Sync | Notes |
|---|---------------|--------------|----------|-------------------|--------------|----------|------|-------|
| 1 | `api.post()` | POST | `/seo-ai/optimize/:propertyId` | `optimizeProperty()` | POST | `/seo-ai/optimize/:propertyId` | ✅ | Parfait |
| 2 | `api.get()` | GET | `/seo-ai/property/:propertyId` | `getOptimization()` | GET | `/seo-ai/property/:propertyId` | ✅ | Parfait |
| 3 | `api.post()` | POST | `/seo-ai/generate/alt-text` | `generateAltText()` | POST | `/seo-ai/generate/alt-text` | ✅ | Parfait |
| 4 | `api.post()` | POST | `/seo-ai/optimize/batch` | `optimizeBatch()` | POST | `/seo-ai/optimize/batch` | ✅ | Parfait |

### Statistiques
- **Total Endpoints Frontend:** 4
- **Synchronisés:** 4 (100%)
- **Non synchronisés:** 0 (0%)

### Actions Requises

✅ **Aucune action requise** - Synchronisation parfaite!

---

## 3. MODULE DOCUMENTS

### Tableau de Correspondance (Endpoints Utilisés)

| # | Frontend Usage | Méthode HTTP | Endpoint | Backend Controller | Méthode HTTP | Endpoint | Sync | Notes |
|---|---------------|--------------|----------|-------------------|--------------|----------|------|-------|
| 1 | `api.get()` | GET | `/documents` | `findAll()` | GET | `/documents` | ✅ | Parfait |
| 2 | `api.post()` | POST | `/documents/upload` | `upload()` | POST | `/documents/upload` | ✅ | Multipart |
| 3 | `api.get()` | GET | `/documents/:id/download` | `download()` | GET | `/documents/:id/download` | ✅ | Blob response |
| 4 | `api.delete()` | DELETE | `/documents/:id` | `delete()` | DELETE | `/documents/:id` | ✅ | Parfait |

### Endpoints Backend Non Utilisés par le Frontend

| Catégorie | Endpoint Backend | Disponible | Utilisé Frontend | Notes |
|-----------|-----------------|------------|------------------|-------|
| **Stats** | GET `/documents/stats/overview` | ✅ | ❌ | Pourrait enrichir l'UI |
| **AI Generation** | POST `/documents/ai/generate` | ✅ | ✅ | Utilisé dans `/documents/generate` |
| **AI History** | GET `/documents/ai/history` | ✅ | ❌ | Historique non affiché |
| **AI Stats** | GET `/documents/ai/stats` | ✅ | ❌ | Stats AI non affichées |
| **AI Settings** | GET/POST `/documents/ai/settings` | ✅ | ❌ | Configuration non exposée |
| **OCR** | POST `/documents/:id/ocr` | ✅ | ❌ | Fonctionnalité OCR non utilisée |
| **OCR History** | GET `/documents/ocr/history` | ✅ | ❌ | Historique OCR non affiché |
| **OCR Search** | GET `/documents/ocr/search` | ✅ | ❌ | Recherche OCR non disponible |
| **Categories** | POST/GET/PUT/DELETE `/documents/categories/*` | ✅ | ❌ | CRUD catégories manquant |
| **Templates** | POST/GET/PUT/DELETE `/documents/templates/*` | ✅ | ❌ | CRUD templates manquant |

### Statistiques
- **Total Endpoints Backend:** 20+
- **Endpoints Utilisés:** 4 (20%)
- **Endpoints Non Utilisés:** 16+ (80%)

### Actions Requises

#### 🟢 OPTIONNEL - Enrichissement de l'UI

Les endpoints backend sont complets mais le frontend n'expose qu'une partie. Ces améliorations ne sont **pas bloquantes** mais ajouteraient de la valeur:

1. **Dashboard de statistiques**
   ```typescript
   // Ajouter dans /pages/documents/index.tsx
   const [stats, setStats] = useState(null);
   
   useEffect(() => {
     const loadStats = async () => {
       const response = await api.get('/documents/stats/overview');
       setStats(response.data);
     };
     loadStats();
   }, []);
   ```

2. **Historique AI et OCR**
   ```typescript
   // Nouvel onglet dans la page documents
   <Tabs>
     <TabPanel value="documents">...</TabPanel>
     <TabPanel value="ai-history">
       // Afficher GET /documents/ai/history
     </TabPanel>
     <TabPanel value="ocr-history">
       // Afficher GET /documents/ocr/history
     </TabPanel>
   </Tabs>
   ```

3. **Gestion des catégories**
   ```typescript
   // Nouveau modal pour CRUD catégories
   // POST/GET/PUT/DELETE /documents/categories/*
   ```

4. **Gestion des templates**
   ```typescript
   // Nouveau modal pour CRUD templates
   // POST/GET/PUT/DELETE /documents/templates/*
   ```

---

## 4. RÉSUMÉ GLOBAL

### Score de Synchronisation par Module

| Module | Endpoints Frontend | Endpoints Synchronisés | Score | Statut |
|--------|-------------------|----------------------|-------|--------|
| Campaigns | 14 | 5 (+ 3 partiels) | 57% | ⚠️ INCOMPLET |
| SEO AI | 4 | 4 | 100% | ✅ PARFAIT |
| Documents | 4 | 4 | 100% | ✅ PARFAIT |
| **TOTAL** | **22** | **13** | **76%** | ⚠️ BON |

### Problèmes par Criticité

| Criticité | Nombre | Module | Description |
|-----------|--------|--------|-------------|
| 🔴 Critique | 3 | Campaigns | HTTP method mismatch, endpoint incompatibilities |
| 🟡 Important | 6 | Campaigns | Actions de campagne manquantes |
| 🟢 Optionnel | 16+ | Documents | Fonctionnalités avancées non exposées |

---

## 5. PLAN D'ACTION RECOMMANDÉ

### Phase 1: Corrections Critiques (2-3h)

**Objectif:** Atteindre 85% de synchronisation

1. ✅ Aligner les méthodes HTTP (PUT vs PATCH) - 15min
2. ✅ Ajouter `GET /campaigns/:id/stats` au backend - 30min
3. ✅ Aligner l'endpoint `convertLead` - 30min
4. ✅ Tester avec cURL - 30min

### Phase 2: Actions de Campagne (3-4h)

**Objectif:** Atteindre 95% de synchronisation

5. ✅ Implémenter `start`, `pause`, `resume`, `complete` - 2h
6. ✅ Implémenter `duplicate` et `test` - 1h
7. ✅ Tester avec Swagger - 1h

### Phase 3: Enrichissement (Optionnel, 1-2 semaines)

**Objectif:** Exposer toutes les fonctionnalités backend

8. ⚪ Ajouter dashboard stats documents
9. ⚪ Créer UI pour gestion catégories
10. ⚪ Créer UI pour gestion templates
11. ⚪ Intégrer OCR dans l'interface

---

## 6. COMMANDES DE TEST

### Test avec cURL

```bash
# Utiliser le script fourni
./test-api-sync.sh http://localhost:3000/api YOUR_JWT_TOKEN

# Ou manuellement
export API_URL="http://localhost:3000/api"
export TOKEN="your_jwt_token"

# Test Campaigns
curl -X GET "$API_URL/campaigns" -H "Authorization: Bearer $TOKEN"

# Test SEO AI
curl -X POST "$API_URL/seo-ai/optimize/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyIds":["id1"]}'

# Test Documents
curl -X GET "$API_URL/documents" -H "Authorization: Bearer $TOKEN"
```

### Test avec Swagger

1. Démarrer le backend: `npm run start:dev`
2. Ouvrir: `http://localhost:3000/api/docs`
3. Cliquer sur "Authorize" et entrer le JWT
4. Tester chaque endpoint des 3 modules

---

## 7. CONCLUSION

### État Actuel
- **SEO AI:** ✅ 100% synchronisé
- **Documents:** ✅ 100% synchronisé (base), 20% des fonctionnalités exposées
- **Campaigns:** ⚠️ 57% synchronisé, nécessite corrections

### Recommandation

**Action immédiate requise sur le module Campaigns** pour aligner backend et frontend avant la production. Les autres modules sont fonctionnels mais pourraient être enrichis.

**Temps estimé total:** 5-7 heures pour atteindre 95% de synchronisation complète.

---

**Document généré:** 2025-12-07
**Auteur:** Claude AI (GitHub Copilot)
**Status:** ⚠️ Analyse complète - Actions requises sur Campaigns
