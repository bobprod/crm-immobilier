import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ProspectionConfiguration,
  ProspectionPanelState,
  ProspectionPanelStateData,
  ProspectionResult,
  ProspectionLead,
  StartProspectionRequest,
  StartProspectionResponse,
  ConvertToProspectsResponse,
  ConfigurationValidation,
  ValidationError,
  ExportFormat,
  ConversionFunnelData,
  FunnelStage,
} from '../types/ai-prospection.types';

// ============================================================================
// API FUNCTIONS
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function startProspection(
  config: ProspectionConfiguration,
  token: string
): Promise<StartProspectionResponse> {
  const request: StartProspectionRequest = {
    inputMode: config.inputMode,
    // Include appropriate fields based on mode
    ...(config.inputMode === 'urls'
      ? {
        urls: config.urls,
        options: {
          maxCost: config.campaignSettings.maxCost,
          timeout: config.campaignSettings.timeout || 300,
        },
      }
      : {
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
      }),
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

async function fetchProspectionStatus(
  prospectionId: string,
  token: string
): Promise<ProspectionResult> {
  const response = await fetch(`${API_BASE_URL}/api/prospecting-ai/${prospectionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

async function exportProspection(
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

async function convertToProspects(
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

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateConfiguration(config: Partial<ProspectionConfiguration>): ConfigurationValidation {
  const errors: ValidationError[] = [];

  // Mode validation
  if (!config.inputMode) {
    errors.push({ field: 'inputMode', message: 'Le mode de prospection est requis' });
    return { isValid: false, errors };
  }

  // URL mode validation
  if (config.inputMode === 'urls') {
    if (!config.urls || config.urls.length === 0) {
      errors.push({ field: 'urls', message: 'Au moins une URL est requise en mode URLs' });
    } else if (config.urls.length > 50) {
      errors.push({ field: 'urls', message: 'Maximum 50 URLs par campagne' });
    }

    // Campaign settings validation (required for both modes)
    if (!config.campaignSettings) {
      errors.push({ field: 'campaignSettings', message: 'Les paramètres de campagne sont requis' });
    } else {
      if (!config.campaignSettings.name || config.campaignSettings.name.trim() === '') {
        errors.push({ field: 'campaignSettings.name', message: 'Le nom de la campagne est requis' });
      }

      if (!config.campaignSettings.maxCost || config.campaignSettings.maxCost < 0.5) {
        errors.push({ field: 'campaignSettings.maxCost', message: 'Le budget API doit être >= $0.50' });
      } else if (config.campaignSettings.maxCost > 10) {
        errors.push({ field: 'campaignSettings.maxCost', message: 'Le budget API doit être <= $10.00' });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Criteria mode validation
  // Zone validation
  if (!config.zone) {
    errors.push({ field: 'zone', message: 'La zone géographique est requise' });
  } else if (!config.zone.name || config.zone.name.trim() === '') {
    errors.push({ field: 'zone.name', message: 'Le nom de la zone est requis' });
  }

  // Target type validation
  if (!config.targetType) {
    errors.push({ field: 'targetType', message: 'Le type de cible est requis' });
  }

  // Property type validation
  if (!config.propertyType) {
    errors.push({ field: 'propertyType', message: 'Le type de bien est requis' });
  }

  // Campaign settings validation
  if (!config.campaignSettings) {
    errors.push({ field: 'campaignSettings', message: 'Les paramètres de campagne sont requis' });
  } else {
    if (!config.campaignSettings.name || config.campaignSettings.name.trim() === '') {
      errors.push({ field: 'campaignSettings.name', message: 'Le nom de la campagne est requis' });
    }

    if (!config.campaignSettings.maxLeads || config.campaignSettings.maxLeads < 1) {
      errors.push({ field: 'campaignSettings.maxLeads', message: 'Le nombre max de leads doit être >= 1' });
    } else if (config.campaignSettings.maxLeads > 100) {
      errors.push({ field: 'campaignSettings.maxLeads', message: 'Le nombre max de leads doit être <= 100' });
    }

    if (!config.campaignSettings.maxCost || config.campaignSettings.maxCost < 0.5) {
      errors.push({ field: 'campaignSettings.maxCost', message: 'Le budget API doit être >= $0.50' });
    } else if (config.campaignSettings.maxCost > 10) {
      errors.push({ field: 'campaignSettings.maxCost', message: 'Le budget API doit être <= $10.00' });
    }
  }

  // Budget validation (optional but if present, must be valid)
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

// ============================================================================
// FUNNEL DATA COMPUTED FROM REAL LEAD ATTRIBUTES
// ============================================================================

function computeFunnelData(prospectionId: string, leads: ProspectionLead[]): ConversionFunnelData {
  const totalLeads = leads.length;
  if (totalLeads === 0) {
    return {
      prospectionId,
      totalLeads: 0,
      stages: [],
      conversionRate: 0,
    };
  }

  // Contactable: leads with email or phone
  const contacted = leads.filter((l) => l.email || l.phone).length;
  // Qualified: contactable + confidence >= 60
  const qualified = leads.filter((l) => (l.email || l.phone) && l.confidence >= 60).length;
  // High value: qualified + confidence >= 80 (ready to convert)
  const converted = leads.filter((l) => (l.email || l.phone) && l.confidence >= 80).length;
  // Rejected: confidence < 30
  const rejected = leads.filter((l) => l.confidence < 30).length;

  const avgBudget = leads.reduce((sum, l) => {
    if (l.budget) return sum + ((l.budget.min + l.budget.max) / 2);
    return sum;
  }, 0) / totalLeads;

  return {
    prospectionId,
    totalLeads,
    stages: [
      { stage: 'new', count: totalLeads, percentage: 100, avgTimeInStage: 0 },
      { stage: 'contacted', count: contacted, percentage: (contacted / totalLeads) * 100, avgTimeInStage: 0 },
      { stage: 'qualified', count: qualified, percentage: (qualified / totalLeads) * 100, avgTimeInStage: 0 },
      { stage: 'converted', count: converted, percentage: (converted / totalLeads) * 100, avgTimeInStage: 0 },
      { stage: 'rejected', count: rejected, percentage: (rejected / totalLeads) * 100, avgTimeInStage: 0 },
    ],
    conversionRate: totalLeads > 0 ? (converted / totalLeads) * 100 : 0,
    totalValue: converted * Math.round(avgBudget || 250000),
    avgConversionTime: 0,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface UseAiProspectionReturn {
  // State
  panelState: ProspectionPanelState;
  prospectionResult: ProspectionResult | null;
  funnelData: ConversionFunnelData | null;
  error: string | null;
  isPolling: boolean;

  // Configuration
  configuration: Partial<ProspectionConfiguration>;
  updateConfiguration: (updates: Partial<ProspectionConfiguration>) => void;
  validationResult: ConfigurationValidation;

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
  // ============================================================================
  // STATE
  // ============================================================================

  const [panelState, setPanelState] = useState<ProspectionPanelState>('CONFIGURING');
  const [prospectionResult, setProspectionResult] = useState<ProspectionResult | null>(null);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const [configuration, setConfiguration] = useState<Partial<ProspectionConfiguration>>({
    inputMode: 'criteria', // Default to criteria mode
    campaignSettings: {
      name: '',
      maxLeads: 50,
      maxCost: 5,
      timeout: 300,
    },
    urls: [],
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validationResult = validateConfiguration(configuration);
  const isConfigurationValid = validationResult.isValid;
  const canLaunch = isConfigurationValid && (panelState === 'READY' || panelState === 'CONFIGURING');

  // ============================================================================
  // CONFIGURATION UPDATES
  // ============================================================================

  const updateConfiguration = useCallback((updates: Partial<ProspectionConfiguration>) => {
    setConfiguration((prev) => {
      const newConfig = {
        ...prev,
        ...updates,
        campaignSettings: {
          ...(prev?.campaignSettings || {}),
          ...(updates.campaignSettings || {}),
        } as any,
      };

      // Update panel state based on the new configuration validity
      setPanelState((prevState) => {
        if (prevState === 'CONFIGURING' || prevState === 'READY') {
          const validation = validateConfiguration(newConfig);
          return validation.isValid ? 'READY' : 'CONFIGURING';
        }
        return prevState;
      });

      return newConfig;
    });
  }, []);

  // ============================================================================
  // POLLING LOGIC
  // ============================================================================

  const startPolling = useCallback(
    (prospectionId: string) => {
      setIsPolling(true);

      const poll = async () => {
        try {
          const result = await fetchProspectionStatus(prospectionId, authToken);
          setProspectionResult(result);

          if (result.status === 'completed') {
            setPanelState('COMPLETED');
            setIsPolling(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Generate funnel data from real lead attributes
            const funnel = computeFunnelData(prospectionId, result.leads || []);
            setFunnelData(funnel);
          } else if (result.status === 'failed' || result.status === 'timeout') {
            setPanelState('ERROR');
            setError(result.error?.message || 'La prospection a échoué');
            setIsPolling(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
          setPanelState('ERROR');
          setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du statut');
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      };

      // Poll immediately, then every 3 seconds
      poll();
      pollingIntervalRef.current = setInterval(poll, 3000);
    },
    [authToken]
  );

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // ============================================================================
  // LAUNCH PROSPECTION
  // ============================================================================

  const launchProspection = useCallback(async () => {
    if (!canLaunch) {
      setError('Configuration invalide. Veuillez corriger les erreurs.');
      return;
    }

    try {
      setPanelState('LAUNCHING');
      setError(null);

      const response = await startProspection(configuration as ProspectionConfiguration, authToken);

      setPanelState('RUNNING');
      startPolling(response.prospectionId);
    } catch (err) {
      console.error('Launch error:', err);
      setPanelState('ERROR');
      setError(err instanceof Error ? err.message : 'Erreur lors du lancement de la prospection');
    }
  }, [canLaunch, configuration, authToken, startPolling]);

  // ============================================================================
  // RESET PROSPECTION
  // ============================================================================

  const resetProspection = useCallback(() => {
    stopPolling();
    setPanelState('CONFIGURING');
    setProspectionResult(null);
    setFunnelData(null);
    setError(null);
    // Keep configuration for easy retry
  }, [stopPolling]);

  // ============================================================================
  // RETRY AFTER ERROR
  // ============================================================================

  const retryAfterError = useCallback(async () => {
    if (panelState !== 'ERROR') return;
    await launchProspection();
  }, [panelState, launchProspection]);

  // ============================================================================
  // EXPORT RESULTS
  // ============================================================================

  const exportResults = useCallback(
    async (format: ExportFormat) => {
      if (!prospectionResult?.id) {
        setError('Aucune prospection à exporter');
        return;
      }

      try {
        const blob = await exportProspection(prospectionResult.id, format, authToken);
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
        setError(err instanceof Error ? err.message : 'Erreur lors de l\'exportation');
      }
    },
    [prospectionResult, authToken]
  );

  // ============================================================================
  // CONVERT TO PROSPECTS
  // ============================================================================

  const convertAllToProspects = useCallback(async () => {
    if (!prospectionResult?.id) {
      setError('Aucune prospection à convertir');
      return;
    }

    try {
      const response = await convertToProspects(prospectionResult.id, authToken);
      alert(response.message || `${response.created} créés, ${response.merged} fusionnés, ${response.skipped} ignorés.`);
    } catch (err) {
      console.error('Convert error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la conversion');
    }
  }, [prospectionResult, authToken]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const progressPercentage = prospectionResult?.progress || 0;

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    panelState,
    prospectionResult,
    funnelData,
    error,
    isPolling,

    // Configuration
    configuration,
    updateConfiguration,
    validationResult,

    // Actions
    launchProspection,
    resetProspection,
    retryAfterError,

    // Export/Convert
    exportResults,
    convertAllToProspects,

    // Computed
    isConfigurationValid,
    canLaunch,
    progressPercentage,
  };
}
