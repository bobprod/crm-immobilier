import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  Target,
  Megaphone,
  CheckSquare,
  MessageSquare,
  Award,
} from 'lucide-react';
import type { DashboardStats } from '../types/dashboard.types';

interface StatsWidgetProps {
  stats: DashboardStats;
}

export function StatsWidget({ stats }: StatsWidgetProps) {
  const statItems = [
    {
      title: 'Prospects Actifs',
      value: stats.activeProspects,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Propriétés Disponibles',
      value: stats.availableProperties,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: "RDV Aujourd'hui",
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Matchs Totaux',
      value: stats.totalMatches,
      icon: Target,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Campagnes Actives',
      value: stats.activeCampaigns,
      icon: Megaphone,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Tâches en Cours',
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Communications',
      value: stats.totalCommunications,
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Taux de Conversion',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Taux de Match',
      value: `${stats.matchSuccessRate}%`,
      icon: Award,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
