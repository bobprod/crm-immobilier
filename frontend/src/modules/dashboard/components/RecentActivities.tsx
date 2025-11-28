import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { User, Building2, Calendar, MessageSquare } from 'lucide-react';
import type { RecentActivities as RecentActivitiesType } from '../types/dashboard.types';

interface RecentActivitiesProps {
  activities: RecentActivitiesType;
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      available: 'bg-green-100 text-green-800',
      sold: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Combine all activities into one list for simplicity
  const allActivities = [
    ...(activities.recentProspects || []).map(p => ({
      id: p.id,
      type: 'prospect' as const,
      title: `${p.firstName} ${p.lastName}`,
      date: p.createdAt,
      status: p.status,
      icon: User,
      color: 'text-green-600'
    })),
    ...(activities.recentProperties || []).map(p => ({
      id: p.id,
      type: 'property' as const,
      title: p.title,
      date: p.createdAt,
      status: p.status,
      icon: Building2,
      color: 'text-blue-600',
      extra: `${p.price.toLocaleString()} €`
    })),
    ...(activities.recentAppointments || []).map(a => ({
      id: a.id,
      type: 'appointment' as const,
      title: a.title,
      date: a.startTime,
      status: a.status,
      icon: Calendar,
      color: 'text-purple-600'
    })),
    ...(activities.recentCommunications || []).map(c => ({
      id: c.id,
      type: 'communication' as const,
      title: c.subject || c.type,
      date: c.sentAt,
      status: c.status,
      icon: MessageSquare,
      color: 'text-indigo-600',
      extra: c.to
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activités récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allActivities.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucune activité récente</p>
          ) : (
            allActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${activity.color}`} />
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.date)}
                        {'extra' in activity && activity.extra && ` • ${activity.extra}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
