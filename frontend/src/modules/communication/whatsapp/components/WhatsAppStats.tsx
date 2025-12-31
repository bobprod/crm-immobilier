import React from 'react';
import { MessageCircle, Send, Users, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { WhatsAppStats as StatsType } from '../types/whatsapp.types';

interface WhatsAppStatsProps {
  stats: StatsType | null;
  isLoading?: boolean;
}

/**
 * WhatsApp Statistics Cards
 * Displays key metrics in a grid layout
 */
export const WhatsAppStats: React.FC<WhatsAppStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucune statistique disponible</p>
        <p className="text-sm text-gray-400 mt-1">Configurez WhatsApp pour voir les métriques</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Messages Totaux',
      value: stats.totalMessages,
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12% vs période précédente',
      trendUp: true,
    },
    {
      title: 'Conversations Actives',
      value: stats.activeConversations,
      subtitle: `${stats.totalConversations} total`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: `${((stats.activeConversations / stats.totalConversations) * 100).toFixed(0)}% actives`,
      trendUp: true,
    },
    {
      title: 'Taux de Réponse',
      value: `${stats.responseRate.toFixed(0)}%`,
      icon: CheckCircle2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: stats.responseRate > 70 ? 'Excellent' : 'À améliorer',
      trendUp: stats.responseRate > 70,
    },
    {
      title: 'Temps de Réponse Moyen',
      value: stats.averageResponseTime < 60
        ? `${Math.round(stats.averageResponseTime)}min`
        : `${Math.round(stats.averageResponseTime / 60)}h`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: stats.averageResponseTime < 30 ? 'Très rapide' : 'Bon',
      trendUp: stats.averageResponseTime < 30,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          {/* Icon */}
          <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            {stat.subtitle && (
              <span className="text-sm text-gray-500">{stat.subtitle}</span>
            )}
          </div>

          {/* Trend */}
          {stat.trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`w-4 h-4 ${
                  stat.trendUp ? 'text-green-500' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-xs ${
                  stat.trendUp ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {stat.trend}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Additional Info Cards */}
      <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        {/* Messages Sent */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Messages Envoyés</p>
              <p className="text-2xl font-bold text-green-700">{stats.messagesSent}</p>
            </div>
            <Send className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Messages Received */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Messages Reçus</p>
              <p className="text-2xl font-bold text-blue-700">{stats.messagesReceived}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* Templates Used */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Templates Utilisés</p>
              <p className="text-2xl font-bold text-purple-700">{stats.templatesUsed}</p>
            </div>
            <div className="w-8 h-8 bg-purple-400 rounded flex items-center justify-center text-white font-bold">
              T
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Period Selector for Stats
 */
interface PeriodSelectorProps {
  value: '7days' | '30days' | '90days' | 'today';
  onChange: (period: '7days' | '30days' | '90days' | 'today') => void;
}

export const StatsPeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const periods = [
    { value: 'today', label: "Aujourd'hui" },
    { value: '7days', label: '7 jours' },
    { value: '30days', label: '30 jours' },
    { value: '90days', label: '90 jours' },
  ] as const;

  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            value === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};
