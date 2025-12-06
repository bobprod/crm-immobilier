/**
 * Service API pour la gestion des transactions immobilières
 * Architecture DDD - Module Business/Transactions
 */

import apiClient from './api-client';

/**
 * Interfaces de types pour les transactions
 */
export interface Transaction {
  id: string;
  userId: string;
  reference: string;
  type: 'sale' | 'rent';
  propertyId: string;
  prospectId: string;
  mandateId?: string;
  status:
    | 'offer_received'
    | 'offer_accepted'
    | 'promise_signed'
    | 'compromis_signed'
    | 'final_deed_signed'
    | 'cancelled';
  offerPrice: number;
  negotiatedPrice?: number;
  finalPrice?: number;
  currency: string;
  expectedClosing?: string;
  actualClosing?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  property?: {
    id: string;
    title: string;
    reference?: string;
    price?: number;
    city?: string;
  };
  prospect?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  mandate?: {
    id: string;
    reference: string;
    type: string;
  };
  steps?: TransactionStep[];
  _count?: {
    steps: number;
  };
}

export interface TransactionStep {
  id: string;
  transactionId: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  reference: string;
  type: 'sale' | 'rent';
  propertyId: string;
  prospectId: string;
  mandateId?: string;
  status?: string;
  offerPrice: number;
  negotiatedPrice?: number;
  currency?: string;
  expectedClosing?: string;
  notes?: string;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  status?: string;
  finalPrice?: number;
  actualClosing?: string;
}

export interface CreateTransactionStepData {
  name: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  notes?: string;
}

export interface TransactionFilters {
  status?: string;
  type?: string;
  propertyId?: string;
  prospectId?: string;
  mandateId?: string;
}

export interface TransactionStats {
  total: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

/**
 * API Client pour les transactions
 */
export const transactionsAPI = {
  /**
   * Liste toutes les transactions avec filtres optionnels
   */
  list: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    const url = `/api/business/transactions${query ? `?${query}` : ''}`;
    return apiClient.get<Transaction[]>(url);
  },

  /**
   * Récupère une transaction par son ID
   */
  getById: async (id: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/api/business/transactions/${id}`);
  },

  /**
   * Crée une nouvelle transaction
   */
  create: async (data: CreateTransactionData): Promise<Transaction> => {
    return apiClient.post<Transaction>('/api/business/transactions', data);
  },

  /**
   * Met à jour une transaction existante
   */
  update: async (id: string, data: UpdateTransactionData): Promise<Transaction> => {
    return apiClient.patch<Transaction>(`/api/business/transactions/${id}`, data);
  },

  /**
   * Supprime une transaction
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/business/transactions/${id}`);
  },

  /**
   * Ajoute une étape à une transaction
   */
  addStep: async (transactionId: string, data: CreateTransactionStepData): Promise<TransactionStep> => {
    return apiClient.post<TransactionStep>(
      `/api/business/transactions/${transactionId}/steps`,
      data
    );
  },

  /**
   * Récupère les statistiques des transactions
   */
  getStats: async (): Promise<TransactionStats> => {
    return apiClient.get<TransactionStats>('/api/business/transactions/stats');
  },

  /**
   * Finalise une transaction
   */
  finalize: async (id: string, finalPrice: number, actualClosing?: string): Promise<Transaction> => {
    return apiClient.patch<Transaction>(`/api/business/transactions/${id}`, {
      status: 'final_deed_signed',
      finalPrice,
      actualClosing: actualClosing || new Date().toISOString(),
    });
  },

  /**
   * Annule une transaction
   */
  cancel: async (id: string, reason: string): Promise<Transaction> => {
    return apiClient.patch<Transaction>(`/api/business/transactions/${id}`, {
      status: 'cancelled',
      notes: reason,
    });
  },
};
