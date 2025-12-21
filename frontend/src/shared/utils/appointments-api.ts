import apiClient from './backend-api';

// Types
export interface Appointment {
  id: string;
  userId: string;
  prospectId?: string;
  propertyId?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'visit' | 'signature' | 'expertise' | 'estimation' | 'meeting' | 'other';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAllDay: boolean;
  reminder: boolean;
  reminderSent: boolean;
  reminderTime?: number;
  attendees?: any[];
  notes?: string;
  outcome?: string;
  rating?: number;
  googleEventId?: string;
  iCalUid?: string;
  recurrence?: any;
  color?: string;
  createdAt: string;
  updatedAt: string;
  prospects?: any;
  properties?: any;
  users?: any;
}

export interface AppointmentStats {
  total: number;
  byStatus: any[];
  byType: any[];
  byPriority: any[];
  attendanceRate: number;
  averageRating: number;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export const appointmentsAPI = {
  // ============================================
  // CRUD DE BASE
  // ============================================

  create: async (data: {
    title: string;
    startTime: string;
    endTime: string;
    description?: string;
    location?: string;
    type?: string;
    status?: string;
    priority?: string;
    prospectId?: string;
    propertyId?: string;
    isAllDay?: boolean;
    reminder?: boolean;
    reminderTime?: number;
    attendees?: any[];
    notes?: string;
    color?: string;
    recurrence?: any;
  }): Promise<Appointment> => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  getAll: async (filters?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
    prospectId?: string;
    propertyId?: string;
    priority?: string;
    limit?: number;
    skip?: number;
  }): Promise<Appointment[]> => {
    const response = await apiClient.get('/appointments', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },

  // ============================================
  // ACTIONS SPÉCIFIQUES
  // ============================================

  complete: async (id: string, outcome?: string, rating?: number): Promise<Appointment> => {
    const response = await apiClient.post(`/appointments/${id}/complete`, {
      outcome,
      rating,
    });
    return response.data;
  },

  cancel: async (id: string, reason?: string): Promise<Appointment> => {
    const response = await apiClient.post(`/appointments/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  reschedule: async (
    id: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<Appointment> => {
    const response = await apiClient.post(`/appointments/${id}/reschedule`, {
      newStartTime,
      newEndTime,
    });
    return response.data;
  },

  checkConflicts: async (
    id: string,
    startTime: string,
    endTime: string
  ): Promise<Appointment[]> => {
    const response = await apiClient.post(`/appointments/${id}/conflicts`, {
      startTime,
      endTime,
    });
    return response.data;
  },

  // ============================================
  // VUES SPÉCIALES
  // ============================================

  getUpcoming: async (limit?: number): Promise<Appointment[]> => {
    const response = await apiClient.get('/appointments/upcoming', {
      params: { limit },
    });
    return response.data;
  },

  getToday: async (): Promise<Appointment[]> => {
    const response = await apiClient.get('/appointments/today');
    return response.data;
  },

  getAvailability: async (date: string, duration?: number): Promise<AvailabilitySlot[]> => {
    const response = await apiClient.get('/appointments/availability', {
      params: { date, duration },
    });
    return response.data;
  },

  getStats: async (startDate?: string, endDate?: string): Promise<AppointmentStats> => {
    const response = await apiClient.get('/appointments/stats', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

// Helper functions
export const getAppointmentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    visit: 'Visite',
    signature: 'Signature',
    expertise: 'Expertise',
    estimation: 'Estimation',
    meeting: 'Réunion',
    other: 'Autre',
  };
  return labels[type] || type;
};

export const getAppointmentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: 'Planifié',
    confirmed: 'Confirmé',
    completed: 'Terminé',
    cancelled: 'Annulé',
    rescheduled: 'Reprogrammé',
    no_show: 'Absent',
  };
  return labels[status] || status;
};

export const getAppointmentPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
};

export const getAppointmentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    rescheduled: 'bg-yellow-100 text-yellow-800',
    no_show: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getAppointmentPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };
  return colors[priority] || 'text-gray-500';
};

export const formatAppointmentTime = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
};

export const formatAppointmentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getAppointmentDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / (1000 * 60)); // minutes
};
