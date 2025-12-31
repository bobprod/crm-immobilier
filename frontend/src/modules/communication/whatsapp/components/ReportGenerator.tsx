import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, X, FileSpreadsheet, FilePdf } from 'lucide-react';
import { useAnalytics, formatPeriod, AnalyticsPeriod } from '../hooks/useAnalytics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportGeneratorProps {
  onClose?: () => void;
}

/**
 * Report Generator Component
 * Generate and export WhatsApp analytics reports
 */
export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onClose }) => {
  const {
    period,
    changePeriod,
    setPredefinedPeriod,
    generateReport,
    exportPDF,
    exportCSV,
    exportExcel,
    downloadFile,
    isGenerating,
    isExporting,
  } = useAnalytics();

  const [customPeriod, setCustomPeriod] = useState<{
    start: string;
    end: string;
  }>({
    start: format(period.start, 'yyyy-MM-dd'),
    end: format(period.end, 'yyyy-MM-dd'),
  });

  const [selectedPeriodType, setSelectedPeriodType] = useState<
    '7days' | '30days' | '90days' | 'today' | 'custom'
  >('7days');

  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTemplates, setIncludeTemplates] = useState(true);
  const [includeConversations, setIncludeConversations] = useState(true);

  // Handle predefined period change
  const handlePeriodChange = (type: '7days' | '30days' | '90days' | 'today') => {
    setSelectedPeriodType(type);
    setPredefinedPeriod(type);
  };

  // Handle custom period change
  const handleCustomPeriodChange = () => {
    setSelectedPeriodType('custom');
    const newPeriod: AnalyticsPeriod = {
      start: new Date(customPeriod.start),
      end: new Date(customPeriod.end),
      label: 'Période personnalisée',
    };
    changePeriod(newPeriod);
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      const blob = await exportPDF();
      const filename = `whatsapp-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      downloadFile(blob, filename);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'export PDF');
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      const blob = await exportCSV();
      const filename = `whatsapp-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadFile(blob, filename);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'export CSV');
    }
  };

  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      const blob = await exportExcel();
      const filename = `whatsapp-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      downloadFile(blob, filename);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Générateur de rapports</h2>
            <p className="text-sm text-gray-600">Créez et exportez vos rapports d'analytics</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Period Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Calendar className="w-4 h-4 inline mr-2" />
          Période du rapport
        </label>

        {/* Predefined Periods */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => handlePeriodChange('today')}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              selectedPeriodType === 'today'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => handlePeriodChange('7days')}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              selectedPeriodType === '7days'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => handlePeriodChange('30days')}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              selectedPeriodType === '30days'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => handlePeriodChange('90days')}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              selectedPeriodType === '90days'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            90 jours
          </button>
        </div>

        {/* Custom Period */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Période personnalisée</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date de début</label>
              <input
                type="date"
                value={customPeriod.start}
                onChange={(e) => setCustomPeriod({ ...customPeriod, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date de fin</label>
              <input
                type="date"
                value={customPeriod.end}
                onChange={(e) => setCustomPeriod({ ...customPeriod, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleCustomPeriodChange}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            Appliquer la période
          </button>
        </div>

        {/* Current Period Display */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Période sélectionnée:</strong> {formatPeriod(period)}
          </p>
        </div>
      </div>

      {/* Report Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Contenu du rapport
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Graphiques</div>
              <div className="text-xs text-gray-500">
                Inclure les graphiques de messages, conversations et temps de réponse
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTemplates}
              onChange={(e) => setIncludeTemplates(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Performance des templates</div>
              <div className="text-xs text-gray-500">
                Statistiques détaillées de chaque template utilisé
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={includeConversations}
              onChange={(e) => setIncludeConversations(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Détails des conversations</div>
              <div className="text-xs text-gray-500">
                Distribution par heure et statistiques des conversations
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Format d'export</h3>

        {/* PDF Export */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting || isGenerating}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <FilePdf className="w-5 h-5" />
              Exporter en PDF
            </>
          )}
        </button>

        {/* Excel Export */}
        <button
          onClick={handleExportExcel}
          disabled={isExporting || isGenerating}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5" />
              Exporter en Excel
            </>
          )}
        </button>

        {/* CSV Export */}
        <button
          onClick={handleExportCSV}
          disabled={isExporting || isGenerating}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Exporter en CSV
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Astuce:</strong> Les rapports PDF incluent des graphiques et sont parfaits pour
          les présentations. Les exports Excel/CSV sont idéaux pour l'analyse de données.
        </p>
      </div>
    </div>
  );
};

/**
 * Quick Export Buttons - Compact version for dashboards
 */
interface QuickExportProps {
  period?: AnalyticsPeriod;
}

export const QuickExport: React.FC<QuickExportProps> = ({ period }) => {
  const { exportPDF, exportCSV, exportExcel, downloadFile, isExporting } = useAnalytics();

  const handleExport = async (type: 'pdf' | 'csv' | 'excel') => {
    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'pdf':
          blob = await exportPDF();
          filename = `whatsapp-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          break;
        case 'csv':
          blob = await exportCSV();
          filename = `whatsapp-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
        case 'excel':
          blob = await exportExcel();
          filename = `whatsapp-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
          break;
      }

      downloadFile(blob, filename);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'export');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
        title="Exporter en PDF"
      >
        <FilePdf className="w-4 h-4 text-red-600" />
        PDF
      </button>

      <button
        onClick={() => handleExport('excel')}
        disabled={isExporting}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
        title="Exporter en Excel"
      >
        <FileSpreadsheet className="w-4 h-4 text-green-600" />
        Excel
      </button>

      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
        title="Exporter en CSV"
      >
        <Download className="w-4 h-4 text-blue-600" />
        CSV
      </button>
    </div>
  );
};
