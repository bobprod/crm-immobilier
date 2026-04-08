import apiClient from '../utils/backend-api';

export async function completeTask(taskId: string): Promise<void> {
  await apiClient.patch(`/tasks/${taskId}`, { status: 'done' });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`);
}
