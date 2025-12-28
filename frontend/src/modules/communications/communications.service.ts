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

export interface CreateTemplateDto {
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
  variables?: string[];
}

export interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
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

  getTemplates: async (type?: string) => {
    const response = await apiClient.get<Template[]>('/communications/templates', {
      params: type ? { type } : {},
    });
    return response.data;
  },

  createTemplate: async (data: CreateTemplateDto) => {
    const response = await apiClient.post<Template>('/communications/templates', data);
    return response.data;
  },

  sendTestEmail: async (to: string) => {
    const response = await apiClient.post('/communications/smtp/test-email', { to });
    return response.data;
  },
};

export default communicationsService;
