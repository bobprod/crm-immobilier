import React, { useMemo } from 'react';

interface AnalyticsData {
  campaigns: {
    total: number;
    active: number;
    completed: number;
  };
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    rejected: number;
    bySource: { source: string; count: number; rate: number }[];
    byType: { type: string; count: number }[];
  };
  conversion: {
    rate: number;
    avgDays: number;
    byStage: { stage: string; count: number; rate: number }[];
  };
  performance: {
    lastWeek: number[];
    lastMonth: number[];
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
  };
}

interface ProspectingAnalyticsProps {
  data: AnalyticsData;
}

export const ProspectingAnalytics: React.FC<ProspectingAnalyticsProps> = ({ data }) => {
  // Couleurs pour les graphiques
  const colors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
  };

  // Calculer le pourcentage pour le funnel
  const funnelStages = useMemo(() => {
    const total = data.leads.total || 1;
    return [
      { name: 'Nouveaux', count: data.leads.new, percent: (data.leads.new / total) * 100, color: colors.primary },
      { name: 'Contactes', count: data.leads.contacted, percent: (data.leads.contacted / total) * 100, color: colors.cyan },
      { name: 'Qualifies', count: data.leads.qualified, percent: (data.leads.qualified / total) * 100, color: colors.warning },
      { name: 'Convertis', count: data.leads.converted, percent: (data.leads.converted / total) * 100, color: colors.success },
    ];
  }, [data.leads]);

  // Mini bar chart pour la performance hebdomadaire
  const maxWeekValue = Math.max(...data.performance.lastWeek, 1);

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Leads</p>
              <p className="text-3xl font-bold">{data.leads.total}</p>
            </div>
            <div className="text-4xl opacity-50">👥</div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className={`px-2 py-0.5 rounded ${
              data.performance.trend === 'up' ? 'bg-green-400/30' :
              data.performance.trend === 'down' ? 'bg-red-400/30' : 'bg-gray-400/30'
            }`}>
              {data.performance.trend === 'up' ? '↑' : data.performance.trend === 'down' ? '↓' : '→'}
              {data.performance.trendPercent}%
            </span>
            <span className="ml-2 text-blue-100">vs semaine derniere</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Taux Conversion</p>
              <p className="text-3xl font-bold">{data.conversion.rate.toFixed(1)}%</p>
            </div>
            <div className="text-4xl opacity-50">📈</div>
          </div>
          <div className="mt-2 text-sm text-green-100">
            {data.leads.converted} convertis sur {data.leads.total}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Campagnes Actives</p>
              <p className="text-3xl font-bold">{data.campaigns.active}</p>
            </div>
            <div className="text-4xl opacity-50">🎯</div>
          </div>
          <div className="mt-2 text-sm text-purple-100">
            {data.campaigns.completed} terminees
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Temps Moyen</p>
              <p className="text-3xl font-bold">{data.conversion.avgDays}j</p>
            </div>
            <div className="text-4xl opacity-50">⏱️</div>
          </div>
          <div className="mt-2 text-sm text-orange-100">
            Pour convertir un lead
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel de conversion */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Entonnoir de Conversion</h3>
          <div className="space-y-3">
            {funnelStages.map((stage, index) => (
              <div key={stage.name} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                  <span className="text-sm text-gray-500">
                    {stage.count} ({stage.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${Math.max(stage.percent, 5)}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                  {index < funnelStages.length - 1 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      ↓ {funnelStages[index + 1].count > 0
                        ? ((funnelStages[index + 1].count / Math.max(stage.count, 1)) * 100).toFixed(0)
                        : 0}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance hebdomadaire */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads par Jour (7 derniers jours)</h3>
          <div className="flex items-end justify-between h-40 gap-2">
            {data.performance.lastWeek.map((value, index) => {
              const height = (value / maxWeekValue) * 100;
              const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">{value}</div>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{days[index]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sources de leads */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance par Source</h3>
          <div className="space-y-4">
            {data.leads.bySource.map((source, index) => {
              const sourceColors = [colors.primary, colors.purple, colors.cyan, colors.success, colors.warning];
              return (
                <div key={source.source} className="flex items-center gap-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sourceColors[index % sourceColors.length] }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{source.source}</span>
                      <span className="text-sm text-gray-500">{source.count} leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${source.rate}%`,
                            backgroundColor: sourceColors[index % sourceColors.length],
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {source.rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Repartition par type */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Repartition par Type</h3>
          <div className="flex items-center justify-center gap-8">
            {data.leads.byType.map((type, index) => {
              const total = data.leads.byType.reduce((sum, t) => sum + t.count, 0) || 1;
              const percent = (type.count / total) * 100;
              const color = index === 0 ? colors.primary : colors.warning;

              return (
                <div key={type.type} className="text-center">
                  <div className="relative w-32 h-32">
                    {/* Circle background */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke={color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${percent * 3.52} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{type.count}</span>
                      <span className="text-xs text-gray-500">{percent.toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    {type.type === 'requete' ? 'Requetes' : 'Mandats'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {type.type === 'requete' ? 'Cherchent un bien' : 'Proposent un bien'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tableau des conversions par etape */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Analyse des Conversions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etape</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.conversion.byStage.map((stage, index) => (
                <tr key={stage.stage} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-cyan-500' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{stage.stage}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{stage.count}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stage.rate >= 50 ? 'bg-green-100 text-green-700' :
                      stage.rate >= 30 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {stage.rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-cyan-500' :
                          index === 2 ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${stage.rate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProspectingAnalytics;
