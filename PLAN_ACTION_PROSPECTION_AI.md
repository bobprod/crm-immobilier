# 🎯 Plan d'Action - Restructuration Module Prospection IA

**Date:** 11 janvier 2026  
**Durée Estimée:** 3-4 semaines (avec tests)  
**Priorité:** HAUTE ⭐⭐⭐⭐⭐

---

## 📋 Vue d'Ensemble

Ce plan décrit les étapes concrètes pour réorganiser le module Prospection IA Frontend selon l'architecture proposée dans `ANALYSE_PROSPECTION_AI_FRONTEND.md`.

---

## 🗓️ Calendrier Proposé

### Semaine 1: Fondations (Phase 1)
- **Jours 1-2:** Création de la structure de dossiers
- **Jours 3-5:** Extraction et refactoring des composants principaux

### Semaine 2: Logique Métier (Phase 2)
- **Jours 1-3:** Création des services et extraction de la logique
- **Jours 4-5:** Simplification des hooks

### Semaine 3: Composants Partagés (Phase 3)
- **Jours 1-3:** Création des composants UI atomiques
- **Jours 4-5:** Migration et tests

### Semaine 4: Finalisation
- **Jours 1-2:** Documentation et formation
- **Jours 3-5:** Tests complets et validation

---

## 📝 Tâches Détaillées

## SEMAINE 1: FONDATIONS

### 🗂️ Jour 1: Préparation et Structure

#### Tâche 1.1: Créer la branche de refactoring
```bash
git checkout -b refactor/prospection-ai-structure
```

#### Tâche 1.2: Créer la nouvelle structure de dossiers
```bash
cd frontend/src/modules/business/prospecting

# Créer les nouveaux dossiers
mkdir -p components/dashboard
mkdir -p components/ai-prospection
mkdir -p components/targeting
mkdir -p components/leads
mkdir -p components/visualization
mkdir -p components/map
mkdir -p components/shared
mkdir -p services
mkdir -p data
mkdir -p utils
```

#### Tâche 1.3: Créer les index.ts de base
```bash
# Créer les fichiers index.ts vides dans chaque dossier
touch components/dashboard/index.ts
touch components/ai-prospection/index.ts
touch components/targeting/index.ts
touch components/leads/index.ts
touch components/visualization/index.ts
touch components/map/index.ts
touch components/shared/index.ts
touch services/index.ts
touch data/index.ts
touch utils/index.ts
```

**Validation:**
- [ ] Structure créée
- [ ] Compilation TypeScript passe: `npm run build`

---

### 🔧 Jour 2: Extraction des Données Statiques

#### Tâche 2.1: Extraire les régions tunisiennes

**Créer:** `data/tunisian-regions.data.ts`

```typescript
/**
 * Données géographiques des régions tunisiennes
 * Utilisé par GeographicTargeting
 */

export interface TunisianRegion {
  id: string;
  name: string;
  type: 'city' | 'region';
  coordinates: { lat: number; lng: number };
  population: number;
  avgPrice: number;
}

export const TUNISIAN_REGIONS: TunisianRegion[] = [
  {
    id: 'tunis',
    name: 'Tunis',
    type: 'city',
    coordinates: { lat: 36.8065, lng: 10.1815 },
    population: 1056247,
    avgPrice: 350000,
  },
  // ... (copier toutes les régions depuis GeographicTargeting.tsx)
];

export const getRegionById = (id: string): TunisianRegion | undefined => {
  return TUNISIAN_REGIONS.find(region => region.id === id);
};

export const getRegionsByType = (type: 'city' | 'region'): TunisianRegion[] => {
  return TUNISIAN_REGIONS.filter(region => region.type === type);
};
```

#### Tâche 2.2: Extraire les taux de conversion mock

**Créer:** `data/conversion-rates.data.ts`

```typescript
/**
 * Données mock pour les taux de conversion
 * TODO: Remplacer par les vraies données du backend
 */

export interface ConversionRates {
  contactedRate: number;
  qualifiedRate: number;
  convertedRate: number;
  avgConversionValue: number; // TND
  avgConversionTime: number; // jours
}

export const MOCK_CONVERSION_RATES: ConversionRates = {
  contactedRate: 0.489,      // 48.9%
  qualifiedRate: 0.255,      // 25.5%
  convertedRate: 0.064,      // 6.4%
  avgConversionValue: 283333, // 283k TND
  avgConversionTime: 12,      // 12 jours
};

export function calculateFunnelMetrics(totalLeads: number): {
  contacted: number;
  qualified: number;
  converted: number;
  rejected: number;
} {
  const contacted = Math.round(totalLeads * MOCK_CONVERSION_RATES.contactedRate);
  const qualified = Math.round(totalLeads * MOCK_CONVERSION_RATES.qualifiedRate);
  const converted = Math.round(totalLeads * MOCK_CONVERSION_RATES.convertedRate);
  const rejected = totalLeads - contacted - qualified - converted;

  return { contacted, qualified, converted, rejected };
}
```

