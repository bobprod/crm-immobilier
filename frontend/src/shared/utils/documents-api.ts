import apiClient from './backend-api';
import { BaseAPIClient } from './base-api-client';

// Types
export interface Document {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  originalName: string;
  description?: string;
  fileUrl: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  extension: string;
  prospectId?: string;
  propertyId?: string;
  relatedType?: string;
  relatedId?: string;
  tags?: string[];
  isTemplate: boolean;
  isPublic: boolean;
  isSigned: boolean;
  signedAt?: string;
  signedBy?: string;
  ocrProcessed: boolean;
  ocrText?: string;
  aiGenerated: boolean;
  aiGenerationId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  category?: DocumentCategory;
  prospect?: any;
  property?: any;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  parent?: DocumentCategory;
  children?: DocumentCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  content: string;
  variables: string[];
  category?: string;
  mimeType: string;
  isActive: boolean;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIGeneration {
  id: string;
  userId: string;
  provider: string;
  model: string;
  prompt: string;
  response: string;
  documentType?: string;
  tokensUsed?: number;
  cost?: number;
  status: string;
  createdAt: string;
}

export interface AISettings {
  id: string;
  userId: string;
  defaultProvider: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  claudeApiKey?: string;
  deepseekApiKey?: string;
  openrouterApiKey?: string;
  defaultModel?: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface OcrResult {
  id: string;
  userId: string;
  documentId?: string;
  imageUrl: string;
  extractedText: string;
  language: string;
  confidence?: number;
  processingTime?: number;
  engine: string;
  createdAt: string;
}

// Create base client for documents
const baseClient = new BaseAPIClient<Document>('/documents');

export const documentsAPI = {
  // ============================================
  // DOCUMENTS
  // ============================================

  uploadDocument: async (file: File, data: any): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    const response = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getDocuments: (filters?: any): Promise<Document[]> => baseClient.list(filters),

  getDocumentById: (id: string): Promise<Document> => baseClient.getById(id),

  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  updateDocument: (id: string, data: any): Promise<Document> => baseClient.update(id, data),

  deleteDocument: (id: string): Promise<any> => baseClient.delete(id),

  getStats: (): Promise<any> => baseClient.get('stats/overview'),

  // ============================================
  // AI GENERATION
  // ============================================

  generateDocument: async (data: {
    prompt: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    documentType?: string;
    prospectId?: string;
    propertyId?: string;
    saveAsDocument?: boolean;
  }): Promise<any> => {
    const response = await apiClient.post('/documents/ai/generate', data);
    return response.data;
  },

  getAIHistory: async (limit?: number): Promise<AIGeneration[]> => {
    const response = await apiClient.get('/documents/ai/history', {
      params: { limit },
    });
    return response.data;
  },

  getAIStats: async (): Promise<any> => {
    const response = await apiClient.get('/documents/ai/stats');
    return response.data;
  },

  getAISettings: async (): Promise<AISettings> => {
    const response = await apiClient.get('/documents/ai/settings');
    return response.data;
  },

  updateAISettings: async (data: Partial<AISettings>): Promise<AISettings> => {
    const response = await apiClient.post('/documents/ai/settings', data);
    return response.data;
  },

  // ============================================
  // OCR
  // ============================================

  processOCR: async (
    documentId: string,
    options?: { language?: string; engine?: string }
  ): Promise<any> => {
    const response = await apiClient.post(`/documents/${documentId}/ocr`, options);
    return response.data;
  },

  getOCRHistory: async (limit?: number): Promise<OcrResult[]> => {
    const response = await apiClient.get('/documents/ocr/history', {
      params: { limit },
    });
    return response.data;
  },

  searchOCR: async (query: string): Promise<OcrResult[]> => {
    const response = await apiClient.get('/documents/ocr/search', {
      params: { query },
    });
    return response.data;
  },

  // ============================================
  // CATEGORIES
  // ============================================

  createCategory: async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }): Promise<DocumentCategory> => {
    const response = await apiClient.post('/documents/categories', data);
    return response.data;
  },

  getCategories: async (): Promise<DocumentCategory[]> => {
    const response = await apiClient.get('/documents/categories/list');
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: Partial<DocumentCategory>
  ): Promise<DocumentCategory> => {
    const response = await apiClient.put(`/documents/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/documents/categories/${id}`);
    return response.data;
  },

  // ============================================
  // TEMPLATES
  // ============================================

  createTemplate: async (data: {
    name: string;
    description?: string;
    content: string;
    variables?: string[];
    category?: string;
    mimeType?: string;
    isPublic?: boolean;
  }): Promise<DocumentTemplate> => {
    const response = await apiClient.post('/documents/templates', data);
    return response.data;
  },

  getTemplates: async (category?: string): Promise<DocumentTemplate[]> => {
    const response = await apiClient.get('/documents/templates/list', {
      params: { category },
    });
    return response.data;
  },

  getTemplateById: async (id: string): Promise<DocumentTemplate> => {
    const response = await apiClient.get(`/documents/templates/${id}`);
    return response.data;
  },

  updateTemplate: async (
    id: string,
    data: Partial<DocumentTemplate>
  ): Promise<DocumentTemplate> => {
    const response = await apiClient.put(`/documents/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/documents/templates/${id}`);
    return response.data;
  },

  generateFromTemplate: async (
    templateId: string,
    variables: Record<string, any>
  ): Promise<Document> => {
    const response = await apiClient.post(`/documents/templates/${templateId}/generate`, {
      variables,
    });
    return response.data;
  },
};

// Helper functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
  return '📁';
};

export const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    openai: '🤖',
    gemini: '✨',
    claude: '🧠',
    deepseek: '🔍',
    openrouter: '🔀',
  };
  return icons[provider] || '🤖';
};
