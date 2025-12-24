import apiClient from './backend-api';

/**
 * Base API client class with common CRUD operations
 * Reduces duplication across API client files
 */
export class BaseAPIClient<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  constructor(private basePath: string) {}

  /**
   * Create a new resource
   */
  async create(data: CreateDTO): Promise<T> {
    const response = await apiClient.post(this.basePath, data);
    return response.data;
  }

  /**
   * List all resources with optional filters
   */
  async list(filters?: Record<string, any>): Promise<{ items?: T[]; data?: T[]; total?: number }> {
    const response = await apiClient.get(this.basePath, { params: filters });
    return response.data;
  }

  /**
   * Get a resource by ID
   */
  async getById(id: string): Promise<T> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Update a resource
   */
  async update(id: string, updates: UpdateDTO): Promise<T> {
    const response = await apiClient.put(`${this.basePath}/${id}`, updates);
    return response.data;
  }

  /**
   * Delete a resource
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get paginated results with cursor
   */
  async getPaginated(
    cursor?: string,
    limit = 20,
    filters?: Record<string, any>,
  ): Promise<{
    items: T[];
    nextCursor: string | null;
    hasNextPage: boolean;
    total: number;
  }> {
    const params: any = { limit, ...filters };
    if (cursor) {
      params.cursor = cursor;
    }
    const response = await apiClient.get(`${this.basePath}/paginated`, { params });
    return response.data;
  }

  /**
   * Custom GET request to a sub-path
   */
  async get(subPath: string, params?: Record<string, any>): Promise<any> {
    const path = subPath ? `${this.basePath}/${subPath}` : this.basePath;
    const response = await apiClient.get(path, { params });
    return response.data;
  }

  /**
   * Custom POST request to a sub-path
   */
  async post(subPath: string, data?: any): Promise<any> {
    const path = subPath ? `${this.basePath}/${subPath}` : this.basePath;
    const response = await apiClient.post(path, data);
    return response.data;
  }

  /**
   * Custom PUT request to a sub-path
   */
  async put(subPath: string, data?: any): Promise<any> {
    const path = subPath ? `${this.basePath}/${subPath}` : this.basePath;
    const response = await apiClient.put(path, data);
    return response.data;
  }

  /**
   * Custom PATCH request to a sub-path
   */
  async patch(subPath: string, data?: any): Promise<any> {
    const path = subPath ? `${this.basePath}/${subPath}` : this.basePath;
    const response = await apiClient.patch(path, data);
    return response.data;
  }
}