#### Tâche 2.3: Créer l'index pour data/

**Fichier:** `data/index.ts`

```typescript
export * from './tunisian-regions.data';
export * from './conversion-rates.data';
```

#### Tâche 2.4: Mettre à jour GeographicTargeting.tsx

Remplacer:
```typescript
// Ancien
const TUNISIAN_REGIONS: Zone[] = [
  // ... données hardcodées
];
```

Par:
```typescript
// Nouveau
import { TUNISIAN_REGIONS } from '../../data/tunisian-regions.data';
```

**Validation:**
- [ ] Données extraites
- [ ] GeographicTargeting fonctionne
- [ ] Aucune régression

---

### 🧩 Jour 3: Extraction des Composants du Dashboard

#### Tâche 3.1: Créer StatCard

**Fichier:** `components/dashboard/StatCard.tsx`

```typescript
import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: number;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  color = 'purple' 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <p
              className={`text-sm mt-2 flex items-center gap-1 ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <span>{change >= 0 ? '↗' : '↘'}</span>
              {Math.abs(change)}% vs mois dernier
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-${color}-100 to-${color}-200`}>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};
```

#### Tâche 3.2: Créer CampaignCard

**Fichier:** `components/dashboard/CampaignCard.tsx`

```typescript
import React from 'react';
import { ProspectingCampaign } from '@/shared/utils/prospecting-api';
import {
  getCampaignStatusLabel,
  getCampaignStatusColor,
} from '@/shared/utils/prospecting-api';

export interface CampaignCardProps {
  campaign: ProspectingCampaign;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onSelect,
  onStart,
  onPause,
}) => {
  // Extraire la logique depuis ProspectingDashboard.tsx (lignes 71-130)
  // ...
};
```

#### Tâche 3.3: Créer l'index pour dashboard/

**Fichier:** `components/dashboard/index.ts`

```typescript
export { StatCard } from './StatCard';
export { CampaignCard } from './CampaignCard';
export { ProspectingDashboard } from './ProspectingDashboard';
```

#### Tâche 3.4: Mettre à jour ProspectingDashboard.tsx

Déplacer vers `components/dashboard/ProspectingDashboard.tsx` et refactorer:

```typescript
// Nouveau
import { StatCard } from './StatCard';
import { CampaignCard } from './CampaignCard';

// Supprimer les sous-composants inline
// const StatCard: React.FC<...> = ... ❌
// const CampaignCard: React.FC<...> = ... ❌
```

**Validation:**
- [ ] StatCard extrait et fonctionnel
- [ ] CampaignCard extrait et fonctionnel
- [ ] ProspectingDashboard réduit de ~200 lignes
- [ ] Compilation passe

---

### 🤖 Jour 4-5: Décomposer AiProspectionPanel

#### Tâche 4.1: Créer ConfigurationSection

**Fichier:** `components/ai-prospection/ConfigurationSection.tsx`

```typescript
import React from 'react';
import { GeographicTargeting } from '../targeting/GeographicTargeting';
import { DemographicTargeting } from '../targeting/DemographicTargeting';
import { CampaignSettings } from '../targeting/CampaignSettings';
import {
  ProspectionConfiguration,
  GeographicZone,
  ConfigurationValidation,
} from '../../types';

export interface ConfigurationSectionProps {
  configuration: Partial<ProspectionConfiguration>;
  validationResult: ConfigurationValidation;
  isLocked: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onConfigurationChange: (updates: Partial<ProspectionConfiguration>) => void;
}

export const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({
  configuration,
  validationResult,
  isLocked,
  isExpanded,
  onToggleExpanded,
  onConfigurationChange,
}) => {
  // Extraire renderConfigurationSection() depuis AiProspectionPanel.tsx (lignes 115-250)
  // ...
};
```

#### Tâche 4.2: Créer LauncherSection

**Fichier:** `components/ai-prospection/LauncherSection.tsx`

