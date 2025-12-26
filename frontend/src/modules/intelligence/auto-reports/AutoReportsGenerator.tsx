import React, { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, Home, Calendar as CalendarIcon } from 'lucide-react';
import { autoReportsApi, ReportData } from '@/shared/utils/quick-wins-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

export function AutoReportsGenerator() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await autoReportsApi.generateReport({
        reportType,
        format: 'json',
      });
      setReport(data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Erreur lors de la génération du rapport');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rapports Automatiques</h2>
          <p className="text-gray-600 text-sm">Générez des rapports d'activité avec insights IA</p>
        </div>
      </div>

      {/* Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer un rapport
          </CardTitle>
          <CardDescription>Sélectionnez une période et générez un rapport détaillé</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type de rapport</label>
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Journalier (Aujourd'hui)</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire (Cette semaine)</SelectItem>
                  <SelectItem value="monthly">Mensuel (Ce mois)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Report Display */}
      {report && (
        <div className="space-y-6">
          {/* Period */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Période
                </CardTitle>
                <Badge variant="outline">{report.period.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Du {formatDate(report.period.startDate)} au {formatDate(report.period.endDate)}
              </p>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Prospects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.newProspects}</div>
                <p className="text-xs text-gray-600">Nouveaux prospects</p>
                <p className="text-xs text-green-600 mt-1">
                  {report.summary.qualifiedProspects} qualifiés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Home className="h-4 w-4 text-green-600" />
                  Propriétés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.newProperties}</div>
                <p className="text-xs text-gray-600">Nouvelles propriétés</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {report.summary.totalProperties}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-purple-600" />
                  Rendez-vous
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.completedAppointments}</div>
                <p className="text-xs text-gray-600">Rendez-vous complétés</p>
                <p className="text-xs text-gray-500 mt-1">
                  Sur {report.summary.totalAppointments} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  Taux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.summary.newProspects > 0
                    ? Math.round((report.summary.qualifiedProspects / report.summary.newProspects) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-600">Qualification</p>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          {report.insights && report.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Insights
                </CardTitle>
                <CardDescription>Analyses automatiques de votre activité</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💡 Recommandations
                </CardTitle>
                <CardDescription>Actions suggérées pour améliorer vos performances</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-yellow-600 font-bold shrink-0">{index + 1}.</span>
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
