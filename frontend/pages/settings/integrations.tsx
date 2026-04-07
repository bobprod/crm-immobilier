import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { apiClient } from '@/shared/utils/backend-api';
import {
  MessageSquare,
  Mail,
  Send,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Info,
  Zap,
  Globe,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Save,
  Bot,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type TabId = 'communications' | 'tracking';

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  hint?: string;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
}

interface SectionDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl?: string;
  fields: FieldDef[];
  aiHint?: string;
}

interface SectionState {
  values: Record<string, string>;
  saving: boolean;
  testing: boolean;
  testResult: { success: boolean; message?: string; error?: string } | null;
  showSecrets: Record<string, boolean>;
  loading: boolean;
  dirty: boolean;
}

// ─────────────────────────────────────────────────────────────
// Section definitions
// ─────────────────────────────────────────────────────────────

const COMM_SECTIONS: SectionDef[] = [
  {
    id: 'whatsapp_meta',
    title: 'WhatsApp Business (Meta Cloud API)',
    description: 'API officielle Meta pour WhatsApp Business — gratuit jusqu\'à 1 000 conversations/mois.',
    icon: MessageSquare,
    color: 'green',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
    aiHint: 'L\'IA peut vous guider pas à pas pour créer votre application Meta et récupérer vos identifiants.',
    fields: [
      {
        key: 'phoneNumberId',
        label: 'Phone Number ID',
        placeholder: '123456789012345',
        hint: 'Trouvez cet ID dans Meta Business Suite > WhatsApp > Numéros de téléphone',
      },
      {
        key: 'businessAccountId',
        label: 'WhatsApp Business Account ID',
        placeholder: '987654321098765',
        hint: 'ID de votre compte WhatsApp Business',
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        placeholder: 'EAAxxxxxxxxxxxxxxx',
        secret: true,
        hint: 'Token permanent ou temporaire depuis Meta for Developers',
      },
      {
        key: 'appId',
        label: 'App ID (optionnel)',
        placeholder: '1234567890',
        hint: 'ID de l\'application Meta (pour la Conversion API)',
      },
      {
        key: 'appSecret',
        label: 'App Secret (optionnel)',
        placeholder: 'abc123...',
        secret: true,
        hint: 'Secret de l\'application Meta (pour la Conversion API)',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Verify Token',
        placeholder: 'mon-secret-webhook',
        secret: true,
        hint: 'Token personnalisé pour valider les webhooks entrants',
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp via Twilio',
    description: 'Intégration WhatsApp via Twilio — idéal pour les volumes élevés ou les envois programmés.',
    icon: MessageSquare,
    color: 'red',
    docsUrl: 'https://www.twilio.com/docs/whatsapp/api',
    fields: [
      {
        key: 'accountSid',
        label: 'Account SID',
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        hint: 'Depuis votre tableau de bord Twilio',
      },
      {
        key: 'authToken',
        label: 'Auth Token',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        secret: true,
        hint: 'Token d\'authentification Twilio',
      },
      {
        key: 'phoneNumber',
        label: 'Numéro WhatsApp Twilio',
        placeholder: '+14155238886',
        hint: 'Numéro Twilio au format E.164',
      },
    ],
  },
  {
    id: 'smtp',
    title: 'SMTP / Email',
    description: 'Serveur SMTP pour l\'envoi d\'emails transactionnels et notifications.',
    icon: Mail,
    color: 'blue',
    docsUrl: 'https://nodemailer.com/smtp/',
    aiHint: 'L\'IA peut détecter automatiquement les paramètres SMTP de votre hébergeur.',
    fields: [
      {
        key: 'host',
        label: 'Hôte SMTP',
        placeholder: 'smtp.gmail.com',
        hint: 'Exemple: smtp.gmail.com, smtp.office365.com, mail.yourhost.com',
      },
      {
        key: 'port',
        label: 'Port',
        placeholder: '587',
        type: 'select',
        options: [
          { value: '587', label: '587 (TLS — recommandé)' },
          { value: '465', label: '465 (SSL)' },
          { value: '25', label: '25 (SMTP standard — souvent bloqué)' },
          { value: '2525', label: '2525 (alternatif)' },
        ],
        hint: 'Le port 587 avec TLS est recommandé',
      },
      {
        key: 'user',
        label: 'Utilisateur / Email',
        placeholder: 'noreply@monagence.com',
        hint: 'Adresse email d\'authentification SMTP',
      },
      {
        key: 'password',
        label: 'Mot de passe SMTP',
        placeholder: '••••••••',
        secret: true,
        hint: 'Pour Gmail, utilisez un mot de passe d\'application (pas votre mot de passe principal)',
      },
      {
        key: 'fromEmail',
        label: 'Email expéditeur',
        placeholder: 'CRM Immobilier <noreply@monagence.com>',
        hint: 'Adresse affichée dans les emails envoyés',
      },
      {
        key: 'fromName',
        label: 'Nom expéditeur',
        placeholder: 'CRM Immobilier',
      },
    ],
  },
  {
    id: 'telegram',
    title: 'Telegram Bot',
    description: 'Notifications et communication via un bot Telegram.',
    icon: Send,
    color: 'sky',
    docsUrl: 'https://core.telegram.org/bots/tutorial',
    aiHint: 'Créez un bot Telegram en parlant à @BotFather sur Telegram.',
    fields: [
      {
        key: 'botToken',
        label: 'Token du Bot',
        placeholder: '1234567890:ABCDEFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        secret: true,
        hint: 'Obtenez ce token en créant un bot avec @BotFather sur Telegram',
      },
      {
        key: 'defaultChatId',
        label: 'Chat ID par défaut (optionnel)',
        placeholder: '-1001234567890',
        hint: 'ID du groupe ou canal par défaut pour les notifications',
      },
    ],
  },
];

const TRACKING_SECTIONS: SectionDef[] = [
  {
    id: 'tracking_meta',
    title: 'Meta Pixel + Conversion API',
    description: 'Pixel Facebook/Instagram et API de conversions côté serveur pour un tracking plus précis (iOS14+).',
    icon: Zap,
    color: 'blue',
    docsUrl: 'https://developers.facebook.com/docs/meta-pixel',
    aiHint: 'L\'IA peut installer automatiquement le pixel sur votre site vitrine et configurer les événements standards (ViewContent, Lead, Contact, CompleteRegistration).',
    fields: [
      {
        key: 'pixelId',
        label: 'Pixel ID',
        placeholder: '123456789012345',
        hint: 'Dans Meta Business Suite > Gestionnaire d\'événements > Sources de données',
      },
      {
        key: 'accessToken',
        label: 'Access Token (Conversion API)',
        placeholder: 'EAAxxxxxxxxxxxxxxx',
        secret: true,
        hint: 'Token pour la Conversion API côté serveur — améliore la précision du tracking',
      },
      {
        key: 'testEventCode',
        label: 'Test Event Code (optionnel)',
        placeholder: 'TEST12345',
        hint: 'Code de test pour déboguer les événements dans Meta Events Manager',
      },
    ],
  },
  {
    id: 'tracking_gtm',
    title: 'Google Tag Manager',
    description: 'Gérez tous vos scripts de tracking depuis un seul endroit sans modifier le code.',
    icon: Globe,
    color: 'orange',
    docsUrl: 'https://tagmanager.google.com/',
    aiHint: 'L\'IA peut générer un fichier JSON à importer dans GTM avec les tags et triggers préconfigurés pour votre CRM.',
    fields: [
      {
        key: 'containerId',
        label: 'Container ID',
        placeholder: 'GTM-XXXXXXX',
        hint: 'Format: GTM-XXXXXXX — trouvez-le dans votre compte GTM',
      },
      {
        key: 'serverContainerUrl',
        label: 'URL Container Server-Side (optionnel)',
        placeholder: 'https://gtm.monagence.com',
        hint: 'URL de votre container GTM server-side pour le tracking côté serveur',
      },
    ],
  },
  {
    id: 'tracking_ga4',
    title: 'Google Analytics 4',
    description: 'Suivi du comportement des visiteurs, conversions et parcours utilisateur.',
    icon: BarChart3,
    color: 'orange',
    docsUrl: 'https://analytics.google.com/',
    aiHint: 'L\'IA peut configurer automatiquement les événements GA4 (page_view, generate_lead, book_appointment) sur votre site vitrine.',
    fields: [
      {
        key: 'measurementId',
        label: 'Measurement ID',
        placeholder: 'G-XXXXXXXXXX',
        hint: 'Format: G-XXXXXXXXXX — dans GA4 > Admin > Flux de données',
      },
      {
        key: 'apiSecret',
        label: 'API Secret (Measurement Protocol)',
        placeholder: 'xxxxxxxxxxxxxxxx',
        secret: true,
        hint: 'Pour le tracking côté serveur via Measurement Protocol',
      },
    ],
  },
  {
    id: 'tracking_google_ads',
    title: 'Google Ads',
    description: 'Suivi des conversions Google Ads pour optimiser vos campagnes publicitaires.',
    icon: TrendingUp,
    color: 'green',
    docsUrl: 'https://ads.google.com/',
    fields: [
      {
        key: 'conversionId',
        label: 'Conversion ID',
        placeholder: 'AW-XXXXXXXXXX',
        hint: 'Format: AW-XXXXXXXXXX — dans Google Ads > Outils > Mesure > Conversions',
      },
      {
        key: 'conversionLabelLead',
        label: 'Label conversion Lead',
        placeholder: 'XXXXXXXXXXXXXXXX',
        hint: 'Label de conversion pour les leads',
      },
      {
        key: 'conversionLabelContact',
        label: 'Label conversion Contact',
        placeholder: 'XXXXXXXXXXXXXXXX',
        hint: 'Label de conversion pour les prises de contact',
      },
    ],
  },
  {
    id: 'tracking_search_console',
    title: 'Google Search Console',
    description: 'Vérification de propriété et suivi des performances de recherche.',
    icon: Globe,
    color: 'teal',
    docsUrl: 'https://search.google.com/search-console',
    aiHint: 'L\'IA peut ajouter automatiquement la balise de vérification sur votre site vitrine.',
    fields: [
      {
        key: 'verificationToken',
        label: 'Token de vérification HTML',
        placeholder: 'google1234567890abcdef.html',
        hint: 'Depuis Search Console > Paramètres > Propriété > Vérification — méthode fichier HTML',
      },
      {
        key: 'sitemapUrl',
        label: 'URL du Sitemap (optionnel)',
        placeholder: 'https://monagence.com/sitemap.xml',
        hint: 'URL de votre sitemap pour une meilleure indexation',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  icon: 'text-green-600',  badge: 'bg-green-100 text-green-800' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'text-red-600',    badge: 'bg-red-100 text-red-800' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-800' },
  sky:    { bg: 'bg-sky-50',    border: 'border-sky-200',    icon: 'text-sky-600',    badge: 'bg-sky-100 text-sky-800' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   icon: 'text-teal-600',   badge: 'bg-teal-100 text-teal-800' },
};

function initSectionState(): SectionState {
  return {
    values: {},
    saving: false,
    testing: false,
    testResult: null,
    showSecrets: {},
    loading: true,
    dirty: false,
  };
}

// ─────────────────────────────────────────────────────────────
// Section Card Component
// ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: SectionDef;
  state: SectionState;
  onValueChange: (key: string, val: string) => void;
  onToggleSecret: (key: string) => void;
  onSave: () => void;
  onTest: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  state,
  onValueChange,
  onToggleSecret,
  onSave,
  onTest,
}) => {
  const [expanded, setExpanded] = useState(false);
  const colors = COLOR_MAP[section.color] || COLOR_MAP.blue;
  const Icon = section.icon;

  const hasAnyValue = Object.values(state.values).some((v) => v && v.trim() !== '');
  const isConfigured = hasAnyValue;

  return (
    <Card className={`border ${colors.border} transition-shadow hover:shadow-md`}>
      <CardHeader className={`${colors.bg} rounded-t-lg py-4 px-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/70 ${colors.icon}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">{section.title}</CardTitle>
              <p className="text-xs text-gray-600 mt-0.5 max-w-md">{section.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {state.loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : isConfigured ? (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.badge}`}>
                Configuré
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                Non configuré
              </span>
            )}

            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 rounded-md hover:bg-white/50 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4 pb-5 px-5">
          {/* AI Hint */}
          {section.aiHint && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg mb-4">
              <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-800">{section.aiHint}</p>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>

                {field.type === 'select' && field.options ? (
                  <select
                    value={state.values[field.key] || ''}
                    onChange={(e) => onValueChange(field.key, e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.secret ? (
                  <div className="relative">
                    <Input
                      type={state.showSecrets[field.key] ? 'text' : 'password'}
                      placeholder={field.placeholder}
                      value={state.values[field.key] || ''}
                      onChange={(e) => onValueChange(field.key, e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => onToggleSecret(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {state.showSecrets[field.key] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <Input
                    type="text"
                    placeholder={field.placeholder}
                    value={state.values[field.key] || ''}
                    onChange={(e) => onValueChange(field.key, e.target.value)}
                  />
                )}

                {field.hint && (
                  <p className="mt-1 text-xs text-gray-500 flex items-start gap-1">
                    <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {field.hint}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Test result */}
          {state.testResult && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                state.testResult.success
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {state.testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{state.testResult.success ? state.testResult.message : state.testResult.error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onSave}
              disabled={state.saving || !state.dirty}
            >
              {state.saving ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              Enregistrer
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onTest}
              disabled={state.testing || !hasAnyValue}
            >
              {state.testing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1.5" />
              )}
              Tester la connexion
            </Button>

            {section.docsUrl && (
              <a
                href={section.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline ml-auto"
              >
                Documentation
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function IntegrationsSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('communications');
  const [states, setStates] = useState<Record<string, SectionState>>(() => {
    const init: Record<string, SectionState> = {};
    [...COMM_SECTIONS, ...TRACKING_SECTIONS].forEach((s) => {
      init[s.id] = initSectionState();
    });
    return init;
  });

  // ── Load saved settings on mount ──
  useEffect(() => {
    const allSections = [...COMM_SECTIONS, ...TRACKING_SECTIONS];
    const loadSection = async (section: SectionDef) => {
      try {
        const res = await apiClient.get(`/settings/${section.id}`);
        const data: { key: string; value: string }[] = Array.isArray(res.data) ? res.data : [];
        const values: Record<string, string> = {};
        data.forEach((d) => {
          values[d.key] = d.value;
        });
        setStates((prev) => ({
          ...prev,
          [section.id]: { ...prev[section.id], values, loading: false, dirty: false },
        }));
      } catch {
        setStates((prev) => ({
          ...prev,
          [section.id]: { ...prev[section.id], loading: false },
        }));
      }
    };
    void Promise.all(allSections.map(loadSection));
  }, []);

  const updateValue = useCallback((sectionId: string, key: string, val: string) => {
    setStates((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        values: { ...prev[sectionId].values, [key]: val },
        dirty: true,
        testResult: null,
      },
    }));
  }, []);

  const toggleSecret = useCallback((sectionId: string, key: string) => {
    setStates((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        showSecrets: {
          ...prev[sectionId].showSecrets,
          [key]: !prev[sectionId].showSecrets[key],
        },
      },
    }));
  }, []);

  const handleSave = useCallback(
    async (section: SectionDef) => {
      const state = states[section.id];
      setStates((prev) => ({ ...prev, [section.id]: { ...prev[section.id], saving: true } }));

      try {
        const settings = section.fields
          .filter((f) => state.values[f.key] !== undefined && state.values[f.key] !== '')
          .map((f) => ({
            key: f.key,
            value: state.values[f.key],
            encrypted: f.secret === true,
          }));

        await apiClient.post(`/settings/${section.id}/bulk`, { settings });

        setStates((prev) => ({
          ...prev,
          [section.id]: { ...prev[section.id], saving: false, dirty: false },
        }));
      } catch (err: any) {
        setStates((prev) => ({
          ...prev,
          [section.id]: {
            ...prev[section.id],
            saving: false,
            testResult: {
              success: false,
              error: err?.response?.data?.message || err.message || 'Erreur lors de la sauvegarde',
            },
          },
        }));
      }
    },
    [states],
  );

  const handleTest = useCallback(
    async (section: SectionDef) => {
      setStates((prev) => ({
        ...prev,
        [section.id]: { ...prev[section.id], testing: true, testResult: null },
      }));

      try {
        // Save first if dirty
        if (states[section.id].dirty) {
          await handleSave(section);
        }

        const res = await apiClient.post(`/settings/${section.id}/test`);
        setStates((prev) => ({
          ...prev,
          [section.id]: { ...prev[section.id], testing: false, testResult: res.data },
        }));
      } catch (err: any) {
        setStates((prev) => ({
          ...prev,
          [section.id]: {
            ...prev[section.id],
            testing: false,
            testResult: {
              success: false,
              error: err?.response?.data?.message || err.message || 'Erreur de connexion',
            },
          },
        }));
      }
    },
    [states, handleSave],
  );

  const TABS: { id: TabId; label: string; icon: React.ElementType; sections: SectionDef[] }[] = [
    {
      id: 'communications',
      label: 'Communications',
      icon: MessageSquare,
      sections: COMM_SECTIONS,
    },
    {
      id: 'tracking',
      label: 'Tracking & Analytics',
      icon: BarChart3,
      sections: TRACKING_SECTIONS,
    },
  ];

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <MainLayout
      title="Intégrations"
      breadcrumbs={[
        { label: 'Paramètres', href: '/settings' },
        { label: 'Intégrations' },
      ]}
    >
      <Head>
        <title>Intégrations — CRM Immobilier</title>
      </Head>

      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intégrations & Paramétrage</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configurez vos canaux de communication, pixels de tracking et outils analytics.
            Les secrets sont chiffrés avant d'être sauvegardés.
          </p>
        </div>

        {/* AI Banner */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Bot className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">Assistant IA disponible</p>
            <p className="text-xs text-purple-700 mt-0.5">
              L'assistant IA peut configurer automatiquement les tags, pixels et intégrations sur votre site vitrine.
              Pour les utilisateurs non techniques, l'IA guidera chaque étape et vérifiera les configurations.
              Accédez à l'assistant depuis le menu{' '}
              <a href="/ai-assistant" className="underline font-medium">IA Assistant</a>.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {currentTab.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              state={states[section.id]}
              onValueChange={(key, val) => updateValue(section.id, key, val)}
              onToggleSecret={(key) => toggleSecret(section.id, key)}
              onSave={() => handleSave(section)}
              onTest={() => handleTest(section)}
            />
          ))}
        </div>

        {activeTab === 'tracking' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold mb-1">💡 Synchronisation avec le site vitrine</p>
            <p className="text-xs">
              Une fois configurés, les pixels et tags sont automatiquement synchronisés avec votre{' '}
              <a href="/vitrine" className="underline font-medium">site vitrine</a>.
              L'IA vérifie la cohérence des configurations et peut corriger les tags manquants ou mal positionnés.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
