import apiClient from '@/shared/utils/backend-api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  prospectId?: string;
  propertyId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations optionnelles (incluses par le backend)
  prospects?: { id: string; firstName: string; lastName: string };
  properties?: { id: string; title: string; reference?: string };
  appointments?: { id: string; title: string; startTime: string };
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  prospectId?: string;
  propertyId?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

export interface TaskFilters {
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
}

const tasksService = {
  findAll: async (filters?: TaskFilters) => {
    const response = await apiClient.get<Task[]>('/tasks', { params: filters });
    return response.data;
  },

  findOne: async (id: string) => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskDto) => {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTaskDto) => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.put<Task>(`/tasks/${id}/complete`);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/tasks/stats');
    return response.data;
  },

  getToday: async () => {
    const response = await apiClient.get<Task[]>('/tasks/today');
    return response.data;
  },

  getOverdue: async () => {
    const response = await apiClient.get<Task[]>('/tasks/overdue');
    return response.data;
  },
};

export default tasksService;
