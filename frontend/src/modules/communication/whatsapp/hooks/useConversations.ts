import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import {
  WhatsAppConversation,
  ConversationsResponse,
  GetConversationsFilters,
  UpdateConversationDto,
  ConversationStatus,
} from '../types/whatsapp.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook to manage WhatsApp conversations
 * Handles fetching, filtering, and updating conversations
 */
export function useConversations(filters?: GetConversationsFilters) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Build query string from filters
  const buildQueryString = (filters?: GetConversationsFilters): string => {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.phoneNumber) params.append('phoneNumber', filters.phoneNumber);
    if (filters.leadId) params.append('leadId', filters.leadId);
    if (filters.prospectId) params.append('prospectId', filters.prospectId);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const query = params.toString();
    return query ? `?${query}` : '';
  };

  const queryString = buildQueryString(filters);

  // Fetch conversations with SWR
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<ConversationsResponse>(
    `/whatsapp/conversations${queryString}`,
    async (url) => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  /**
   * Get single conversation by ID
   */
  const getConversation = async (conversationId: string): Promise<WhatsAppConversation> => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(
      `${API_BASE_URL}/whatsapp/conversations/${conversationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  };

  /**
   * Update conversation
   */
  const updateConversation = async (
    conversationId: string,
    data: UpdateConversationDto
  ): Promise<WhatsAppConversation> => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${API_BASE_URL}/whatsapp/conversations/${conversationId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Refresh the list
      await mutate();

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update conversation');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Close conversation
   */
  const closeConversation = async (conversationId: string): Promise<WhatsAppConversation> => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/conversations/${conversationId}/close`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh the list
      await mutate();

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to close conversation');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Assign conversation to user
   */
  const assignConversation = async (
    conversationId: string,
    userId: string
  ): Promise<WhatsAppConversation> => {
    setIsAssigning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/conversations/${conversationId}/assign`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Refresh the list
      await mutate();

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to assign conversation');
    } finally {
      setIsAssigning(false);
    }
  };

  /**
   * Add tags to conversation
   */
  const addTags = async (conversationId: string, tags: string[]): Promise<WhatsAppConversation> => {
    const conversation = await getConversation(conversationId);
    const newTags = Array.from(new Set([...conversation.tags, ...tags]));
    return updateConversation(conversationId, { tags: newTags });
  };

  /**
   * Remove tag from conversation
   */
  const removeTag = async (conversationId: string, tag: string): Promise<WhatsAppConversation> => {
    const conversation = await getConversation(conversationId);
    const newTags = conversation.tags.filter(t => t !== tag);
    return updateConversation(conversationId, { tags: newTags });
  };

  /**
   * Change conversation status
   */
  const changeStatus = async (
    conversationId: string,
    status: ConversationStatus
  ): Promise<WhatsAppConversation> => {
    return updateConversation(conversationId, { status });
  };

  /**
   * Get conversation count by status
   */
  const getStatusCounts = () => {
    if (!data?.conversations) return { open: 0, assigned: 0, resolved: 0, closed: 0 };

    return data.conversations.reduce(
      (acc, conv) => {
        acc[conv.status] = (acc[conv.status] || 0) + 1;
        return acc;
      },
      { open: 0, assigned: 0, resolved: 0, closed: 0 } as Record<ConversationStatus, number>
    );
  };

  return {
    conversations: data?.conversations || [],
    total: data?.total || 0,
    limit: data?.limit || 50,
    offset: data?.offset || 0,
    isLoading,
    error,
    isUpdating,
    isAssigning,
    getConversation,
    updateConversation,
    closeConversation,
    assignConversation,
    addTags,
    removeTag,
    changeStatus,
    getStatusCounts,
    refresh: mutate,
  };
}
