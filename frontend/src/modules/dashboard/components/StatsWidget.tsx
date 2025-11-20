import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';

interface StatsWidgetProps {
  stats: {
    totalProperties: number;
    totalProspects: number;
    totalAppointments: number;
    conversionRate: number;
  };
}

export function StatsWidget({ stats }: StatsWidgetProps) {
  const statItems = [
    {
      title: 'Propriétés',
      value: stats.totalProperties,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Prospects',
      value: stats.totalProspects,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Rendez-vous',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Taux de conversion',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
