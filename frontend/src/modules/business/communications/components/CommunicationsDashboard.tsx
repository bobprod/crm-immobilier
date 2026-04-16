import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import communicationsService, {
  Communication,
  Template,
  CreateTemplateDto,
} from '@/modules/communications/communications.service';
import apiClient from '@/shared/utils/backend-api';
import {
  Mail,
  MessageCircle,
  Phone,
  Send,
  Hash,
  Instagram,
  Linkedin,
  Globe,
  Plus,
  RefreshCw,
  X,
  Sparkles,
  Search,
  Settings,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  WifiOff,
  ChevronRight,
  Clock,
  Loader2,
} from 'lucide-react';

type ChannelType =
  | 'all'
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'linkedin'
  | 'other';

interface CommunicationsDashboardProps {
  language?: 'fr' | 'en';
}

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  type?: string;
  status?: string;
}

const CHANNELS: {
  id: ChannelType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    id: 'all',
    label: 'Tous',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-gray-700',
    bg: 'border-gray-300',
  },
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    color: 'text-blue-600',
    bg: 'border-blue-500 bg-blue-50',
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: <Phone className="w-4 h-4" />,
    color: 'text-emerald-600',
    bg: 'border-emerald-500 bg-emerald-50',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-green-600',
    bg: 'border-green-500 bg-green-50',
  },
  {
    id: 'messenger',
    label: 'Messenger',
    icon: <Send className="w-4 h-4" />,
    color: 'text-purple-600',
    bg: 'border-purple-500 bg-purple-50',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="w-4 h-4" />,
    color: 'text-pink-600',
    bg: 'border-pink-500 bg-pink-50',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    color: 'text-sky-700',
    bg: 'border-sky-500 bg-sky-50',
  },
  {
    id: 'other',
    label: 'Autre',
    icon: <Hash className="w-4 h-4" />,
    color: 'text-gray-600',
    bg: 'border-gray-400 bg-gray-50',
  },
];

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  opened: 'bg-purple-100 text-purple-700',
  clicked: 'bg-indigo-100 text-indigo-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Envoyé',
  delivered: 'Délivré',
  opened: 'Ouvert',
  clicked: 'Cliqué',
  failed: 'Échoué',
  pending: 'En attente',
};

const getChannelInfo = (type: string) =>
  CHANNELS.find((c) => c.id === type) || CHANNELS[CHANNELS.length - 1];

