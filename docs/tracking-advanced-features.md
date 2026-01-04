# Fonctionnalités Avancées de Tracking

Ce document décrit les 4 nouvelles fonctionnalités avancées ajoutées au module de tracking :

1. **WebSocket Temps Réel**
2. **Heatmaps**
3. **A/B Testing**
4. **Attribution Multi-Touch**

---

## 1. 🔴 WebSocket Temps Réel

### Objectif
Voir les événements de tracking arriver en temps réel dans le dashboard CRM sans polling HTTP.

### Architecture

**Backend** : `TrackingRealtimeGateway`
- WebSocket Gateway sur `/tracking-realtime`
- Authentification JWT obligatoire
- Support des rooms par utilisateur, plateforme et type d'événement
- Auto-reconnexion et gestion des déconnexions

**Frontend** : `/marketing/tracking/realtime`
- Dashboard temps réel avec Socket.IO client
- Auto-refresh optionnel
- Filtres par plateforme et type d'événement
- KPIs en direct (total events, events/min, users actifs)

### Utilisation

**Backend** (émission automatique) :
```typescript
// Dans TrackingEventsService, après sauvegarde d'un événement :
this.realtimeGateway.emitTrackingEvent({
  userId,
  platform: 'meta',
  eventName: 'PageView',
  eventData: {...},
  timestamp: new Date(),
  id: savedEvent.id
});
```

**Frontend** (réception) :
```typescript
const socket = io('http://localhost:3000/tracking-realtime', {
  auth: { token: 'JWT_TOKEN' }
});

socket.on('tracking:new-event', (event) => {
  console.log('Nouvel événement:', event);
  // Mettre à jour l'UI
});
```

### Endpoints WebSocket

- `tracking:subscribe` - S'abonner à des filtres spécifiques
- `tracking:unsubscribe` - Se désabonner
- `tracking:new-event` - Événement émis automatiquement
- `tracking:stats-update` - Mise à jour des stats
- `tracking:alert` - Alertes/anomalies

### Accès Dashboard
`/marketing/tracking/realtime`

---

## 2. 🎯 Heatmaps

### Objectif
Visualiser où les visiteurs cliquent, déplacent leur souris et scrollent sur les pages vitrines.

### Architecture

**Backend** :
- `HeatmapService` - Stockage et agrégation des données
- `HeatmapController` - API endpoints

**Frontend** :
- `HeatmapTracker` - Composant React pour tracker automatiquement
- Enregistre clics, mouvements souris (throttled), et scroll
- Batch d'événements envoyé toutes les 10s ou 50 events

### Modèle de données

```typescript
interface HeatmapEvent {
  userId: string;
  pageUrl: string;
  x: number; // Position X
  y: number; // Position Y
  type: 'click' | 'move' | 'scroll';
  sessionId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenWidth: number;
  screenHeight: number;
  element?: string; // Sélecteur CSS de l'élément cliqué
  timestamp: Date;
}
```

### Utilisation

**Frontend (tracking automatique)** :
```tsx
import { HeatmapTracker } from '@/shared/components/vitrine/HeatmapTracker';

export default function VitrineProperty({ agencyId }) {
  return (
    <>
      {/* Tracker automatiquement tous les clics/mouvements/scroll */}
      <HeatmapTracker agencyId={agencyId} enabled={true} throttleMs={500} />

      {/* Contenu de la page */}
    </>
  );
}
```

**Backend (récupération données)** :
```http
GET /api/marketing-tracking/heatmap/data?pageUrl=https://...&type=click&deviceType=desktop
GET /api/marketing-tracking/heatmap/stats?pageUrl=https://...
GET /api/marketing-tracking/heatmap/scroll-depth?pageUrl=https://...
GET /api/marketing-tracking/heatmap/pages
```

### Données retournées

**Heatmap data** :
```json
[
  { "x": 100, "y": 200, "value": 15, "type": "click" },
  { "x": 120, "y": 220, "value": 8, "type": "click" }
]
```

**Stats** :
```json
{
  "totalClicks": 1247,
  "totalMoves": 8563,
  "totalScrolls": 2341,
  "uniqueSessions": 456,
  "deviceBreakdown": [
    { "deviceType": "desktop", "count": 890 },
    { "deviceType": "mobile", "count": 357 }
  ],
  "topClickedElements": [
    { "element": "button.cta", "clicks": 234 },
    { "element": "a.property-card", "clicks": 189 }
  ]
}
```

