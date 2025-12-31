import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import {
  WhatsAppConfig,
  CreateWhatsAppConfigDto,
  UpdateWhatsAppConfigDto,
  WhatsAppProvider,
} from '../types/whatsapp.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook to manage WhatsApp configuration
 * Handles CRUD operations for WhatsApp config
 */
export function useWhatsAppConfig() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch config with SWR
  const {
    data: config,
    error,
    isLoading,
    mutate,
  } = useSWR<WhatsAppConfig>(
    '/whatsapp/config',
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
        // If 404, no config exists yet
        if (err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  /**
   * Create WhatsApp configuration
   */
  const createConfig = async (data: CreateWhatsAppConfigDto): Promise<WhatsAppConfig> => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/config`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update SWR cache
      await mutate(response.data);

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create configuration');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Update WhatsApp configuration
   */
  const updateConfig = async (data: UpdateWhatsAppConfigDto): Promise<WhatsAppConfig> => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${API_BASE_URL}/whatsapp/config`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update SWR cache
      await mutate(response.data);

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update configuration');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Delete WhatsApp configuration
   */
  const deleteConfig = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/whatsapp/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update SWR cache
      await mutate(null);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete configuration');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Test connection to WhatsApp provider
   */
  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/test-connection`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Connection test failed',
      };
    }
  };

  /**
   * Get webhook URL for configuration
   */
  const getWebhookUrl = (provider: WhatsAppProvider): string => {
    const baseUrl = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || 'https://your-domain.com';
    if (provider === WhatsAppProvider.META) {
      return `${baseUrl}/whatsapp/webhook`;
    }
    return `${baseUrl}/whatsapp/webhook/twilio`;
  };

  /**
   * Toggle config active status
   */
  const toggleActive = async (): Promise<WhatsAppConfig> => {
    if (!config) {
      throw new Error('No configuration found');
    }
    return updateConfig({ isActive: !config.isActive });
  };

  /**
   * Toggle auto-reply
   */
  const toggleAutoReply = async (): Promise<WhatsAppConfig> => {
    if (!config) {
      throw new Error('No configuration found');
    }
    return updateConfig({ autoReplyEnabled: !config.autoReplyEnabled });
  };

  return {
    config,
    isLoading,
    error,
    hasConfig: !!config,
    isCreating,
    isUpdating,
    isDeleting,
    createConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    getWebhookUrl,
    toggleActive,
    toggleAutoReply,
    refresh: mutate,
  };
}
