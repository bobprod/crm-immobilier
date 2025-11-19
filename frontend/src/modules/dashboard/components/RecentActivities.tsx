import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Clock, User, Building2, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  type: 'prospect' | 'property' | 'appointment' | 'user';
  action: string;
  details: string;
  timestamp: string;
  user?: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'prospect':
        return User;
      case 'property':
        return Building2;
      case 'appointment':
        return Calendar;
      case 'user':
        return User;
      default:
        return Clock;
    }
  };

  const getColor = (type: Activity['type']) => {
    switch (type) {
      case 'prospect':
        return 'text-blue-600 bg-blue-100';
      case 'property':
        return 'text-green-600 bg-green-100';
      case 'appointment':
        return 'text-purple-600 bg-purple-100';
      case 'user':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activités récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.type);
              const colorClasses = getColor(activity.type);

              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${colorClasses}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.details}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-gray-500 mt-1">
                        Par {activity.user}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