```typescript
import React from 'react';
import { ProspectionPanelState } from '../../types';

export interface LauncherSectionProps {
  panelState: ProspectionPanelState;
  canLaunch: boolean;
  error: string | null;
  progressPercentage: number;
  onLaunch: () => void;
  onRetry: () => void;
  onReset: () => void;
}

export const LauncherSection: React.FC<LauncherSectionProps> = ({
  panelState,
  canLaunch,
  error,
  progressPercentage,
  onLaunch,
  onRetry,
  onReset,
}) => {
  // Extraire renderLauncherSection() depuis AiProspectionPanel.tsx (lignes 252-339)
  // ...
};
```

#### Tâche 4.3: Créer ResultsSection

**Fichier:** `components/ai-prospection/ResultsSection.tsx`

```typescript
import React from 'react';
import { ProgressTracker } from '../visualization/ProgressTracker';
import { LeadsTable } from '../leads/LeadsTable';
import { ProspectionResult, ExportFormat } from '../../types';

export interface ResultsSectionProps {
  prospectionResult: ProspectionResult | null;
  onExport: (format: ExportFormat) => void;
  onConvertAll: () => void;
  onAddToCrm: (leadId: string) => void;
  onContact: (leadId: string) => void;
  onReject: (leadId: string) => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  prospectionResult,
  onExport,
  onConvertAll,
  onAddToCrm,
  onContact,
  onReject,
}) => {
  // Extraire renderResultsSection() depuis AiProspectionPanel.tsx (lignes 341-364)
  // ...
};
```

#### Tâche 4.4: Refactorer AiProspectionPanel.tsx

**Fichier:** `components/ai-prospection/AiProspectionPanel.tsx`

