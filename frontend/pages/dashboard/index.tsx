'use client';

import { useEffect, useState } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { StatsWidget } from '../../src/modules/dashboard/components/StatsWidget';
import { RecentActivities } from '../../src/modules/dashboard/components/RecentActivities';
import { QuickActions } from '../../src/modules/dashboard/components/QuickActions';
import { apiClient } from '../../src/shared/utils/api-client-backend';
import type { DashboardStats } from '../../src/modules/dashboard/types/dashboard.types';

const defaultStats: DashboardStats = {
  activeProspects: 0,
  availableProperties: 0,
  todayAppointments: 0,
  totalMatches: 0,
  activeCampaigns: 0,
  pendingTasks: 0,
  totalCommunications: 0,
  conversionRate: 0,
  matchSuccessRate: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait a bit to ensure token is available after redirect from login
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Verify token exists before making request
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[Dashboard] No token found, cannot fetch data');
        setLoading(false);
        return;
      }

      console.log('[Dashboard] Token found, fetching dashboard stats...');
      const response = await apiClient.get('/dashboard/stats');

      console.log('[Dashboard] Response received:', response.data);
      if (response.data) {
        // Merge with defaults to ensure all fields are present
        setStats({ ...defaultStats, ...response.data });
      }
    } catch (error: any) {
      console.error('[Dashboard] Error fetching dashboard data:', error);
      console.error('[Dashboard] Error details:', error.response?.status, error.response?.data);
      // Set default values on error
      setStats(defaultStats);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Statistiques */}
        <StatsWidget stats={stats} />

        {/* Actions rapides */}
        <QuickActions />

        {/* Activités récentes */}
        <RecentActivities activities={recentActivities} />
      </div>
    </Layout>
  );
}
