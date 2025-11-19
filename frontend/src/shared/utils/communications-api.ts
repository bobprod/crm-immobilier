import apiClient from './backend-api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Communication {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'whatsapp';
  to: string;
  from?: string;
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failedReason?: string;
  prospectId?: string;
  propertyId?: string;
  templateId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  prospects?: any;
  properties?: any;
  template?: CommunicationTemplate;
}

export interface CommunicationTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendEmailData {
  to: string;
  subject: string;
  body: string;
  prospectId?: string;
  propertyId?: string;
  templateId?: string;
  attachments?: any[];
}

export interface SendSmsData {
  to: string;
  message: string;
  prospectId?: string;
  propertyId?: string;
  templateId?: string;
}

export interface SendWhatsAppData {
  to: string;
  message: string;
  mediaUrl?: string;
  prospectId?: string;
  propertyId?: string;
  templateId?: string;
}

export interface CreateTemplateData {
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  variables?: string[];
}

export interface CommunicationStats {
  total: number;
  sent: number;
  failed: number;
  byType: {
    email: number;
    sms: number;
    whatsapp: number;
  };
}

// ============================================
// API CLIENT
// ============================================

export const communicationsAPI = {
  // ============================================
  // SEND MESSAGES
  // ============================================
  
  /**
   * Envoyer un email
   */
  sendEmail: async (data: SendEmailData) => {
    try {
      const response = await apiClient.post('/communications/email', data);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  /**
   * Envoyer un SMS
   */
  sendSms: async (data: SendSmsData) => {
    try {
      const response = await apiClient.post('/communications/sms', data);
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  },

  /**
   * Envoyer un message WhatsApp
   */
  sendWhatsApp: async (data: SendWhatsAppData) => {
    try {
      const response = await apiClient.post('/communications/whatsapp', data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      throw error;
    }
  },

  // ============================================
  // HISTORY
  // ============================================
  
  /**
   * Récupérer l'historique des communications
   */
  getHistory: async (filters?: {
    type?: 'email' | 'sms' | 'whatsapp';
    prospectId?: string;
    propertyId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  }): Promise<Communication[]> => {
    try {
      const response = await apiClient.get('/communications/history', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching communication history:', error);
      throw error;
    }
  },

  /**
   * Récupérer les détails d'une communication
   */
  getById: async (id: string): Promise<Communication> => {
    try {
      const response = await apiClient.get(`/communications/history/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching communication details:', error);
      throw error;
    }
  },

  // ============================================
  // TEMPLATES
  // ============================================
  
  /**
   * Récupérer la liste des templates
   */
  getTemplates: async (type?: 'email' | 'sms' | 'whatsapp'): Promise<CommunicationTemplate[]> => {
    try {
      const response = await apiClient.get('/communications/templates', {
        params: type ? { type } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau template
   */
  createTemplate: async (data: CreateTemplateData): Promise<CommunicationTemplate> => {
    try {
      const response = await apiClient.post('/communications/templates', data);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  /**
   * Modifier un template
   */
  updateTemplate: async (id: string, data: Partial<CreateTemplateData>): Promise<any> => {
    try {
      const response = await apiClient.put(`/communications/templates/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  /**
   * Supprimer un template
   */
  deleteTemplate: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`/communications/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // ============================================
  // STATS
  // ============================================
  
  /**
   * Récupérer les statistiques
   */
  getStats: async (): Promise<CommunicationStats> => {
    try {
      const response = await apiClient.get('/communications/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching communication stats:', error);
      throw error;
    }
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formater une date pour affichage
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Obtenir le badge de statut
 */
export const getStatusBadge = (status: string): { label: string; color: string } => {
  switch (status) {
    case 'sent':
      return { label: 'Envoyé', color: 'blue' };
    case 'delivered':
      return { label: 'Livré', color: 'green' };
    case 'opened':
      return { label: 'Ouvert', color: 'purple' };
    case 'clicked':
      return { label: 'Cliqué', color: 'pink' };
    case 'failed':
      return { label: 'Échec', color: 'red' };
    default:
      return { label: status, color: 'gray' };
  }
};

/**
 * Obtenir l'icône du type de communication
 */
export const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'email':
      return '📧';
    case 'sms':
      return '📱';
    case 'whatsapp':
      return '💬';
    default:
      return '📨';
  }
};

/**
 * Remplacer les variables dans un template
 */
export const replaceVariables = (content: string, variables: Record<string, any>): string => {
  let result = content;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });
  return result;
};

export default communicationsAPI;
