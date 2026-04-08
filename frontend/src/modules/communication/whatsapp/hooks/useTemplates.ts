import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import {
  WhatsAppTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateCategory,
  TemplateStatus,
} from '../types/whatsapp.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Hook to manage WhatsApp templates
 * Handles CRUD operations for templates
 */
export function useTemplates() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all templates
  const {
    data: templatesResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<{ templates: WhatsAppTemplate[] }>(
    '/whatsapp/templates',
    async (url) => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}${url}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return { templates: [] };
        }
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
    }
  );
  const templates = templatesResponse?.templates || [];

  /**
   * Get single template by ID
   */
  const getTemplate = async (templateId: string): Promise<WhatsAppTemplate> => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(
      `${API_BASE_URL}/whatsapp/templates/${templateId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  };

  /**
   * Create template
   */
  const createTemplate = async (data: CreateTemplateDto): Promise<WhatsAppTemplate> => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/templates`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Refresh list
      await mutate();

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Update template
   */
  const updateTemplate = async (
    templateId: string,
    data: UpdateTemplateDto
  ): Promise<WhatsAppTemplate> => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${API_BASE_URL}/whatsapp/templates/${templateId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Refresh list
      await mutate();

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update template');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Delete template
   */
  const deleteTemplate = async (templateId: string): Promise<void> => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(
        `${API_BASE_URL}/whatsapp/templates/${templateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh list
      await mutate();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Duplicate template
   */
  const duplicateTemplate = async (templateId: string): Promise<WhatsAppTemplate> => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post(
      `${API_BASE_URL}/whatsapp/templates/${templateId}/duplicate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    await mutate();
    return response.data;
  };

  /**
   * Filter templates
   */
  const filterTemplates = (filters: {
    status?: TemplateStatus;
    category?: TemplateCategory;
    language?: string;
    search?: string;
  }) => {
    if (!templates) return [];

    return templates.filter((template) => {
      if (filters.status && template.status !== filters.status) return false;
      if (filters.category && template.category !== filters.category) return false;
      if (filters.language && template.language !== filters.language) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          template.name.toLowerCase().includes(searchLower) ||
          template.body.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  };

  /**
   * Get template stats
   */
  const getTemplateStats = (template: WhatsAppTemplate) => {
    const total = template.sentCount;
    const successRate = total > 0
      ? ((template.deliveredCount / total) * 100).toFixed(1)
      : '0';
    const readRate = total > 0
      ? ((template.readCount / total) * 100).toFixed(1)
      : '0';
    const failRate = total > 0
      ? ((template.failedCount / total) * 100).toFixed(1)
      : '0';

    return {
      total,
      delivered: template.deliveredCount,
      read: template.readCount,
      failed: template.failedCount,
      successRate: parseFloat(successRate),
      readRate: parseFloat(readRate),
      failRate: parseFloat(failRate),
    };
  };

  /**
   * Extract variables from template body
   */
  const extractVariables = (body: string): string[] => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = body.match(regex);
    if (!matches) return [];

    const variables = Array.from(new Set(matches))
      .map((match) => match.replace(/\{\{|\}\}/g, ''))
      .sort((a, b) => parseInt(a) - parseInt(b));

    return variables;
  };

  /**
   * Validate template body
   */
  const validateTemplateBody = (body: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!body || body.trim().length === 0) {
      errors.push('Le corps du message est requis');
    }

    if (body.length > 1024) {
      errors.push('Le corps du message ne peut pas dépasser 1024 caractères');
    }

    // Check for sequential variables
    const variables = extractVariables(body);
    for (let i = 0; i < variables.length; i++) {
      if (parseInt(variables[i]) !== i + 1) {
        errors.push(`Les variables doivent être séquentielles ({{1}}, {{2}}, etc.)`);
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Get template by category counts
   */
  const getCategoryCounts = () => {
    if (!templates) return { marketing: 0, utility: 0, authentication: 0 };

    return templates.reduce(
      (acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      },
      { marketing: 0, utility: 0, authentication: 0 } as Record<TemplateCategory, number>
    );
  };

  /**
   * Get template by status counts
   */
  const getStatusCounts = () => {
    if (!templates) return { pending: 0, approved: 0, rejected: 0 };

    return templates.reduce(
      (acc, template) => {
        acc[template.status] = (acc[template.status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 } as Record<TemplateStatus, number>
    );
  };

  /**
   * Get top performing templates
   */
  const getTopTemplates = (limit: number = 5) => {
    if (!templates) return [];

    return [...templates]
      .filter((t) => t.sentCount > 0)
      .sort((a, b) => {
        const aSuccessRate = a.deliveredCount / a.sentCount;
        const bSuccessRate = b.deliveredCount / b.sentCount;
        return bSuccessRate - aSuccessRate;
      })
      .slice(0, limit);
  };

  return {
    templates,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    filterTemplates,
    getTemplateStats,
    extractVariables,
    validateTemplateBody,
    getCategoryCounts,
    getStatusCounts,
    getTopTemplates,
    refresh: mutate,
  };
}
