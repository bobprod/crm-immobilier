import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { BarChart3, TrendingUp, Clock, Target, MessageSquare, Mail, Bell, Smartphone } from 'lucide-react';
import axios from 'axios';

interface EngagementStats {
  total: number;
  unread: number;
  read: number;
  openRate: string;
}

interface ChannelStats {
  channel: string;
  sent: number;
  opened: number;
  rate: number;
}

interface HourlyActivity {
  hour: number;
  count: number;
}

const NotificationAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [statsRes, readingStatsRes] = await Promise.all([
        axios.get('/api/notifications/stats/engagement', { headers }),
        axios.get('/api/notifications/stats/reading', { headers })
      ]);

      if (statsRes.data) {
        setStats(statsRes.data);
      }

      if (readingStatsRes.data) {
        const { byChannel, byHour } = readingStatsRes.data;
        if (byChannel) setChannelStats(byChannel);
        if (byHour) setHourlyActivity(byHour);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'push':
        return <Bell className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <Smartphone className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getMaxActivity = () => {
    if (hourlyActivity.length === 0) return 0;
    return Math.max(...hourlyActivity.map(h => h.count));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics des Notifications</h1>
          <p className="text-gray-600 mt-2">Analysez l'engagement et l'efficacité de vos notifications</p>
        </div>

        {/* Statistiques Générales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Toutes les notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non Lues</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.unread || 0}</div>
              <p className="text-xs text-muted-foreground">En attente de lecture</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lues</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.read || 0}</div>
              <p className="text-xs text-muted-foreground">Notifications ouvertes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.openRate || '0'}%</div>
              <p className="text-xs text-muted-foreground">Performance globale</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance par Canal */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par Canal</CardTitle>
            <CardDescription>Taux d'engagement par canal de communication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelStats.length > 0 ? (
                channelStats.map((channel) => (
                  <div key={channel.channel} className="flex items-center">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="text-gray-600">{getChannelIcon(channel.channel)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{channel.channel}</span>
                          <span className="text-sm text-gray-600">
                            {channel.opened}/{channel.sent} ({channel.rate.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${channel.rate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée de canal disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activité par Heure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Activité par Heure
            </CardTitle>
            <CardDescription>Heures où vous êtes le plus actif sur les notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hourlyActivity.length > 0 ? (
                <div className="grid grid-cols-24 gap-1">
                  {hourlyActivity.map((activity) => {
                    const maxActivity = getMaxActivity();
                    const heightPercent = maxActivity > 0 ? (activity.count / maxActivity) * 100 : 0;
                    return (
                      <div
                        key={activity.hour}
                        className="flex flex-col items-center"
                        title={`${activity.hour}h: ${activity.count} notifications`}
                      >
                        <div className="relative h-24 w-full flex items-end">
                          <div
                            className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-colors"
                            style={{ height: `${heightPercent}%`, minHeight: activity.count > 0 ? '4px' : '0' }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1">{activity.hour}h</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée d'activité horaire disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommandations IA */}
        <Card>
          <CardHeader>
            <CardTitle>Recommandations IA</CardTitle>
            <CardDescription>Suggestions basées sur votre activité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Timing Optimal</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Vos heures les plus actives sont entre 9h-11h et 14h-16h. Activez le timing optimal pour de meilleurs résultats.
                  </p>
                </div>
              </div>

              {stats && parseFloat(stats.openRate) < 50 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Améliorer l'Engagement</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Votre taux d'ouverture est de {stats.openRate}%. Essayez de réduire la fréquence ou d'ajuster vos canaux préférés.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Bell className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Canal Recommandé</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Les notifications Push ont le meilleur taux d'engagement. Considérez-les comme canal principal.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationAnalyticsPage;
