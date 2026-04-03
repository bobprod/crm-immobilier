import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { useProspecting } from '@/shared/hooks/useProspecting';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Target,
  Sparkles,
  LayoutList,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  Key,
  MapPin,
  Home,
} from 'lucide-react';

/**
 * Dashboard Principal - Nouvelle Architecture
 *
 * Page d'accueil principale du CRM utilisant la nouvelle Sidebar navigation.
 * Remplace l'ancien système de tabs horizontaux par une navigation hiérarchique.
 *
 * Phase 2: UX/UI Restructuring — Navy/Amber premium palette
 */

// ─── Skeleton Loader ────────────────────────────────────────────────────────

const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-8 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-32" />
      </div>
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex-shrink-0" />
    </div>
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  variant?: 'navy' | 'amber' | 'emerald' | 'slate';
}

const variantConfig = {
  navy: {
    bg: 'bg-navy-100',
    icon: 'text-navy-600',
    ring: 'ring-navy-200',
  },
  amber: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    ring: 'ring-amber-200',
  },
  emerald: {
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    ring: 'ring-emerald-200',
  },
  slate: {
    bg: 'bg-slate-100',
    icon: 'text-slate-600',
    ring: 'ring-slate-200',
  },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, variant = 'navy' }) => {
  const cfg = variantConfig[variant];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group cursor-default">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
          {change !== undefined && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 font-medium ${
                change >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(change)}% vs mois dernier
            </p>
          )}
        </div>
        <div className={`p-3.5 rounded-2xl ${cfg.bg} ring-1 ${cfg.ring} group-hover:scale-105 transition-transform duration-200`}>
          <span className={`w-6 h-6 flex items-center justify-center ${cfg.icon}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Property Status Badge ───────────────────────────────────────────────────

type PropertyStatus = 'Disponible' | 'Exclusivité' | 'Compromis' | 'Vendu';

const statusConfig: Record<PropertyStatus, string> = {
  Disponible: 'badge-disponible',
  Exclusivité: 'badge-exclusivite',
  Compromis: 'badge-compromis',
  Vendu: 'badge-vendu',
};

const PropertyStatusBadge: React.FC<{ status: PropertyStatus }> = ({ status }) => (
  <span className={statusConfig[status]}>{status}</span>
);

// ─── Quick Action Card ───────────────────────────────────────────────────────

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  badge?: string;
  variant?: 'primary' | 'default';
}

const QuickActionCard: React.FC<QuickActionProps> = ({
  href, icon, title, description, cta, badge, variant = 'default',
}) => {
  if (variant === 'primary') {
    return (
      <a
        href={href}
        className="block p-6 bg-gradient-to-br from-navy-600 via-navy-700 to-navy-800 rounded-xl text-white hover:from-navy-700 hover:to-navy-900 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] group"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2.5 bg-white/15 rounded-xl ring-1 ring-white/20">{icon}</div>
          <div>
            {badge && (
              <div className="inline-block px-2 py-0.5 bg-amber-400/90 text-amber-950 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
                {badge}
              </div>
            )}
            <h3 className="font-bold text-lg leading-tight">{title}</h3>
          </div>
        </div>
        <p className="text-navy-100 text-sm mb-4 leading-relaxed">{description}</p>
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90 group-hover:opacity-100">
          {cta}
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
    );
  }

  return (
    <a
      href={href}
      className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-navy-300 hover:shadow-card-hover transition-all group"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-2.5 bg-navy-50 rounded-xl ring-1 ring-navy-100 group-hover:bg-navy-100 transition-colors">{icon}</div>
        <div>
          {badge && (
            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-wide mb-1">
              {badge}
            </span>
          )}
          <h3 className="font-bold text-base text-gray-900 leading-tight">{title}</h3>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-4 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 text-sm font-semibold text-navy-600 group-hover:text-navy-700">
        {cta}
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </a>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { globalStats, loading } = useProspecting();

  return (
    <ProtectedRoute>
      <MainLayout
        title="Tableau de Bord"
        breadcrumbs={[{ label: 'Dashboard' }]}
      >
        <div className="space-y-8">

          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-navy-600 to-navy-800 rounded-xl p-8 text-white shadow-lg">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 right-16 w-28 h-28 rounded-full bg-amber-gold-500/10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <Home className="w-6 h-6 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold uppercase tracking-widest">CRM Immobilier</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Bienvenue sur votre espace de travail</h2>
              <p className="text-navy-100 text-sm max-w-lg">
                Gérez vos mandats, prospections et campagnes depuis une interface professionnelle conçue pour les agents.
              </p>
              {/* Sample property status badges for demo */}
              <div className="flex items-center gap-2 mt-5 flex-wrap">
                <PropertyStatusBadge status="Disponible" />
                <PropertyStatusBadge status="Exclusivité" />
                <PropertyStatusBadge status="Compromis" />
                <PropertyStatusBadge status="Vendu" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Total Leads"
                value={globalStats?.total ?? 0}
                icon={<Users className="w-6 h-6" />}
                variant="navy"
              />
              <StatCard
                title="Leads Convertis"
                value={globalStats?.converted ?? 0}
                icon={<CheckCircle2 className="w-6 h-6" />}
                variant="emerald"
              />
              <StatCard
                title="Taux de Conversion"
                value={`${(globalStats?.conversionRate ?? 0).toFixed(1)}%`}
                icon={<TrendingUp className="w-6 h-6" />}
                variant="amber"
              />
              <StatCard
                title="Score Moyen"
                value={`${(globalStats?.avgScore ?? 0).toFixed(0)}%`}
                icon={<Target className="w-6 h-6" />}
                variant="slate"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <QuickActionCard
                href="/prospection/new"
                variant="primary"
                icon={<Sparkles className="w-5 h-5 text-white" />}
                badge="Recommandé"
                title="Prospection IA"
                description="Trouvez des leads qualifiés automatiquement avec l'intelligence artificielle."
                cta="Lancer une prospection"
              />
              <QuickActionCard
                href="/prospection/campaigns"
                icon={<LayoutList className="w-5 h-5 text-navy-600" />}
                title="Mes Campagnes"
                description="Gérez et suivez vos campagnes de prospection en cours."
                cta="Voir les campagnes"
              />
              <QuickActionCard
                href="/leads/validate"
                icon={<ClipboardCheck className="w-5 h-5 text-navy-600" />}
                title="Leads à Valider"
                description="Validez et qualifiez vos nouveaux leads."
                cta="Valider maintenant"
                badge="12 nouveaux"
              />
              <QuickActionCard
                href="/analytics/funnel"
                icon={<BarChart3 className="w-5 h-5 text-navy-600" />}
                title="Analytics"
                description="Analysez vos performances et votre funnel de conversion."
                cta="Voir les stats"
              />
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-navy-50 border border-navy-100 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-navy-100 rounded-lg flex-shrink-0">
                <Key className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-gray-900 mb-1">Navigation rapide</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Utilisez la sidebar à gauche pour naviguer entre les différentes sections :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-navy-500 flex-shrink-0" />
                    <span><strong className="text-gray-800">Prospection</strong> – Créez et gérez vos campagnes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-navy-500 flex-shrink-0" />
                    <span><strong className="text-gray-800">Leads</strong> – Validez et suivez vos prospects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-navy-500 flex-shrink-0" />
                    <span><strong className="text-gray-800">Analytics</strong> – Analysez vos performances</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-navy-500 flex-shrink-0" />
                    <span><strong className="text-gray-800">Paramètres</strong> – Configurez vos clés API</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
