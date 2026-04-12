import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Calendar,
  Target,
  TrendingUp,
  Bot,
  ArrowRight,
  Home,
  Plus,
  MapPin,
  Clock,
  DollarSign,
} from 'lucide-react';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';
import type { DashboardStats } from '@/modules/dashboard/types/dashboard.types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'navy' | 'emerald' | 'sky' | 'amber' | 'purple' | 'rose';
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const styles: Record<string, { bg: string; iconBg: string }> = {
    navy: { bg: 'bg-[hsl(222,65%,28%)]', iconBg: 'bg-white/15' },
    emerald: { bg: 'bg-emerald-700', iconBg: 'bg-white/15' },
    sky: { bg: 'bg-sky-700', iconBg: 'bg-white/15' },
    amber: { bg: 'bg-amber-600', iconBg: 'bg-white/15' },
    purple: { bg: 'bg-purple-700', iconBg: 'bg-white/15' },
    rose: { bg: 'bg-rose-600', iconBg: 'bg-white/15' },
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
          <Icon className="w-5 h-5 text-white/80" />
        </div>
      </div>
    </div>
  );
};

interface RecentProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  type: string;
  status: string;
  createdAt: string;
}

interface RecentProspect {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  score: number;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [recentProspects, setRecentProspects] = useState<RecentProspect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData] = await Promise.allSettled([dashboardService.getStats()]);

        if (statsData.status === 'fulfilled') setStats(statsData.value);

        // Fetch recent properties & prospects directly
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        const [propsRes, prospectsRes] = await Promise.allSettled([
          fetch(`${apiBase}/properties?limit=5&sort=createdAt&order=desc`, { headers }).then((r) =>
            r.json()
          ),
          fetch(`${apiBase}/prospects?limit=5&sort=createdAt&order=desc`, { headers }).then((r) =>
            r.json()
          ),
        ]);

        if (propsRes.status === 'fulfilled') {
          const data = propsRes.value;
          setRecentProperties(
            Array.isArray(data)
              ? data.slice(0, 5)
              : (data.data || data.properties || []).slice(0, 5)
          );
        }
        if (prospectsRes.status === 'fulfilled') {
          const data = prospectsRes.value;
          setRecentProspects(
            Array.isArray(data) ? data.slice(0, 5) : (data.data || data.prospects || []).slice(0, 5)
          );
        }
      } catch {
        // Dashboard gracefully handles missing data
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (price: number, category?: string) => {
    if (category === 'rent') return `${price.toLocaleString('fr-TN')} TND/mois`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M TND`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K TND`;
    return `${price.toLocaleString('fr-TN')} TND`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      reserved: 'bg-amber-100 text-amber-700',
      sold: 'bg-slate-100 text-slate-500',
      rented: 'bg-blue-100 text-blue-700',
    };
    const labels: Record<string, string> = {
      available: 'Disponible',
      reserved: 'Réservé',
      sold: 'Vendu',
      rented: 'Loué',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <MainLayout title="Tableau de Bord" breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="space-y-7">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[hsl(222,65%,22%)] to-[hsl(222,65%,32%)] rounded-xl p-7 text-white shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                    Bienvenue
                  </p>
                  <h2 className="text-xl font-bold leading-tight">CRM Immobilier Professionnel</h2>
                </div>
              </div>
              <p className="text-white/70 text-sm max-w-lg">
                Gérez vos propriétés, prospects et rendez-vous depuis une interface moderne et
                performante.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-48 h-full opacity-10 pointer-events-none">
              <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute top-8 right-8 w-20 h-20 border border-white rounded-full" />
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(222,65%,28%)]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                title="Prospects Actifs"
                value={stats?.activeProspects ?? 0}
                icon={Users}
                color="navy"
              />
              <StatCard
                title="Propriétés"
                value={stats?.availableProperties ?? 0}
                icon={Building2}
                color="emerald"
              />
              <StatCard
                title="RDV Aujourd'hui"
                value={stats?.todayAppointments ?? 0}
                icon={Calendar}
                color="purple"
              />
              <StatCard
                title="Matchs"
                value={stats?.totalMatches ?? 0}
                icon={Target}
                color="rose"
              />
              <StatCard
                title="Taux Conversion"
                value={`${(stats?.conversionRate ?? 0).toFixed(1)}%`}
                icon={TrendingUp}
                color="sky"
              />
              <StatCard
                title="Taux Match"
                value={`${(stats?.matchSuccessRate ?? 0).toFixed(1)}%`}
                icon={Target}
                color="amber"
              />
            </div>
          )}

          {/* Two-column: Recent Properties + Recent Prospects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Properties */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-400" />
                  Dernières Propriétés
                </h3>
                <a
                  href="/properties"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  Voir tout <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="divide-y divide-slate-50">
                {recentProperties.length === 0 ? (
                  <div className="p-8 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Aucune propriété</p>
                    <a
                      href="/properties"
                      className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </a>
                  </div>
                ) : (
                  recentProperties.map((prop) => (
                    <a
                      key={prop.id}
                      href={`/properties/${prop.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{prop.title}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{prop.city || 'N/A'}</span>
                          <span className="text-slate-300">|</span>
                          <DollarSign className="w-3 h-3" />
                          <span>{formatPrice(prop.price)}</span>
                        </div>
                      </div>
                      {statusBadge(prop.status)}
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Recent Prospects */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Derniers Prospects
                </h3>
                <a
                  href="/prospects"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  Voir tout <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="divide-y divide-slate-50">
                {recentProspects.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Aucun prospect</p>
                    <a
                      href="/prospects"
                      className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </a>
                  </div>
                ) : (
                  recentProspects.map((p) => (
                    <a
                      key={p.id}
                      href={`/prospects/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-sm">
                        {p.firstName?.[0] || '?'}
                        {p.lastName?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm">
                          {p.firstName} {p.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="capitalize">
                            {p.type === 'buyer'
                              ? 'Acheteur'
                              : p.type === 'renter'
                                ? 'Locataire'
                                : p.type === 'seller'
                                  ? 'Vendeur'
                                  : p.type}
                          </span>
                          <span className="text-slate-300">|</span>
                          <Clock className="w-3 h-3" />
                          <span>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${p.score >= 70 ? 'bg-green-500' : p.score >= 40 ? 'bg-amber-500' : 'bg-slate-300'}`}
                        />
                        <span className="text-xs font-medium text-slate-600">{p.score}%</span>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
              Accès Rapide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/properties"
                className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Building2 className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Propriétés</p>
                  <p className="text-xs text-slate-500">Gérer le portefeuille</p>
                </div>
              </a>
              <a
                href="/prospects"
                className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <Users className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Prospects</p>
                  <p className="text-xs text-slate-500">Suivi des contacts</p>
                </div>
              </a>
              <a
                href="/prospection/new"
                className="group flex items-center gap-4 p-4 bg-[hsl(222,65%,28%)] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Prospection IA</p>
                  <p className="text-xs text-white/60">Recherche intelligente</p>
                </div>
              </a>
              <a
                href="/matching"
                className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <Target className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Matching</p>
                  <p className="text-xs text-slate-500">Prospect ↔ Propriété</p>
                </div>
              </a>
            </div>
          </div>

          {/* Module Quick Access - Extended */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
              Modules
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Marketing', path: '/marketing-dashboard', icon: '📊', color: 'bg-red-50 hover:bg-red-100' },
                { label: 'Analytics', path: '/analytics', icon: '📈', color: 'bg-blue-50 hover:bg-blue-100' },
                { label: 'Assistant IA', path: '/ai-assistant', icon: '🤖', color: 'bg-amber-50 hover:bg-amber-100' },
                { label: 'Investissement', path: '/investment', icon: '💰', color: 'bg-green-50 hover:bg-green-100' },
                { label: 'SEO & IA', path: '/seo-ai', icon: '🔍', color: 'bg-purple-50 hover:bg-purple-100' },
                { label: 'WhatsApp', path: '/communication/whatsapp', icon: '💬', color: 'bg-emerald-50 hover:bg-emerald-100' },
                { label: 'Documents', path: '/documents', icon: '📄', color: 'bg-slate-50 hover:bg-slate-100' },
                { label: 'Scraping', path: '/scraping', icon: '🕷️', color: 'bg-orange-50 hover:bg-orange-100' },
                { label: 'Facturation IA', path: '/settings/ai-billing', icon: '💳', color: 'bg-cyan-50 hover:bg-cyan-100' },
                { label: 'Vitrine', path: '/vitrine', icon: '🌐', color: 'bg-indigo-50 hover:bg-indigo-100' },
                { label: 'Intégrations', path: '/integrations', icon: '🔗', color: 'bg-pink-50 hover:bg-pink-100' },
                { label: 'Personnel', path: '/personnel', icon: '👥', color: 'bg-teal-50 hover:bg-teal-100' },
              ].map((mod) => (
                <a
                  key={mod.path}
                  href={mod.path}
                  className={`flex flex-col items-center p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center ${mod.color}`}
                >
                  <span className="text-2xl mb-2">{mod.icon}</span>
                  <span className="text-xs font-semibold text-slate-700">{mod.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
