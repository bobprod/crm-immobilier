import apiClient from './backend-api';

// ========== ENUMS & TYPES ==========

export enum CommissionStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum ClientType {
  BUYER = 'buyer',
  SELLER = 'seller',
  TENANT = 'tenant',
  LANDLORD = 'landlord',
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  OTHER = 'other',
}

// ========== COMMISSION TYPES ==========

export interface Commission {
  id: string;
  userId: string;
  transactionId: string;
  agentId: string;
  type: string;
  amount: number;
  percentage?: number;
  currency: string;
  status: CommissionStatus;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  transaction?: any;
  agent?: any;
  payments?: Payment[];
}

export interface CreateCommissionDTO {
  transactionId: string;
  agentId: string;
  type?: string;
  amount: number;
  percentage?: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
  metadata?: any;
}

export interface UpdateCommissionDTO extends Partial<CreateCommissionDTO> {
  status?: CommissionStatus;
  paidAt?: string;
}

export interface CommissionFilters {
  status?: string;
  agentId?: string;
  transactionId?: string;
}

// ========== INVOICE TYPES ==========

export interface Invoice {
  id: string;
  userId: string;
  transactionId?: string;
  ownerId?: string;
  number: string;
  clientType: ClientType;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  amount: number;
  vat: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  description?: string;
  items?: any;
  notes?: string;
  pdfUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  transaction?: any;
  owner?: any;
  payments?: Payment[];
}

export interface CreateInvoiceDTO {
  transactionId?: string;
  ownerId?: string;
  number: string;
  clientType: ClientType;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  amount: number;
  vat?: number;
  totalAmount: number;
  currency?: string;
  dueDate: string;
  description?: string;
  items?: any;
  notes?: string;
  metadata?: any;
}

export interface UpdateInvoiceDTO extends Partial<CreateInvoiceDTO> {
  status?: InvoiceStatus;
  paidAt?: string;
  pdfUrl?: string;
}

export interface InvoiceFilters {
  status?: string;
  clientType?: string;
  transactionId?: string;
  ownerId?: string;
  overdue?: boolean;
}

// ========== PAYMENT TYPES ==========

export interface Payment {
  id: string;
  userId: string;
  invoiceId?: string;
  commissionId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  invoice?: Invoice;
  commission?: Commission;
}

export interface CreatePaymentDTO {
  invoiceId?: string;
  commissionId?: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  reference?: string;
  paidAt?: string;
  notes?: string;
  metadata?: any;
}

export interface UpdatePaymentDTO extends Partial<CreatePaymentDTO> {}

export interface PaymentFilters {
  invoiceId?: string;
  commissionId?: string;
  method?: string;
}

// ========== STATS TYPES ==========

export interface FinanceStats {
  commissions: {
    total: number;
    pending: number;
    paid: number;
    totalAmount: number;
    paidAmount: number;
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
  };
  payments: {
    total: number;
    totalAmount: number;
    byMethod: Array<{
      method: string;
      count: number;
      totalAmount: number;
    }>;
  };
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
}

// ========== API ==========