```typescript
// Nouveau - Utilise les sections
import { ConfigurationSection } from './ConfigurationSection';
import { LauncherSection } from './LauncherSection';
import { ResultsSection } from './ResultsSection';
import { ConversionFunnel } from '../visualization/ConversionFunnel';

export const AiProspectionPanel: React.FC<AiProspectionPanelProps> = ({
  language = 'fr',
}) => {
  const { user } = useAuth();
  const authToken = user?.token || '';
  const {
    panelState,
    prospectionResult,
    funnelData,
    error,
    configuration,
    updateConfiguration,
    validationResult,
    launchProspection,
    resetProspection,
    retryAfterError,
    exportResults,
    convertAllToProspects,
    canLaunch,
    progressPercentage,
  } = useAiProspection(authToken);

  const [isConfigExpanded, setIsConfigExpanded] = useState(true);

  // Auto-collapse configuration
  useEffect(() => {
    if (panelState === 'LAUNCHING' || panelState === 'RUNNING') {
      setIsConfigExpanded(false);
    }
  }, [panelState]);

  // Handlers simplifiés
  const handleAddToCrm = (leadId: string) => {
    console.log('Add to CRM:', leadId);
    alert(`Lead ${leadId} sera ajouté au CRM`);
  };

  const handleContact = (leadId: string) => {
    console.log('Contact lead:', leadId);
    alert(`Contacter le lead ${leadId}`);
  };

  const handleReject = (leadId: string) => {
    console.log('Reject lead:', leadId);
    alert(`Lead ${leadId} sera rejeté`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      {/* ... (garder le header) */}

      {/* Main Content - SIMPLIFIÉ */}
      <div className="space-y-6">
        {/* 1. Configuration */}
        <ConfigurationSection
          configuration={configuration}
          validationResult={validationResult}
          isLocked={panelState === 'LAUNCHING' || panelState === 'RUNNING' || panelState === 'COMPLETED'}
          isExpanded={isConfigExpanded}
          onToggleExpanded={() => setIsConfigExpanded(!isConfigExpanded)}
          onConfigurationChange={updateConfiguration}
        />

        {/* 2. Launcher */}
        <LauncherSection
          panelState={panelState}
          canLaunch={canLaunch}
          error={error}
          progressPercentage={progressPercentage}
          onLaunch={launchProspection}
          onRetry={retryAfterError}
          onReset={resetProspection}
        />

        {/* 3. Results */}
        <ResultsSection
          prospectionResult={prospectionResult}
          onExport={exportResults}
          onConvertAll={convertAllToProspects}
          onAddToCrm={handleAddToCrm}
          onContact={handleContact}
          onReject={handleReject}
        />

        {/* 4. Funnel */}
        {panelState === 'COMPLETED' && funnelData && (
          <ConversionFunnel funnelData={funnelData} />
        )}

        {/* 5. New Prospection Button */}
        {panelState === 'COMPLETED' && (
          <div className="text-center">
            <button
              onClick={resetProspection}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 text-base font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nouvelle Prospection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

**Résultat Attendu:**
- AiProspectionPanel.tsx: ~461 lignes → ~200 lignes (-57%)

**Validation:**
- [ ] ConfigurationSection créé
- [ ] LauncherSection créé
- [ ] ResultsSection créé
- [ ] AiProspectionPanel refactoré
- [ ] Tests manuels: workflow complet fonctionne

---

## SEMAINE 2: LOGIQUE MÉTIER

### 🔌 Jour 1-2: Créer les Services

#### Tâche 5.1: Créer ProspectionApiService

**Fichier:** `services/prospection-api.service.ts`

```typescript
import {
  ProspectionConfiguration,
  StartProspectionRequest,
  StartProspectionResponse,
  ProspectionResult,
  ExportFormat,
  ConvertToProspectsResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Service pour les appels API du module Prospection IA
 */
export class ProspectionApiService {
  /**
   * Lancer une nouvelle prospection
   */
  static async startProspection(
    config: ProspectionConfiguration,
    token: string
  ): Promise<StartProspectionResponse> {
    const request: StartProspectionRequest = {
      zone: config.zone,
      targetType: config.targetType,
      propertyType: config.propertyType,
      budget: config.budget,
      keywords: config.keywords,
      maxLeads: config.campaignSettings.maxLeads,
      options: {
        maxCost: config.campaignSettings.maxCost,
        timeout: config.campaignSettings.timeout || 300,
      },
    };

    const response = await fetch(`${API_BASE_URL}/api/prospecting-ai/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Récupérer le statut d'une prospection
   */
  static async fetchStatus(
    prospectionId: string,
    token: string
  ): Promise<ProspectionResult> {
    const response = await fetch(
      `${API_BASE_URL}/api/prospecting-ai/${prospectionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Exporter les résultats
   */
  static async exportResults(
    prospectionId: string,
    format: ExportFormat,
    token: string
  ): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/api/prospecting-ai/${prospectionId}/export?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: HTTP ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Convertir les leads en prospects CRM
   */
  static async convertToProspects(
    prospectionId: string,
    token: string
  ): Promise<ConvertToProspectsResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/prospecting-ai/${prospectionId}/convert-to-prospects`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}
```

#### Tâche 5.2: Créer ProspectionValidator

**Fichier:** `services/prospection-validation.ts`

```typescript
import {
  ProspectionConfiguration,
  ConfigurationValidation,
  ValidationError,
  GeographicZone,
  CampaignSettings,
} from '../types';

/**
 * Service de validation pour la configuration de prospection
 */
export class ProspectionValidator {
  /**
   * Valider la configuration complète
   */
  static validateConfiguration(
    config: Partial<ProspectionConfiguration>
  ): ConfigurationValidation {
    const errors: ValidationError[] = [];

    // Zone validation
    const zoneErrors = this.validateZone(config.zone);
    errors.push(...zoneErrors);

    // Target type validation
    if (!config.targetType) {
      errors.push({ field: 'targetType', message: 'Le type de cible est requis' });
    }

    // Property type validation
    if (!config.propertyType) {
      errors.push({ field: 'propertyType', message: 'Le type de bien est requis' });
    }

    // Campaign settings validation
    if (config.campaignSettings) {
      const campaignErrors = this.validateCampaignSettings(config.campaignSettings);
      errors.push(...campaignErrors);
    } else {
      errors.push({ field: 'campaignSettings', message: 'Les paramètres de campagne sont requis' });
    }

    // Budget validation (optional)
    if (config.budget) {
      if (config.budget.min < 0) {
        errors.push({ field: 'budget.min', message: 'Le budget minimum doit être >= 0' });
      }
      if (config.budget.max < config.budget.min) {
        errors.push({ field: 'budget.max', message: 'Le budget maximum doit être >= budget minimum' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valider une zone géographique
   */
  static validateZone(zone?: GeographicZone): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!zone) {
      errors.push({ field: 'zone', message: 'La zone géographique est requise' });
    } else {
      if (!zone.name || zone.name.trim() === '') {
        errors.push({ field: 'zone.name', message: 'Le nom de la zone est requis' });
      }
    }

    return errors;
  }

  /**
   * Valider les paramètres de campagne
   */
  static validateCampaignSettings(settings: CampaignSettings): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!settings.name || settings.name.trim() === '') {
      errors.push({ field: 'campaignSettings.name', message: 'Le nom de la campagne est requis' });
    }

    if (!settings.maxLeads || settings.maxLeads < 1) {
      errors.push({ field: 'campaignSettings.maxLeads', message: 'Le nombre max de leads doit être >= 1' });
    } else if (settings.maxLeads > 100) {
      errors.push({ field: 'campaignSettings.maxLeads', message: 'Le nombre max de leads doit être <= 100' });
    }

    if (!settings.maxCost || settings.maxCost < 0.5) {
      errors.push({ field: 'campaignSettings.maxCost', message: 'Le budget API doit être >= $0.50' });
    } else if (settings.maxCost > 10) {
      errors.push({ field: 'campaignSettings.maxCost', message: 'Le budget API doit être <= $10.00' });
    }

    return errors;
  }
}
```

#### Tâche 5.3: Créer services/index.ts

```typescript
export { ProspectionApiService } from './prospection-api.service';
export { ProspectionValidator } from './prospection-validation';
```

**Validation:**
- [ ] ProspectionApiService créé et testé
- [ ] ProspectionValidator créé et testé
- [ ] Compilation passe

---

### 🎣 Jour 3-4: Extraire les Hooks Secondaires

#### Tâche 6.1: Créer useProspectionPolling

**Fichier:** `hooks/useProspectionPolling.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { ProspectionResult } from '../types';
import { ProspectionApiService } from '../services';

export interface UseProspectionPollingOptions {
  prospectionId: string;
  authToken: string;
  enabled: boolean;
  interval?: number; // default: 3000ms
  onUpdate: (result: ProspectionResult) => void;
  onComplete: (result: ProspectionResult) => void;
  onError: (error: Error) => void;
}

/**
 * Hook pour gérer le polling d'une prospection en cours
 */
export function useProspectionPolling({
  prospectionId,
  authToken,
  enabled,
  interval = 3000,
  onUpdate,
  onComplete,
  onError,
}: UseProspectionPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    try {
      const result = await ProspectionApiService.fetchStatus(prospectionId, authToken);
      onUpdate(result);

      if (result.status === 'completed') {
        onComplete(result);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (result.status === 'failed' || result.status === 'timeout') {
        const error = new Error(result.error?.message || 'La prospection a échoué');
        onError(error);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      onError(err instanceof Error ? err : new Error('Erreur inconnue'));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [prospectionId, authToken, onUpdate, onComplete, onError]);

  useEffect(() => {
    if (enabled && prospectionId && authToken) {
      // Poll immediately
      poll();
      
      // Then set up interval
      intervalRef.current = setInterval(poll, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, prospectionId, authToken, interval, poll]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { stopPolling };
}
```

#### Tâche 6.2: Créer useProspectionValidation

**Fichier:** `hooks/useProspectionValidation.ts`

```typescript
import { useMemo } from 'react';
import { ProspectionConfiguration, ConfigurationValidation } from '../types';
import { ProspectionValidator } from '../services';

/**
 * Hook pour valider une configuration de prospection en temps réel
 */
export function useProspectionValidation(
  configuration: Partial<ProspectionConfiguration>
): ConfigurationValidation {
  const validationResult = useMemo(() => {
    return ProspectionValidator.validateConfiguration(configuration);
  }, [configuration]);

  return validationResult;
}
```

#### Tâche 6.3: Créer hooks/index.ts

```typescript
export { useAiProspection } from './useAiProspection';
export { useProspectionPolling } from './useProspectionPolling';
export { useProspectionValidation } from './useProspectionValidation';
```

**Validation:**
- [ ] useProspectionPolling créé
- [ ] useProspectionValidation créé
- [ ] Tests fonctionnels

---

### 🔄 Jour 5: Refactorer useAiProspection

#### Tâche 7.1: Simplifier useAiProspection.ts

Utiliser les nouveaux services et hooks:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { ProspectionApiService } from '../services';
import { useProspectionPolling } from './useProspectionPolling';
import { useProspectionValidation } from './useProspectionValidation';
import { generateMockFunnelData } from '../data/conversion-rates.data';
import {
  ProspectionConfiguration,
  ProspectionPanelState,
  ProspectionResult,
  ConversionFunnelData,
  ExportFormat,
} from '../types';

export interface UseAiProspectionReturn {
  // State
  panelState: ProspectionPanelState;
  prospectionResult: ProspectionResult | null;
  funnelData: ConversionFunnelData | null;
  error: string | null;

  // Configuration
  configuration: Partial<ProspectionConfiguration>;
  updateConfiguration: (updates: Partial<ProspectionConfiguration>) => void;
  validationResult: ReturnType<typeof useProspectionValidation>;

  // Actions
  launchProspection: () => Promise<void>;
  resetProspection: () => void;
  retryAfterError: () => Promise<void>;

  // Export/Convert
  exportResults: (format: ExportFormat) => Promise<void>;
  convertAllToProspects: () => Promise<void>;

  // Computed values
  isConfigurationValid: boolean;
  canLaunch: boolean;
  progressPercentage: number;
}

export function useAiProspection(authToken: string): UseAiProspectionReturn {
  const [panelState, setPanelState] = useState<ProspectionPanelState>('CONFIGURING');
  const [prospectionResult, setProspectionResult] = useState<ProspectionResult | null>(null);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prospectionId, setProspectionId] = useState<string>('');

  const [configuration, setConfiguration] = useState<Partial<ProspectionConfiguration>>({
    campaignSettings: {
      name: '',
      maxLeads: 50,
      maxCost: 5,
      timeout: 300,
    },
  });

  // Utiliser le hook de validation
  const validationResult = useProspectionValidation(configuration);
  const isConfigurationValid = validationResult.isValid;
  const canLaunch = isConfigurationValid && (panelState === 'READY' || panelState === 'CONFIGURING');

  // Polling avec le nouveau hook
  const { stopPolling } = useProspectionPolling({
    prospectionId,
    authToken,
    enabled: panelState === 'RUNNING',
    onUpdate: (result) => {
      setProspectionResult(result);
    },
    onComplete: (result) => {
      setPanelState('COMPLETED');
      setProspectionResult(result);
      const funnel = generateMockFunnelData(result.id, result.metadata.totalLeads);
      setFunnelData(funnel);
    },
    onError: (err) => {
      setPanelState('ERROR');
      setError(err.message);
    },
  });

  // Update configuration
  const updateConfiguration = useCallback((updates: Partial<ProspectionConfiguration>) => {
    setConfiguration((prev) => ({
      ...prev,
      ...updates,
      campaignSettings: {
        ...prev.campaignSettings,
        ...updates.campaignSettings,
      } as any,
    }));

    setPanelState((prevState) => {
      if (prevState === 'CONFIGURING' || prevState === 'READY') {
        return validationResult.isValid ? 'READY' : 'CONFIGURING';
      }
      return prevState;
    });
  }, [validationResult.isValid]);

  // Launch prospection
  const launchProspection = useCallback(async () => {
    if (!canLaunch) {
      setError('Configuration invalide. Veuillez corriger les erreurs.');
      return;
    }

    try {
      setPanelState('LAUNCHING');
      setError(null);

      const response = await ProspectionApiService.startProspection(
        configuration as ProspectionConfiguration,
        authToken
      );

      setProspectionId(response.prospectionId);
      setPanelState('RUNNING');
    } catch (err) {
      console.error('Launch error:', err);
      setPanelState('ERROR');
      setError(err instanceof Error ? err.message : 'Erreur lors du lancement');
    }
  }, [canLaunch, configuration, authToken]);

  // Reset
  const resetProspection = useCallback(() => {
    stopPolling();
    setPanelState('CONFIGURING');
    setProspectionResult(null);
    setFunnelData(null);
    setError(null);
    setProspectionId('');
  }, [stopPolling]);

  // Retry
  const retryAfterError = useCallback(async () => {
    if (panelState !== 'ERROR') return;
    await launchProspection();
  }, [panelState, launchProspection]);

  // Export
  const exportResults = useCallback(
    async (format: ExportFormat) => {
      if (!prospectionResult?.id) {
        setError('Aucune prospection à exporter');
        return;
      }

      try {
        const blob = await ProspectionApiService.exportResults(
          prospectionResult.id,
          format,
          authToken
        );
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prospection-${prospectionResult.id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Export error:', err);
        setError(err instanceof Error ? err.message : "Erreur lors de l'exportation");
      }
    },
    [prospectionResult, authToken]
  );

  // Convert to prospects
  const convertAllToProspects = useCallback(async () => {
    if (!prospectionResult?.id) {
      setError('Aucune prospection à convertir');
      return;
    }

    try {
      const response = await ProspectionApiService.convertToProspects(
        prospectionResult.id,
        authToken
      );
      alert(`${response.converted} leads convertis en prospects CRM avec succès!`);
    } catch (err) {
      console.error('Convert error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la conversion');
    }
  }, [prospectionResult, authToken]);

  const progressPercentage = prospectionResult?.progress || 0;

  return {
    panelState,
    prospectionResult,
    funnelData,
    error,
    configuration,
    updateConfiguration,
    validationResult,
    launchProspection,
    resetProspection,
    retryAfterError,
    exportResults,
    convertAllToProspects,
    isConfigurationValid,
    canLaunch,
    progressPercentage,
  };
}
```

**Résultat Attendu:**
- useAiProspection.ts: ~521 lignes → ~250 lignes (-52%)

**Validation:**
- [ ] Hook simplifié
- [ ] Utilise les services
- [ ] Utilise les hooks secondaires
- [ ] Tests fonctionnels complets

---

## SEMAINE 3: COMPOSANTS PARTAGÉS

### 🎨 Jour 1-2: Créer les Composants UI Atomiques

#### Tâche 8.1: Créer Badge générique

**Fichier:** `components/shared/Badge.tsx`

```typescript
import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
```

#### Tâche 8.2: Créer Button générique

**Fichier:** `components/shared/Button.tsx`

```typescript
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-700 border-transparent',
  secondary: 'bg-white text-purple-600 hover:bg-purple-50 border-purple-600',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border-gray-300',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center gap-2 font-semibold rounded-lg border
        transition-all duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
};
```

#### Tâche 8.3: Créer components/shared/index.ts

```typescript
export { Badge } from './Badge';
export { Button } from './Button';
export { ProviderUsageBadge } from './ProviderUsageBadge';
export { LlmProviderSelector } from './LlmProviderSelector';
```

**Validation:**
- [ ] Badge créé et testé
- [ ] Button créé et testé
- [ ] Composants réutilisables

---

### 🔄 Jour 3-4: Réorganiser les Composants Restants

#### Tâche 9.1: Déplacer les composants dans les bons dossiers

```bash
# Targeting
mv components/GeographicTargeting.tsx components/targeting/
mv components/DemographicTargeting.tsx components/targeting/
mv components/CampaignSettings.tsx components/targeting/

# Leads
mv components/LeadsTable.tsx components/leads/
mv components/LeadValidator.tsx components/leads/

# Visualization
mv components/ConversionFunnel.tsx components/visualization/
mv components/SalesFunnel.tsx components/visualization/
mv components/ProgressTracker.tsx components/visualization/
mv components/ProspectingAnalytics.tsx components/visualization/

# Map
mv components/LeafletMapComponent.tsx components/map/

# Shared (déjà créés ci-dessus)
mv components/ProviderUsageBadge.tsx components/shared/
mv components/LlmProviderSelector.tsx components/shared/
```

#### Tâche 9.2: Créer les index.ts pour chaque dossier

**`components/targeting/index.ts`**
```typescript
export { GeographicTargeting } from './GeographicTargeting';
export { DemographicTargeting } from './DemographicTargeting';
export { CampaignSettings } from './CampaignSettings';
```

**`components/leads/index.ts`**
```typescript
export { LeadsTable } from './LeadsTable';
export { LeadValidator } from './LeadValidator';
```

**`components/visualization/index.ts`**
```typescript
export { ConversionFunnel } from './ConversionFunnel';
export { SalesFunnel } from './SalesFunnel';
export { ProgressTracker } from './ProgressTracker';
export { ProspectingAnalytics } from './ProspectingAnalytics';
```

**`components/map/index.ts`**
```typescript
export { LeafletMapComponent } from './LeafletMapComponent';
```

#### Tâche 9.3: Mettre à jour tous les imports

Utiliser un script de recherche/remplacement:

```bash
# Exemple
find . -name "*.tsx" -exec sed -i "s|from '../components/GeographicTargeting'|from '../components/targeting'|g" {} +
```

**Validation:**
- [ ] Tous les composants déplacés
- [ ] Tous les index.ts créés
- [ ] Tous les imports mis à jour
- [ ] Compilation passe: `npm run build`

---

### ✅ Jour 5: Tests et Validation

#### Tâche 10.1: Tests de compilation

```bash
cd frontend
npm run build
```

#### Tâche 10.2: Tests manuels complets

- [ ] Dashboard principal s'affiche
- [ ] Onglet "Prospection IA" fonctionne
- [ ] Configuration complète fonctionne
- [ ] Lancement de prospection fonctionne
- [ ] Polling et live updates fonctionnent
- [ ] Résultats et funnel s'affichent
- [ ] Export fonctionne
- [ ] Conversion CRM fonctionne

#### Tâche 10.3: Vérifier les performances

- [ ] Temps de chargement initial < 2s
- [ ] Navigation fluide entre sections
- [ ] Pas de freeze pendant le polling

**Validation:**
- [ ] Tous les tests passent
- [ ] Aucune régression détectée
- [ ] Performance acceptable

---

## SEMAINE 4: FINALISATION

### 📚 Jour 1-2: Documentation

#### Tâche 11.1: Créer un README pour le module

**Fichier:** `frontend/src/modules/business/prospecting/README.md`

```markdown
# Module Prospection IA

## Architecture

[Décrire l'architecture avec diagramme]

## Structure

[Décrire la structure des dossiers]

## Utilisation

[Exemples de code]

## Développement

[Guide pour les développeurs]
```

#### Tâche 11.2: Documenter les conventions de code

**Fichier:** `frontend/src/modules/business/prospecting/CONVENTIONS.md`

[Copier depuis ANALYSE_PROSPECTION_AI_FRONTEND.md]

#### Tâche 11.3: Créer un guide de migration

**Fichier:** `frontend/src/modules/business/prospecting/MIGRATION_GUIDE.md`

```markdown
# Guide de Migration - Ancienne Structure → Nouvelle Structure

## Imports Changés

| Ancien Import | Nouvel Import |
|--------------|---------------|
| `from './components/GeographicTargeting'` | `from './components/targeting'` |
| ... | ... |
```

**Validation:**
- [ ] README créé
- [ ] CONVENTIONS créé
- [ ] MIGRATION_GUIDE créé

---

### 🧹 Jour 3: Nettoyage et Optimisation

#### Tâche 12.1: Supprimer l'ancien dossier components/ vide

```bash
# Vérifier qu'il ne reste aucun fichier dans components/ racine
ls -la components/
# Si vide, supprimer le dossier
rm -rf components/
```

#### Tâche 12.2: Optimiser les imports avec barrel exports

Vérifier que tous les `index.ts` sont correctement configurés pour des imports propres.

#### Tâche 12.3: Vérifier les duplications

```bash
# Utiliser un outil comme jscpd
npx jscpd src/modules/business/prospecting
```

**Validation:**
- [ ] Ancien dossier supprimé
- [ ] Duplications < 5%
- [ ] Imports optimisés

---

### ✅ Jour 4-5: Tests Finaux et Merge

#### Tâche 13.1: Tests end-to-end complets

Tester tous les workflows:
- [ ] Workflow standard
- [ ] Gestion d'erreurs
- [ ] Cas limites
- [ ] Performance

#### Tâche 13.2: Code Review

- [ ] Review par un pair
- [ ] Vérifier les bonnes pratiques
- [ ] Vérifier la documentation

#### Tâche 13.3: Préparation du merge

```bash
# Mettre à jour depuis main
git fetch origin
git rebase origin/main

# Vérifier les conflits
git status

# Push final
git push origin refactor/prospection-ai-structure
```

#### Tâche 13.4: Créer la Pull Request

- [ ] Titre clair
- [ ] Description détaillée
- [ ] Screenshots avant/après
- [ ] Checklist de review

**Validation:**
- [ ] Tous les tests passent
- [ ] Code review approuvé
- [ ] PR prête à merger

---

## 📊 Métriques de Succès

### Avant Refactoring
- Composants > 500 lignes: **5**
- Profondeur max dossiers: **2**
- Duplications: **~15%**
- Composants au même niveau: **15**

### Après Refactoring
- Composants > 500 lignes: **0** ✅
- Profondeur max dossiers: **4** ✅
- Duplications: **< 5%** ✅
- Composants organisés: **7 dossiers** ✅

---

## 🎯 Checklist Finale

### Phase 1: Fondations ✅
- [ ] Structure de dossiers créée
- [ ] Données extraites
- [ ] Dashboard décomposé
- [ ] AiProspectionPanel décomposé

### Phase 2: Logique Métier ✅
- [ ] Services créés
- [ ] Hooks extraits
- [ ] useAiProspection simplifié

### Phase 3: Composants Partagés ✅
- [ ] Composants UI atomiques
- [ ] Composants réorganisés
- [ ] Imports mis à jour

### Phase 4: Finalisation ✅
- [ ] Documentation complète
- [ ] Tests validés
- [ ] Code review approuvé
- [ ] PR mergée

---

**Créé par:** GitHub Copilot  
**Date:** 11 janvier 2026  
**Statut:** Prêt pour implémentation
