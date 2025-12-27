/**
 * Investment Intelligence API Client
 * Communicates with the Investment Intelligence backend
 */

import axios from 'axios';
import type {
  InvestmentProject,
  InvestmentAnalysis,
  InvestmentComparison,
  InvestmentAlert,
  PlatformDetectionResult,
  PlatformsSummary,
  ImportProjectRequest,
  ImportBatchRequest,
  AnalyzeProjectRequest,
  CompareProjectsRequest,
  CreateAlertRequest,
  UpdateAlertRequest,
  ListProjectsFilters,
} from '../types/investment.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INVESTMENT_API_BASE = `${API_BASE_URL}/api/investment-intelligence`;

// ============================================
// API Response Types
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

interface ImportBatchResponse {
  success: boolean;
  succeeded: InvestmentProject[];
  failed: Array<{ url: string; error: string }>;
}

// ============================================
// HTTP Client
// ============================================

class InvestmentApiClient {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // ============================================
  // Platform Detection
  // ============================================

  async detectPlatform(url: string): Promise<PlatformDetectionResult> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/detect`, {
      params: { url },
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getSupportedPlatforms(): Promise<PlatformsSummary> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/platforms`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // ============================================
  // Project Import
  // ============================================

  async importProject(data: ImportProjectRequest): Promise<InvestmentProject> {
    const response = await axios.post(`${INVESTMENT_API_BASE}/import`, data, {
      headers: this.getHeaders(),
    });
    return response.data.project;
  }

  async importBatch(data: ImportBatchRequest): Promise<ImportBatchResponse> {
    const response = await axios.post(`${INVESTMENT_API_BASE}/import/batch`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async syncProject(projectId: string): Promise<InvestmentProject> {
    const response = await axios.post(
      `${INVESTMENT_API_BASE}/sync/${projectId}`,
      {},
      {
        headers: this.getHeaders(),
      },
    );
    return response.data.project;
  }

  // ============================================
  // Projects List & Details
  // ============================================

  async listProjects(filters?: ListProjectsFilters): Promise<InvestmentProject[]> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/projects`, {
      params: filters,
      headers: this.getHeaders(),
    });
    return response.data.projects;
  }

  async getProject(projectId: string): Promise<InvestmentProject> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/projects/${projectId}`, {
      headers: this.getHeaders(),
    });
    return response.data.project;
  }

  async deleteProject(projectId: string): Promise<void> {
    await axios.delete(`${INVESTMENT_API_BASE}/projects/${projectId}`, {
      headers: this.getHeaders(),
    });
  }

  // ============================================
  // Analysis
  // ============================================

  async analyzeProject(data: AnalyzeProjectRequest): Promise<InvestmentAnalysis> {
    const response = await axios.post(`${INVESTMENT_API_BASE}/analyze`, data, {
      headers: this.getHeaders(),
    });
    return response.data.analysis;
  }

  async getAnalysis(projectId: string): Promise<InvestmentAnalysis | null> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/analyses/${projectId}`, {
      headers: this.getHeaders(),
    });
    return response.data.analysis;
  }

  async listAnalyses(): Promise<InvestmentAnalysis[]> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/analyses`, {
      headers: this.getHeaders(),
    });
    return response.data.analyses;
  }

  // ============================================
  // Comparison
  // ============================================

  async compareProjects(data: CompareProjectsRequest): Promise<InvestmentComparison> {
    const response = await axios.post(`${INVESTMENT_API_BASE}/compare`, data, {
      headers: this.getHeaders(),
    });
    return response.data.comparison;
  }

  async getComparison(comparisonId: string): Promise<InvestmentComparison> {
    const response = await axios.get(
      `${INVESTMENT_API_BASE}/comparisons/${comparisonId}`,
      {
        headers: this.getHeaders(),
      },
    );
    return response.data.comparison;
  }

  async listComparisons(): Promise<InvestmentComparison[]> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/comparisons`, {
      headers: this.getHeaders(),
    });
    return response.data.comparisons;
  }

  async deleteComparison(comparisonId: string): Promise<void> {
    await axios.delete(`${INVESTMENT_API_BASE}/comparisons/${comparisonId}`, {
      headers: this.getHeaders(),
    });
  }

  // ============================================
  // Alerts
  // ============================================

  async createAlert(data: CreateAlertRequest): Promise<InvestmentAlert> {
    const response = await axios.post(`${INVESTMENT_API_BASE}/alerts`, data, {
      headers: this.getHeaders(),
    });
    return response.data.alert;
  }

  async updateAlert(
    alertId: string,
    data: UpdateAlertRequest,
  ): Promise<InvestmentAlert> {
    const response = await axios.put(`${INVESTMENT_API_BASE}/alerts/${alertId}`, data, {
      headers: this.getHeaders(),
    });
    return response.data.alert;
  }

  async listAlerts(): Promise<InvestmentAlert[]> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/alerts`, {
      headers: this.getHeaders(),
    });
    return response.data.alerts;
  }

  async getAlert(alertId: string): Promise<InvestmentAlert> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/alerts/${alertId}`, {
      headers: this.getHeaders(),
    });
    return response.data.alert;
  }

  async deleteAlert(alertId: string): Promise<void> {
    await axios.delete(`${INVESTMENT_API_BASE}/alerts/${alertId}`, {
      headers: this.getHeaders(),
    });
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<{ status: string; timestamp: string; adapters: number }> {
    const response = await axios.get(`${INVESTMENT_API_BASE}/health`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }
}

// Export singleton instance
export const investmentApi = new InvestmentApiClient();

// Export class for testing
export default InvestmentApiClient;
