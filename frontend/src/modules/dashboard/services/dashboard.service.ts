import { apiClient } from '@/shared/utils/api-client-backend';
import type {
    DashboardStats,
    DashboardCharts,
    RecentActivities,
    TopPerformers,
    DashboardAlerts,
} from '../types/dashboard.types';

class DashboardService {
    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        const response = await apiClient.get<DashboardStats>('/dashboard/stats');
        return response.data;
    }

    /**
     * Get chart data
     */
    async getCharts(): Promise<DashboardCharts> {
        const response = await apiClient.get<DashboardCharts>('/dashboard/charts');
        return response.data;
    }

    /**
     * Get recent activities
     */
    async getRecentActivities(): Promise<RecentActivities> {
        const response = await apiClient.get<RecentActivities>('/dashboard/activities');
        return response.data;
    }

    /**
     * Get top performers
     */
    async getTopPerformers(): Promise<TopPerformers> {
        const response = await apiClient.get<TopPerformers>('/dashboard/top-performers');
        return response.data;
    }

    /**
     * Get alerts
     */
    async getAlerts(): Promise<DashboardAlerts> {
        const response = await apiClient.get<DashboardAlerts>('/dashboard/alerts');
        return response.data;
    }
}

export const dashboardService = new DashboardService();
