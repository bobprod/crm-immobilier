import apiClient from './backend-api';

// Types
export interface ValidationResult {
  email?: string;
  phone?: string;
  isValid: boolean;
  score: number;
  isSpam: boolean;
  isDisposable?: boolean;
  isCatchAll?: boolean;
  provider?: string;
  reason?: string;
  validationMethod?: string;
  metadata?: any;
}

export interface ValidationHistory {
  id: string;
  userId: string;
  contactType: string;
  contactValue: string;
  isValid: boolean;
  score: number;
  validationMethod?: string;
  reason?: string;
  isSpam: boolean;
  isDisposable: boolean;
  provider?: string;
  verifiedAt: string;
  prospects?: any;
}

export interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  spam: number;
  disposable: number;
  avgScore: number;
  validRate: number;
}

export interface BlacklistItem {
  id: string;
  type: string;
  value: string;
  reason?: string;
  addedBy?: string;
  isActive: boolean;
  createdAt: string;
}

export const validationAPI = {
  // ============================================
  // VALIDATION EMAIL
  // ============================================

  validateEmail: async (
    email: string,
    prospectId?: string,
  ): Promise<ValidationResult> => {
    const response = await apiClient.post('/validation/email', {
      email,
      prospectId,
    });
    return response.data;
  },

  validateEmails: async (emails: string[]): Promise<any> => {
    const response = await apiClient.post('/validation/emails', { emails });
    return response.data;
  },

  // ============================================
  // VALIDATION TÉLÉPHONE
  // ============================================

  validatePhone: async (
    phone: string,
    prospectId?: string,
  ): Promise<ValidationResult> => {
    const response = await apiClient.post('/validation/phone', {
      phone,
      prospectId,
    });
    return response.data;
  },

  // ============================================
  // BLACKLIST
  // ============================================

  getBlacklist: async (type?: string): Promise<BlacklistItem[]> => {
    const response = await apiClient.get('/validation/blacklist', {
      params: { type },
    });
    return response.data;
  },

  addToBlacklist: async (
    type: string,
    value: string,
    reason?: string,
  ): Promise<BlacklistItem> => {
    const response = await apiClient.post('/validation/blacklist', {
      type,
      value,
      reason,
    });
    return response.data;
  },

  removeFromBlacklist: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/validation/blacklist/${id}`);
    return response.data;
  },

  // ============================================
  // WHITELIST
  // ============================================

  getWhitelist: async (type?: string): Promise<BlacklistItem[]> => {
    const response = await apiClient.get('/validation/whitelist', {
      params: { type },
    });
    return response.data;
  },

  addToWhitelist: async (type: string, value: string): Promise<BlacklistItem> => {
    const response = await apiClient.post('/validation/whitelist', {
      type,
      value,
    });
    return response.data;
  },

  // ============================================
  // HISTORIQUE & STATS
  // ============================================

  getHistory: async (filters?: {
    contactType?: string;
    isValid?: boolean;
    isSpam?: boolean;
    limit?: number;
  }): Promise<ValidationHistory[]> => {
    const response = await apiClient.get('/validation/history', {
      params: filters,
    });
    return response.data;
  },

  getStats: async (): Promise<ValidationStats> => {
    const response = await apiClient.get('/validation/stats');
    return response.data;
  },

  // ============================================
  // VALIDATION AI
  // ============================================

  validateEmailWithAI: async (
    email: string,
    context?: string,
  ): Promise<any> => {
    const response = await apiClient.post('/validation/email/ai', {
      email,
      context,
    });
    return response.data;
  },

  detectSpamWithAI: async (
    email: string,
    name?: string,
    message?: string,
  ): Promise<any> => {
    const response = await apiClient.post('/validation/spam/ai', {
      email,
      name,
      message,
    });
    return response.data;
  },

  enrichContactWithAI: async (
    email: string,
    phone?: string,
    name?: string,
  ): Promise<any> => {
    const response = await apiClient.post('/validation/enrich/ai', {
      email,
      phone,
      name,
    });
    return response.data;
  },
};

// Helper functions
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

export const getScoreBadgeColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-blue-100 text-blue-800';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export const getValidationStatusLabel = (isValid: boolean): string => {
  return isValid ? 'Valide' : 'Invalide';
};

export const getValidationStatusColor = (isValid: boolean): string => {
  return isValid
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
};
