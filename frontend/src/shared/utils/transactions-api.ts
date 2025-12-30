import apiClient from './backend-api';

// ========== ENUMS & TYPES ==========

export enum TransactionType {
  SALE = 'sale',
  RENTAL = 'rental',
}

export enum TransactionStatus {
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  PROMISE_SIGNED = 'promise_signed',
  COMPROMIS_SIGNED = 'compromis_signed',
  FINAL_DEED_SIGNED = 'final_deed_signed',
  CANCELLED = 'cancelled',
}

// ========== TRANSACTION TYPES ==========

export interface Transaction {
  id: string;
  userId: string;
  propertyId: string;
  prospectId?: string;
  mandateId?: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  offerPrice?: number;
  negotiatedPrice?: number;
  finalPrice?: number;
  currency: string;
  depositAmount?: number;
  depositPaidAt?: string;
  estimatedClosing?: string;
  actualClosing?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  notaryName?: string;
  notaryContact?: string;
  loanAmount?: number;
  loanApproved: boolean;
  offerDate?: string;
  promiseDate?: string;
  compromisDate?: string;
  finalDeedDate?: string;
  notes?: string;
  conditions?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  property?: any;
  prospect?: any;
  mandate?: any;
  steps?: TransactionStep[];
  commissions?: any[];
  invoices?: any[];
}

export interface CreateTransactionDTO {
  propertyId: string;
  prospectId?: string;
  mandateId?: string;
  reference: string;
  type: TransactionType;
  offerPrice?: number;
  negotiatedPrice?: number;
  finalPrice?: number;
  currency?: string;
  depositAmount?: number;
  depositPaidAt?: string;
  estimatedClosing?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  notaryName?: string;
  notaryContact?: string;
  loanAmount?: number;
  loanApproved?: boolean;
  notes?: string;
  conditions?: any;
  metadata?: any;
}

export interface UpdateTransactionDTO extends Partial<CreateTransactionDTO> {
  status?: TransactionStatus;
  offerDate?: string;
  promiseDate?: string;
  compromisDate?: string;
  finalDeedDate?: string;
  actualClosing?: string;
}

export interface TransactionFilters {
  status?: string;
  type?: string;
  propertyId?: string;
  prospectId?: string;
  mandateId?: string;
}

// ========== TRANSACTION STEP TYPES ==========

export interface TransactionStep {
  id: string;
  transactionId: string;
  stage: string;
  completedAt: string;
  completedBy?: string;
  notes?: string;
  documents?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionStepDTO {
  stage: string;
  completedBy?: string;
  notes?: string;
  documents?: any;
  metadata?: any;
}

// ========== PIPELINE TYPES ==========

export interface PipelineStage {
  status: TransactionStatus;
  label: string;
  count: number;
  totalValue: number;
  transactions: Transaction[];
}

export interface Pipeline {
  stages: PipelineStage[];
  totalTransactions: number;
  totalValue: number;
}

// ========== STATS TYPES ==========

export interface TransactionStats {
  total: number;
  byStatus: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
    totalValue: number;
  }>;
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  avgClosingTime: number;
  conversionRate: number;
}

// ========== API ==========

export const transactionsAPI = {
  // ============================================
  // CRUD DE BASE
  // ============================================

  /**
   * Créer une nouvelle transaction
   */
  create: async (data: CreateTransactionDTO): Promise<Transaction> => {
    const response = await apiClient.post('/transactions', data);
    return response.data;
  },

  /**
   * Liste toutes les transactions avec filtres
   */
  list: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const response = await apiClient.get('/transactions', { params: filters });
    return response.data;
  },

  /**
   * Obtenir une transaction par ID
   */
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour une transaction
   */
  update: async (id: string, data: UpdateTransactionDTO): Promise<Transaction> => {
    const response = await apiClient.put(`/transactions/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une transaction
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  // ============================================
  // VUES SPÉCIALES
  // ============================================

  /**
   * Obtenir la vue pipeline des transactions
   */
  getPipeline: async (): Promise<Pipeline> => {
    const response = await apiClient.get('/transactions/pipeline');
    return response.data;
  },

  /**
   * Obtenir les statistiques des transactions
   */
  getStats: async (): Promise<TransactionStats> => {
    const response = await apiClient.get('/transactions/stats');
    return response.data;
  },

  // ============================================
  // TRANSACTION STEPS
  // ============================================

  /**
   * Ajouter une étape à une transaction
   */
  addStep: async (id: string, data: CreateTransactionStepDTO): Promise<TransactionStep> => {
    const response = await apiClient.post(`/transactions/${id}/steps`, data);
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getTransactionTypeLabel = (type: TransactionType): string => {
  const labels: Record<TransactionType, string> = {
    [TransactionType.SALE]: 'Vente',
    [TransactionType.RENTAL]: 'Location',
  };
  return labels[type] || type;
};

export const getTransactionStatusLabel = (status: TransactionStatus): string => {
  const labels: Record<TransactionStatus, string> = {
    [TransactionStatus.OFFER_RECEIVED]: 'Offre reçue',
    [TransactionStatus.OFFER_ACCEPTED]: 'Offre acceptée',
    [TransactionStatus.PROMISE_SIGNED]: 'Promesse signée',
    [TransactionStatus.COMPROMIS_SIGNED]: 'Compromis signé',
    [TransactionStatus.FINAL_DEED_SIGNED]: 'Acte final signé',
    [TransactionStatus.CANCELLED]: 'Annulée',
  };
  return labels[status] || status;
};

export const getTransactionStatusColor = (status: TransactionStatus): string => {
  const colors: Record<TransactionStatus, string> = {
    [TransactionStatus.OFFER_RECEIVED]: 'bg-blue-100 text-blue-800',
    [TransactionStatus.OFFER_ACCEPTED]: 'bg-indigo-100 text-indigo-800',
    [TransactionStatus.PROMISE_SIGNED]: 'bg-purple-100 text-purple-800',
    [TransactionStatus.COMPROMIS_SIGNED]: 'bg-yellow-100 text-yellow-800',
    [TransactionStatus.FINAL_DEED_SIGNED]: 'bg-green-100 text-green-800',
    [TransactionStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const formatTransactionPrice = (amount?: number, currency: string = 'TND'): string => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getTransactionProgress = (status: TransactionStatus): number => {
  const progressMap: Record<TransactionStatus, number> = {
    [TransactionStatus.OFFER_RECEIVED]: 20,
    [TransactionStatus.OFFER_ACCEPTED]: 40,
    [TransactionStatus.PROMISE_SIGNED]: 60,
    [TransactionStatus.COMPROMIS_SIGNED]: 80,
    [TransactionStatus.FINAL_DEED_SIGNED]: 100,
    [TransactionStatus.CANCELLED]: 0,
  };
  return progressMap[status] || 0;
};

export const isTransactionActive = (transaction: Transaction): boolean => {
  return transaction.status !== TransactionStatus.CANCELLED &&
    transaction.status !== TransactionStatus.FINAL_DEED_SIGNED;
};

export const getTransactionDaysToClosing = (transaction: Transaction): number | null => {
  if (!transaction.estimatedClosing) return null;
  const closingDate = new Date(transaction.estimatedClosing);
  const now = new Date();
  const diffTime = closingDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getTransactionCurrentPrice = (transaction: Transaction): number | undefined => {
  return transaction.finalPrice || transaction.negotiatedPrice || transaction.offerPrice;
};

export default transactionsAPI;