export const financeAPI = {
  // ============================================
  // COMMISSIONS
  // ============================================

  /**
   * Créer une nouvelle commission
   */
  createCommission: async (data: CreateCommissionDTO): Promise<Commission> => {
    const response = await apiClient.post('/finance/commissions', data);
    return response.data;
  },

  /**
   * Liste toutes les commissions avec filtres
   */
  listCommissions: async (filters?: CommissionFilters): Promise<Commission[]> => {
    const response = await apiClient.get('/finance/commissions', { params: filters });
    return response.data;
  },

  /**
   * Obtenir une commission par ID
   */
  getCommissionById: async (id: string): Promise<Commission> => {
    const response = await apiClient.get(`/finance/commissions/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour une commission
   */
  updateCommission: async (id: string, data: UpdateCommissionDTO): Promise<Commission> => {
    const response = await apiClient.put(`/finance/commissions/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une commission
   */
  deleteCommission: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/commissions/${id}`);
  },

  // ============================================
  // INVOICES
  // ============================================

  /**
   * Créer une nouvelle facture
   */
  createInvoice: async (data: CreateInvoiceDTO): Promise<Invoice> => {
    const response = await apiClient.post('/finance/invoices', data);
    return response.data;
  },

  /**
   * Liste toutes les factures avec filtres
   */
  listInvoices: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    const response = await apiClient.get('/finance/invoices', { params: filters });
    return response.data;
  },

  /**
   * Obtenir une facture par ID
   */
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/finance/invoices/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour une facture
   */
  updateInvoice: async (id: string, data: UpdateInvoiceDTO): Promise<Invoice> => {
    const response = await apiClient.put(`/finance/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une facture
   */
  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/invoices/${id}`);
  },

  // ============================================
  // PAYMENTS
  // ============================================

  /**
   * Créer un nouveau paiement
   */
  createPayment: async (data: CreatePaymentDTO): Promise<Payment> => {
    const response = await apiClient.post('/finance/payments', data);
    return response.data;
  },

  /**
   * Liste tous les paiements avec filtres
   */
  listPayments: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const response = await apiClient.get('/finance/payments', { params: filters });
    return response.data;
  },

  /**
   * Obtenir un paiement par ID
   */
  getPaymentById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/finance/payments/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un paiement
   */
  updatePayment: async (id: string, data: UpdatePaymentDTO): Promise<Payment> => {
    const response = await apiClient.put(`/finance/payments/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un paiement
   */
  deletePayment: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/payments/${id}`);
  },

  // ============================================
  // STATS
  // ============================================

  /**
   * Obtenir les statistiques financières
   */
  getStats: async (): Promise<FinanceStats> => {
    const response = await apiClient.get('/finance/stats');
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getCommissionStatusLabel = (status: CommissionStatus): string => {
  const labels: Record<CommissionStatus, string> = {
    [CommissionStatus.PENDING]: 'En attente',
    [CommissionStatus.PARTIALLY_PAID]: 'Partiellement payée',
    [CommissionStatus.PAID]: 'Payée',
    [CommissionStatus.CANCELLED]: 'Annulée',
  };
  return labels[status] || status;
};

export const getInvoiceStatusLabel = (status: InvoiceStatus): string => {
  const labels: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'Brouillon',
    [InvoiceStatus.SENT]: 'Envoyée',
    [InvoiceStatus.PAID]: 'Payée',
    [InvoiceStatus.PARTIALLY_PAID]: 'Partiellement payée',
    [InvoiceStatus.OVERDUE]: 'En retard',
    [InvoiceStatus.CANCELLED]: 'Annulée',
  };
  return labels[status] || status;
};

export const getClientTypeLabel = (type: ClientType): string => {
  const labels: Record<ClientType, string> = {
    [ClientType.BUYER]: 'Acheteur',
    [ClientType.SELLER]: 'Vendeur',
    [ClientType.TENANT]: 'Locataire',
    [ClientType.LANDLORD]: 'Propriétaire',
  };
  return labels[type] || type;
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Espèces',
    [PaymentMethod.CHECK]: 'Chèque',
    [PaymentMethod.BANK_TRANSFER]: 'Virement bancaire',
    [PaymentMethod.CREDIT_CARD]: 'Carte de crédit',
    [PaymentMethod.OTHER]: 'Autre',
  };
  return labels[method] || method;
};

export const getCommissionStatusColor = (status: CommissionStatus): string => {
  const colors: Record<CommissionStatus, string> = {
    [CommissionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [CommissionStatus.PARTIALLY_PAID]: 'bg-blue-100 text-blue-800',
    [CommissionStatus.PAID]: 'bg-green-100 text-green-800',
    [CommissionStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getInvoiceStatusColor = (status: InvoiceStatus): string => {
  const colors: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-800',
    [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
    [InvoiceStatus.PARTIALLY_PAID]: 'bg-yellow-100 text-yellow-800',
    [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-800',
    [InvoiceStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const formatCurrency = (amount: number, currency: string = 'TND'): string => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
    return false;
  }
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  return dueDate < now;
};

export default financeAPI;
