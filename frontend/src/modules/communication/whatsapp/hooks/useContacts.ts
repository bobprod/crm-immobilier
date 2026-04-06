import { useState, useCallback } from 'react';
import useSWR from 'swr';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper for authenticated requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return { Authorization: `Bearer ${token}` };
};

const fetcher = async (url: string) => {
  const response = await axios.get(`${API_BASE_URL}${url}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Types
export interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  tags: string[];
  groups: string[];
  notes?: string;
  customFields?: Record<string, any>;
  isBlocked: boolean;
  stats: ContactStats;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactStats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  totalConversations: number;
  activeConversations: number;
  avgResponseTime: number; // in minutes
  lastInteraction?: Date;
}

export interface CreateContactDto {
  phoneNumber: string;
  name?: string;
  email?: string;
  tags?: string[];
  groups?: string[];
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateContactDto {
  name?: string;
  email?: string;
  tags?: string[];
  groups?: string[];
  notes?: string;
  customFields?: Record<string, any>;
  isBlocked?: boolean;
}

export interface ImportContactDto {
  phoneNumber: string;
  name?: string;
  email?: string;
  tags?: string[];
  notes?: string;
}

export interface ContactFilters {
  search?: string;
  tags?: string[];
  groups?: string[];
  isBlocked?: boolean;
  hasConversations?: boolean;
}

export interface ContactsResponse {
  contacts: WhatsAppContact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Hook for WhatsApp Contacts Management
 */
export function useContacts(filters?: ContactFilters) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Build query string from filters
  const buildQueryString = useCallback(() => {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => params.append('tags', tag));
    }
    if (filters.groups && filters.groups.length > 0) {
      filters.groups.forEach((group) => params.append('groups', group));
    }
    if (filters.isBlocked !== undefined) {
      params.append('isBlocked', filters.isBlocked.toString());
    }
    if (filters.hasConversations !== undefined) {
      params.append('hasConversations', filters.hasConversations.toString());
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }, [filters]);

  // Fetch contacts with filters
  const {
    data: contactsResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<ContactsResponse>(
    `/whatsapp/contacts${buildQueryString()}`,
    fetcher
  );

  const contacts = contactsResponse?.contacts || [];
  const total = contactsResponse?.total || 0;

  // Create contact
  const createContact = async (data: CreateContactDto): Promise<WhatsAppContact> => {
    setIsCreating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/contacts`,
        data,
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du contact');
    } finally {
      setIsCreating(false);
    }
  };

  // Update contact
  const updateContact = async (
    id: string,
    data: UpdateContactDto
  ): Promise<WhatsAppContact> => {
    setIsUpdating(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/whatsapp/contacts/${id}`,
        data,
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du contact');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete contact
  const deleteContact = async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/whatsapp/contacts/${id}`, {
        headers: getAuthHeaders(),
      });
      await mutate();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression du contact');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get single contact
  const getContact = async (id: string): Promise<WhatsAppContact> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/contacts/${id}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération du contact');
    }
  };

  // Block/Unblock contact
  const toggleBlock = async (id: string, isBlocked: boolean): Promise<WhatsAppContact> => {
    return updateContact(id, { isBlocked });
  };

  // Add tags to contact
  const addTags = async (id: string, tags: string[]): Promise<WhatsAppContact> => {
    const contact = await getContact(id);
    const newTags = [...new Set([...contact.tags, ...tags])];
    return updateContact(id, { tags: newTags });
  };

  // Remove tag from contact
  const removeTag = async (id: string, tag: string): Promise<WhatsAppContact> => {
    const contact = await getContact(id);
    const newTags = contact.tags.filter((t) => t !== tag);
    return updateContact(id, { tags: newTags });
  };

  // Add groups to contact
  const addGroups = async (id: string, groups: string[]): Promise<WhatsAppContact> => {
    const contact = await getContact(id);
    const newGroups = [...new Set([...contact.groups, ...groups])];
    return updateContact(id, { groups: newGroups });
  };

  // Remove group from contact
  const removeGroup = async (id: string, group: string): Promise<WhatsAppContact> => {
    const contact = await getContact(id);
    const newGroups = contact.groups.filter((g) => g !== group);
    return updateContact(id, { groups: newGroups });
  };

  // Import contacts from CSV
  const importContacts = async (file: File): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/contacts/import`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'import des contacts');
    } finally {
      setIsImporting(false);
    }
  };

  // Export contacts to CSV
  const exportContacts = async (): Promise<Blob> => {
    setIsExporting(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/contacts/export/csv`,
        {
          headers: getAuthHeaders(),
        }
      );
      const { data, mimeType } = response.data;
      const byteCharacters = atob(data);
      const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType || 'text/csv' });
    } catch (error: any) {
      throw new Error('Erreur lors de l\'export des contacts');
    } finally {
      setIsExporting(false);
    }
  };

  // Download file helper
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Get all unique tags
  const getAllTags = useCallback((): string[] => {
    const tagsSet = new Set<string>();
    contacts.forEach((contact) => {
      contact.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [contacts]);

  // Get all unique groups
  const getAllGroups = useCallback((): string[] => {
    const groupsSet = new Set<string>();
    contacts.forEach((contact) => {
      contact.groups.forEach((group) => groupsSet.add(group));
    });
    return Array.from(groupsSet).sort();
  }, [contacts]);

  // Get contact stats summary
  const getStatsSummary = useCallback(() => {
    const totalContacts = contacts.length;
    const blockedContacts = contacts.filter((c) => c.isBlocked).length;
    const activeContacts = contacts.filter(
      (c) => c.stats.activeConversations > 0
    ).length;
    const totalMessages = contacts.reduce(
      (sum, c) => sum + c.stats.totalMessages,
      0
    );
    const totalConversations = contacts.reduce(
      (sum, c) => sum + c.stats.totalConversations,
      0
    );

    return {
      totalContacts,
      blockedContacts,
      activeContacts,
      totalMessages,
      totalConversations,
    };
  }, [contacts]);

  // Filter contacts locally (for quick filtering without API call)
  const filterContacts = useCallback(
    (localFilters: ContactFilters): WhatsAppContact[] => {
      return contacts.filter((contact) => {
        // Search filter
        if (localFilters.search) {
          const searchLower = localFilters.search.toLowerCase();
          const matchesSearch =
            contact.name?.toLowerCase().includes(searchLower) ||
            contact.phoneNumber.includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower);

          if (!matchesSearch) return false;
        }

        // Tags filter
        if (localFilters.tags && localFilters.tags.length > 0) {
          const hasTags = localFilters.tags.every((tag) =>
            contact.tags.includes(tag)
          );
          if (!hasTags) return false;
        }

        // Groups filter
        if (localFilters.groups && localFilters.groups.length > 0) {
          const hasGroups = localFilters.groups.every((group) =>
            contact.groups.includes(group)
          );
          if (!hasGroups) return false;
        }

        // Blocked filter
        if (localFilters.isBlocked !== undefined) {
          if (contact.isBlocked !== localFilters.isBlocked) return false;
        }

        // Has conversations filter
        if (localFilters.hasConversations !== undefined) {
          const hasConv = contact.stats.totalConversations > 0;
          if (hasConv !== localFilters.hasConversations) return false;
        }

        return true;
      });
    },
    [contacts]
  );

  return {
    // Data
    contacts,
    total,
    isLoading,
    error,

    // CRUD
    createContact,
    updateContact,
    deleteContact,
    getContact,

    // Actions
    toggleBlock,
    addTags,
    removeTag,
    addGroups,
    removeGroup,

    // Import/Export
    importContacts,
    exportContacts,
    downloadFile,

    // Helpers
    getAllTags,
    getAllGroups,
    getStatsSummary,
    filterContacts,

    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    isImporting,
    isExporting,

    // Mutate
    mutate,
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Format based on length
  if (digits.length === 12 && digits.startsWith('33')) {
    // French number: +33 6 12 34 56 78
    return `+33 ${digits.slice(2, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }

  // Default: keep original
  return phoneNumber;
}

/**
 * Validate phone number (E.164 format)
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Get initials from name
 */
export function getInitials(name?: string): string {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
