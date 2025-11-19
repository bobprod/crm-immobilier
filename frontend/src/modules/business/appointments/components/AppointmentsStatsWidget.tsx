import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { appointmentsAPI, AppointmentStats } from '@/shared/utils/appointments-api';

export default function AppointmentsStatsWidget() {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Stats du mois en cours
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const data = await appointmentsAPI.getStats(
        startOfMonth.toISOString(),
        endOfMonth.toISOString(),
      );
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Rendez-vous</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusCount = (status: string) => {
    const item = stats.byStatus.find((s: any) => s.status === status);
    return item?._count || 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Calendar className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-gray-500">Ce mois</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Terminés</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getStatusCount('completed')}</div>
          <p className="text-xs text-gray-500">Taux: {stats.attendanceRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {getStatusCount('scheduled') + getStatusCount('confirmed')}
          </div>
          <p className="text-xs text-gray-500">À venir</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
          <TrendingUp className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
          </div>
          <p className="text-xs text-gray-500">Sur 5</p>
        </CardContent>
      </Card>
    </div>
  );
}
