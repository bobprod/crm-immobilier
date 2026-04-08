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
export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface AnalyticsMetrics {
  messages: {
    total: number;
    sent: number;
    received: number;
    delivered: number;
    read: number;
    failed: number;
    avgResponseTime: number; // in minutes
  };
  conversations: {
    total: number;
    active: number;
    new: number;
    closed: number;
    avgDuration: number; // in hours
  };
  templates: {
    total: number;
    used: number;
    successRate: number;
    topTemplate?: {
      name: string;
      count: number;
    };
  };
  engagement: {
    responseRate: number;
    readRate: number;
    replyRate: number;
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsChartData {
  messages: TimeSeriesDataPoint[];
  conversations: TimeSeriesDataPoint[];
  responseTime: TimeSeriesDataPoint[];
}

export interface TemplatePerformance {
  templateId: string;
  templateName: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  successRate: number;
  readRate: number;
}

export interface ConversationStats {
  hour: number;
  count: number;
}

export interface AnalyticsReport {
  id: string;
  period: AnalyticsPeriod;
  metrics: AnalyticsMetrics;
  charts: AnalyticsChartData;
  templates: TemplatePerformance[];
  generatedAt: Date;
}

/**
 * Hook for WhatsApp Analytics & Reports
 */
export function useAnalytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(getDefaultPeriod('7days'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Build query string from period
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams({
      start: period.start.toISOString(),
      end: period.end.toISOString(),
    });
    return `?${params.toString()}`;
  }, [period]);

  // Fetch analytics metrics
  const {
    data: metrics,
    error: metricsError,
    isLoading: isLoadingMetrics,
    mutate: mutateMetrics,
  } = useSWR<AnalyticsMetrics>(
    `/whatsapp/analytics/metrics${buildQueryString()}`,
    fetcher
  );

  // Fetch chart data
  const {
    data: chartData,
    error: chartError,
    isLoading: isLoadingCharts,
    mutate: mutateCharts,
  } = useSWR<AnalyticsChartData>(
    `/whatsapp/analytics/charts${buildQueryString()}`,
    fetcher
  );

  // Fetch template performance
  const {
    data: templatePerformance,
    error: templateError,
    isLoading: isLoadingTemplates,
    mutate: mutateTemplates,
  } = useSWR<TemplatePerformance[]>(
    `/whatsapp/analytics/templates/performance${buildQueryString()}`,
    fetcher
  );

  // Fetch conversation stats by hour
  const {
    data: conversationsByHour,
    error: conversationError,
    isLoading: isLoadingConversations,
    mutate: mutateConversations,
  } = useSWR<ConversationStats[]>(
    `/whatsapp/analytics/conversations/by-hour${buildQueryString()}`,
    fetcher
  );

  // Change period
  const changePeriod = useCallback((newPeriod: AnalyticsPeriod) => {
    setPeriod(newPeriod);
  }, []);

  // Set predefined period
  const setPredefinedPeriod = useCallback((type: '7days' | '30days' | '90days' | 'today') => {
    setPeriod(getDefaultPeriod(type));
  }, []);

  // Generate report
  const generateReport = async (): Promise<AnalyticsReport> => {
    setIsGenerating(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/analytics/report`,
        {
          params: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
          },
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export report as PDF
  const exportPDF = async (): Promise<Blob> => {
    setIsExporting(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/analytics/report/export`,
        {
          params: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
            format: 'pdf',
          },
          headers: getAuthHeaders(),
        }
      );
      return exportResultToBlob(response.data);
    } catch (error: any) {
      throw new Error('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Export report as CSV
  const exportCSV = async (): Promise<Blob> => {
    setIsExporting(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/analytics/report/export`,
        {
          params: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
            format: 'csv',
          },
          headers: getAuthHeaders(),
        }
      );
      return exportResultToBlob(response.data);
    } catch (error: any) {
      throw new Error('Erreur lors de l\'export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Export report as Excel
  const exportExcel = async (): Promise<Blob> => {
    setIsExporting(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/analytics/report/export`,
        {
          params: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
            format: 'excel',
          },
          headers: getAuthHeaders(),
        }
      );
      return exportResultToBlob(response.data);
    } catch (error: any) {
      throw new Error('Erreur lors de l\'export Excel');
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

  // Compare periods
  const comparePeriods = async (
    period1: AnalyticsPeriod,
    period2: AnalyticsPeriod
  ): Promise<{
    period1: AnalyticsMetrics;
    period2: AnalyticsMetrics;
    comparison: Record<string, number>; // percentage change
  }> => {
    try {
      const [response1, response2] = await Promise.all([
        axios.get(`${API_BASE_URL}/whatsapp/analytics/metrics`, {
          params: {
            start: period1.start.toISOString(),
            end: period1.end.toISOString(),
          },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/whatsapp/analytics/metrics`, {
          params: {
            start: period2.start.toISOString(),
            end: period2.end.toISOString(),
          },
          headers: getAuthHeaders(),
        }),
      ]);
      return {
        period1: response1.data,
        period2: response2.data,
        comparison: {
          totalMessages: calculatePercentageChange(
            response1.data?.messages?.total || 0,
            response2.data?.messages?.total || 0
          ),
          responseRate: calculatePercentageChange(
            response1.data?.engagement?.responseRate || 0,
            response2.data?.engagement?.responseRate || 0
          ),
        },
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la comparaison');
    }
  };

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      mutateMetrics(),
      mutateCharts(),
      mutateTemplates(),
      mutateConversations(),
    ]);
  }, [mutateMetrics, mutateCharts, mutateTemplates, mutateConversations]);

  return {
    // Data
    metrics,
    chartData,
    templatePerformance,
    conversationsByHour,

    // Period
    period,
    changePeriod,
    setPredefinedPeriod,

    // Loading states
    isLoading: isLoadingMetrics || isLoadingCharts || isLoadingTemplates,
    isLoadingMetrics,
    isLoadingCharts,
    isLoadingTemplates,
    isLoadingConversations,
    isGenerating,
    isExporting,

    // Errors
    error: metricsError || chartError || templateError || conversationError,

    // Actions
    generateReport,
    exportPDF,
    exportCSV,
    exportExcel,
    downloadFile,
    comparePeriods,
    refresh,
  };
}

/**
 * Get default period based on type
 */
function getDefaultPeriod(type: '7days' | '30days' | '90days' | 'today'): AnalyticsPeriod {
  const end = new Date();
  let start = new Date();
  let label = '';

  switch (type) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      label = "Aujourd'hui";
      break;
    case '7days':
      start.setDate(end.getDate() - 7);
      label = '7 derniers jours';
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      label = '30 derniers jours';
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      label = '90 derniers jours';
      break;
  }

  return { start, end, label };
}

/**
 * Format period for display
 */
export function formatPeriod(period: AnalyticsPeriod): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const startStr = period.start.toLocaleDateString('fr-FR', options);
  const endStr = period.end.toLocaleDateString('fr-FR', options);

  return `${startStr} - ${endStr}`;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

function exportResultToBlob(result: { data: string; mimeType?: string }): Blob {
  const byteCharacters = atob(result.data);
  const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], {
    type: result.mimeType || 'application/octet-stream',
  });
}
