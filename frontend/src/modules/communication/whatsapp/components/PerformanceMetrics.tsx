import React from 'react';
import {
  MessageCircle,
  Send,
  CheckCircle,
  Eye,
  XCircle,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { AnalyticsMetrics } from '../hooks/useAnalytics';

interface PerformanceMetricsProps {
  metrics: AnalyticsMetrics;
  isLoading?: boolean;
  comparisonData?: {
    percentage: number;
    label: string;
  };
}

/**
 * Performance Metrics Component
 * Displays key performance indicators for WhatsApp analytics
 */
export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  metrics,
  isLoading,
  comparisonData,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Messages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Messages"
            value={metrics.messages.total}
            icon={<MessageCircle className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Envoyés"
            value={metrics.messages.sent}
            icon={<Send className="w-5 h-5" />}
            color="purple"
            subtitle={`${((metrics.messages.sent / metrics.messages.total) * 100 || 0).toFixed(1)}% du total`}
          />
          <MetricCard
            title="Délivrés"
            value={metrics.messages.delivered}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
            subtitle={`${((metrics.messages.delivered / metrics.messages.sent) * 100 || 0).toFixed(1)}% taux de délivrance`}
          />
          <MetricCard
            title="Lus"
            value={metrics.messages.read}
            icon={<Eye className="w-5 h-5" />}
            color="blue"
            subtitle={`${((metrics.messages.read / metrics.messages.delivered) * 100 || 0).toFixed(1)}% taux de lecture`}
          />
        </div>
      </div>

      {/* Conversations Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Conversations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Conversations"
            value={metrics.conversations.total}
            icon={<Users className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            title="Actives"
            value={metrics.conversations.active}
            icon={<Users className="w-5 h-5" />}
            color="blue"
            subtitle={`${((metrics.conversations.active / metrics.conversations.total) * 100 || 0).toFixed(1)}% du total`}
          />
          <MetricCard
            title="Nouvelles"
            value={metrics.conversations.new}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            title="Durée moyenne"
            value={`${metrics.conversations.avgDuration.toFixed(1)}h`}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
            isNumeric={false}
          />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Engagement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Taux de réponse"
            value={`${metrics.engagement.responseRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
            isNumeric={false}
            progress={metrics.engagement.responseRate}
          />
          <MetricCard
            title="Taux de lecture"
            value={`${metrics.engagement.readRate.toFixed(1)}%`}
            icon={<Eye className="w-5 h-5" />}
            color="blue"
            isNumeric={false}
            progress={metrics.engagement.readRate}
          />
          <MetricCard
            title="Taux de réponse client"
            value={`${metrics.engagement.replyRate.toFixed(1)}%`}
            icon={<MessageCircle className="w-5 h-5" />}
            color="purple"
            isNumeric={false}
            progress={metrics.engagement.replyRate}
          />
          <MetricCard
            title="Temps de réponse"
            value={`${metrics.messages.avgResponseTime.toFixed(0)} min`}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
            isNumeric={false}
          />
        </div>
      </div>

      {/* Templates Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Templates utilisés"
            value={metrics.templates.used}
            subtitle={`sur ${metrics.templates.total} disponibles`}
            icon={<MessageCircle className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            title="Taux de succès"
            value={`${metrics.templates.successRate.toFixed(1)}%`}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
            isNumeric={false}
            progress={metrics.templates.successRate}
          />
          {metrics.templates.topTemplate && (
            <MetricCard
              title="Template le plus utilisé"
              value={metrics.templates.topTemplate.name}
              subtitle={`${metrics.templates.topTemplate.count} envois`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="blue"
              isNumeric={false}
            />
          )}
          <MetricCard
            title="Messages échoués"
            value={metrics.messages.failed}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
            subtitle={`${((metrics.messages.failed / metrics.messages.total) * 100 || 0).toFixed(1)}% du total`}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: number;
  isNumeric?: boolean;
  progress?: number; // 0-100
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  isNumeric = true,
  progress,
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      progress: 'bg-blue-500',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      progress: 'bg-green-500',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      progress: 'bg-purple-500',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      progress: 'bg-orange-500',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      progress: 'bg-red-500',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 ${colors.bg} rounded-lg ${colors.text}`}>{icon}</div>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : trend < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {isNumeric && typeof value === 'number' ? formatNumber(value) : value}
        </p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${colors.progress} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Metric Card Skeleton
 */
const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
};

/**
 * Comparison Card - Shows metric comparison between two periods
 */
interface ComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  format?: 'number' | 'percentage' | 'duration';
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  currentValue,
  previousValue,
  icon,
  color,
  format = 'number',
}) => {
  const change = currentValue - previousValue;
  const percentageChange =
    previousValue !== 0 ? ((change / previousValue) * 100).toFixed(1) : '0.0';

  const formatValue = (value: number): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return `${value.toFixed(1)}h`;
      default:
        return formatNumber(value);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <MetricCard
          title={title}
          value={formatValue(currentValue)}
          icon={icon}
          color={color}
          isNumeric={false}
        />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Période précédente</p>
          <p className="text-sm font-semibold text-gray-700">{formatValue(previousValue)}</p>
        </div>

        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${
            change > 0
              ? 'bg-green-100 text-green-700'
              : change < 0
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {change > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : change < 0 ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          <span>{percentageChange}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Alert Card - Shows important metrics that need attention
 */
interface AlertMetricProps {
  title: string;
  value: number;
  threshold: number;
  type: 'warning' | 'error' | 'success';
  message: string;
}

export const AlertMetric: React.FC<AlertMetricProps> = ({
  title,
  value,
  threshold,
  type,
  message,
}) => {
  const typeClasses = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
    },
  };

  const classes = typeClasses[type];

  return (
    <div className={`${classes.bg} border ${classes.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 ${classes.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${classes.text} mb-1`}>{title}</h4>
          <p className={`text-sm ${classes.text} mb-2`}>{message}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className={classes.text}>
              Valeur actuelle: <strong>{value.toFixed(1)}%</strong>
            </span>
            <span className="text-gray-500">
              Seuil: <strong>{threshold}%</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to format numbers
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}
