import React, { useState, useEffect, useCallback } from 'react';
import communicationsService, { Communication, Template, SendEmailDto, SendSmsDto, SendWhatsAppDto, CreateTemplateDto } from '@/modules/communications/communications.service';
import { Mail, MessageCircle, Phone, Send, Hash, Instagram, Linkedin, Globe, Plus, RefreshCw, X, Sparkles, ChevronDown, Search, Filter } from 'lucide-react';

type ChannelType = 'all' | 'email' | 'sms' | 'whatsapp' | 'messenger' | 'instagram' | 'linkedin' | 'other';

interface CommunicationsDashboardProps {
    language?: 'fr' | 'en';
}

const CHANNELS: { id: ChannelType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { id: 'all', label: 'Tous', icon: <Globe className="w-4 h-4" />, color: 'text-gray-700', bg: 'border-gray-300' },
    { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, color: 'text-blue-600', bg: 'border-blue-500 bg-blue-50' },
    { id: 'sms', label: 'SMS', icon: <Phone className="w-4 h-4" />, color: 'text-emerald-600', bg: 'border-emerald-500 bg-emerald-50' },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />, color: 'text-green-600', bg: 'border-green-500 bg-green-50' },
    { id: 'messenger', label: 'Messenger', icon: <Send className="w-4 h-4" />, color: 'text-purple-600', bg: 'border-purple-500 bg-purple-50' },
    { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" />, color: 'text-pink-600', bg: 'border-pink-500 bg-pink-50' },
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, color: 'text-sky-700', bg: 'border-sky-500 bg-sky-50' },
    { id: 'other', label: 'Autre', icon: <Hash className="w-4 h-4" />, color: 'text-gray-600', bg: 'border-gray-400 bg-gray-50' },
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
    sent: 'Envoyé', delivered: 'Délivré', opened: 'Ouvert', clicked: 'Cliqué', failed: 'Échoué', pending: 'En attente',
};

const getChannelInfo = (type: string) => CHANNELS.find(c => c.id === type) || CHANNELS[CHANNELS.length - 1];

