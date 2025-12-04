import apiClient from './backend-api';

// ============================================
// TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'lead_new'
  | 'lead_qualified'
  | 'lead_converted'
  | 'match_found'
  | 'appointment_reminder'
  | 'task_due'
  | 'campaign_completed'
  | 'system';

export interface CreateNotificationDto {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
}

// ============================================
// BACKEND RESPONSE MAPPING
// ============================================

// Backend response interface (what the API returns)
interface BackendNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;      // Backend uses 'isRead'
  actionUrl?: string;   // Backend uses 'actionUrl'
  metadata?: Record<string, any>;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Map backend response to frontend Notification interface
const mapNotification = (n: BackendNotification): Notification => ({
  id: n.id,
  userId: n.userId,
  title: n.title,
  message: n.message,
  type: mapBackendTypeToFrontend(n.type),
  read: n.isRead,           // Map isRead → read
  link: n.actionUrl,        // Map actionUrl → link
  metadata: n.metadata,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

// Map backend notification types to frontend types
const mapBackendTypeToFrontend = (backendType: string): NotificationType => {
  const typeMap: Record<string, NotificationType> = {
    'appointment': 'appointment_reminder',
    'task': 'task_due',
    'lead': 'lead_new',
    'system': 'system',
    'property': 'info',
    'message': 'info',
  };
  return typeMap[backendType] || 'system';
};

// ============================================
// API CLIENT
// ============================================

export const notificationsAPI = {
  // Get all notifications
  getNotifications: async (limit?: number): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications', { params: { limit } });
    return (response.data || []).map(mapNotification);
  },

  // Get unread notifications
  getUnread: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/unread');
    return (response.data || []).map(mapNotification);
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/notifications/unread/count');
    return response.data.count || response.data;
  },

  // Create notification
  create: async (data: CreateNotificationDto): Promise<Notification> => {
    const response = await apiClient.post('/notifications', data);
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return mapNotification(response.data);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<{ count: number }> => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data; // Prisma returns { count: number }
  },

  // Delete notification
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getNotificationTypeIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    lead_new: '🆕',
    lead_qualified: '✨',
    lead_converted: '🎉',
    match_found: '🎯',
    appointment_reminder: '📅',
    task_due: '⏰',
    campaign_completed: '🏆',
    system: '🔔',
  };
  return icons[type] || '🔔';
};

export const getNotificationTypeColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    lead_new: 'bg-purple-100 text-purple-800 border-purple-300',
    lead_qualified: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    lead_converted: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    match_found: 'bg-pink-100 text-pink-800 border-pink-300',
    appointment_reminder: 'bg-orange-100 text-orange-800 border-orange-300',
    task_due: 'bg-amber-100 text-amber-800 border-amber-300',
    campaign_completed: 'bg-teal-100 text-teal-800 border-teal-300',
    system: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    info: 'Information',
    success: 'Succès',
    warning: 'Avertissement',
    error: 'Erreur',
    lead_new: 'Nouveau lead',
    lead_qualified: 'Lead qualifié',
    lead_converted: 'Lead converti',
    match_found: 'Match trouvé',
    appointment_reminder: 'Rappel RDV',
    task_due: 'Tâche due',
    campaign_completed: 'Campagne terminée',
    system: 'Système',
  };
  return labels[type] || type;
};

export const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export default notificationsAPI;
