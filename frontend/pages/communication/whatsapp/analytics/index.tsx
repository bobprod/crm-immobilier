import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Calendar, FileText, TrendingUp } from 'lucide-react';
import { useAnalytics, formatPeriod } from '../../../../src/modules/communication/whatsapp/hooks/useAnalytics';
import { PerformanceMetrics, AlertMetric } from '../../../../src/modules/communication/whatsapp/components/PerformanceMetrics';
import { AnalyticsCharts, ConversationsByHourChart } from '../../../../src/modules/communication/whatsapp/components/AnalyticsCharts';
import { QuickExport } from '../../../../src/modules/communication/whatsapp/components/ReportGenerator';
import { TemplatePerformance } from '../../../../src/modules/communication/whatsapp/hooks/useAnalytics';

/**
 * WhatsApp Analytics Dashboard Page
 * Main analytics and reporting dashboard
 */
export default function AnalyticsPage() {
  const {
    metrics,
    chartData,
    templatePerformance,
    conversationsByHour,
    period,
    setPredefinedPeriod,
    isLoading,
    isLoadingMetrics,
    isLoadingCharts,
    isLoadingTemplates,
    isLoadingConversations,
    refresh,
  } = useAnalytics();

  const [selectedPeriod, setSelectedPeriod] = useState<
    '7days' | '30days' | '90days' | 'today'
  >('7days');

  const [showReportGenerator, setShowReportGenerator] = useState(false);

  // Handle period change
  const handlePeriodChange = (newPeriod: '7days' | '30days' | '90days' | 'today') => {
    setSelectedPeriod(newPeriod);
    setPredefinedPeriod(newPeriod);
  };

  // Check for alerts
  const getAlerts = () => {
    const alerts: React.ReactNode[] = [];

    if (metrics) {
      // Low delivery rate
      const deliveryRate = (metrics.messages.delivered / metrics.messages.sent) * 100 || 0;
      if (deliveryRate < 90) {
        alerts.push(
          <AlertMetric
            key="delivery"
            title="Taux de délivrance faible"
            value={deliveryRate}
            threshold={90}
            type="warning"
            message="Le taux de délivrance est inférieur à 90%. Vérifiez la qualité de vos numéros de téléphone."
          />
        );
      }

      // Low response rate
      if (metrics.engagement.responseRate < 60) {
        alerts.push(
          <AlertMetric
            key="response"
            title="Taux de réponse faible"
            value={metrics.engagement.responseRate}
            threshold={60}
            type="warning"
            message="Vos clients répondent peu à vos messages. Essayez de rendre vos messages plus engageants."
          />
        );
      }

      // High failed rate
      const failedRate = (metrics.messages.failed / metrics.messages.total) * 100 || 0;
      if (failedRate > 5) {
        alerts.push(
          <AlertMetric
            key="failed"
            title="Taux d'échec élevé"
            value={failedRate}
            threshold={5}
            type="error"
            message="Un nombre important de messages échouent. Vérifiez votre configuration WhatsApp."
          />
        );
      }

      // Good performance
      if (metrics.engagement.readRate > 80 && alerts.length === 0) {
        alerts.push(
          <AlertMetric
            key="success"
            title="Excellente performance"
            value={metrics.engagement.readRate}
            threshold={80}
            type="success"
            message="Vos messages ont un excellent taux de lecture. Continuez ainsi !"
          />
        );
      }
    }

    return alerts;
  };

  const alerts = getAlerts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Analytics WhatsApp - CRM Immobilier</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/communication/whatsapp"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics WhatsApp</h1>
              <p className="text-gray-600 mt-1">
                Tableau de bord des performances
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Display */}
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {formatPeriod(period)}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export Buttons */}
            <QuickExport period={period} />

            {/* Report Generator */}
            <Link
              href="/communication/whatsapp/analytics/reports"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Rapports
            </Link>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-1 flex gap-1 overflow-x-auto">
          <button
            onClick={() => handlePeriodChange('today')}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              selectedPeriod === 'today'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => handlePeriodChange('7days')}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              selectedPeriod === '7days'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => handlePeriodChange('30days')}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              selectedPeriod === '30days'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => handlePeriodChange('90days')}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              selectedPeriod === '90days'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            90 jours
          </button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts}
          </div>
        )}

        {/* Performance Metrics */}
        <div className="mb-8">
          {metrics ? (
            <PerformanceMetrics metrics={metrics} isLoading={isLoadingMetrics} />
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des métriques...</p>
            </div>
          )}
        </div>

        {/* Charts */}
        {chartData && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Évolution dans le temps
            </h2>
            <AnalyticsCharts data={chartData} isLoading={isLoadingCharts} />
          </div>
        )}

        {/* Conversations by Hour */}
        {conversationsByHour && conversationsByHour.length > 0 && (
          <div className="mb-8">
            <ConversationsByHourChart
              data={conversationsByHour}
              isLoading={isLoadingConversations}
            />
          </div>
        )}

        {/* Template Performance */}
        {templatePerformance && templatePerformance.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Performance des templates
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Envoyés
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Délivrés
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lus
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taux de succès
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taux de lecture
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {templatePerformance.map((template) => (
                      <tr key={template.templateId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{template.templateName}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {template.sent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {template.delivered.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {template.read.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              template.successRate >= 90
                                ? 'bg-green-100 text-green-800'
                                : template.successRate >= 70
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {template.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              template.readRate >= 70
                                ? 'bg-blue-100 text-blue-800'
                                : template.readRate >= 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {template.readRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !metrics && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée disponible
            </h3>
            <p className="text-gray-600 mb-6">
              Les données d'analytics apparaîtront une fois que vous aurez commencé à utiliser WhatsApp
            </p>
            <Link
              href="/communication/whatsapp"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retour au dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