export const CommunicationsDashboard: React.FC<CommunicationsDashboardProps> = ({ language = 'fr' }) => {
    const [activeChannel, setActiveChannel] = useState<ChannelType>('all');
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showComposer, setShowComposer] = useState(false);
    const [composerChannel, setComposerChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
    const [searchQuery, setSearchQuery] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);

    // Composer form
    const [formTo, setFormTo] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [formBody, setFormBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const filter = activeChannel !== 'all' ? { type: activeChannel } : undefined;
            const [comms, statsData, tpls] = await Promise.all([
                communicationsService.getHistory(filter).catch(() => []),
                communicationsService.getStats().catch(() => null),
                communicationsService.getTemplates().catch(() => []),
            ]);
            setCommunications(comms);
            setStats(statsData);
            setTemplates(tpls);
        } catch (err) {
            console.error('Error loading communications:', err);
        } finally {
            setLoading(false);
        }
    }, [activeChannel]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTo.trim() || !formBody.trim()) {
            setError('Destinataire et message sont requis');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            if (composerChannel === 'email') {
                await communicationsService.sendEmail({ to: formTo, subject: formSubject, body: formBody });
            } else if (composerChannel === 'sms') {
                await communicationsService.sendSms({ to: formTo, message: formBody });
            } else {
                await communicationsService.sendWhatsApp({ to: formTo, message: formBody });
            }
            setSuccess(`Message ${composerChannel} envoyé avec succès !`);
            setFormTo(''); setFormSubject(''); setFormBody('');
            setShowComposer(false);
            setTimeout(() => setSuccess(null), 4000);
            await loadData();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Erreur lors de l\'envoi');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAiGenerate = async () => {
        try {
            if (composerChannel === 'email') {
                const result = await communicationsService.generateSmartEmail({ purpose: formSubject || 'follow-up' });
                setFormSubject(result.subject);
                setFormBody(result.body);
            } else {
                const result = await communicationsService.generateSmartSMS({ purpose: formBody || 'rappel' });
                setFormBody(result.body || '');
            }
        } catch { setError('Erreur IA — réessayez'); }
    };

    // Stats computed from data
    const totalComms = communications.length;
    const sentCount = communications.filter(c => c.status === 'sent' || c.status === 'delivered').length;
    const pendingCount = communications.filter(c => !c.status || c.status === 'pending' as any).length;
    const failedCount = communications.filter(c => c.status === 'failed').length;
    const openedCount = communications.filter(c => c.status === 'opened' || c.status === 'clicked').length;

    // Channel breakdown
    const channelBreakdown = CHANNELS.filter(c => c.id !== 'all').map(ch => ({
        ...ch,
        count: communications.filter(c => c.type === ch.id).length,
    }));

    // Filter by search
    const filtered = communications.filter(c =>
        !searchQuery || c.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.body?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Centre de Communication</h1>
                    <p className="text-gray-500 mt-1">Orchestration multi-canal centralisée</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadData} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Rafraîchir">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setShowTemplates(!showTemplates)} className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
                        Templates ({templates.length})
                    </button>
                    <button onClick={() => { setShowComposer(true); setComposerChannel('email'); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm">
                        <Plus className="w-4 h-4" /> Nouveau message
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {success}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="text-2xl font-bold">{totalComms}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-green-600 mb-1">Envoyés</p>
                    <p className="text-2xl font-bold text-green-700">{sentCount}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-purple-600 mb-1">Ouverts</p>
                    <p className="text-2xl font-bold text-purple-700">{openedCount}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-amber-600 mb-1">En attente</p>
                    <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-red-500 mb-1">Échoués</p>
                    <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                </div>
            </div>

            {/* Channel Tabs */}
            <div className="bg-white rounded-xl border">
                <div className="flex items-center gap-1 px-4 py-3 border-b overflow-x-auto">
                    {CHANNELS.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => setActiveChannel(ch.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition ${activeChannel === ch.id
                                ? `${ch.bg} ${ch.color} border`
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {ch.icon}
                            {ch.label}
                            {ch.id !== 'all' && (
                                <span className="text-xs opacity-70">
                                    ({communications.filter(c => ch.id === 'all' ? true : c.type === ch.id).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search bar */}
                <div className="px-4 py-3 border-b">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par destinataire, sujet ou contenu..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Channel Breakdown (only on "all" tab) */}
                {activeChannel === 'all' && totalComms > 0 && (
                    <div className="px-4 py-3 border-b flex items-center gap-4 overflow-x-auto">
                        {channelBreakdown.filter(ch => ch.count > 0).map(ch => (
                            <div key={ch.id} className="flex items-center gap-2 text-sm">
                                <span className={ch.color}>{ch.icon}</span>
                                <span className="font-medium">{ch.label}</span>
                                <span className="text-gray-400">{ch.count}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Messages List */}
                <div className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune communication</h3>
                            <p className="text-gray-500 mb-4">
                                {activeChannel === 'all'
                                    ? 'Envoyez votre premier message multi-canal'
                                    : `Aucun message ${CHANNELS.find(c => c.id === activeChannel)?.label}`}
                            </p>
                            <button onClick={() => setShowComposer(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                                <Plus className="w-4 h-4 inline mr-1" /> Nouveau message
                            </button>
                        </div>
                    ) : (
                        filtered.slice(0, 50).map(comm => {
                            const ch = getChannelInfo(comm.type);
                            return (
                                <div key={comm.id} className="px-4 py-3 hover:bg-gray-50 flex items-center gap-4 cursor-pointer">
                                    <div className={`p-2 rounded-lg ${ch.bg} border`}>
                                        <span className={ch.color}>{ch.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 text-sm truncate">{comm.to}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[comm.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {STATUS_LABELS[comm.status] || comm.status}
                                            </span>
                                        </div>
                                        {comm.subject && <p className="text-sm text-gray-600 truncate">{comm.subject}</p>}
                                        <p className="text-xs text-gray-400 truncate">{comm.body?.slice(0, 100)}</p>
                                    </div>
                                    <div className="text-xs text-gray-400 whitespace-nowrap">
                                        {comm.sentAt ? new Date(comm.sentAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ===== COMPOSER MODAL ===== */}
            {showComposer && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowComposer(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-bold">Nouveau message</h2>
                            <button onClick={() => setShowComposer(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Channel selector */}
                        <div className="flex gap-2 px-6 pt-4">
                            {(['email', 'sms', 'whatsapp'] as const).map(ch => {
                                const info = getChannelInfo(ch);
                                return (
                                    <button
                                        key={ch}
                                        onClick={() => setComposerChannel(ch)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border ${composerChannel === ch
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {composerChannel === 'email' ? 'Email destinataire *' : 'Numéro de téléphone *'}
                                </label>
                                <input
                                    type={composerChannel === 'email' ? 'email' : 'tel'}
                                    value={formTo}
                                    onChange={e => setFormTo(e.target.value)}
                                    placeholder={composerChannel === 'email' ? 'contact@example.com' : '+216 XX XXX XXX'}
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
                                        onChange={e => setFormSubject(e.target.value)}
                                        placeholder="Objet du message..."
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Message *</label>
                                    <button type="button" onClick={handleAiGenerate} className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Générer avec IA
                                    </button>
                                </div>
                                <textarea
                                    value={formBody}
                                    onChange={e => setFormBody(e.target.value)}
                                    placeholder="Votre message..."
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={composerChannel === 'email' ? 6 : 4}
                                    required
                                />
                                {composerChannel === 'sms' && (
                                    <p className="text-xs text-gray-400 mt-1">{formBody.length}/160 caractères</p>
                                )}
                            </div>
                            {/* Template quick-select */}
                            {templates.filter(t => t.type === composerChannel).length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Template rapide</label>
                                    <select
                                        onChange={e => {
                                            const tpl = templates.find(t => t.id === e.target.value);
                                            if (tpl) {
                                                setFormBody(tpl.content);
                                                if (tpl.subject) setFormSubject(tpl.subject);
                                            }
                                        }}
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        defaultValue=""
                                    >
                                        <option value="">-- Choisir un template --</option>
                                        {templates.filter(t => t.type === composerChannel).map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowComposer(false)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm">
                                    Annuler
                                </button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2">
                                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
                        <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                    {templates.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Aucun template créé</div>
                    ) : (
                        <div className="divide-y">
                            {templates.map(tpl => {
                                const ch = getChannelInfo(tpl.type);
                                return (
                                    <div key={tpl.id} className="px-6 py-3 flex items-center gap-3">
                                        <span className={ch.color}>{ch.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{tpl.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{tpl.content.slice(0, 80)}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{tpl.type}</span>
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

export default CommunicationsDashboard;
