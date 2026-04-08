import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Building2,
  FileSpreadsheet,
  Download,
  Zap,
  Eye
} from 'lucide-react';

interface DetectedSource {
  source: 'bricks' | 'homunity' | 'seloger' | 'leboncoin' | 'unknown';
  confidence: number;
  detectedFields: string[];
  suggestedMapping?: Record<string, string>;
}

interface ImportedRow {
  id: string;
  rawData: Record<string, any>;
  detectedSource: DetectedSource;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  mappedData?: Record<string, any>;
}

export default function AutoImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [sourceStats, setSourceStats] = useState<Record<string, number>>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setAnalyzing(true);

    // Simulate file analysis with auto-detection
    setTimeout(() => {
      const mockRows: ImportedRow[] = [
        {
          id: '1',
          rawData: {
            'Deal ID': 'BRK-2024-001',
            'Property Address': '15 rue de la République, Paris',
            'Investment Amount': '€250,000',
            'Expected ROI': '8.5%',
            'Platform': 'Bricks'
          },
          detectedSource: {
            source: 'bricks',
            confidence: 98,
            detectedFields: ['Deal ID', 'Investment Amount', 'Expected ROI'],
            suggestedMapping: {
              'Deal ID': 'externalId',
              'Property Address': 'address',
              'Investment Amount': 'investmentAmount',
              'Expected ROI': 'expectedReturn'
            }
          },
          status: 'pending'
        },
        {
          id: '2',
          rawData: {
            'Project ID': 'HOM-2024-034',
            'Location': 'Lyon 6ème',
            'Ticket': '5000€',
            'Rendement': '7.2%',
            'Source': 'Homunity'
          },
          detectedSource: {
            source: 'homunity',
            confidence: 95,
            detectedFields: ['Project ID', 'Ticket', 'Rendement'],
            suggestedMapping: {
              'Project ID': 'externalId',
              'Location': 'address',
              'Ticket': 'investmentAmount',
              'Rendement': 'expectedReturn'
            }
          },
          status: 'pending'
        },
        {
          id: '3',
          rawData: {
            'Annonce': 'Appartement T3',
            'Ville': 'Marseille',
            'Prix': '180000',
            'Surface': '65m²'
          },
          detectedSource: {
            source: 'seloger',
            confidence: 87,
            detectedFields: ['Annonce', 'Prix', 'Surface'],
            suggestedMapping: {
              'Annonce': 'title',
              'Ville': 'city',
              'Prix': 'price',
              'Surface': 'surface'
            }
          },
          status: 'pending'
        },
        {
          id: '4',
          rawData: {
            'Title': 'Maison individuelle',
            'Price': '€320,000',
            'Unknown Field': 'Data'
          },
          detectedSource: {
            source: 'unknown',
            confidence: 45,
            detectedFields: ['Title', 'Price'],
          },
          status: 'pending'
        }
      ];

      setRows(mockRows);

      // Calculate source stats
      const stats: Record<string, number> = {};
      mockRows.forEach(row => {
        const source = row.detectedSource.source;
        stats[source] = (stats[source] || 0) + 1;
      });
      setSourceStats(stats);

      setAnalyzing(false);
    }, 2000);
  };

  const handleImport = async () => {
    setImporting(true);

    // Simulate import process
    for (let i = 0; i < rows.length; i++) {
      setRows(prev =>
        prev.map((row, idx) =>
          idx === i ? { ...row, status: 'processing' } : row
        )
      );

      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate success/failure based on confidence
      const success = rows[i].detectedSource.confidence > 70;
      setRows(prev =>
        prev.map((row, idx) =>
          idx === i
            ? {
                ...row,
                status: success ? 'success' : 'error',
                errorMessage: success ? undefined : 'Confidence trop faible - mapping manuel requis',
                mappedData: success ? row.detectedSource.suggestedMapping : undefined
              }
            : row
        )
      );
    }

    setImporting(false);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'bricks':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'homunity':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      case 'seloger':
        return <Building2 className="w-5 h-5 text-green-600" />;
      case 'leboncoin':
        return <Building2 className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'bricks':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'homunity':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'seloger':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'leboncoin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalRows = rows.length;
  const successRows = rows.filter(r => r.status === 'success').length;
  const errorRows = rows.filter(r => r.status === 'error').length;
  const pendingRows = rows.filter(r => r.status === 'pending').length;

  return (
    <MainLayout>
      <Head>
        <title>Auto-Import Investment Intelligence - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Import Automatique avec Détection Intelligente
          </h1>
          <p className="text-gray-600 mt-1">
            Importez des données de n'importe quelle source - le système détecte automatiquement le format
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 mb-6">
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-16 h-16 text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Uploader un fichier CSV ou Excel
            </h2>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
              Le système détectera automatiquement la source (Bricks, Homunity, SeLoger, etc.)
              et mappera les champs intelligemment
            </p>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={analyzing || importing}
            />
            <label
              htmlFor="file-upload"
              className={`px-6 py-3 bg-purple-600 text-white rounded-lg font-medium cursor-pointer hover:bg-purple-700 transition-colors flex items-center gap-2 ${
                analyzing || importing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              {file ? 'Changer de fichier' : 'Choisir un fichier'}
            </label>

            {file && (
              <p className="text-sm text-gray-600 mt-3">
                Fichier sélectionné: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Analyzing Indicator */}
        {analyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8">
                <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Analyse intelligente en cours...
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Détection automatique de la source et des champs
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Source Statistics */}
        {rows.length > 0 && !analyzing && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Lignes</p>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalRows}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Importés</p>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{successRows}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Erreurs</p>
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{errorRows}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingRows}</p>
            </div>
          </div>
        )}

        {/* Source Breakdown */}
        {Object.keys(sourceStats).length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sources Détectées
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(sourceStats).map(([source, count]) => (
                <div
                  key={source}
                  className={`p-4 rounded-lg border ${getSourceColor(source)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getSourceIcon(source)}
                    <span className="font-semibold capitalize">{source}</span>
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs mt-1">lignes détectées</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Button */}
        {rows.length > 0 && !importing && pendingRows > 0 && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleImport}
              className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors flex items-center gap-3 shadow-lg"
            >
              <Download className="w-6 h-6" />
              Importer {pendingRows} lignes
            </button>
          </div>
        )}

        {/* Rows Table */}
        {rows.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Aperçu et Statut d'Import
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Source Détectée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Confiance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Données
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {row.status === 'pending' && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded border border-yellow-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            En attente
                          </span>
                        )}
                        {row.status === 'processing' && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded border border-blue-200 flex items-center gap-1 w-fit">
                            <Zap className="w-3 h-3 animate-pulse" />
                            Import...
                          </span>
                        )}
                        {row.status === 'success' && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded border border-green-200 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Importé
                          </span>
                        )}
                        {row.status === 'error' && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded border border-red-200 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Erreur
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(row.detectedSource.source)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getSourceColor(
                              row.detectedSource.source
                            )}`}
                          >
                            {row.detectedSource.source}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                row.detectedSource.confidence > 80
                                  ? 'bg-green-500'
                                  : row.detectedSource.confidence > 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${row.detectedSource.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {row.detectedSource.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          {Object.entries(row.rawData)
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}...
                              </div>
                            ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
