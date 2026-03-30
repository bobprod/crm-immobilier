import { Card, CardContent } from '../../../shared/components/ui/card';
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
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Propriétés Disponibles',
      value: stats.availableProperties,
      icon: Building2,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: "RDV Aujourd'hui",
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Matchs Totaux',
      value: stats.totalMatches,
      icon: Target,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      title: 'Campagnes Actives',
      value: stats.activeCampaigns,
      icon: Megaphone,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Tâches en Cours',
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Communications',
      value: stats.totalCommunications,
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Taux de Conversion',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title} className="group overflow-hidden border-none shadow-ambient hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${item.bgColor} transition-transform group-hover:scale-110 duration-300`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 group-hover:text-primary transition-colors">
                En direct
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
                {item.title}
              </p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {item.value}
                </h4>
                {/* Visual placeholder for trend */}
                <div className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  +12%
                </div>
              </div>
            </div>
          </CardContent>
          <div className={`h-1.5 w-full ${item.bgColor} absolute bottom-0 left-0 overflow-hidden`}>
             <div className={`h-full ${item.color.replace('text-', 'bg-')} opacity-40 w-1/3 rounded-full animate-pulse`}></div>
          </div>
        </Card>
      ))}
    </div>
  );
}
