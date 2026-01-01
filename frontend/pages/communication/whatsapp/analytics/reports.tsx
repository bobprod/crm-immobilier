import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, FileText, TrendingUp } from 'lucide-react';
import { ReportGenerator } from '../../../../src/modules/communication/whatsapp/components/ReportGenerator';

/**
 * WhatsApp Reports Page
 * Dedicated page for generating and exporting reports
 */
export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Rapports WhatsApp - CRM Immobilier</title>
      </Head>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/communication/whatsapp/analytics"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapports WhatsApp</h1>
            <p className="text-gray-600 mt-1">
              Générez et exportez vos rapports d'analytics personnalisés
            </p>
          </div>
        </div>

        {/* Report Generator */}
        <ReportGenerator />

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Guide des rapports
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PDF Reports */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                Rapports PDF
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Format professionnel avec graphiques</li>
                <li>• Idéal pour les présentations</li>
                <li>• Inclut logo et mise en page</li>
                <li>• Partage facile par email</li>
              </ul>
            </div>

            {/* Excel Reports */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Rapports Excel
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Données structurées en tableaux</li>
                <li>• Analyse approfondie possible</li>
                <li>• Formules et graphiques Excel</li>
                <li>• Compatible avec tous les outils</li>
              </ul>
            </div>

            {/* CSV Reports */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Rapports CSV
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Format simple et universel</li>
                <li>• Import dans n'importe quel outil</li>
                <li>• Fichier léger et rapide</li>
                <li>• Parfait pour les intégrations</li>
              </ul>
            </div>

            {/* Best Practices */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Bonnes pratiques</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Exportez régulièrement (hebdomadaire)</li>
                <li>• Comparez les périodes</li>
                <li>• Archivez vos rapports</li>
                <li>• Partagez avec votre équipe</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Reports (Mock) */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rapports récents</h3>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {/* Mock recent reports */}
            {[
              {
                name: 'Rapport WhatsApp - 30 derniers jours',
                date: '2024-01-15',
                format: 'PDF',
                size: '2.4 MB',
              },
              {
                name: 'Export données templates',
                date: '2024-01-10',
                format: 'Excel',
                size: '856 KB',
              },
              {
                name: 'Analyse conversations',
                date: '2024-01-05',
                format: 'CSV',
                size: '124 KB',
              },
            ].map((report, index) => (
              <div
                key={index}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-gray-500">{report.format}</span>
                    <p className="text-xs text-gray-400">{report.size}</p>
                  </div>
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Télécharger
                  </button>
                </div>
              </div>
            ))}

            {/* Empty state message */}
            <div className="p-6 text-center text-gray-500 text-sm">
              <p>Les rapports générés seront enregistrés et disponibles ici</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium text-gray-900 mb-1">Comparez les périodes</h4>
            <p className="text-sm text-gray-600">
              Analysez l'évolution de vos performances en comparant différentes périodes
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium text-gray-900 mb-1">Fixez des objectifs</h4>
            <p className="text-sm text-gray-600">
              Utilisez les données pour définir des KPIs et suivre vos objectifs
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-medium text-gray-900 mb-1">Optimisez</h4>
            <p className="text-sm text-gray-600">
              Identifiez les templates et horaires les plus performants
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
