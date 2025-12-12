// API Client for CRM Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('crm-token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('crm-token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('crm-token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Une erreur est survenue' };
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Erreur de connexion au serveur' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, fullName: string, role: string = 'agent') {
    return this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
  }

  // Properties endpoints
  async getProperties(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/properties${queryParams ? `?${queryParams}` : ''}`);
  }

  async getProperty(id: string) {
    return this.request<any>(`/properties/${id}`);
  }

  async createProperty(property: any) {
    return this.request<any>('/properties', {
      method: 'POST',
      body: JSON.stringify(property),
    });
  }

  async updateProperty(id: string, property: any) {
    return this.request<any>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(property),
    });
  }

  async deleteProperty(id: string) {
    return this.request<void>(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  async syncPropertyToWordPress(id: string) {
    return this.request<any>(`/properties/${id}/sync-wordpress`, {
      method: 'PUT',
    });
  }

  // Prospects endpoints
  async getProspects(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/prospects${queryParams ? `?${queryParams}` : ''}`);
  }

  async getProspect(id: string) {
    return this.request<any>(`/prospects/${id}`);
  }

  async createProspect(prospect: any) {
    return this.request<any>('/prospects', {
      method: 'POST',
      body: JSON.stringify(prospect),
    });
  }

  async updateProspect(id: string, prospect: any) {
    return this.request<any>(`/prospects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prospect),
    });
  }

  async deleteProspect(id: string) {
    return this.request<void>(`/prospects/${id}`, {
      method: 'DELETE',
    });
  }

  // Integrations endpoints
  async getIntegrations() {
    return this.request<any[]>('/integrations');
  }

  async getIntegration(type: string) {
    return this.request<any>(`/integrations/${type}`);
  }

  async createOrUpdateIntegration(integration: any) {
    return this.request<any>('/integrations', {
      method: 'POST',
      body: JSON.stringify(integration),
    });
  }

  async toggleIntegration(type: string) {
    return this.request<any>(`/integrations/${type}/toggle`, {
      method: 'PUT',
    });
  }

  async deleteIntegration(type: string) {
    return this.request<void>(`/integrations/${type}`, {
      method: 'DELETE',
    });
  }

  // Campaigns endpoints
  async getCampaigns() {
    return this.request<any[]>('/campaigns');
  }

  async getCampaign(id: string) {
    return this.request<any>(`/campaigns/${id}`);
  }

  async createCampaign(campaign: any) {
    return this.request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  }

  async updateCampaign(id: string, campaign: any) {
    return this.request<any>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaign),
    });
  }

  async deleteCampaign(id: string) {
    return this.request<void>(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  async getCampaignStats(id: string) {
    return this.request<any>(`/campaigns/${id}/stats`);
  }

  // Appointments endpoints
  async getAppointments(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/appointments${queryParams ? `?${queryParams}` : ''}`);
  }

  async getAppointment(id: string) {
    return this.request<any>(`/appointments/${id}`);
  }

  async createAppointment(appointment: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  }

  async updateAppointment(id: string, appointment: any) {
    return this.request<any>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
  }

  async deleteAppointment(id: string) {
    return this.request<void>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Matching endpoints
  async generateMatches() {
    return this.request<any[]>('/matching/generate', {
      method: 'POST',
    });
  }

  async getMatches(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/matching${queryParams ? `?${queryParams}` : ''}`);
  }

  async updateMatchStatus(id: string, status: string) {
    return this.request<any>(`/matching/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
