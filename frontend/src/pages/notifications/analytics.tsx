import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../shared/utils/notifications-api';
import type { NotificationAnalytics, ChannelStatistics, NotificationChannel } from '../../shared/utils/notifications-api';

/**
 * 📊 Page d'Analytics des Notifications Smart AI
 *
 * Affiche:
 * - Statistiques globales
 * - Métriques par canal (taux livraison, ouverture)
 * - Graphiques de performance
 * - Recommandations AI
 */
export default function NotificationAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await notificationsAPI.getAnalytics(period);
      setAnalytics(data);
    } catch (error: any) {
      setErrorMessage('Erreur lors du chargement des analytics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !analytics) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-800">Erreur</h2>
        <p className="text-red-600">{errorMessage || 'Impossible de charger les analytics.'}</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const channelData = Object.entries(analytics.byChannel) as [NotificationChannel, ChannelStatistics][];

  // Calculer les totaux
  const totalDelivered = channelData.reduce((sum, [_, stats]) => sum + stats.delivered, 0);
  const totalOpened = channelData.reduce((sum, [_, stats]) => sum + stats.opened, 0);
  const globalDeliveryRate = analytics.total > 0 ? (totalDelivered / analytics.total) * 100 : 0;
  const globalOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;

  // Trouver le meilleur canal
  const bestChannel = channelData.reduce((best, [channel, stats]) => {
    if (!best || stats.openRate > best[1].openRate) {
      return [channel, stats];
    }
    return best;
  }, channelData[0]);

  const getChannelIcon = (channel: NotificationChannel): string => {
    const icons: Record<NotificationChannel, string> = {
      in_app: '📱',
      email: '📧',
      sms: '💬',
      push: '🔔',
      whatsapp: '💚',
    };
    return icons[channel] || '📡';
  };

  const getChannelLabel = (channel: NotificationChannel): string => {
    const labels: Record<NotificationChannel, string> = {
      in_app: 'Dans l\'app',
      email: 'Email',
      sms: 'SMS',
      push: 'Push',
      whatsapp: 'WhatsApp',
    };
    return labels[channel] || channel;
  };

  const getChannelColor = (channel: NotificationChannel): string => {
    const colors: Record<NotificationChannel, string> = {
      in_app: 'bg-blue-500',
      email: 'bg-green-500',
      sms: 'bg-purple-500',
      push: 'bg-orange-500',
      whatsapp: 'bg-emerald-500',
    };
    return colors[channel] || 'bg-gray-500';
  };

  const getRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Analytics des Notifications Smart AI
            </h1>
            <p className="text-gray-600">
              Analysez les performances de vos notifications et optimisez votre engagement.
            </p>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="180">6 derniers mois</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Notifications */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Notifications</p>
              <p className="text-3xl font-bold mt-2">{analytics.total}</p>
            </div>
            <div className="text-4xl opacity-50">📬</div>
          </div>
        </div>

        {/* Unread */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Non lues</p>
              <p className="text-3xl font-bold mt-2">{analytics.unread}</p>
            </div>
            <div className="text-4xl opacity-50">📭</div>
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Taux de livraison</p>
              <p className="text-3xl font-bold mt-2">{globalDeliveryRate.toFixed(1)}%</p>
            </div>
            <div className="text-4xl opacity-50">📨</div>
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Taux d'ouverture</p>
              <p className="text-3xl font-bold mt-2">{globalOpenRate.toFixed(1)}%</p>
            </div>
            <div className="text-4xl opacity-50">👀</div>
          </div>
        </div>
      </div>

      {/* Best Channel */}
      {bestChannel && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg shadow-md p-6 border-2 border-amber-200">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">🏆</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Meilleur canal: {getChannelIcon(bestChannel[0])} {getChannelLabel(bestChannel[0])}
              </h3>
              <p className="text-gray-600 mt-1">
                Taux d'ouverture de <span className="font-bold text-green-600">{bestChannel[1].openRate.toFixed(1)}%</span> avec {bestChannel[1].total} notifications
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Channel Statistics Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📡 Statistiques par canal
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Canal</th>
                <th className="text-center p-3 font-semibold text-gray-700">Total</th>
                <th className="text-center p-3 font-semibold text-gray-700">Livrées</th>
                <th className="text-center p-3 font-semibold text-gray-700">Ouvertes</th>
                <th className="text-center p-3 font-semibold text-gray-700">Taux livraison</th>
                <th className="text-center p-3 font-semibold text-gray-700">Taux ouverture</th>
                <th className="text-center p-3 font-semibold text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map(([channel, stats]) => (
                <tr key={channel} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getChannelIcon(channel)}</span>
                      <span className="font-medium text-gray-800">{getChannelLabel(channel)}</span>
                    </div>
                  </td>
                  <td className="text-center p-3 font-medium">{stats.total}</td>
                  <td className="text-center p-3">{stats.delivered}</td>
                  <td className="text-center p-3">{stats.opened}</td>
                  <td className="text-center p-3">
                    <span className={`font-bold ${getRateColor(stats.deliveryRate)}`}>
                      {stats.deliveryRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <span className={`font-bold ${getRateColor(stats.openRate)}`}>
                      {stats.openRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getChannelColor(channel)}`}
                        style={{ width: `${Math.min(stats.openRate, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Rate Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📨 Taux de livraison par canal
          </h3>
          <div className="space-y-3">
            {channelData.map(([channel, stats]) => (
              <div key={channel}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">
                    {getChannelIcon(channel)} {getChannelLabel(channel)}
                  </span>
                  <span className={`font-bold ${getRateColor(stats.deliveryRate)}`}>
                    {stats.deliveryRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getChannelColor(channel)}`}
                    style={{ width: `${Math.min(stats.deliveryRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Rate Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            👀 Taux d'ouverture par canal
          </h3>
          <div className="space-y-3">
            {channelData.map(([channel, stats]) => (
              <div key={channel}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">
                    {getChannelIcon(channel)} {getChannelLabel(channel)}
                  </span>
                  <span className={`font-bold ${getRateColor(stats.openRate)}`}>
                    {stats.openRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getChannelColor(channel)}`}
                    style={{ width: `${Math.min(stats.openRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 border border-indigo-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="text-3xl mr-2">🤖</span>
          Insights AI
        </h2>

        <div className="space-y-3">
          {globalOpenRate < 50 && (
            <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 font-medium">
                ⚠️ Taux d'ouverture global faible ({globalOpenRate.toFixed(1)}%)
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Recommandation: Activez l'optimisation AI pour améliorer l'engagement automatiquement.
              </p>
            </div>
          )}

          {bestChannel && bestChannel[1].openRate > 80 && (
            <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Excellent taux d'ouverture sur {getChannelLabel(bestChannel[0])} ({bestChannel[1].openRate.toFixed(1)}%)
              </p>
              <p className="text-green-700 text-sm mt-1">
                L'AI privilégiera ce canal pour maximiser votre engagement.
              </p>
            </div>
          )}

          {analytics.unread > analytics.total * 0.5 && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-blue-800 font-medium">
                💡 {((analytics.unread / analytics.total) * 100).toFixed(0)}% de notifications non lues
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Considérez activer le digest quotidien pour regrouper les notifications moins urgentes.
              </p>
            </div>
          )}

          {channelData.some(([_, stats]) => stats.deliveryRate < 90) && (
            <div className="p-4 bg-orange-50 border border-orange-300 rounded-lg">
              <p className="text-orange-800 font-medium">
                📉 Taux de livraison sous-optimal détecté
              </p>
              <p className="text-orange-700 text-sm mt-1">
                Certains canaux ont des problèmes de livraison. Vérifiez la configuration des intégrations externes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          💡 Recommandations
        </h2>

        <ul className="space-y-3">
          <li className="flex items-start space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <p className="font-medium text-gray-800">Utilisez l'optimisation AI</p>
              <p className="text-sm text-gray-600">
                L'AI sélectionne automatiquement le meilleur canal basé sur vos taux d'engagement historiques.
              </p>
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <p className="font-medium text-gray-800">Configurez les quiet hours</p>
              <p className="text-sm text-gray-600">
                Améliorez l'expérience utilisateur en évitant les notifications pendant les heures de repos.
              </p>
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <p className="font-medium text-gray-800">Activez le digest quotidien</p>
              <p className="text-sm text-gray-600">
                Regroupez les notifications moins urgentes dans un email quotidien pour réduire la fatigue.
              </p>
            </div>
          </li>

          <li className="flex items-start space-x-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <p className="font-medium text-gray-800">Surveillez les métriques régulièrement</p>
              <p className="text-sm text-gray-600">
                Analysez vos analytics hebdomadairement pour identifier les tendances et optimiser votre stratégie.
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadAnalytics}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          ↻ Rafraîchir les données
        </button>
      </div>
    </div>
  );
}
