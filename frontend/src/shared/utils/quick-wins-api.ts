import backendApiClient from './api-client-backend';

// ============================================
// SMART FORMS AUTO-FILL
// ============================================

export interface FormSuggestion {
  value: string;
  label: string;
  frequency?: number;
  lastUsed?: Date;
  metadata?: Record<string, any>;
}

export interface FormSuggestionQuery {
  fieldName: string;
  partialValue?: string;
  formType?: 'prospect' | 'property' | 'appointment';
  context?: Record<string, any>;
}

export interface ProspectAutoFill {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  city?: string;
  budget?: number;
}

export const smartFormsApi = {
  getFieldSuggestions: async (query: FormSuggestionQuery): Promise<FormSuggestion[]> => {
    const params = new URLSearchParams();
    params.append('fieldName', query.fieldName);
    if (query.partialValue) params.append('partialValue', query.partialValue);
    if (query.formType) params.append('formType', query.formType);
    
    const response = await backendApiClient.get(`/smart-forms/suggestions?${params.toString()}`);
    return response.data.suggestions;
  },

  getProspectAutoFill: async (name: string): Promise<ProspectAutoFill[]> => {
    const response = await backendApiClient.get(`/smart-forms/autofill/prospect?name=${encodeURIComponent(name)}`);
    return response.data;
  },
};

// ============================================
// SEMANTIC SEARCH
// ============================================

export interface SemanticSearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface SemanticSearchQuery {
  query: string;
  searchType?: 'properties' | 'prospects' | 'appointments' | 'all';
  limit?: number;
  filters?: Record<string, any>[];
}

export const semanticSearchApi = {
  search: async (query: SemanticSearchQuery): Promise<SemanticSearchResult[]> => {
    const params = new URLSearchParams();
    params.append('query', query.query);
    if (query.searchType) params.append('searchType', query.searchType);
    if (query.limit) params.append('limit', query.limit.toString());
    
    const response = await backendApiClient.get(`/semantic-search?${params.toString()}`);
    return response.data;
  },

  getSuggestions: async (partialQuery: string): Promise<string[]> => {
    const response = await backendApiClient.get(`/semantic-search/suggestions?q=${encodeURIComponent(partialQuery)}`);
    return response.data;
  },
};

// ============================================
// PRIORITY INBOX
// ============================================

export interface PriorityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  priorityScore: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
  metadata?: Record<string, any>;
  recommendedActions?: string[];
}

export interface PriorityInboxQuery {
  type?: 'prospects' | 'messages' | 'tasks' | 'all';
  limit?: number;
}

export interface PriorityStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: {
    prospects: number;
    appointments: number;
  };
}

export const priorityInboxApi = {
  getPriorityInbox: async (query?: PriorityInboxQuery): Promise<PriorityItem[]> => {
    const params = new URLSearchParams();
    if (query?.type) params.append('type', query.type);
    if (query?.limit) params.append('limit', query.limit.toString());
    
    const response = await backendApiClient.get(`/priority-inbox?${params.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<PriorityStats> => {
    const response = await backendApiClient.get('/priority-inbox/stats');
    return response.data;
  },
};

// ============================================
// AUTO-REPORTS
// ============================================

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface ReportSummary {
  totalProspects: number;
  newProspects: number;
  qualifiedProspects: number;
  totalProperties: number;
  newProperties: number;
  totalAppointments: number;
  completedAppointments: number;
  revenue: number;
}

export interface ReportData {
  period: ReportPeriod;
  summary: ReportSummary;
  insights: string[];
  recommendations: string[];
  charts?: any[];
}

export interface GenerateReportDto {
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'pdf' | 'excel';
}

export const autoReportsApi = {
  generateReport: async (dto: GenerateReportDto): Promise<ReportData> => {
    const response = await backendApiClient.post('/auto-reports/generate', dto);
    return response.data;
  },

  getReportHistory: async (limit?: number): Promise<any[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await backendApiClient.get(`/auto-reports/history${params}`);
    return response.data;
  },
};

// ============================================
// EMAIL AI AUTO-RESPONSE
// ============================================

export interface EmailAnalysisResult {
  analysisId: string;
  intent: 'information' | 'appointment' | 'negotiation' | 'complaint' | 'other';
  confidence: number;
  keywords: string[];
  suggestedActions: string[];
  context?: {
    prospectName?: string;
    prospectEmail?: string;
    prospectBudget?: number;
    propertyTitle?: string;
    propertyPrice?: number;
  };
  property?: {
    id: string;
    title: string;
    price: number;
  };
}

export interface AnalyzeEmailDto {
  from: string;
  subject: string;
  body: string;
  prospectId?: string;
  propertyId?: string;
}

export interface EmailDraft {
  draftId: string;
  analysisId: string;
  to: string;
  subject: string;
  body: string;
  attachmentSuggestions: string[];
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  createdAt: string;
}

export interface GenerateDraftDto {
  analysisId: string;
  additionalInstructions?: string;
  tone?: 'professional' | 'friendly' | 'formal';
}

export interface ApproveAndSendDto {
  draftId: string;
  subject?: string;
  body?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface EmailAIStats {
  totalAnalyzed: number;
  totalDraftsGenerated: number;
  totalSent: number;
  avgResponseTime: number;
  intentDistribution: {
    information: number;
    appointment: number;
    negotiation: number;
    complaint: number;
    other: number;
  };
}

export const emailAIResponseApi = {
  analyzeEmail: async (dto: AnalyzeEmailDto): Promise<EmailAnalysisResult> => {
    const response = await backendApiClient.post('/email-ai-response/analyze', dto);
    return response.data;
  },

  generateDraft: async (dto: GenerateDraftDto): Promise<EmailDraft> => {
    const response = await backendApiClient.post('/email-ai-response/generate-draft', dto);
    return response.data;
  },

  approveAndSend: async (dto: ApproveAndSendDto): Promise<{ success: boolean; messageId: string }> => {
    const response = await backendApiClient.post('/email-ai-response/approve-and-send', dto);
    return response.data;
  },

  getDrafts: async (status?: string): Promise<EmailDraft[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await backendApiClient.get(`/email-ai-response/drafts${params}`);
    return response.data;
  },

  getHistory: async (limit?: number): Promise<EmailAnalysisResult[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await backendApiClient.get(`/email-ai-response/history${params}`);
    return response.data;
  },

  getStats: async (): Promise<EmailAIStats> => {
    const response = await backendApiClient.get('/email-ai-response/stats');
    return response.data;
  },
};
