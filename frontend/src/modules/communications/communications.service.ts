import apiClient from '@/shared/utils/backend-api';

export interface Communication {
  id: string;
  type: 'email' | 'sms' | 'whatsapp' | 'messenger' | 'instagram' | 'linkedin' | 'other';
  to: string;
  from?: string;
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sentAt: string;
  prospectId?: string;
  propertyId?: string;
  // Relations enrichies (si incluses par le backend)
  prospects?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    type?: string;
    status?: string;
  };
}

export interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  prospectId?: string;
  propertyId?: string;
  templateId?: string;
}

export interface SendSmsDto {
  to: string;
  message: string;
  prospectId?: string;
  propertyId?: string;
  templateId?: string;
}

export interface SendWhatsAppDto {
  to: string;
  message: string;
  prospectId?: string;
  propertyId?: string;
  templateId?: string;
  mediaUrl?: string;
}

export interface CreateTemplateDto {
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  variables?: string[];
}

export interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationFilters {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  prospectId?: string;
}

export interface CommSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  whatsappApiKey: string;
  whatsappPhoneNumberId: string;
  emailProvider: 'smtp' | 'resend' | 'sendgrid';
  resendApiKey: string;
  sendgridApiKey: string;
  smtpConfigured: boolean;
  twilioConfigured: boolean;
  metaConfigured?: boolean;
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

  updateTemplate: async (id: string, data: Partial<CreateTemplateDto>) => {
    const response = await apiClient.put<Template>(`/communications/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string) => {
    const response = await apiClient.delete(`/communications/templates/${id}`);
    return response.data;
  },

  sendTestEmail: async (to: string) => {
    const response = await apiClient.post('/communications/smtp/test-email', { to });
    return response.data;
  },

  // Settings (SMTP / Twilio / WhatsApp)
  getSettings: async (): Promise<CommSettings> => {
    const response = await apiClient.get<CommSettings>('/communications/settings');
    return response.data;
  },

  saveSettings: async (settings: Partial<CommSettings>) => {
    const response = await apiClient.put('/communications/settings', settings);
    return response.data;
  },

  // AI helpers
  generateSmartEmail: async (data: {
    prospectId?: string;
    propertyId?: string;
    purpose?: string;
    tone?: string;
    additionalContext?: string;
  }) => {
    const response = await apiClient.post('/communications/ai/generate-email', data);
    return response.data as { subject: string; body: string; confidence?: number };
  },

  generateSmartSMS: async (data: {
    prospectId?: string;
    propertyId?: string;
    purpose?: string;
    maxLength?: number;
    additionalContext?: string;
  }) => {
    const response = await apiClient.post('/communications/ai/generate-sms', data);
    return response.data as { body: string; length?: number };
  },

  improveText: async (text: string, options?: string[]) => {
    const response = await apiClient.post('/communications/ai/improve-text', {
      text,
      improvements: options || ['clarity'],
    });
    return response.data as { improved: string; changes?: any[] };
  },

  translateMessage: async (text: string, target: string) => {
    const response = await apiClient.post('/communications/ai/translate', {
      text,
      targetLanguage: target,
    });
    return response.data as { translated: string };
  },
};

export default communicationsService;
