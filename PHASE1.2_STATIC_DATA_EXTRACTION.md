# Phase 1.2: Extraction des Données Statiques

**Date**: 2026-01-12
**Branch**: `phase1-frontend-restructuring`
**Status**: ✅ COMPLETÉ

## Objectif

Extraire les données statiques (régions tunisiennes et taux de conversion) dans des fichiers dédiés pour améliorer la réutilisabilité et la maintenance.

## Fichiers Créés

### 1. `data/tunisian-regions.data.ts` (230 lignes)

Données géographiques de la Tunisie pour le ciblage:

#### Interface Zone
```typescript
export interface Zone {
  id: string;
  name: string;
  type: 'city' | 'region' | 'radius' | 'polygon' | 'custom';
  coordinates?: { lat: number; lng: number };
  radius?: number;
  polygon?: { lat: number; lng: number }[];
  population?: number;
  avgPrice?: number;
  selected: boolean;
}
```

#### Constantes Exportées

**TUNISIAN_REGIONS** (12 villes principales):
- Tunis (1,056,247 hab., 350k TND)
- Ariana (576,088 hab., 280k TND)
- Ben Arous (631,842 hab., 220k TND)
- Manouba (379,518 hab., 180k TND)
- La Marsa (92,987 hab., 550k TND)
- Carthage (21,276 hab., 650k TND)
- Sousse (271,428 hab., 200k TND)
- Sfax (330,440 hab., 180k TND)
- Hammamet (97,579 hab., 320k TND)
- Nabeul (79,628 hab., 190k TND)
- Bizerte (142,966 hab., 150k TND)
- Monastir (104,535 hab., 210k TND)

**QUARTIERS_TUNIS** (8 quartiers de Tunis):
- Les Berges du Lac 1 (450k TND)
- Les Berges du Lac 2 (380k TND)
- Ennasr (320k TND)
- El Menzah (280k TND)
- El Manar (300k TND)
- Centre Ville (250k TND)
- Le Bardo (200k TND)
- La Soukra (350k TND)

**ALL_ZONES**: Combinaison de toutes les zones (20 zones)

**ZONE_STATS**: Statistiques calculées
- Total régions: 12
- Total quartiers: 8
- Total zones: 20
- Prix moyen: ~280,000 TND
- Population totale: 3,784,544 habitants

### 2. `data/conversion-rates.data.ts` (185 lignes)

Taux de conversion et données du funnel:

#### Constantes Exportées

**CONVERSION_RATES**:
```typescript
{
  contacted: 0.489,   // 48.9%
  qualified: 0.255,   // 25.5%
  converted: 0.064,   // 6.4%
}
```

**AVG_STAGE_DURATIONS** (en heures):
```typescript
{
  new: 0,           // 0h - Lead créé
  contacted: 24,    // 24h - Premier contact
  qualified: 72,    // 3 jours - Qualification
  converted: 288,   // 12 jours - Conversion
  rejected: 48,     // 2 jours - Rejet
}
```

**CONVERSION_STATS**:
```typescript
{
  avgConversionValue: 283333,    // 283k TND par conversion
  avgConversionTime: 12,         // 12 jours en moyenne
  globalConversionRate: 6.4,     // 6.4% de taux global
}
```

**STAGE_LABELS** (français):
```typescript
{
  new: 'Nouveaux',
  contacted: 'Contactés',
  qualified: 'Qualifiés',
  converted: 'Convertis',
  rejected: 'Rejetés',
}
```

**STAGE_COLORS** (Tailwind):
```typescript
{
  new: '#3b82f6',       // blue-500
  contacted: '#8b5cf6',  // violet-500
  qualified: '#10b981',  // green-500
  converted: '#f59e0b',  // amber-500
  rejected: '#ef4444',   // red-500
}
```

#### Fonctions Utilitaires

1. **calculateFunnelStages(totalLeads)**: Calcule le nombre de leads par étape
2. **calculateStagePercentages(totalLeads)**: Calcule les pourcentages
3. **calculateTotalValue(totalLeads)**: Calcule la valeur totale estimée
4. **calculateFunnelMetrics(totalLeads)**: Métriques complètes du funnel

### 3. `data/index.ts` (Mise à jour)

Point d'entrée centralisé pour toutes les données:

```typescript
// Geographic data
export {
  TUNISIAN_REGIONS,
  QUARTIERS_TUNIS,
  ALL_ZONES,
  ZONE_STATS,
  type Zone,
} from './tunisian-regions.data';

// Conversion rates & funnel data
export {
  CONVERSION_RATES,
  AVG_STAGE_DURATIONS,
  CONVERSION_STATS,
  STAGE_LABELS,
  STAGE_COLORS,
  calculateFunnelStages,
  calculateStagePercentages,
  calculateTotalValue,
  calculateFunnelMetrics,
  type FunnelStage,
} from './conversion-rates.data';
```

