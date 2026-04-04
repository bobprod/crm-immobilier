import React from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Star,
  Bot,
  LayoutList,
  ClipboardCheck,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { MainLayout } from '@/shared/components/layout';
import { useProspecting } from '@/shared/hooks/useProspecting';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Dashboard Principal - Nouvelle Architecture
 *
 * Page d'accueil principale du CRM utilisant la nouvelle Sidebar navigation.
 * Remplace l'ancien système de tabs horizontaux par une navigation hiérarchique.
 */

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'navy' | 'emerald' | 'sky' | 'amber';
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const styles = {
    navy: {
      bg: 'bg-[hsl(222,65%,28%)]',
      icon: 'text-white/80',
      iconBg: 'bg-white/15',
    },
    emerald: {
      bg: 'bg-emerald-700',
      icon: 'text-white/80',
      iconBg: 'bg-white/15',
    },
    sky: {
      bg: 'bg-sky-700',
      icon: 'text-white/80',
      iconBg: 'bg-white/15',
    },
    amber: {
      bg: 'bg-amber-600',
      icon: 'text-white/80',
      iconBg: 'bg-white/15',
    },
  };

  const s = styles[color];

  return (
    <div className={`${s.bg} rounded-xl p-5 text-white shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/70 mb-1">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && <p className="text-xs text-white/60 mt-1">{trend}</p>}
        </div>
        <div className={`${s.iconBg} p-2.5 rounded-lg`}>
          <Icon className={`w-5 h-5 ${s.icon}`} />
        </div>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { globalStats, loading } = useProspecting();

  return (
    <ProtectedRoute>
      <MainLayout
        title="Tableau de Bord"
        breadcrumbs={[{ label: 'Dashboard' }]}
      >
        <div className="space-y-7">
          {/* Welcome Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[hsl(222,65%,22%)] to-[hsl(222,65%,32%)] rounded-xl p-7 text-white shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">Bienvenue</p>
                  <h2 className="text-xl font-bold leading-tight">CRM Immobilier Professionnel</h2>
                </div>
              </div>
              <p className="text-white/70 text-sm max-w-lg">
                Gérez vos leads, prospections et campagnes depuis une interface élégante et performante.
              </p>
            </div>
            {/* Decorative background element */}
            <div className="absolute right-0 top-0 w-48 h-full opacity-10 pointer-events-none">
              <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute top-8 right-8 w-20 h-20 border border-white rounded-full" />
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(222,65%,28%)]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Leads"
                value={globalStats?.total || 0}
                icon={Users}
                color="navy"
              />
              <StatCard
                title="Leads Convertis"
                value={globalStats?.converted || 0}
                icon={UserCheck}
                color="emerald"
              />
              <StatCard
                title="Taux de Conversion"
                value={`${(globalStats?.conversionRate || 0).toFixed(1)}%`}
                icon={TrendingUp}
                color="sky"
              />
              <StatCard
                title="Score Moyen"
                value={`${(globalStats?.avgScore || 0).toFixed(0)}%`}
                icon={Star}
                color="amber"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Accès Rapide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Prospection Card */}
              <a
                href="/prospection/new"
                className="group flex items-center gap-5 p-5 bg-[hsl(222,65%,28%)] text-white rounded-xl shadow-md hover:shadow-lg hover:bg-[hsl(222,65%,24%)] transition-all"
              >
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 transition-colors">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">Prospection IA</h3>
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-xs font-semibold">
                      RECOMMANDÉ
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Trouvez des leads qualifiés avec l'intelligence artificielle.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>

              {/* Campaigns Card */}
              <a
                href="/prospection/campaigns"
                className="group flex items-center gap-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(222,65%,28%)] transition-colors">
                  <LayoutList className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-slate-900 mb-1">Mes Campagnes</h3>
                  <p className="text-slate-500 text-sm">Gérez et suivez vos campagnes de prospection.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>

              {/* Leads Validation Card */}
              <a
                href="/leads/validate"
                className="group flex items-center gap-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(222,65%,28%)] transition-colors">
                  <ClipboardCheck className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-slate-900">Leads à Valider</h3>
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded">
                      12 nouveaux
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm">Validez et qualifiez vos nouveaux leads.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>

              {/* Analytics Card */}
              <a
                href="/analytics/funnel"
                className="group flex items-center gap-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(222,65%,28%)] transition-colors">
                  <BarChart3 className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-slate-900 mb-1">Analytics</h3>
                  <p className="text-slate-500 text-sm">Analysez vos performances et votre funnel.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Help Section */}
          <div className="flex items-start gap-4 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1.5">Navigation par la barre latérale</h3>
              <p className="text-slate-600 text-sm mb-2">
                Utilisez le menu à gauche pour accéder à toutes les sections :
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <strong>Prospection</strong> — Créez et gérez vos campagnes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <strong>Leads</strong> — Validez et suivez vos prospects
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <strong>Analytics</strong> — Analysez vos performances
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <strong>Paramètres</strong> — Configurez vos clés API et options
                </li>
              </ul>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
