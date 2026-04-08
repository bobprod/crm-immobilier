import apiClient from '@/shared/utils/backend-api';

export interface TaskBoard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  layout?: Record<string, any>;
  settings?: Record<string, any>;
  columns?: TaskColumn[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskColumn {
  id: string;
  boardId: string;
  name: string;
  color?: string;
  position: number;
  limit?: number;
  settings?: Record<string, any>;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  prospectId?: string;
  propertyId?: string;
  appointmentId?: string;
  boardId?: string;
  columnId?: string;
  position?: number;
  viewType?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  column?: TaskColumn;
  board?: TaskBoard;
}

export interface PlanningView {
  id: string;
  userId: string;
  viewType: 'calendar' | 'kanban' | 'list' | 'mindmap';
  preferences?: Record<string, any>;
  defaultView: boolean;
  filterOptions?: Record<string, any>;
  layoutConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedPlanningData {
  tasks: Task[];
  appointments: any[];
  boards: TaskBoard[];
  views: PlanningView[];
  metadata: {
    viewType: string;
    totalTasks: number;
    totalAppointments: number;
    filters: Record<string, any>;
  };
}

// TaskBoard API
export const createTaskBoard = async (data: Partial<TaskBoard>): Promise<TaskBoard> => {
  const response = await apiClient.post('/planning/boards', data);
  return response.data;
};

export const getTaskBoards = async (): Promise<TaskBoard[]> => {
  const response = await apiClient.get('/planning/boards');
  return response.data;
};

export const getTaskBoard = async (boardId: string): Promise<TaskBoard> => {
  const response = await apiClient.get(`/planning/boards/${boardId}`);
  return response.data;
};

export const updateTaskBoard = async (
  boardId: string,
  data: Partial<TaskBoard>
): Promise<TaskBoard> => {
  const response = await apiClient.put(`/planning/boards/${boardId}`, data);
  return response.data;
};

export const deleteTaskBoard = async (boardId: string): Promise<void> => {
  await apiClient.delete(`/planning/boards/${boardId}`);
};

export const initializeDefaultBoard = async (): Promise<TaskBoard> => {
  const response = await apiClient.get('/planning/boards/initialize');
  return response.data;
};

// TaskColumn API
export const createTaskColumn = async (data: Partial<TaskColumn>): Promise<TaskColumn> => {
  const response = await apiClient.post('/planning/columns', data);
  return response.data;
};

export const updateTaskColumn = async (
  columnId: string,
  data: Partial<TaskColumn>
): Promise<TaskColumn> => {
  const response = await apiClient.put(`/planning/columns/${columnId}`, data);
  return response.data;
};

export const deleteTaskColumn = async (columnId: string): Promise<void> => {
  await apiClient.delete(`/planning/columns/${columnId}`);
};

// Task Movement API
export const moveTask = async (data: {
  taskId: string;
  boardId?: string;
  columnId?: string;
  position: number;
}): Promise<Task> => {
  const response = await apiClient.post('/planning/tasks/move', data);
  return response.data;
};

// PlanningView API
export const createPlanningView = async (data: Partial<PlanningView>): Promise<PlanningView> => {
  const response = await apiClient.post('/planning/views', data);
  return response.data;
};

export const getPlanningViews = async (): Promise<PlanningView[]> => {
  const response = await apiClient.get('/planning/views');
  return response.data;
};

export const getPlanningView = async (viewId: string): Promise<PlanningView> => {
  const response = await apiClient.get(`/planning/views/${viewId}`);
  return response.data;
};

export const updatePlanningView = async (
  viewId: string,
  data: Partial<PlanningView>
): Promise<PlanningView> => {
  const response = await apiClient.put(`/planning/views/${viewId}`, data);
  return response.data;
};

export const deletePlanningView = async (viewId: string): Promise<void> => {
  await apiClient.delete(`/planning/views/${viewId}`);
};

// Unified Planning API
export const getUnifiedPlanningData = async (params?: {
  viewType?: string;
  startDate?: string;
  endDate?: string;
  boardId?: string;
  status?: string;
  priority?: string;
  search?: string;
}): Promise<UnifiedPlanningData> => {
  const response = await apiClient.get('/planning/unified', { params });
  return response.data;
};
