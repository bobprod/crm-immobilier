import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import {
  WhatsAppMessage,
  SendTextMessageDto,
  SendMediaMessageDto,
  SendTemplateMessageDto,
  MessageResponseDto,
} from '../types/whatsapp.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Hook to manage WhatsApp messages
 * Handles sending and fetching messages
 */
export function useMessages(conversationId?: string) {
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch messages for a conversation
  const {
    data: messages,
    error,
    isLoading,
    mutate,
  } = useSWR<WhatsAppMessage[]>(
    conversationId ? `/whatsapp/conversations/${conversationId}` : null,
    async (url) => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Extract messages from conversation response
      return response.data.messages || [];
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  /**
   * Send text message
   */
  const sendTextMessage = async (data: SendTextMessageDto): Promise<MessageResponseDto> => {
    setIsSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_BASE_URL}/whatsapp/messages/text`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await mutate();
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Send media message
   */
  const sendMediaMessage = async (data: SendMediaMessageDto): Promise<MessageResponseDto> => {
    setIsSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_BASE_URL}/whatsapp/messages/media`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await mutate();
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send media message');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Send template message
   */
  const sendTemplateMessage = async (
    data: SendTemplateMessageDto
  ): Promise<MessageResponseDto> => {
    setIsSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_BASE_URL}/whatsapp/messages/template`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await mutate();
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to send template message');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Upload media file and get URL
   */
  const uploadMedia = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/whatsapp/media/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Get message status counts
   */
  const getMessageStatusCounts = () => {
    if (!messages) return { sent: 0, delivered: 0, read: 0, failed: 0 };

    return messages.reduce(
      (acc, msg) => {
        if (msg.direction === 'outbound') {
          acc[msg.status] = (acc[msg.status] || 0) + 1;
        }
        return acc;
      },
      { sent: 0, delivered: 0, read: 0, failed: 0 } as Record<string, number>
    );
  };

  /**
   * Get last message
   */
  const getLastMessage = (): WhatsAppMessage | null => {
    if (!messages || messages.length === 0) return null;
    return messages[messages.length - 1];
  };

  /**
   * Get unread count (messages from others not read)
   */
  const getUnreadCount = (): number => {
    if (!messages) return 0;
    return messages.filter((msg) => msg.direction === 'inbound' && !msg.readAt).length;
  };

  /**
   * Mark messages as read
   */
  const markAsRead = async (messageIds: string[]): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_BASE_URL}/whatsapp/messages/mark-read`,
        { messageIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await mutate();
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  /**
   * Get media type from file
   */
  const getMediaType = (file: File): 'image' | 'document' | 'video' | 'audio' => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    messages: messages || [],
    isLoading,
    error,
    isSending,
    isUploading,
    sendTextMessage,
    sendMediaMessage,
    sendTemplateMessage,
    uploadMedia,
    getMessageStatusCounts,
    getLastMessage,
    getUnreadCount,
    markAsRead,
    getMediaType,
    formatFileSize,
    refresh: mutate,
  };
}