export const CommunicationsDashboard: React.FC<CommunicationsDashboardProps> = ({
  language = 'fr',
}) => {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<ChannelType>('all');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [composerChannel, setComposerChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null);

  // Composer form
  const [formTo, setFormTo] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Prospect picker
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [prospectSearch, setProspectSearch] = useState('');
  const [prospectResults, setProspectResults] = useState<Prospect[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [showProspectDropdown, setShowProspectDropdown] = useState(false);
  const prospectDropdownRef = useRef<HTMLDivElement>(null);

  // Post-send follow-up
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [lastSentProspectId, setLastSentProspectId] = useState<string | null>(null);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = activeChannel !== 'all' ? { type: activeChannel } : undefined;
      const [comms, statsData, tpls, settingsData] = await Promise.all([
        communicationsService.getHistory(filter).catch(() => []),
        communicationsService.getStats().catch(() => null),
        communicationsService.getTemplates().catch(() => []),
        communicationsService.getSettings().catch(() => null),
      ]);
      setCommunications(comms);
      setStats(statsData);
      setTemplates(tpls);
      if (settingsData) setSmtpConfigured(settingsData.smtpConfigured);
    } catch (err) {
      console.error('Error loading communications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close prospect dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (prospectDropdownRef.current && !prospectDropdownRef.current.contains(e.target as Node)) {
        setShowProspectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search prospects with debounce
  useEffect(() => {
    if (!prospectSearch || prospectSearch.length < 2) {
      setProspectResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingProspects(true);
      try {
        const response = await apiClient.get('/prospects', {
          params: { search: prospectSearch, limit: 8 },
        });
        const data = response.data;
        setProspectResults(Array.isArray(data) ? data : data.data || []);
        setShowProspectDropdown(true);
      } catch {
        setProspectResults([]);
      } finally {
        setLoadingProspects(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [prospectSearch]);

  const selectProspect = (p: Prospect) => {
    setSelectedProspect(p);
    setShowProspectDropdown(false);
    setProspectSearch('');
    // Auto-fill contact info based on channel
    if (composerChannel === 'email') {
      setFormTo(p.email || '');
    } else {
      setFormTo(p.phone || '');
    }
  };

  const clearProspect = () => {
    setSelectedProspect(null);
    setFormTo('');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTo.trim() || !formBody.trim()) {
      setError('Destinataire et message sont requis');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const prospectId = selectedProspect?.id;
      if (composerChannel === 'email') {
        await communicationsService.sendEmail({
          to: formTo,
          subject: formSubject,
          body: formBody,
          prospectId,
        });
      } else if (composerChannel === 'sms') {
        await communicationsService.sendSms({ to: formTo, message: formBody, prospectId });
      } else {
        await communicationsService.sendWhatsApp({ to: formTo, message: formBody, prospectId });
      }
      const prospectName = selectedProspect
        ? `${selectedProspect.firstName} ${selectedProspect.lastName}`
        : formTo;
      setSuccess(`Message ${composerChannel} envoyé à ${prospectName} !`);
      setLastSentProspectId(prospectId || null);
      setFormTo('');
      setFormSubject('');
      setFormBody('');
      setSelectedProspect(null);
      setShowComposer(false);
      if (prospectId) setShowFollowUp(true);
      setTimeout(() => setSuccess(null), 6000);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      if (composerChannel === 'email') {
        const result = await communicationsService.generateSmartEmail({
          prospectId: selectedProspect?.id,
          purpose: formSubject || 'follow-up',
        });
        setFormSubject(result.subject);
        setFormBody(result.body);
      } else {
        const result = await communicationsService.generateSmartSMS({
          prospectId: selectedProspect?.id,
          purpose: formBody || 'rappel',
        });
        setFormBody(result.body || '');
      }
    } catch {
      setError('Erreur IA — réessayez');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateFollowUp = async (type: 'appointment' | 'task') => {
    if (!lastSentProspectId) return;
    setCreatingFollowUp(true);
    try {
      if (type === 'appointment') {
        await apiClient.post('/appointments', {
          prospectId: lastSentProspectId,
          title: 'Suivi communication',
          date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
          type: 'call',
          notes: 'Créé automatiquement après envoi de message',
        });
      } else {
        await apiClient.post('/tasks', {
          prospectId: lastSentProspectId,
          title: 'Suivi message envoyé',
          dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
          priority: 'medium',
        });
      }
      setShowFollowUp(false);
      setSuccess('Suivi planifié avec succès !');
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      // Silently ignore — planning may not be configured
      setShowFollowUp(false);
    } finally {
      setCreatingFollowUp(false);
    }
  };

  // Stats
  const totalComms = communications.length;
  const sentCount = communications.filter(
    (c) => c.status === 'sent' || c.status === 'delivered'
  ).length;
  const pendingCount = communications.filter(
    (c) => !c.status || (c.status as any) === 'pending'
  ).length;
  const failedCount = communications.filter((c) => c.status === 'failed').length;
  const openedCount = communications.filter(
    (c) => c.status === 'opened' || c.status === 'clicked'
  ).length;
  const channelBreakdown = CHANNELS.filter((c) => c.id !== 'all').map((ch) => ({
    ...ch,
    count: communications.filter((c) => c.type === ch.id).length,
  }));
  const filtered = communications.filter(
    (c) =>
      !searchQuery ||
      c.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.prospects &&
        `${c.prospects.firstName} ${c.prospects.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centre de Communication</h1>
          <p className="text-gray-500 mt-1">Orchestration multi-canal centralisée</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* SMTP status badge */}
          {smtpConfigured === false && (
            <button
              onClick={() => router.push('/settings/communications')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs hover:bg-amber-100 transition"
            >
              <WifiOff className="w-3.5 h-3.5" /> Email non configuré
            </button>
          )}
          <button
            onClick={() => router.push('/settings/communications')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            title="Paramètres communications"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={loadData}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Templates ({templates.length})
          </button>
          <button
            onClick={() => {
              setShowComposer(true);
              setComposerChannel('email');
              setSelectedProspect(null);
              setFormTo('');
              setFormSubject('');
              setFormBody('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau message
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Post-send follow-up prompt */}
      {showFollowUp && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Planifier un suivi ?</p>
              <p className="text-xs text-blue-600">
                Message envoyé — voulez-vous créer un suivi avec ce prospect ?
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleCreateFollowUp('appointment')}
              disabled={creatingFollowUp}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1"
            >
              {creatingFollowUp ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              RDV
            </button>
            <button
              onClick={() => handleCreateFollowUp('task')}
              disabled={creatingFollowUp}
              className="px-3 py-1.5 text-xs rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 transition flex items-center gap-1"
            >
              <Clock className="w-3 h-3" /> Tâche
            </button>
            <button
              onClick={() => setShowFollowUp(false)}
              className="p-1.5 text-blue-400 hover:text-blue-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: totalComms, color: 'text-gray-900' },
          { label: 'Envoyés', value: sentCount, color: 'text-green-700' },
          { label: 'Ouverts', value: openedCount, color: 'text-purple-700' },
          { label: 'En attente', value: pendingCount, color: 'text-amber-700' },
          { label: 'Échoués', value: failedCount, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Channel Tabs + history */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center gap-1 px-4 py-3 border-b overflow-x-auto">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition ${
                activeChannel === ch.id
                  ? `${ch.bg} ${ch.color} border`
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {ch.icon} {ch.label}
              {ch.id !== 'all' && (
                <span className="text-xs opacity-70">
                  ({communications.filter((c) => c.type === ch.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par prospect, sujet ou contenu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Channel breakdown on "all" */}
        {activeChannel === 'all' && totalComms > 0 && (
          <div className="px-4 py-2 border-b flex items-center gap-4 overflow-x-auto bg-gray-50">
            {channelBreakdown
              .filter((ch) => ch.count > 0)
              .map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id as ChannelType)}
                  className="flex items-center gap-1.5 text-sm hover:opacity-80 transition"
                >
                  <span className={ch.color}>{ch.icon}</span>
                  <span className="font-medium text-gray-700">{ch.label}</span>
                  <span className="text-gray-400">{ch.count}</span>
                </button>
              ))}
          </div>
        )}

        {/* History list */}
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune communication</h3>
              <p className="text-gray-500 mb-4">
                {activeChannel === 'all'
                  ? 'Envoyez votre premier message multi-canal'
                  : `Aucun message ${CHANNELS.find((c) => c.id === activeChannel)?.label}`}
              </p>
              <button
                onClick={() => setShowComposer(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" /> Nouveau message
              </button>
            </div>
          ) : (
            filtered.slice(0, 50).map((comm) => {
              const ch = getChannelInfo(comm.type);
              const prospectName = comm.prospects
                ? `${comm.prospects.firstName} ${comm.prospects.lastName}`
                : null;
              return (
                <div
                  key={comm.id}
                  className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3 cursor-pointer group"
                >
                  <div className={`p-2 rounded-lg ${ch.bg} border shrink-0`}>
                    <span className={ch.color}>{ch.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {prospectName ? (
                        <span className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {prospectName}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-700 text-sm truncate">
                          {comm.to}
                        </span>
                      )}
                      {prospectName && (
                        <span className="text-xs text-gray-400 truncate">{comm.to}</span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[comm.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABELS[comm.status] || comm.status}
                      </span>
                    </div>
                    {comm.subject && (
                      <p className="text-sm text-gray-600 truncate">{comm.subject}</p>
                    )}
                    <p className="text-xs text-gray-400 truncate">{comm.body?.slice(0, 100)}</p>
                  </div>
                  {comm.prospectId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/prospects/${comm.prospectId}`);
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Voir le prospect"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <div className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {comm.sentAt
                      ? new Date(comm.sentAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== COMPOSER MODAL ===== */}
      {showComposer && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowComposer(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">Nouveau message</h2>
              <button
                onClick={() => setShowComposer(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Channel selector */}
            <div className="flex gap-2 px-6 pt-4">
              {(['email', 'sms', 'whatsapp'] as const).map((ch) => {
                const info = getChannelInfo(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      setComposerChannel(ch);
                      if (selectedProspect) {
                        setFormTo(
                          ch === 'email'
                            ? selectedProspect.email || ''
                            : selectedProspect.phone || ''
                        );
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border ${
                      composerChannel === ch
                        ? `${info.bg} ${info.color}`
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {info.icon} {info.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-4">
              {/* Prospect picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prospect (optionnel)
                </label>
                {selectedProspect ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <User className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-900">
                        {selectedProspect.firstName} {selectedProspect.lastName}
                      </p>
                      <p className="text-xs text-blue-600 truncate">
                        {selectedProspect.email || selectedProspect.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearProspect}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={prospectDropdownRef}>
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un prospect..."
                      value={prospectSearch}
                      onChange={(e) => setProspectSearch(e.target.value)}
                      onFocus={() => prospectSearch.length >= 2 && setShowProspectDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    {loadingProspects && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 animate-spin" />
                    )}
                    {showProspectDropdown && prospectResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {prospectResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProspect(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition"
                          >
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {p.firstName} {p.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{p.email || p.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* To field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {composerChannel === 'email' ? 'Email destinataire *' : 'Numéro de téléphone *'}
                </label>
                <input
                  type={composerChannel === 'email' ? 'email' : 'tel'}
                  value={formTo}
                  onChange={(e) => setFormTo(e.target.value)}
                  placeholder={
                    composerChannel === 'email' ? 'contact@example.com' : '+216 XX XXX XXX'
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {composerChannel === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Objet du message..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Message *</label>
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Générer avec IA
                    {selectedProspect && (
                      <span className="text-purple-400">(contexte prospect)</span>
                    )}
                  </button>
                </div>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Votre message..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={composerChannel === 'email' ? 6 : 4}
                  required
                />
                {composerChannel === 'sms' && (
                  <p className="text-xs text-gray-400 mt-1">{formBody.length}/160 caractères</p>
                )}
              </div>

              {/* Template quick-select */}
              {templates.filter((t) => t.type === composerChannel).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template rapide
                  </label>
                  <select
                    onChange={(e) => {
                      const tpl = templates.find((t) => t.id === e.target.value);
                      if (tpl) {
                        setFormBody(tpl.content);
                        if (tpl.subject) setFormSubject(tpl.subject);
                      }
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="">-- Choisir un template --</option>
                    {templates
                      .filter((t) => t.type === composerChannel)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== TEMPLATES PANEL ===== */}
      {showTemplates && (
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Templates</h2>
            <button
              onClick={() => setShowTemplates(false)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Aucun template créé</div>
          ) : (
            <div className="divide-y">
              {templates.map((tpl) => {
                const ch = getChannelInfo(tpl.type);
                return (
                  <div
                    key={tpl.id}
                    className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setShowComposer(true);
                      setComposerChannel(tpl.type as 'email' | 'sms' | 'whatsapp');
                      setFormBody(tpl.content);
                      if (tpl.subject) setFormSubject(tpl.subject);
                      setShowTemplates(false);
                    }}
                  >
                    <span className={ch.color}>{ch.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tpl.name}</p>
                      <p className="text-xs text-gray-400 truncate">{tpl.content.slice(0, 80)}</p>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{tpl.type}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
