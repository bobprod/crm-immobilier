import apiClient from './backend-api';

// ========== COMMISSIONS ==========

export type CommissionStatus = 'pending' | 'partially_paid' | 'paid' | 'cancelled';

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

export interface CommissionFilters {
  status?: CommissionStatus;
  agentId?: string;
  transactionId?: string;
}

export interface CreateCommissionData {
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

export interface UpdateCommissionData {
  transactionId?: string;
  agentId?: string;
  type?: string;
  amount?: number;
  percentage?: number;
  currency?: string;
  status?: CommissionStatus;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  metadata?: any;
}

// ========== INVOICES ==========

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
export type ClientType = 'buyer' | 'seller' | 'tenant' | 'landlord';

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
  issueDate: string;
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

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientType?: ClientType;
  transactionId?: string;
  ownerId?: string;
  overdue?: boolean;
}

export interface CreateInvoiceData {
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

export interface UpdateInvoiceData {
  transactionId?: string;
  ownerId?: string;
  number?: string;
  clientType?: ClientType;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  amount?: number;
  vat?: number;
  totalAmount?: number;
  currency?: string;
  status?: InvoiceStatus;
  dueDate?: string;
  paidAt?: string;
  description?: string;
  items?: any;
  notes?: string;
  pdfUrl?: string;
  metadata?: any;
}

// ========== PAYMENTS ==========

export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';

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

export interface PaymentFilters {
  invoiceId?: string;
  commissionId?: string;
  method?: PaymentMethod;
}

export interface CreatePaymentData {
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

export interface UpdatePaymentData {
  invoiceId?: string;
  commissionId?: string;
  amount?: number;
  currency?: string;
  method?: PaymentMethod;
  reference?: string;
  paidAt?: string;
  notes?: string;
  metadata?: any;
}

// ========== STATS ==========

export interface FinanceStats {
  commissions: {
    total: number;
    pending: number;
    paid: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
  payments: {
    total: number;
    totalAmount: number;
    byMethod: {
      method: PaymentMethod;
      count: number;
      amount: number;
    }[];
  };
}

// ========== API FUNCTIONS ==========

export const commissionsAPI = {
  /**
   * Get all commissions with optional filters
   */
  list: async (filters?: CommissionFilters): Promise<Commission[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.agentId) params.append('agentId', filters.agentId);
    if (filters?.transactionId) params.append('transactionId', filters.transactionId);

    const queryString = params.toString();
    const url = `/finance/commissions${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get a single commission by ID
   */
  getById: async (id: string): Promise<Commission> => {
    const response = await apiClient.get(`/finance/commissions/${id}`);
    return response.data;
  },

  /**
   * Create a new commission
   */
  create: async (data: CreateCommissionData): Promise<Commission> => {
    const response = await apiClient.post('/finance/commissions', data);
    return response.data;
  },

  /**
   * Update an existing commission
   */
  update: async (id: string, data: UpdateCommissionData): Promise<Commission> => {
    const response = await apiClient.put(`/finance/commissions/${id}`, data);
    return response.data;
  },

  /**
   * Delete a commission
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/commissions/${id}`);
  },
};

export const invoicesAPI = {
  /**
   * Get all invoices with optional filters
   */
  list: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientType) params.append('clientType', filters.clientType);
    if (filters?.transactionId) params.append('transactionId', filters.transactionId);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.overdue !== undefined) params.append('overdue', String(filters.overdue));

    const queryString = params.toString();
    const url = `/finance/invoices${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get a single invoice by ID
   */
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/finance/invoices/${id}`);
    return response.data;
  },

  /**
   * Create a new invoice
   */
  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.post('/finance/invoices', data);
    return response.data;
  },

  /**
   * Update an existing invoice
   */
  update: async (id: string, data: UpdateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.put(`/finance/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Delete an invoice
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/invoices/${id}`);
  },
};

export const paymentsAPI = {
  /**
   * Get all payments with optional filters
   */
  list: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (filters?.invoiceId) params.append('invoiceId', filters.invoiceId);
    if (filters?.commissionId) params.append('commissionId', filters.commissionId);
    if (filters?.method) params.append('method', filters.method);

    const queryString = params.toString();
    const url = `/finance/payments${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get a single payment by ID
   */
  getById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/finance/payments/${id}`);
    return response.data;
  },

  /**
   * Create a new payment
   */
  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await apiClient.post('/finance/payments', data);
    return response.data;
  },

  /**
   * Update an existing payment
   */
  update: async (id: string, data: UpdatePaymentData): Promise<Payment> => {
    const response = await apiClient.put(`/finance/payments/${id}`, data);
    return response.data;
  },

  /**
   * Delete a payment
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/payments/${id}`);
  },
};

export const financeAPI = {
  /**
   * Get financial statistics
   */
  getStats: async (): Promise<FinanceStats> => {
    const response = await apiClient.get('/finance/stats');
    return response.data;
  },
};
