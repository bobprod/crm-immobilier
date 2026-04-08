import apiClient from './backend-api';

// ========== TYPES ==========

export type CommitmentFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
export type CommitmentCategory = 'INVESTOR' | 'RENT' | 'LOAN' | 'TAX' | 'SALARY' | 'CUSTOM';
export type CommitmentType = 'provision_capital' | 'loan_interest' | 'loan_principal' | 'rent_deposit' | 'salary' | 'custom';
export type OccurrenceStatus = 'PENDING' | 'DONE' | 'OVERDUE' | 'WAIVED';
export type AlertLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'GREEN' | 'ORANGE' | 'RED' | 'CRITICAL';

export interface FinancialCommitment {
  id: string;
  agencyId: string;
  name: string;
  description?: string;
  category: CommitmentCategory;
  type: CommitmentType;
  amount: number;
  currency: string;
  frequency: CommitmentFrequency;
  customDayOfMonth?: number;
  gracePeriodDays: number;
  startDate: string;
  endDate?: string;
  totalOccurrences?: number;
  alertLevel: AlertLevel;
  alertChannels?: string[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Relations
  occurrences?: ProvisionOccurrence[];
  _count?: {
    occurrences: number;
  };
}

export interface ProvisionOccurrence {
  id: string;
  commitmentId: string;
  agencyId: string;
  periodLabel: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount?: number;
  currency: string;
  status: OccurrenceStatus;
  paymentRef?: string;
  paidAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AlertStatusResponse {
  status: AlertStatus;
  details?: Array<{
    commitmentId: string;
    commitmentName: string;
    overdueCount: number;
    criticalCount: number;
  }>;
}

export interface YearlySummaryResponse {
  year: number;
  totalByMonth: Record<number, number>;
  byMonth: Record<number, {
    total: number;
    done: number;
    pending: number;
    overdue: number;
    waived: number;
    hasPending: boolean;
    hasOverdue: boolean;
    occurrences: Array<{ id: string; status: OccurrenceStatus }>;
  }>;
}

export interface CumulativeProgressResponse {
  occurrencesTotal: number;
  occurrencesDone: number;
  totalExpected: number;
  totalPaid: number;
  progressPercent: number;
}

export interface OverdueOccurrence extends ProvisionOccurrence {
  commitment: FinancialCommitment;
  daysOverdue: number;
}

export interface CreateCommitmentData {
  name: string;
  description?: string;
  category: CommitmentCategory;
  type: CommitmentType;
  amount: number;
  currency?: string;
  frequency: CommitmentFrequency;
  customDayOfMonth?: number;
  gracePeriodDays?: number;
  startDate: string;
  endDate?: string;
  totalOccurrences?: number;
  alertLevel?: AlertLevel;
  alertChannels?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateCommitmentData {
  name?: string;
  description?: string;
  category?: CommitmentCategory;
  type?: CommitmentType;
  amount?: number;
  currency?: string;
  frequency?: CommitmentFrequency;
  customDayOfMonth?: number;
  gracePeriodDays?: number;
  startDate?: string;
  endDate?: string;
  totalOccurrences?: number;
  alertLevel?: AlertLevel;
  alertChannels?: string[];
  metadata?: Record<string, any>;
}

export interface MarkOccurrenceDoneData {
  paymentRef?: string;
  notes?: string;
}

// ========== API CALLS ==========

// ─── Commitments ─────────────────────────────────────────────────────────
export const getCommitments = (params?: {
  isActive?: boolean;
  category?: CommitmentCategory;
  type?: CommitmentType;
}) => {
  const query: Record<string, any> = {};
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  if (params?.category) query.category = params.category;
  if (params?.type) query.type = params.type;
  return apiClient.get<FinancialCommitment[]>('/finance/commitments', { params: query });
};

export const getCommitment = (id: string) =>
  apiClient.get<FinancialCommitment>(`/finance/commitments/${id}`);

export const createCommitment = (data: CreateCommitmentData) =>
  apiClient.post<FinancialCommitment>('/finance/commitments', data);

export const updateCommitment = (id: string, data: UpdateCommitmentData) =>
  apiClient.put<FinancialCommitment>(`/finance/commitments/${id}`, data);

export const deleteCommitment = (id: string) =>
  apiClient.delete(`/finance/commitments/${id}`);

export const toggleCommitment = (id: string) =>
  apiClient.put<FinancialCommitment>(`/finance/commitments/${id}/toggle`, {});

// ─── Occurrences ──────────────────────────────────────────────────────────
export const markOccurrenceDone = (id: string, data: MarkOccurrenceDoneData) =>
  apiClient.put<ProvisionOccurrence>(`/finance/occurrences/${id}/done`, data);

export const markOccurrenceWaived = (id: string, reason?: string) =>
  apiClient.put<ProvisionOccurrence>(`/finance/occurrences/${id}/waived`, { reason });

// ─── Dashboard provisions ─────────────────────────────────────────────────
export const getAlertStatus = () =>
  apiClient.get<AlertStatusResponse>('/finance/provisions/alert-status');

export const getYearlySummary = (year?: number) =>
  apiClient.get<YearlySummaryResponse>(
    `/finance/provisions/summary?year=${year || new Date().getFullYear()}`
  );

export const getOverdueOccurrences = () =>
  apiClient.get<OverdueOccurrence[]>('/finance/provisions/overdue');

export const getCumulativeProgress = (commitmentId: string) =>
  apiClient.get<CumulativeProgressResponse>(`/finance/provisions/cumulative/${commitmentId}`);
