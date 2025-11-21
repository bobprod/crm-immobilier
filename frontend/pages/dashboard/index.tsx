'use client';

import { useEffect, useState } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { StatsWidget } from '../../src/modules/dashboard/components/StatsWidget';
import { RecentActivities } from '../../src/modules/dashboard/components/RecentActivities';
import { QuickActions } from '../../src/modules/dashboard/components/QuickActions';
import { apiClient } from '../../src/shared/utils/api-client-backend';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalProspects: 0,
    totalAppointments: 0,
    conversionRate: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('[Dashboard] Fetching dashboard stats...');
      const response = await apiClient.get('/dashboard/stats');

      console.log('[Dashboard] Response received:', response.data);
      if (response.data) {
        setStats(response.data.stats || {
          totalProperties: 0,
          totalProspects: 0,
          totalAppointments: 0,
          conversionRate: 0
        });
        setRecentActivities(response.data.recentActivities || []);
      }
    } catch (error: any) {
      console.error('[Dashboard] Error fetching dashboard data:', error);
      console.error('[Dashboard] Error details:', error.response?.status, error.response?.data);
      // Set default values on error
      setStats({
        totalProperties: 0,
        totalProspects: 0,
        totalAppointments: 0,
        conversionRate: 0
      });
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
              day: 'numeric'
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
