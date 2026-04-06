import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Clock,
  Home,
  Calendar,
  CalendarPlus,
  Eye,
  TrendingUp,
  MessageCircle,
  CheckCircle,
  Trash2,
  FileText,
  Zap,
  Target,
  Edit,
  Send,
  Building2,
  Tag,
  Info,
  AlertCircle,
  ChevronRight,
  BarChart2,
  RefreshCw,
  Search,
  Plus,
  ExternalLink,
  Briefcase,
  Play,
  ArrowRight,
  ShieldCheck,
  Coins,
} from 'lucide-react';

import { prospectsAPI } from '@/shared/utils/prospects-api';
import apiClient from '@/shared/utils/backend-api';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface ProspectCardProps {
  prospectId: string;
}

/* ─── helpers ─── */
const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  qualified: 'Qualifié',
  lead: 'Lead',
  converted: 'Converti',
  lost: 'Perdu',
  archived: 'Archivé',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  qualified: 'bg-blue-100 text-blue-800',
  lead: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-800',
  archived: 'bg-gray-100 text-gray-600',
};
const TYPE_LABELS: Record<string, string> = {
  buyer: 'Acheteur',
  seller: 'Vendeur',
  tenant: 'Locataire',
  landlord: 'Bailleur',
  investor: 'Investisseur',
  other: 'Autre',
};
function scoreColor(s: number) {
  return s >= 80 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-500';
}
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
function fmtDateTime(d: string | Date) {
  return new Date(d).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function toLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ─── Modal Rendez-vous ─── */
function AppointmentModal({
  prospectId,
  onClose,
  onCreated,
}: {
  prospectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);
  const [form, setForm] = useState({
    title: '',
    type: 'meeting',
    startTime: toLocal(tomorrow),
    endTime: toLocal(tomorrowEnd),
    location: '',
    notes: '',
    prospectId,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/appointments', {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-blue-600" />
            Nouveau Rendez-vous
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Visite appartement La Marsa"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="call">📞 Appel téléphonique</option>
              <option value="meeting">🤝 Réunion bureau</option>
              <option value="visit">🏠 Visite de bien</option>
              <option value="signing">✍️ Signature</option>
              <option value="other">📋 Autre</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début *</label>
              <input
                required
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <input
                required
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adresse ou lien Teams/Zoom"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Objectifs du rendez-vous..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CalendarPlus className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Création...' : 'Créer le RDV'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function ProspectCard({ prospectId }: ProspectCardProps) {
  const router = useRouter();
  const [prospect, setProspect] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'info' | 'mandat' | 'rdv' | 'matching' | 'tasks' | 'comms'
  >('info');
  const [ownedProperties, setOwnedProperties] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const prospectData = await prospectsAPI.getProspectById(prospectId);
      setProspect(prospectData);
      await Promise.allSettled([
        apiClient
          .get('/appointments', { params: { prospectId, limit: 20 } })
          .then((r) => setAppointments(Array.isArray(r.data) ? r.data : r.data?.data || [])),
        apiClient
          .get(`/matching/prospect/${prospectId}`)
          .then((r) => setMatches(Array.isArray(r.data) ? r.data : r.data?.data || [])),
        apiClient
          .get('/tasks', { params: { prospectId, limit: 20 } })
          .then((r) => setTasks(Array.isArray(r.data) ? r.data : r.data?.data || [])),
        apiClient
          .get('/properties', { params: { ownerId: prospectId, limit: 20 } })
          .then((r) => setOwnedProperties(Array.isArray(r.data) ? r.data : r.data?.data || [])),
        apiClient
          .get('/transactions', { params: { prospectId, limit: 20 } })
          .then((r) => setTransactions(Array.isArray(r.data) ? r.data : r.data?.data || [])),
      ]);
    } catch (err) {
      console.error('Erreur chargement prospect:', err);
    } finally {
      setLoading(false);
    }
  }, [prospectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce prospect définitivement ?')) return;
    try {
      await prospectsAPI.deleteProspect(prospectId);
      router.push('/prospects');
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading)
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-36 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );

  if (!prospect)
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-semibold">Prospect introuvable</p>
          <p className="text-sm mt-1">
            Cet enregistrement n'existe pas ou vous n'avez pas les droits.
          </p>
        </CardContent>
      </Card>
    );

  const budget = prospect.budget || {};
  const criteria = prospect.searchCriteria || {};
  const mandatInfo = prospect.mandatInfo || null;
  const upcomingCount = appointments.filter((a) => new Date(a.startTime) > new Date()).length;
  const APPOINTMENT_ICONS: Record<string, string> = {
    call: '📞',
    meeting: '🤝',
    visit: '🏠',
    signing: '✍️',
    other: '📋',
  };
  const isSellerType = ['seller', 'landlord'].includes(prospect.type);
  const isRequeteType = ['buyer', 'tenant', 'investor'].includes(prospect.type);

  const handleLaunchMatching = async () => {
    setMatchingLoading(true);
    try {
      await apiClient.post(`/matching/find/${prospectId}`);
      const r = await apiClient.get(`/matching/prospect/${prospectId}`);
      setMatches(Array.isArray(r.data) ? r.data : r.data?.data || []);
    } catch (err) {
      console.error('Erreur matching:', err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const MATCH_STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'En attente', color: 'bg-gray-100 text-gray-700', icon: '⏳' },
    contacted: { label: 'Contacté', color: 'bg-blue-100 text-blue-700', icon: '📞' },
    visited: { label: 'Visité', color: 'bg-purple-100 text-purple-700', icon: '🏠' },
    offered: { label: 'Offre faite', color: 'bg-amber-100 text-amber-700', icon: '💰' },
    negotiating: { label: 'Négociation', color: 'bg-orange-100 text-orange-700', icon: '🤝' },
    rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700', icon: '❌' },
    success: { label: 'Conclu', color: 'bg-green-100 text-green-700', icon: '✅' },
  };

  const tabs = [
    { id: 'info', label: 'Infos', icon: <Info className="h-4 w-4" /> },
    {
      id: 'mandat',
      label: isSellerType
        ? `Mandats${ownedProperties.length > 0 ? ` (${ownedProperties.length})` : ''}`
        : `Requête`,
      icon: isSellerType ? <FileText className="h-4 w-4" /> : <Search className="h-4 w-4" />,
    },
    {
      id: 'rdv',
      label: `RDV${appointments.length > 0 ? ` (${appointments.length})` : ''}`,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: 'matching',
      label: `Matching${matches.length > 0 ? ` (${matches.length})` : ''}`,
      icon: <Target className="h-4 w-4" />,
    },
    {
      id: 'tasks',
      label: `Tâches${tasks.length > 0 ? ` (${tasks.length})` : ''}`,
      icon: <CheckCircle className="h-4 w-4" />,
    },
    { id: 'comms', label: 'Messages', icon: <MessageCircle className="h-4 w-4" /> },
  ] as const;

  return (
    <>
      {showModal && (
        <AppointmentModal
          prospectId={prospectId}
          onClose={() => setShowModal(false)}
          onCreated={loadData}
        />
      )}
      <div className="space-y-4">
        {/* ── Header ── */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {prospect.profiling?.avatar ? (
                  <img
                    src={prospect.profiling.avatar}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                    {(prospect.firstName?.[0] || '').toUpperCase()}
                    {(prospect.lastName?.[0] || '').toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {prospect.firstName} {prospect.lastName}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      className={STATUS_COLORS[prospect.status] || 'bg-gray-100 text-gray-700'}
                    >
                      {STATUS_LABELS[prospect.status] || prospect.status}
                    </Badge>
                    <Badge variant="outline">{TYPE_LABELS[prospect.type] || prospect.type}</Badge>
                    {prospect.source && (
                      <Badge variant="outline" className="text-gray-500">
                        via {prospect.source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                    {prospect.phone && (
                      <a
                        href={`tel:${prospect.phone}`}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <Phone className="h-4 w-4" />
                        {prospect.phone}
                      </a>
                    )}
                    {prospect.email && (
                      <a
                        href={`mailto:${prospect.email}`}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <Mail className="h-4 w-4" />
                        {prospect.email}
                      </a>
                    )}
                    {(criteria.city || prospect.city) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {criteria.city || prospect.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center">
                  <div className={`text-4xl font-black ${scoreColor(prospect.score || 0)}`}>
                    {prospect.score || 0}
                  </div>
                  <div className="text-xs text-gray-400">Score</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${(prospect.score || 0) >= 80 ? 'bg-green-500' : (prospect.score || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                      style={{ width: `${prospect.score || 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Nouveau RDV
                  </Button>
                  <Button
                    onClick={() => router.push(`/communications?prospectId=${prospectId}`)}
                    variant="outline"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer message
                  </Button>
                  <Button onClick={handleDelete} variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: <Calendar className="h-6 w-6 text-blue-500" />,
              value: appointments.length,
              label: 'RDV total',
            },
            {
              icon: <Target className="h-6 w-6 text-purple-500" />,
              value: matches.length,
              label: 'Biens matchés',
            },
            {
              icon: <CheckCircle className="h-6 w-6 text-green-500" />,
              value: tasks.filter((t) => t.status !== 'completed').length,
              label: 'Tâches actives',
            },
            {
              icon: <DollarSign className="h-6 w-6 text-emerald-500" />,
              value: budget.max ? `${Math.round(budget.max / 1000)}k TND` : '–',
              label: 'Budget max',
            },
          ].map((kpi, i) => (
            <Card key={i} className="p-4 text-center">
              <div className="flex justify-center mb-1">{kpi.icon}</div>
              <div className="text-xl font-bold">{kpi.value}</div>
              <div className="text-xs text-gray-500">{kpi.label}</div>
            </Card>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB INFOS ── */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-2 gap-4">
            {(budget.min || budget.max || budget.asking) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">
                    {budget.min && budget.max
                      ? `${budget.min.toLocaleString()} – ${budget.max.toLocaleString()}`
                      : (budget.asking || budget.max || budget.min || 0).toLocaleString()}{' '}
                    {budget.currency || 'TND'}
                  </div>
                  {budget.period && (
                    <div className="text-sm text-gray-500 mt-1">
                      / {budget.period === 'monthly' ? 'mois' : budget.period}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {(criteria.type || criteria.city || criteria.minBedrooms) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    Critères de recherche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {criteria.type && (
                    <div>
                      <span className="text-gray-500">Type : </span>
                      <strong>{criteria.type}</strong>
                    </div>
                  )}
                  {criteria.city && (
                    <div>
                      <span className="text-gray-500">Ville : </span>
                      <strong>{criteria.city}</strong>
                    </div>
                  )}
                  {criteria.minBedrooms && (
                    <div>
                      <span className="text-gray-500">Chambres min : </span>
                      <strong>{criteria.minBedrooms}</strong>
                    </div>
                  )}
                  {criteria.category && (
                    <div>
                      <span className="text-gray-500">Catégorie : </span>
                      <strong>{criteria.category === 'sale' ? 'Achat' : 'Location'}</strong>
                    </div>
                  )}
                  {criteria.features?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {criteria.features.map((f: string) => (
                        <Badge key={f} variant="outline" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {mandatInfo && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                    <FileText className="h-5 w-5" />
                    Mandat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {mandatInfo.type && (
                    <div>
                      <span className="text-amber-700">Type : </span>
                      <strong>{mandatInfo.type}</strong>
                    </div>
                  )}
                  {mandatInfo.reference && (
                    <div>
                      <span className="text-amber-700">Réf : </span>
                      <strong>{mandatInfo.reference}</strong>
                    </div>
                  )}
                  {mandatInfo.signedAt && (
                    <div>
                      <span className="text-amber-700">Signé le : </span>
                      <strong>{fmtDate(mandatInfo.signedAt)}</strong>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {prospect.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Edit className="h-5 w-5 text-gray-500" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">{prospect.notes}</p>
                </CardContent>
              </Card>
            )}
            {prospect.tags?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-5 w-5 text-purple-500" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {prospect.tags.map((tag: string) => (
                      <Badge key={tag} className="bg-purple-100 text-purple-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {prospect.profiling &&
              Object.keys(prospect.profiling).filter((k) => k !== 'avatar').length > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                      <Zap className="h-5 w-5" />
                      Profil IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-purple-900">
                    {Object.entries(prospect.profiling)
                      .filter(([k]) => k !== 'avatar')
                      .map(([k, v]) => (
                        <div key={k}>
                          <span className="text-purple-600 capitalize">{k} : </span>
                          <strong>{String(v)}</strong>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {/* ── TAB MANDAT / REQUÊTE ── */}
        {activeTab === 'mandat' && isSellerType && (
          <div className="space-y-4">
            {/* En-tête */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Mandats — {prospect.firstName} {prospect.lastName}
              </h3>
              <Link href="/mandates/new">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un mandat
                </Button>
              </Link>
            </div>

            {/* Mandat Info (JSON existant) */}
            {mandatInfo && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                    <ShieldCheck className="h-5 w-5" />
                    Mandat actuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {mandatInfo.type && (
                      <div>
                        <span className="text-amber-700 block text-xs">Type</span>
                        <strong className="capitalize">
                          {mandatInfo.type === 'exclusive'
                            ? 'Exclusif'
                            : mandatInfo.type === 'semi_exclusive'
                              ? 'Semi-exclusif'
                              : 'Simple'}
                        </strong>
                      </div>
                    )}
                    {mandatInfo.reference && (
                      <div>
                        <span className="text-amber-700 block text-xs">Référence</span>
                        <strong>{mandatInfo.reference}</strong>
                      </div>
                    )}
                    {mandatInfo.category && (
                      <div>
                        <span className="text-amber-700 block text-xs">Catégorie</span>
                        <strong>
                          {mandatInfo.category === 'sale' ? '🏷️ Vente' : '🔑 Location'}
                        </strong>
                      </div>
                    )}
                    {mandatInfo.signedAt && (
                      <div>
                        <span className="text-amber-700 block text-xs">Signé le</span>
                        <strong>{fmtDate(mandatInfo.signedAt)}</strong>
                      </div>
                    )}
                    {mandatInfo.commission && (
                      <div>
                        <span className="text-amber-700 block text-xs">Commission</span>
                        <strong>{mandatInfo.commission}%</strong>
                      </div>
                    )}
                    {mandatInfo.price && (
                      <div>
                        <span className="text-amber-700 block text-xs">Prix</span>
                        <strong>{Number(mandatInfo.price).toLocaleString()} TND</strong>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Propriétés possédées */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Biens du propriétaire ({ownedProperties.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ownedProperties.length === 0 ? (
                  <div className="text-center text-gray-400 py-6">
                    <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucun bien associé à ce prospect.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ownedProperties.map((prop: any) => (
                      <div
                        key={prop.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {prop.images?.[0] ? (
                          <img
                            src={prop.images[0]}
                            alt={prop.title}
                            className="h-16 w-24 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-16 w-24 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {prop.title || 'Bien sans titre'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {prop.city} · {prop.type}
                          </div>
                          <div className="text-sm font-semibold text-emerald-600 mt-1">
                            {prop.price?.toLocaleString()} {prop.currency || 'TND'}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            className={
                              prop.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : prop.status === 'sold'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                            }
                          >
                            {prop.status === 'available'
                              ? 'Disponible'
                              : prop.status === 'sold'
                                ? 'Vendu'
                                : prop.status === 'rented'
                                  ? 'Loué'
                                  : prop.status}
                          </Badge>
                          {prop.mandates?.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-amber-600 border-amber-300"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {prop.mandates.length} mandat(s)
                            </Badge>
                          )}
                        </div>
                        <Link href={`/properties/${prop.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transactions */}
            {transactions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-600" />
                    Transactions ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{tx.reference || tx.id}</div>
                        <div className="text-xs text-gray-500">
                          {tx.type === 'sale' ? '🏷️ Vente' : '🔑 Location'} ·{' '}
                          {fmtDate(tx.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.finalPrice && (
                          <span className="font-semibold text-sm text-emerald-600">
                            {tx.finalPrice.toLocaleString()} {tx.currency || 'TND'}
                          </span>
                        )}
                        <Badge
                          className={
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {tx.status === 'completed'
                            ? '✅ Conclu'
                            : tx.status === 'cancelled'
                              ? '❌ Annulé'
                              : '🔄 En cours'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'mandat' && isRequeteType && (
          <div className="space-y-4">
            {/* En-tête Requête */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Requête de recherche —{' '}
                {prospect.type === 'buyer'
                  ? 'Achat'
                  : prospect.type === 'tenant'
                    ? 'Location'
                    : 'Investissement'}
              </h3>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleLaunchMatching}
                disabled={matchingLoading}
              >
                {matchingLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {matchingLoading ? 'Recherche...' : 'Lancer le Matching IA'}
              </Button>
            </div>

            {/* Badge type de requête */}
            <div className="flex gap-2">
              <Badge
                className={
                  prospect.type === 'buyer'
                    ? 'bg-blue-100 text-blue-800'
                    : prospect.type === 'tenant'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                }
              >
                {prospect.type === 'buyer'
                  ? '🏠 Requête Achat'
                  : prospect.type === 'tenant'
                    ? '🔑 Requête Location'
                    : '📈 Requête Investissement'}
              </Badge>
              {matches.length > 0 && (
                <Badge variant="outline" className="text-purple-600 border-purple-300">
                  <Target className="h-3 w-3 mr-1" />
                  {matches.length} bien(s) trouvé(s)
                </Badge>
              )}
            </div>

            {/* Critères de recherche détaillés */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Home className="h-5 w-5" />
                  Critères de recherche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {criteria.category && (
                    <div>
                      <span className="text-blue-600 block text-xs">Catégorie</span>
                      <strong>{criteria.category === 'sale' ? '🏷️ Achat' : '🔑 Location'}</strong>
                    </div>
                  )}
                  {criteria.type && (
                    <div>
                      <span className="text-blue-600 block text-xs">Type de bien</span>
                      <strong className="capitalize">{criteria.type}</strong>
                    </div>
                  )}
                  {criteria.city && (
                    <div>
                      <span className="text-blue-600 block text-xs">Ville</span>
                      <strong>{criteria.city}</strong>
                    </div>
                  )}
                  {criteria.minBedrooms && (
                    <div>
                      <span className="text-blue-600 block text-xs">Chambres min.</span>
                      <strong>{criteria.minBedrooms}</strong>
                    </div>
                  )}
                  {criteria.minArea && (
                    <div>
                      <span className="text-blue-600 block text-xs">Surface min.</span>
                      <strong>{criteria.minArea} m²</strong>
                    </div>
                  )}
                  {criteria.maxArea && (
                    <div>
                      <span className="text-blue-600 block text-xs">Surface max.</span>
                      <strong>{criteria.maxArea} m²</strong>
                    </div>
                  )}
                </div>
                {criteria.features?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <span className="text-blue-600 text-xs block mb-2">
                      Caractéristiques souhaitées
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {criteria.features.map((f: string) => (
                        <Badge
                          key={f}
                          variant="outline"
                          className="text-xs text-blue-700 border-blue-300"
                        >
                          ✓ {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {!criteria.type &&
                  !criteria.city &&
                  !criteria.minBedrooms &&
                  !criteria.category && (
                    <div className="text-center text-gray-400 py-4">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucun critère de recherche défini.</p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Budget */}
            {(budget.min || budget.max) && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-800">
                    <DollarSign className="h-5 w-5" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {budget.min && budget.max
                      ? `${budget.min.toLocaleString()} – ${budget.max.toLocaleString()}`
                      : (budget.max || budget.min || 0).toLocaleString()}{' '}
                    {budget.currency || 'TND'}
                  </div>
                  {budget.period && (
                    <div className="text-sm text-green-600 mt-1">
                      / {budget.period === 'monthly' ? 'mois' : budget.period}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Résumé matching rapide */}
            {matches.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Résultats du matching ({matches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {matches.slice(0, 4).map((match: any) => {
                      const p = match.properties || match.property || {};
                      const s = match.score || match.matchScore || 0;
                      return (
                        <Link key={match.id} href={`/properties/${p.id}`} className="flex-shrink-0">
                          <div className="w-40 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt=""
                                className="h-20 w-full rounded object-cover mb-2"
                              />
                            ) : (
                              <div className="h-20 w-full rounded bg-gray-200 flex items-center justify-center mb-2">
                                <Building2 className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="text-xs font-semibold truncate">
                              {p.title || 'Bien'}
                            </div>
                            <div className="text-xs text-gray-500">{p.city}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-bold text-emerald-600">
                                {p.price?.toLocaleString()} TND
                              </span>
                              <span
                                className={`text-xs font-black ${s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-gray-500'}`}
                              >
                                {Math.round(s)}%
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {matches.length > 4 && (
                    <button
                      onClick={() => setActiveTab('matching')}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium mt-2 flex items-center gap-1"
                    >
                      Voir les {matches.length} résultats <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Transactions liées */}
            {transactions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-600" />
                    Transactions ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{tx.reference || tx.id}</div>
                        <div className="text-xs text-gray-500">
                          {tx.type === 'sale' ? '🏷️ Vente' : '🔑 Location'} ·{' '}
                          {fmtDate(tx.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.finalPrice && (
                          <span className="font-semibold text-sm text-emerald-600">
                            {tx.finalPrice.toLocaleString()} {tx.currency || 'TND'}
                          </span>
                        )}
                        <Badge
                          className={
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {tx.status === 'completed'
                            ? '✅ Conclu'
                            : tx.status === 'cancelled'
                              ? '❌ Annulé'
                              : '🔄 En cours'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'mandat' && !isSellerType && !isRequeteType && (
          <Card>
            <CardContent className="p-10 text-center text-gray-400">
              <Info className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>Ce type de prospect n'a pas de mandat ou requête associé.</p>
            </CardContent>
          </Card>
        )}

        {/* ── TAB RDV ── */}
        {activeTab === 'rdv' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">
                {upcomingCount} à venir · {appointments.length - upcomingCount} passés
              </h3>
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Nouveau RDV
              </Button>
            </div>
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-gray-400">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p>Aucun rendez-vous pour ce prospect.</p>
                  <Button
                    onClick={() => setShowModal(true)}
                    className="mt-4 bg-blue-600 text-white"
                    size="sm"
                  >
                    Planifier le premier RDV
                  </Button>
                </CardContent>
              </Card>
            ) : (
              appointments.map((apt: any) => {
                const isPast = new Date(apt.startTime) <= new Date();
                return (
                  <Card
                    key={apt.id}
                    className={`border-l-4 ${isPast ? 'border-l-gray-300 opacity-75' : 'border-l-blue-500'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{APPOINTMENT_ICONS[apt.type] || '📋'}</div>
                          <div>
                            <div className="font-semibold">{apt.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              {fmtDateTime(apt.startTime)} –{' '}
                              {new Date(apt.endTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            {apt.location && (
                              <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3" />
                                {apt.location}
                              </div>
                            )}
                            {apt.notes && (
                              <p className="text-sm text-gray-600 italic mt-2">"{apt.notes}"</p>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={
                            apt.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : apt.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {apt.status === 'completed'
                            ? '✅ Terminé'
                            : apt.status === 'cancelled'
                              ? '❌ Annulé'
                              : '🕐 Prévu'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB MATCHING ── */}
        {activeTab === 'matching' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold text-gray-700">
                {matches.length} bien(s) correspondant(s)
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleLaunchMatching}
                  disabled={matchingLoading}
                >
                  {matchingLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {matchingLoading ? 'Recherche...' : 'Relancer le Matching'}
                </Button>
                <Link href={`/matching?prospectId=${prospectId}`}>
                  <Button variant="outline" size="sm">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Module Matching
                  </Button>
                </Link>
              </div>
            </div>
            {/* Pipeline résumé */}
            {matches.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(
                  matches.reduce((acc: Record<string, number>, m: any) => {
                    const st = m.status || 'pending';
                    acc[st] = (acc[st] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => {
                  const info = MATCH_STATUS_LABELS[status] || {
                    label: status,
                    color: 'bg-gray-100 text-gray-600',
                    icon: '📋',
                  };
                  return (
                    <Badge key={status} className={`${info.color} text-xs`}>
                      {info.icon} {info.label} ({count as number})
                    </Badge>
                  );
                })}
              </div>
            )}
            {matches.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-gray-400">
                  <Target className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p>Aucun bien correspondant trouvé.</p>
                  <Button
                    className="mt-4 bg-purple-600 text-white"
                    size="sm"
                    onClick={handleLaunchMatching}
                    disabled={matchingLoading}
                  >
                    {matchingLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {matchingLoading ? 'Recherche...' : 'Lancer le Matching IA'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              matches.slice(0, 10).map((match: any) => {
                const prop = match.properties || match.property || {};
                const score = match.score || match.matchScore || 0;
                const matchStatus =
                  MATCH_STATUS_LABELS[match.status || 'pending'] || MATCH_STATUS_LABELS.pending;
                return (
                  <Card key={match.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {prop.images?.[0] ? (
                          <img
                            src={prop.images[0]}
                            alt={prop.title}
                            className="h-20 w-28 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-20 w-28 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold truncate">
                                {prop.title || 'Bien sans titre'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {prop.city} · {prop.type}
                              </div>
                              <div className="text-sm text-emerald-600 font-semibold mt-1">
                                {prop.price?.toLocaleString()} {prop.currency || 'TND'}
                              </div>
                            </div>
                            <div className="text-center flex-shrink-0 ml-2">
                              <div
                                className={`text-2xl font-black ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-gray-500'}`}
                              >
                                {Math.round(score)}%
                              </div>
                              <div className="text-xs text-gray-400">match</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className={`${matchStatus.color} text-xs`}>
                              {matchStatus.icon} {matchStatus.label}
                            </Badge>
                            {match.reasons?.length > 0 &&
                              match.reasons.slice(0, 3).map((r: string, i: number) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs text-green-700 border-green-300"
                                >
                                  ✓ {r}
                                </Badge>
                              ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {prop.id && (
                            <Link href={`/properties/${prop.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowModal(true)}
                            title="Planifier une visite"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB TÂCHES ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">{tasks.length} tâche(s)</h3>
              <Link href={`/planification?prospectId=${prospectId}`}>
                <Button variant="outline" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Voir planification
                </Button>
              </Link>
            </div>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-gray-400">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p>Aucune tâche associée.</p>
                  <Link href="/planification">
                    <Button className="mt-4 bg-green-600 text-white" size="sm">
                      Créer une tâche
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task: any) => (
                <Card
                  key={task.id}
                  className={`border-l-4 ${task.status === 'completed' ? 'border-l-green-400 opacity-70' : task.priority === 'high' || task.priority === 'urgent' ? 'border-l-red-400' : 'border-l-yellow-400'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                        {task.dueDate && (
                          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Échéance : {fmtDate(task.dueDate)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          className={
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {task.status === 'completed'
                            ? '✅ Terminée'
                            : task.status === 'in_progress'
                              ? '🔄 En cours'
                              : '⏳ À faire'}
                        </Badge>
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className={
                              task.priority === 'urgent' || task.priority === 'high'
                                ? 'text-red-600 border-red-300'
                                : 'text-gray-500'
                            }
                          >
                            {task.priority === 'urgent'
                              ? '🔥 Urgent'
                              : task.priority === 'high'
                                ? '⚠️ Haute'
                                : task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ── TAB COMMS ── */}
        {activeTab === 'comms' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Communications</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/communications?prospectId=${prospectId}&type=email`)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/communications?prospectId=${prospectId}&type=sms`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>
            </div>
            {!prospect.communications || prospect.communications.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-gray-400">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p>Aucune communication enregistrée.</p>
                  <Button
                    size="sm"
                    className="bg-blue-600 text-white mt-4"
                    onClick={() => router.push(`/communications?prospectId=${prospectId}`)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              prospect.communications.slice(0, 10).map((comm: any) => (
                <Card key={comm.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${comm.channel === 'email' ? 'bg-blue-500' : comm.channel === 'sms' ? 'bg-green-500' : 'bg-purple-500'}`}
                      >
                        {comm.channel === 'email' ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm capitalize">{comm.channel}</span>
                          <span className="text-xs text-gray-400">
                            {fmtDateTime(comm.sentAt || comm.createdAt)}
                          </span>
                        </div>
                        {comm.subject && (
                          <div className="text-sm font-medium mt-1">{comm.subject}</div>
                        )}
                        {comm.content && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{comm.content}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${comm.status === 'sent' || comm.status === 'delivered' ? 'text-green-600 border-green-300' : 'text-gray-500'}`}
                          >
                            {comm.status === 'read'
                              ? '👁️ Lu'
                              : comm.status === 'delivered'
                                ? '✅ Délivré'
                                : '✉️ Envoyé'}
                          </Badge>
                          {comm.direction && (
                            <Badge variant="outline" className="text-xs">
                              {comm.direction === 'outbound' ? '↗ Sortant' : '↙ Entrant'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        <div className="text-xs text-gray-400 text-right pt-2">
          Créé le {fmtDate(prospect.createdAt)} · Mis à jour le {fmtDate(prospect.updatedAt)}
        </div>
      </div>
    </>
  );
}
