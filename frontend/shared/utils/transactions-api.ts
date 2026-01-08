/**
 * Service API pour la gestion des transactions immobilières
 * Architecture DDD - Module Business/Transactions
 */

import apiClient from './backend-api';

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
    const response = await apiClient.get<Transaction[]>(url);
    return response.data;
  },

  /**
   * Récupère une transaction par son ID
   */
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/api/business/transactions/${id}`);
    return response.data;
  },

  /**
   * Crée une nouvelle transaction
   */
  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/api/business/transactions', data);
    return response.data;
  },

  /**
   * Met à jour une transaction existante
   */
  update: async (id: string, data: UpdateTransactionData): Promise<Transaction> => {
    const response = await apiClient.patch<Transaction>(`/api/business/transactions/${id}`, data);
    return response.data;
  },

  /**
   * Supprime une transaction
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/business/transactions/${id}`);
  },

  /**
   * Ajoute une étape à une transaction
   */
  addStep: async (transactionId: string, data: CreateTransactionStepData): Promise<TransactionStep> => {
    const response = await apiClient.post<TransactionStep>(
      `/api/business/transactions/${transactionId}/steps`,
      data
    );
    return response.data;
  },

  /**
   * Récupère les statistiques des transactions
   */
  getStats: async (): Promise<TransactionStats> => {
    const response = await apiClient.get<TransactionStats>('/api/business/transactions/stats');
    return response.data;
  },

  /**
   * Finalise une transaction
   */
  finalize: async (id: string, finalPrice: number, actualClosing?: string): Promise<Transaction> => {
    const response = await apiClient.patch<Transaction>(`/api/business/transactions/${id}`, {
      status: 'final_deed_signed',
      finalPrice,
      actualClosing: actualClosing || new Date().toISOString(),
    });
    return response.data;
  },

  /**
   * Annule une transaction
   */
  cancel: async (id: string, reason: string): Promise<Transaction> => {
    const response = await apiClient.patch<Transaction>(`/api/business/transactions/${id}`, {
      status: 'cancelled',
      notes: reason,
    });
    return response.data;
  },
};