## Source des Données

### Extrait de GeographicTargeting.tsx
- **Lignes 32-141**: TUNISIAN_REGIONS
- **Lignes 143-208**: QUARTIERS_TUNIS
- **Ligne 230**: Utilisation: `[...TUNISIAN_REGIONS, ...QUARTIERS_TUNIS]`

### Extrait de useAiProspection.ts
- **Lignes 185-187**: Taux de conversion
- **Lignes 189-232**: Fonction `generateMockFunnelData()`
- **Note**: Données mock, à remplacer par données backend réelles

## Bénéfices

### 1. **Réutilisabilité**
- Données accessibles depuis n'importe quel composant
- Import simple: `import { TUNISIAN_REGIONS } from '../data'`
- Plus besoin de dupliquer les données

### 2. **Maintenance**
- Modification centralisée
- Une seule source de vérité
- Mise à jour propagée automatiquement

### 3. **Testabilité**
- Données isolées, faciles à mocker
- Tests unitaires simplifiés
- Données cohérentes

### 4. **Performance**
- Tree-shaking optimisé
- Import sélectif des données nécessaires
- Pas de duplication en mémoire

### 5. **Type Safety**
- Interface `Zone` exportée et réutilisable
- Type `FunnelStage` pour les étapes
- IntelliSense complet

## Impact sur les Composants Existants

### À Mettre à Jour (Phase suivante)

1. **GeographicTargeting.tsx** (ligne 230):
   ```typescript
   // Avant
   const [zones, setZones] = useState<Zone[]>([...TUNISIAN_REGIONS, ...QUARTIERS_TUNIS]);

   // Après
   import { ALL_ZONES, type Zone } from '../data';
   const [zones, setZones] = useState<Zone[]>(ALL_ZONES);
   ```

2. **useAiProspection.ts** (lignes 183-232):
   ```typescript
   // Avant
   function generateMockFunnelData(prospectionId: string, totalLeads: number): ConversionFunnelData {
     const contactedRate = 0.489;
     const qualifiedRate = 0.255;
     const convertedRate = 0.064;
     // ...
   }

   // Après
   import { calculateFunnelMetrics, CONVERSION_STATS } from '../data';
   function generateMockFunnelData(prospectionId: string, totalLeads: number): ConversionFunnelData {
     return calculateFunnelMetrics(totalLeads);
   }
   ```

## Statistiques

### Données Géographiques
- **12 villes** principales tunisiennes
- **8 quartiers** de Tunis
- **20 zones** au total
- **3,784,544 habitants** (population totale)
- **~280,000 TND** (prix moyen)

### Données de Conversion
- **48.9%** de taux de contact
- **25.5%** de taux de qualification
- **6.4%** de taux de conversion finale
- **283,333 TND** de valeur moyenne par conversion
- **12 jours** de durée moyenne du cycle

## Prochaines Étapes

### Phase 1.3: Extraire StatCard et CampaignCard
Ces composants utilisent potentiellement les données de conversion, ils pourront maintenant les importer depuis `../data`.

### Phase 1.4: Décomposer AiProspectionPanel
Le panneau IA pourra utiliser les fonctions utilitaires de calcul du funnel.

## Notes Importantes

1. ✅ **Données préservées**: Aucune perte de données
2. ✅ **Backward compatible**: Les anciens imports continuent de fonctionner
3. ⚠️ **TODO**: Remplacer les données mock par les vraies données backend
4. ✅ **Documenté**: Chaque constante est documentée avec JSDoc
5. ✅ **Typed**: Interfaces TypeScript complètes

## Commit

```bash
git add frontend/src/modules/business/prospecting/data/
git add PHASE1.2_STATIC_DATA_EXTRACTION.md
git commit -m "Phase 1.2: Extract static data (regions, conversion rates)

- Create tunisian-regions.data.ts with 12 cities and 8 districts
- Create conversion-rates.data.ts with funnel metrics and utilities
- Update data/index.ts with centralized exports
- Add Zone and FunnelStage type definitions
- Add utility functions for funnel calculations

415 lines of data extraction and utilities"
```

---

**Phase 1.2**: ✅ COMPLETÉ
**Fichiers créés**: 2
**Fichiers modifiés**: 1
**Lignes de code**: 415
**Lignes de documentation**: 280
**Temps estimé**: 15 minutes
