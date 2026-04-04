import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AgentUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

export interface CommissionOverride {
  id: string;
  agentProfileId: string;
  tier1MaxAmount?: number;
  tier2MinAmount?: number;
  tier2Rate?: number;
  tier3MinAmount?: number;
  tier3Rate?: number;
  directSaleRate?: number;
}

export interface AgentProfile {
  id: string;
  userId: string;
  agencyId: string;
  jobTitle?: string;
  phone?: string;
  hireDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  user: AgentUser;
  commissionOverride?: CommissionOverride | null;
}

export interface CommissionConfig {
  id?: string;
  agencyId: string;
  tier1MaxAmount: number;
  tier2MinAmount: number;
  tier2Rate: number;
  tier3MinAmount: number;
  tier3Rate: number;
  directSaleRate: number;
  currency: string;
  isDefault?: boolean;
}

export interface AnnualBonusConfig {
  id?: string;
  agencyId: string;
  tier1MinAmount: number;
  tier1Rate: number;
  tier2MinAmount?: number | null;
  tier2Rate?: number | null;
  tier3MinAmount?: number | null;
  tier3Rate?: number | null;
  currency: string;
  isDefault?: boolean;
}

export interface MonthlyPerformance {
  id: string;
  agentProfileId: string;
  year: number;
  month: number;
  caAmount: number;
  commissionRate: number;
  commissionAmount: number;
  directSalesCA: number;
  directSalesCommission: number;
  totalCommission: number;
  currency: string;
  notes?: string;
}

export interface AnnualSummary {
  agentProfile: AgentProfile;
  year: number;
  totalAnnualCA: number;
  totalDirectSalesCA: number;
  totalCommissions: number;
  bonusRate: number;
  annualBonus: number;
  monthlyBreakdown: MonthlyPerformance[];
  currency: string;
}

export function usePersonnel() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig | null>(null);
  const [annualBonusConfig, setAnnualBonusConfig] = useState<AnnualBonusConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/personnel/agents`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur lors du chargement du personnel');
      const data = await response.json();
      setAgents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCommissionConfig = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/personnel/commission-config`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur configuration commission');
      setCommissionConfig(await response.json());
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const loadAnnualBonusConfig = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/personnel/annual-bonus-config`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur configuration prime annuelle');
      setAnnualBonusConfig(await response.json());
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadAgents();
    loadCommissionConfig();
    loadAnnualBonusConfig();
  }, [loadAgents, loadCommissionConfig, loadAnnualBonusConfig]);

  // ── Agent CRUD ──────────────────────────────────────────────────────────────

  const createAgent = async (data: {
    userId: string;
    jobTitle?: string;
    phone?: string;
    hireDate?: string;
    isActive?: boolean;
    notes?: string;
  }) => {
    const response = await fetch(`${API_URL}/personnel/agents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erreur lors de la création');
    }
    const agent = await response.json();
    setAgents((prev) => [agent, ...prev]);
    return agent;
  };

  const updateAgent = async (id: string, data: Partial<AgentProfile>) => {
    const response = await fetch(`${API_URL}/personnel/agents/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erreur lors de la mise à jour');
    }
    const updated = await response.json();
    setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const deleteAgent = async (id: string) => {
    const response = await fetch(`${API_URL}/personnel/agents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression');
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Commission Config ───────────────────────────────────────────────────────

  const saveCommissionConfig = async (data: Partial<CommissionConfig>) => {
    const response = await fetch(`${API_URL}/personnel/commission-config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erreur sauvegarde configuration');
    const updated = await response.json();
    setCommissionConfig(updated);
    return updated;
  };

  // ── Annual Bonus Config ─────────────────────────────────────────────────────

  const saveAnnualBonusConfig = async (data: Partial<AnnualBonusConfig>) => {
    const response = await fetch(`${API_URL}/personnel/annual-bonus-config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erreur sauvegarde prime annuelle');
    const updated = await response.json();
    setAnnualBonusConfig(updated);
    return updated;
  };

  // ── Agent Commission Override ───────────────────────────────────────────────

  const saveAgentCommissionOverride = async (
    agentProfileId: string,
    data: Partial<CommissionOverride>,
  ) => {
    const response = await fetch(`${API_URL}/personnel/agents/${agentProfileId}/commission-override`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erreur sauvegarde override commission');
    return response.json();
  };

  const deleteAgentCommissionOverride = async (agentProfileId: string) => {
    const response = await fetch(`${API_URL}/personnel/agents/${agentProfileId}/commission-override`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erreur suppression override commission');
  };

  // ── Monthly Performance ─────────────────────────────────────────────────────

  const saveMonthlyPerformance = async (
    agentProfileId: string,
    data: { year: number; month: number; caAmount?: number; directSalesCA?: number; notes?: string },
  ) => {
    const response = await fetch(`${API_URL}/personnel/agents/${agentProfileId}/performance`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erreur sauvegarde performance');
    return response.json();
  };

  const getAnnualSummary = async (agentProfileId: string, year?: number): Promise<AnnualSummary> => {
    const params = year ? `?year=${year}` : '';
    const response = await fetch(`${API_URL}/personnel/agents/${agentProfileId}/annual-summary${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erreur chargement résumé annuel');
    return response.json();
  };

  const getAgencyStats = async (year?: number) => {
    const params = year ? `?year=${year}` : '';
    const response = await fetch(`${API_URL}/personnel/stats${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Erreur chargement statistiques agence');
    return response.json();
  };

  return {
    agents,
    commissionConfig,
    annualBonusConfig,
    loading,
    error,
    refresh: loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    saveCommissionConfig,
    saveAnnualBonusConfig,
    saveAgentCommissionOverride,
    deleteAgentCommissionOverride,
    saveMonthlyPerformance,
    getAnnualSummary,
    getAgencyStats,
  };
}