**Scroll depth** :
```json
{
  "averageScrollDepth": 67,
  "maxScrollDepth": 100,
  "scrollReachPercentages": {
    "25%": 95,
    "50%": 78,
    "75%": 45,
    "100%": 12
  }
}
```

### Visualisation

Utiliser une bibliothèque comme `heatmap.js` ou `@nivo/heatmap` pour afficher les données :

```tsx
import h337 from 'heatmap.js';

const heatmapInstance = h337.create({
  container: document.getElementById('heatmap-container')
});

heatmapInstance.setData({
  max: maxValue,
  data: heatmapData.map(point => ({
    x: point.x,
    y: point.y,
    value: point.value
  }))
});
```

---

## 3. 🧪 A/B Testing

### Objectif
Tester différentes configurations de tracking pixels pour identifier la plus performante.

### Architecture

**Service** : `ABTestingService`

### Modèle de données

```typescript
interface ABTest {
  id: string;
  userId: string;
  name: string;
  description?: string;
  variantAConfig: any; // Config tracking variante A
  variantBConfig: any; // Config tracking variante B
  trafficSplit: number; // % pour A (0-100)
  startDate: Date;
  endDate: Date;
  status: 'running' | 'stopped' | 'completed';
}

interface ABTestAssignment {
  testId: string;
  sessionId: string;
  variant: 'A' | 'B';
}

interface ABTestResult {
  testId: string;
  sessionId: string;
  variant: 'A' | 'B';
  eventName: string;
  value?: number;
  timestamp: Date;
}
```

### Utilisation

**Créer un test A/B** :
```typescript
const test = await abTestingService.createABTest(userId, {
  name: 'Test Meta Pixel vs GTM',
  description: 'Comparer Meta Pixel direct vs GTM pour tracking des conversions',
  variantA: {
    platform: 'meta',
    pixelId: '123456789',
    events: ['PageView', 'ViewContent', 'Lead']
  },
  variantB: {
    platform: 'google_tag_manager',
    containerId: 'GTM-XXXXX',
    events: ['page_view', 'view_item', 'generate_lead']
  },
  trafficSplit: 50, // 50% A, 50% B
  duration: 14 // 14 jours
});
```

**Obtenir la variante pour un utilisateur** :
```typescript
const variant = await abTestingService.getVariantForSession(testId, sessionId);
// Retourne 'A' ou 'B' de manière déterministe (même session = même variant)
```

**Enregistrer une conversion** :
```typescript
await abTestingService.recordConversion(testId, sessionId, 'Lead', 150);
```

**Obtenir les stats** :
```typescript
const stats = await abTestingService.getTestStats(testId);
```

**Résultat** :
```json
{
  "test": { "id": "...", "name": "Test Meta Pixel vs GTM", ... },
  "variantA": {
    "totalEvents": 1247,
    "conversions": 34,
    "conversionRate": "2.73"
  },
  "variantB": {
    "totalEvents": 1189,
    "conversions": 41,
    "conversionRate": "3.45"
  },
  "winner": "B",
  "improvementPercentage": "0.72",
  "isStatisticallySignificant": true,
  "zScore": "2.14"
}
```

### Test de signification statistique

Le service utilise un Z-test pour déterminer si la différence est statistiquement significative (p < 0.05).

- **zScore > 1.96** → Différence significative
- **isStatisticallySignificant: true** → Résultats fiables

---

## 4. 📊 Attribution Multi-Touch

### Objectif
Analyser le parcours complet du lead et attribuer le crédit de conversion à chaque point de contact selon différents modèles.

### Modèles d'attribution

1. **First Touch** - 100% au premier contact
2. **Last Touch** - 100% au dernier contact
3. **Linear** - Crédit égal à tous les points
4. **Time Decay** - Plus de crédit aux interactions récentes
5. **Position-Based (U-Shaped)** - 40% premier, 40% dernier, 20% milieu
6. **Data-Driven** - Basé sur les données réelles de conversion

### Architecture

**Service** : `AttributionMultiTouchService`

### Parcours utilisateur

```
PageView (Meta) → ViewContent (GTM) → Search (GA4) → Lead (Meta)
     ↑                ↑                    ↑              ↑
  Premier          Milieu              Milieu        Dernier
```

### Utilisation

