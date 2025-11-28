import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/modules/core/layout/components/Layout';
import { StatsWidget } from '@/modules/dashboard/components/StatsWidget';
import { QuickActions } from '@/modules/dashboard/components/QuickActions';
import { RecentActivities } from '@/modules/dashboard/components/RecentActivities';
import { ChartsWidget } from '@/modules/dashboard/components/ChartsWidget';
import { AlertsWidget } from '@/modules/dashboard/components/AlertsWidget';
import { TopPerformersWidget } from '@/modules/dashboard/components/TopPerformersWidget';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';
import type {
  DashboardStats,
  DashboardCharts,
  RecentActivities as RecentActivitiesType,
  TopPerformers,
  DashboardAlerts,
} from '@/modules/dashboard/types/dashboard.types';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for all dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    activeProspects: 0,
    availableProperties: 0,
    todayAppointments: 0,
    totalMatches: 0,
    activeCampaigns: 0,
    pendingTasks: 0,
    totalCommunications: 0,
    conversionRate: 0,
    matchSuccessRate: 0,
  });

  const [charts, setCharts] = useState<DashboardCharts>({
    prospects: { labels: [], values: [] },
    properties: { labels: [], values: [] },
    appointments: { labels: [], values: [] },
    communications: { labels: [], values: [] },
  });

  const [activities, setActivities] = useState<RecentActivitiesType>({
    recentProspects: [],
    recentProperties: [],
    recentAppointments: [],
    recentCommunications: [],
  });

  const [performers, setPerformers] = useState<TopPerformers>({
    topProperties: [],
    topProspects: [],
    topMatches: [],
  });

  const [alerts, setAlerts] = useState<DashboardAlerts>({
    alerts: [],
    counts: {
      overdueTasks: 0,
      upcomingAppointments: 0,
      unmatchedProspects: 0,
    },
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [statsData, chartsData, activitiesData, performersData, alertsData] =
        await Promise.all([
          dashboardService.getStats(),
          dashboardService.getCharts(),
          dashboardService.getRecentActivities(),
          dashboardService.getTopPerformers(),
          dashboardService.getAlerts(),
        ]);

      setStats(statsData);
      setCharts(chartsData);
      setActivities(activitiesData);
      setPerformers(performersData);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err?.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
        </div>

        {/* Alerts */}
        {alerts.alerts.length > 0 && (
          <AlertsWidget alerts={alerts} />
        )}

        {/* Stats Grid */}
        <StatsWidget stats={stats} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Charts */}
        <ChartsWidget charts={charts} />

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activities */}
          <RecentActivities activities={activities} />

          {/* Top Performers */}
          <TopPerformersWidget performers={performers} />
        </div>
      </div>
    </Layout>
  );
}
