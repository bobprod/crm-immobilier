import { useState, useEffect, useCallback } from 'react';
import { prospectsEnhancedAPI } from '../utils/prospects-enhanced-api';

// Types
export interface ProspectInteraction {
  id: string;
  prospectId: string;
  userId: string;
  date: string;
  channel: 'phone' | 'email' | 'sms' | 'whatsapp' | 'meeting' | 'visit';
  type: string;
  subject?: string;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  propertyShown?: string;
  feedback?: any;
}

export interface ProspectPreference {
  id: string;
  prospectId: string;
  category: string;
  liked?: string[];
  disliked?: string[];
  priority: number;
  notes?: string;
}

export interface PropertyShown {
  id: string;
  prospectId: string;
  propertyId: string;
  shownDate: string;
  visitType?: string;
  feedback?: string;
  interestLevel?: number;
  reasons?: any;
  outcome?: string;
  properties?: any;
}

export interface ProspectBudget {
  min?: number;
  max?: number;
  currency?: string;
}

export interface SearchCriteria {
  propertyType?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  features?: string[];
}

export interface ProspectEnhanced {
  id: string;
  userId: string;
  agencyId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type: 'buyer' | 'seller' | 'renter' | 'landlord' | 'investor' | 'other';
  currency: string;
  preferences?: any;
  source?: string;
  status: 'active' | 'inactive' | 'converted' | 'lost' | 'archived' | 'lead' | 'contacted' | 'qualified' | 'negotiation' | 'closing';
  score: number;
  prospectType?: 'requete_location' | 'requete_achat' | 'mandat_location' | 'mandat_vente' | 'promoteur';
  subType?: string;
  searchCriteria?: SearchCriteria;
  mandatInfo?: any;
  profiling?: any;
  timeline?: string;
  budget?: ProspectBudget;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  interactions?: ProspectInteraction[];
  preferences_details?: ProspectPreference[];
  propertiesShown?: PropertyShown[];
  timelineStages?: any[];
  matches?: any[];
  appointments?: any[];
  documents?: any[];
  communications?: any[];
}

export interface ProspectStats {
  byType: { prospectType: string; _count: number }[];
  byStatus: { status: string; _count: number }[];
}

export interface ActionsToday {
  appointments: any[];
  followUps: any[];
}

export function useProspectsEnhanced() {
  const [prospects, setProspects] = useState<ProspectEnhanced[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProspectStats | null>(null);
  const [actionsToday, setActionsToday] = useState<ActionsToday | null>(null);

  // Charger les prospects par type
  const loadProspectsByType = useCallback(async (type: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await prospectsEnhancedAPI.getProspectsByType(type);
      setProspects(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des prospects');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Recherche intelligente
  const searchProspects = useCallback(async (criteria: any) => {
    try {
      setLoading(true);
      setError(null);
      const data = await prospectsEnhancedAPI.smartSearch(criteria);
      setProspects(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un prospect enrichi
  const createProspect = useCallback(async (data: Partial<ProspectEnhanced>) => {
    try {
      setLoading(true);
      setError(null);
      const newProspect = await prospectsEnhancedAPI.createProspectEnhanced(data);
      setProspects(prev => [newProspect, ...prev]);
      return newProspect;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer un prospect complet
  const getProspectFull = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await prospectsEnhancedAPI.getProspectFull(id);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajouter une interaction
  const addInteraction = useCallback(async (prospectId: string, data: Partial<ProspectInteraction>) => {
    try {
      setError(null);
      const interaction = await prospectsEnhancedAPI.addInteraction(prospectId, data);
      // Mettre à jour le prospect dans la liste
      setProspects(prev => prev.map(p => {
        if (p.id === prospectId) {
          return {
            ...p,
            interactions: [interaction, ...(p.interactions || [])],
          };
        }
        return p;
      }));
      return interaction;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout de l\'interaction');
      throw err;
    }
  }, []);

  // Définir une préférence
  const setPreference = useCallback(async (prospectId: string, data: Partial<ProspectPreference>) => {
    try {
      setError(null);
      return await prospectsEnhancedAPI.setPreference(prospectId, data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la définition de la préférence');
      throw err;
    }
  }, []);

  // Récupérer les préférences
  const getPreferences = useCallback(async (prospectId: string) => {
    try {
      setError(null);
      return await prospectsEnhancedAPI.getPreferences(prospectId);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des préférences');
      throw err;
    }
  }, []);

  // Enregistrer un bien montré
  const recordPropertyShown = useCallback(async (prospectId: string, data: any) => {
    try {
      setError(null);
      const propertyShown = await prospectsEnhancedAPI.recordPropertyShown(prospectId, data);
      // Mettre à jour le prospect
      setProspects(prev => prev.map(p => {
        if (p.id === prospectId) {
          return {
            ...p,
            propertiesShown: [propertyShown, ...(p.propertiesShown || [])],
          };
        }
        return p;
      }));
      return propertyShown;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
      throw err;
    }
  }, []);

  // Changer l'étape du funnel
  const changeStage = useCallback(async (prospectId: string, stage: string) => {
    try {
      setError(null);
      const updated = await prospectsEnhancedAPI.changeStage(prospectId, stage);
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, status: stage } : p));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement d\'étape');
      throw err;
    }
  }, []);

  // Charger les stats
  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await prospectsEnhancedAPI.getStatsByType();
      setStats(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des stats');
      throw err;
    }
  }, []);

  // Charger les actions du jour
  const loadActionsToday = useCallback(async () => {
    try {
      setError(null);
      const data = await prospectsEnhancedAPI.getActionsToday();
      setActionsToday(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des actions');
      throw err;
    }
  }, []);

  // Obtenir les propriétés recommandées
  const getRecommendedProperties = useCallback(async (prospectId: string, limit = 10) => {
    try {
      setError(null);
      return await prospectsEnhancedAPI.getRecommendedProperties(prospectId, limit);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des recommandations');
      throw err;
    }
  }, []);

  // Vérifier le match
  const checkMatch = useCallback(async (prospectId: string, propertyId: string) => {
    try {
      setError(null);
      return await prospectsEnhancedAPI.checkPropertyMatch(prospectId, propertyId);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification du match');
      throw err;
    }
  }, []);

  return {
    // State
    prospects,
    loading,
    error,
    stats,
    actionsToday,

    // Actions
    loadProspectsByType,
    searchProspects,
    createProspect,
    getProspectFull,
    addInteraction,
    setPreference,
    getPreferences,
    recordPropertyShown,
    changeStage,
    loadStats,
    loadActionsToday,
    getRecommendedProperties,
    checkMatch,

    // Utilities
    clearError: () => setError(null),
    setProspects,
  };
}