**Calculer l'attribution** :
```typescript
const attribution = await attributionService.calculateAttribution(
  userId,
  sessionId,
  'linear' // ou 'first_touch', 'last_touch', 'time_decay', 'position_based'
);
```

**Résultat** :
```json
[
  { "platform": "meta", "credit": 50, "touchpoints": 2 },
  { "platform": "google_tag_manager", "credit": 25, "touchpoints": 1 },
  { "platform": "google_analytics", "credit": 25, "touchpoints": 1 }
]
```

**Comparer tous les modèles** :
```typescript
const comparison = await attributionService.compareAttributionModels(userId, sessionId);
```

**Résultat** :
```json
[
  {
    "model": "first_touch",
    "attribution": [{ "platform": "meta", "credit": 100, "touchpoints": 1 }]
  },
  {
    "model": "last_touch",
    "attribution": [{ "platform": "meta", "credit": 100, "touchpoints": 1 }]
  },
  {
    "model": "linear",
    "attribution": [
      { "platform": "meta", "credit": 50, "touchpoints": 2 },
      { "platform": "google_tag_manager", "credit": 25, "touchpoints": 1 },
      { "platform": "google_analytics", "credit": 25, "touchpoints": 1 }
    ]
  },
  {
    "model": "time_decay",
    "attribution": [...]
  },
  {
    "model": "position_based",
    "attribution": [...]
  }
]
```

**ROI par plateforme** :
```typescript
const roi = await attributionService.getPlatformROI(userId, 'linear');
```

**Résultat** :
```json
[
  {
    "platform": "meta",
    "totalCredit": 1250.50,
    "totalValue": 15600,
    "touchpoints": 450,
    "averageValue": 34.67
  },
  {
    "platform": "google_tag_manager",
    "totalCredit": 625.25,
    "totalValue": 8400,
    "touchpoints": 210,
    "averageValue": 40.00
  }
]
```

### Modèle Time Decay

Utilise une décroissance exponentielle avec demi-vie de 7 jours :

```
Crédit = 2^(-timeDiff / 7days)
```

Plus l'interaction est récente, plus elle a de poids.

### Modèle Position-Based (U-Shaped)

- **40%** au premier touchpoint
- **40%** au dernier touchpoint
- **20%** réparti sur tous les touchpoints intermédiaires

Idéal pour valoriser à la fois l'acquisition et la conversion finale.

---

## 📦 Fichiers créés

### Backend

```
backend/src/modules/marketing/tracking/
├── analytics/
│   ├── tracking-realtime.gateway.ts (WebSocket Gateway)
│   ├── tracking-analytics.service.ts
│   └── tracking-analytics.controller.ts
├── heatmap/
│   ├── heatmap.service.ts
│   └── heatmap.controller.ts
├── ab-testing/
│   └── ab-testing.service.ts
├── attribution/
│   └── attribution-multi-touch.service.ts
└── tracking.module.ts (mis à jour)
```

### Frontend

```
frontend/src/
├── pages/marketing/tracking/
│   └── realtime.tsx (Dashboard WebSocket)
└── shared/components/vitrine/
    └── HeatmapTracker.tsx
```

### Documentation

```
docs/tracking-advanced-features.md
```

---

## 🚀 Prochaines étapes recommandées

1. **Créer les modèles Prisma** pour :
   - `HeatmapEvent`
   - `TrackingABTest`, `TrackingABTestAssignment`, `TrackingABTestResult`

2. **Installer les dépendances** :
   ```bash
   # Backend
   npm install @nestjs/websockets @nestjs/platform-socket.io socket.io

   # Frontend
   npm install socket.io-client heatmap.js
   ```

3. **Visualisation Heatmaps** :
   - Créer une page `/marketing/tracking/heatmap`
   - Intégrer `heatmap.js` ou bibliothèque similaire
   - Afficher overlay heatmap sur screenshot de la page

4. **Dashboard A/B Testing** :
   - Page `/marketing/tracking/ab-tests`
   - Créer/gérer tests A/B
   - Visualiser résultats avec graphiques

5. **Dashboard Attribution** :
   - Page `/marketing/tracking/attribution`
   - Visualiser parcours utilisateur (funnel)
   - Comparer modèles d'attribution
   - Graphiques ROI par plateforme

6. **Optimisations** :
   - Ajouter cache Redis pour heatmap data
   - Compression des données WebSocket
   - Pagination pour heatmap events
   - Background jobs pour calculs attribution

---

**Date** : 2025-01-04
**Version** : 1.0.0
