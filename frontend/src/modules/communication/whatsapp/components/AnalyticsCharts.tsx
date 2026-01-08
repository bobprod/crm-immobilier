import React from 'react';
import { LineChart, BarChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TimeSeriesDataPoint, AnalyticsChartData } from '../hooks/useAnalytics';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AnalyticsChartsProps {
  data: AnalyticsChartData;
  isLoading?: boolean;
}

/**
 * Analytics Charts Component
 * Displays various charts for WhatsApp analytics
 */
export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Messages Chart */}
      <LineChartCard
        title="Messages"
        data={data.messages}
        color="blue"
        icon={<LineChart className="w-5 h-5" />}
      />

      {/* Conversations Chart */}
      <LineChartCard
        title="Conversations"
        data={data.conversations}
        color="green"
        icon={<BarChart className="w-5 h-5" />}
      />

      {/* Response Time Chart */}
      <LineChartCard
        title="Temps de réponse moyen (min)"
        data={data.responseTime}
        color="orange"
        icon={<TrendingUp className="w-5 h-5" />}
        fullWidth
      />
    </div>
  );
};

/**
 * Line Chart Card Component
 */
interface LineChartCardProps {
  title: string;
  data: TimeSeriesDataPoint[];
  color: 'blue' | 'green' | 'orange' | 'purple';
  icon: React.ReactNode;
  fullWidth?: boolean;
}

const LineChartCard: React.FC<LineChartCardProps> = ({
  title,
  data,
  color,
  icon,
  fullWidth = false,
}) => {
  // Calculate stats
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const avg = data.length > 0 ? total / data.length : 0;
  const max = data.length > 0 ? Math.max(...data.map((p) => p.value)) : 0;
  const trend = calculateTrend(data);

  // Color classes
  const colorClasses = {
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      line: 'stroke-blue-500',
      fill: 'fill-blue-100',
    },
    green: {
      border: 'border-green-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
      line: 'stroke-green-500',
      fill: 'fill-green-100',
    },
    orange: {
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      line: 'stroke-orange-500',
      fill: 'fill-orange-100',
    },
    purple: {
      border: 'border-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      line: 'stroke-purple-500',
      fill: 'fill-purple-100',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${fullWidth ? 'lg:col-span-2' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${colors.bg} rounded-lg ${colors.text}`}>{icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">Dernière période</p>
          </div>
        </div>

        {/* Trend indicator */}
        <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : trend < 0 ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-lg font-bold text-gray-900">{formatNumber(total)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Moyenne</p>
          <p className="text-lg font-bold text-gray-900">{formatNumber(avg)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Maximum</p>
          <p className="text-lg font-bold text-gray-900">{formatNumber(max)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <SimpleLineChartCard data={data} color={color} />
      </div>
    </div>
  );
};

/**
 * Simple Line Chart (SVG-based)
 */
interface SimpleLineChartProps {
  data: TimeSeriesDataPoint[];
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const SimpleLineChartCard: React.FC<SimpleLineChartProps> = ({ data, color }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">Aucune donnée disponible</p>
      </div>
    );
  }

  const width = 100;
  const height = 100;
  const padding = 5;

  // Calculate scales
  const maxValue = Math.max(...data.map((p) => p.value));
  const minValue = Math.min(...data.map((p) => p.value));
  const valueRange = maxValue - minValue || 1;

  // Create points
  const points = data.map((point, index) => {
    const x = padding + ((width - 2 * padding) * index) / (data.length - 1 || 1);
    const y = height - padding - ((height - 2 * padding) * (point.value - minValue)) / valueRange;
    return { x, y, value: point.value, date: point.date };
  });

  // Create path
  const pathD = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  // Create area path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  const colorClasses = {
    blue: { line: '#3B82F6', fill: '#DBEAFE' },
    green: { line: '#10B981', fill: '#D1FAE5' },
    orange: { line: '#F97316', fill: '#FFEDD5' },
    purple: { line: '#A855F7', fill: '#F3E8FF' },
  };

  const colors = colorClasses[color];

  return (
    <div className="relative w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Area */}
        <path d={areaD} fill={colors.fill} opacity="0.3" />

        {/* Line */}
        <path d={pathD} stroke={colors.line} strokeWidth="2" fill="none" />

        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="3" fill={colors.line}>
              <title>
                {format(parseISO(point.date), 'PP', { locale: fr })}: {point.value}
              </title>
            </circle>
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.length > 0 && (
          <>
            <span>{format(parseISO(data[0].date), 'dd MMM', { locale: fr })}</span>
            {data.length > 2 && (
              <span>
                {format(parseISO(data[Math.floor(data.length / 2)].date), 'dd MMM', { locale: fr })}
              </span>
            )}
            <span>{format(parseISO(data[data.length - 1].date), 'dd MMM', { locale: fr })}</span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Chart Skeleton Loader
 */
const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-48 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Bar Chart for Conversations by Hour
 */
interface ConversationsByHourChartProps {
  data: { hour: number; count: number }[];
  isLoading?: boolean;
}

export const ConversationsByHourChart: React.FC<ConversationsByHourChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Conversations par heure</h3>

      <div className="space-y-2">
        {data.map((item) => {
          const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

          return (
            <div key={item.hour} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-16">
                {item.hour.toString().padStart(2, '0')}:00
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className="bg-blue-500 h-full flex items-center justify-end pr-3 transition-all"
                  style={{ width: `${percentage}%` }}
                >
                  {item.count > 0 && (
                    <span className="text-xs font-medium text-white">{item.count}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Helper functions
 */

function calculateTrend(data: TimeSeriesDataPoint[]): number {
  if (data.length < 2) return 0;

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

  if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;

  return ((secondAvg - firstAvg) / firstAvg) * 100;
}

function getTrendColor(trend: number): string {
  if (trend > 0) return 'text-green-600';
  if (trend < 0) return 'text-red-600';
  return 'text-gray-600';
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}
