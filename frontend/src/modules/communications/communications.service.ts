import apiClient from '@/shared/utils/backend-api';

export interface Communication {
  id: string;
  type: 'email' | 'sms' | 'whatsapp';
  to: string;
  from?: string;
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sentAt: string;
  prospectId?: string;
  propertyId?: string;
}

export interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  prospectId?: string;
  propertyId?: string;
}

export interface SendSmsDto {
  to: string;
  body: string;
  prospectId?: string;
}

export interface SendWhatsAppDto {
  to: string;
  body: string;
  prospectId?: string;
}

export interface CommunicationFilters {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

const communicationsService = {
  getHistory: async (filters?: CommunicationFilters) => {
    const response = await apiClient.get<Communication[]>('/communications/history', {
      params: filters,
    });
    return response.data;
  },

  sendEmail: async (data: SendEmailDto) => {
    const response = await apiClient.post('/communications/email', data);
    return response.data;
  },

  sendSms: async (data: SendSmsDto) => {
    const response = await apiClient.post('/communications/sms', data);
    return response.data;
  },

  sendWhatsApp: async (data: SendWhatsAppDto) => {
    const response = await apiClient.post('/communications/whatsapp', data);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/communications/stats');
    return response.data;
  },

  testSmtp: async () => {
    const response = await apiClient.post('/communications/smtp/test-connection');
    return response.data;
  },

  // ========== AI-POWERED METHODS ==========

  generateSmartEmail: async (context: {
    prospectId?: string;
    propertyId?: string;
    purpose: 'follow_up' | 'appointment' | 'negotiation' | 'information' | 'custom';
    tone?: 'formal' | 'friendly' | 'commercial';
    additionalContext?: string;
  }) => {
    const response = await apiClient.post('/communications/ai/generate-email', context);
    return response.data;
  },

  generateSmartSMS: async (context: {
    prospectId?: string;
    propertyId?: string;
    purpose: 'appointment_reminder' | 'follow_up' | 'confirmation' | 'custom';
    maxLength?: number;
    additionalContext?: string;
  }) => {
    const response = await apiClient.post('/communications/ai/generate-sms', context);
    return response.data;
  },

  suggestTemplates: async (context: {
    type: 'email' | 'sms' | 'whatsapp';
    prospectId?: string;
    propertyId?: string;
    purpose?: string;
    keywords?: string[];
  }) => {
    const response = await apiClient.post('/communications/ai/suggest-templates', context);
    return response.data;
  },

  generateTemplate: async (request: {
    type: 'email' | 'sms' | 'whatsapp';
    purpose: string;
    tone?: 'formal' | 'friendly' | 'commercial';
    includeVariables?: string[];
    sampleContext?: string;
  }) => {
    const response = await apiClient.post('/communications/ai/generate-template', request);
    return response.data;
  },

  autoComplete: async (data: {
    partialText: string;
    type: 'email' | 'sms';
    prospectId?: string;
    propertyId?: string;
  }) => {
    const response = await apiClient.post('/communications/ai/auto-complete', data);
    return response.data;
  },

  improveText: async (text: string, improvements: ('grammar' | 'tone' | 'clarity' | 'professional' | 'concise')[]) => {
    const response = await apiClient.post('/communications/ai/improve-text', { text, improvements });
    return response.data;
  },

  translateMessage: async (text: string, targetLanguage: 'ar' | 'en' | 'fr') => {
    const response = await apiClient.post('/communications/ai/translate', { text, targetLanguage });
    return response.data;
  },
};

export default communicationsService;
