import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/router';
import type { DashboardAlerts } from '../types/dashboard.types';

interface AlertsWidgetProps {
  alerts: DashboardAlerts;
}

export function AlertsWidget({ alerts: alertsData }: AlertsWidgetProps) {
  const router = useRouter();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (alertsData.alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Aucune alerte pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alertes</CardTitle>
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {alertsData.alerts.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alertsData.alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-start p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getAlertColor(alert.type)}`}
              onClick={() => router.push(alert.action)}
            >
              <div className="flex-shrink-0 mr-3">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
