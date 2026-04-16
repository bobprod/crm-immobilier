import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { apiClient } from '@/shared/utils/backend-api';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Key,
  Brain,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  Phone,
  Server,
  Send,
  Wifi,
  WifiOff,
  Facebook,
  Instagram,
  Globe,
  Link2,
  Hash,
  Linkedin,
  Video,
  Building,
  BarChart3,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  Info,
  Bot,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  validateApiKey,
  getAvailableModels,
  validateScrapingApiKey,
} from '../../utils/api-key-validators';

type TabType = 'profile' | 'api-keys' | 'llm' | 'security' | 'communications' | 'tracking';

type EmailProvider = 'smtp' | 'resend' | 'sendgrid';

interface CommSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  whatsappApiKey: string;
  whatsappPhoneNumberId: string;
  emailProvider: EmailProvider;
  resendApiKey: string;
  sendgridApiKey: string;
  smtpConfigured: boolean;
  twilioConfigured: boolean;
  // Meta Platform
  metaAppId: string;
  metaAppSecret: string;
  metaPageAccessToken: string;
  metaPageId: string;
  metaInstagramAccountId: string;
  metaWebhookVerifyToken: string;
  metaGraphApiVersion: string;
  metaConfigured: boolean;
  instagramConfigured: boolean;
  // TikTok Business
  tiktokAppId: string;
  tiktokAppSecret: string;
  tiktokAccessToken: string;
  tiktokBusinessId: string;
  tiktokWebhookSecret: string;
  tiktokConfigured: boolean;
  // LinkedIn Page
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinAccessToken: string;
  linkedinOrganizationId: string;
  linkedinConfigured: boolean;
}

const DEFAULT_COMM_SETTINGS: CommSettings = {
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  smtpFrom: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  whatsappApiKey: '',
  whatsappPhoneNumberId: '',
  emailProvider: 'smtp',
  resendApiKey: '',
  sendgridApiKey: '',
  smtpConfigured: false,
  twilioConfigured: false,
  // Meta Platform
  metaAppId: '',
  metaAppSecret: '',
  metaPageAccessToken: '',
  metaPageId: '',
  metaInstagramAccountId: '',
  metaWebhookVerifyToken: '',
  metaGraphApiVersion: 'v21.0',
  metaConfigured: false,
  instagramConfigured: false,
  // TikTok Business
  tiktokAppId: '',
  tiktokAppSecret: '',
  tiktokAccessToken: '',
  tiktokBusinessId: '',
  tiktokWebhookSecret: '',
  tiktokConfigured: false,
  // LinkedIn Page
  linkedinClientId: '',
  linkedinClientSecret: '',
  linkedinAccessToken: '',
  linkedinOrganizationId: '',
  linkedinConfigured: false,
};

interface ApiKeyFieldState {
  apiKey: string;
  testing: boolean;
  testResult: { success: boolean; message?: string; error?: string } | null;
  models: string[];
  loadingModels: boolean;
  selectedModel: string;
}

// ========== TRACKING SECTIONS ==========
interface TrackingFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  hint?: string;
}
interface TrackingSectionDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl?: string;
  aiHint?: string;
  fields: TrackingFieldDef[];
}
interface TrackingSectionState {
  values: Record<string, string>;
  saving: boolean;
  testing: boolean;
  testResult: { success: boolean; message?: string; error?: string } | null;
  showSecrets: Record<string, boolean>;
  loading: boolean;
  dirty: boolean;
  expanded: boolean;
}

const TRACKING_SECTIONS: TrackingSectionDef[] = [
  {
    id: 'tracking_meta',
    title: 'Meta Pixel + Conversion API',
    description: 'Pixel Facebook/Instagram et API de conversions côté serveur (iOS14+).',
    icon: Facebook,
    color: 'blue',
    docsUrl: 'https://developers.facebook.com/docs/meta-pixel',
    aiHint:
      "L'IA peut installer automatiquement le pixel sur votre site vitrine et configurer les événements standards.",
    fields: [
      {
        key: 'pixelId',
        label: 'Pixel ID',
        placeholder: '123456789012345',
        hint: "Dans Meta Business Suite > Gestionnaire d'événements > Sources de données",
      },
      {
        key: 'accessToken',
        label: 'Access Token (Conversion API)',
        placeholder: 'EAAxxxxxxxxxxxxxxx',
        secret: true,
        hint: 'Token pour la Conversion API côté serveur',
      },
      {
        key: 'testEventCode',
        label: 'Test Event Code (optionnel)',
        placeholder: 'TEST12345',
        hint: 'Code de test pour déboguer dans Meta Events Manager',
      },
    ],
  },
  {
    id: 'tracking_gtm',
    title: 'Google Tag Manager',
    description: 'Gérez tous vos scripts de tracking depuis un seul endroit.',
    icon: Globe,
    color: 'amber',
    docsUrl: 'https://tagmanager.google.com/',
    aiHint:
      "L'IA peut générer un fichier JSON à importer dans GTM avec les tags et triggers préconfigurés.",
    fields: [
      {
        key: 'containerId',
        label: 'Container ID',
        placeholder: 'GTM-XXXXXXX',
        hint: 'Format: GTM-XXXXXXX',
      },
      {
        key: 'serverContainerUrl',
        label: 'URL Container Server-Side (optionnel)',
        placeholder: 'https://gtm.monagence.com',
        hint: 'URL container GTM server-side',
      },
    ],
  },
  {
    id: 'tracking_ga4',
    title: 'Google Analytics 4',
    description: 'Suivi du comportement des visiteurs, conversions et parcours utilisateur.',
    icon: BarChart3,
    color: 'amber',
    docsUrl: 'https://analytics.google.com/',
    aiHint: "L'IA peut configurer automatiquement les événements GA4 sur votre site vitrine.",
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
    description: 'Suivi des conversions Google Ads pour optimiser vos campagnes.',
    icon: TrendingUp,
    color: 'green',
    docsUrl: 'https://ads.google.com/',
    fields: [
      {
        key: 'conversionId',
        label: 'Conversion ID',
        placeholder: 'AW-XXXXXXXXXX',
        hint: 'Format: AW-XXXXXXXXXX',
      },
      {
        key: 'conversionLabelLead',
        label: 'Label conversion Lead',
        placeholder: 'XXXXXXXXXXXXXXXX',
      },
      {
        key: 'conversionLabelContact',
        label: 'Label conversion Contact',
        placeholder: 'XXXXXXXXXXXXXXXX',
      },
    ],
  },
  {
    id: 'tracking_search_console',
    title: 'Google Search Console',
    description: 'Vérification de propriété et suivi des performances de recherche.',
    icon: Search,
    color: 'teal',
    docsUrl: 'https://search.google.com/search-console',
    aiHint: "L'IA peut ajouter automatiquement la balise de vérification sur votre site vitrine.",
    fields: [
      {
        key: 'verificationToken',
        label: 'Token de vérification HTML',
        placeholder: 'google1234567890abcdef.html',
        hint: 'Depuis Search Console > Paramètres > Propriété > Vérification',
      },
      {
        key: 'sitemapUrl',
        label: 'URL du Sitemap (optionnel)',
        placeholder: 'https://monagence.com/sitemap.xml',
      },
    ],
  },
  {
    id: 'tracking_tiktok',
    title: 'TikTok Pixel',
    description: 'Pixel TikTok pour le suivi des conversions et le reciblage publicitaire.',
    icon: Video,
    color: 'pink',
    docsUrl: 'https://ads.tiktok.com/help/article/tiktok-pixel',
    aiHint:
      "L'IA peut installer le pixel TikTok et configurer les événements (ViewContent, SubmitForm, Contact).",
    fields: [
      {
        key: 'pixelId',
        label: 'Pixel ID',
        placeholder: 'CXXXXXXXXXXXXXXXXX',
        hint: 'Dans TikTok Ads Manager > Assets > Events > Web Events',
      },
      {
        key: 'accessToken',
        label: 'Access Token (Events API)',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        secret: true,
        hint: 'Token pour le tracking côté serveur via Events API',
      },
    ],
  },
  {
    id: 'tracking_linkedin',
    title: 'LinkedIn Insight Tag',
    description: 'Suivi des conversions LinkedIn Ads et remarketing professionnel.',
    icon: Linkedin,
    color: 'indigo',
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a418880',
    aiHint: "L'IA peut installer le tag LinkedIn sur votre site vitrine pour le tracking B2B.",
    fields: [
      {
        key: 'partnerId',
        label: 'Partner ID',
        placeholder: '1234567',
        hint: 'Dans LinkedIn Campaign Manager > Account Assets > Insight Tag',
      },
      {
        key: 'conversionId',
        label: 'Conversion ID (optionnel)',
        placeholder: '12345678',
        hint: 'ID de conversion pour le suivi des leads',
      },
    ],
  },
];

const TRACKING_COLOR_MAP: Record<
  string,
  { bg: string; border: string; icon: string; badge: string }
> = {
  blue: {
    bg: 'bg-blue-50/50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  amber: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  green: {
    bg: 'bg-green-50/50',
    border: 'border-green-200',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-700 border-green-200',
  },
  teal: {
    bg: 'bg-teal-50/50',
    border: 'border-teal-200',
    icon: 'text-teal-600',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  pink: {
    bg: 'bg-pink-50/50',
    border: 'border-pink-200',
    icon: 'text-pink-600',
    badge: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  indigo: {
    bg: 'bg-indigo-50/50',
    border: 'border-indigo-200',
    icon: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.query.tab && typeof router.query.tab === 'string') {
      setActiveTab(router.query.tab as TabType);
    }
  }, [router.query.tab]);
  const [message, setMessage] = useState('');
  const [selectedOtherLLM, setSelectedOtherLLM] = useState<string>('cohere');

  // Communications state
  const [commSettings, setCommSettings] = useState<CommSettings>(DEFAULT_COMM_SETTINGS);
  const [commLoading, setCommLoading] = useState(false);
  const [commSaving, setCommSaving] = useState(false);
  const [commTesting, setCommTesting] = useState(false);
  const [commSendingTest, setCommSendingTest] = useState(false);
  const [commTestEmail, setCommTestEmail] = useState('');
  const [commMessage, setCommMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Tracking state
  const initTrackingStates = (): Record<string, TrackingSectionState> => {
    const s: Record<string, TrackingSectionState> = {};
    TRACKING_SECTIONS.forEach((sec) => {
      s[sec.id] = {
        values: {},
        saving: false,
        testing: false,
        testResult: null,
        showSecrets: {},
        loading: true,
        dirty: false,
        expanded: false,
      };
    });
    return s;
  };
  const [trackingSections, setTrackingSections] =
    useState<Record<string, TrackingSectionState>>(initTrackingStates);
  const [trackingLoaded, setTrackingLoaded] = useState(false);

  // State for API key testing
  const [apiKeyStates, setApiKeyStates] = useState<Record<string, ApiKeyFieldState>>({
    openai: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    anthropic: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    gemini: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    deepseek: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    mistral: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    openrouter: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    grok: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
  });

  // State for scraping API keys (legacy - kept for saving)
  const [scrapingKeys, setScrapingKeys] = useState({
    firecrawlApiKey: '',
    serpApiKey: '',
    picaApiKey: '',
  });

  // State for scraping API key testing
  const [scrapingApiKeyStates, setScrapingApiKeyStates] = useState<
    Record<string, ApiKeyFieldState>
  >({
    firecrawl: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    serpapi: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
    pica: {
      apiKey: '',
      testing: false,
      testResult: null,
      models: [],
      loadingModels: false,
      selectedModel: '',
    },
  });

  const [savingLLM, setSavingLLM] = useState(false);
  const [savingScraping, setSavingScraping] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // State for internal scraping engines
  const [internalEngines, setInternalEngines] = useState({
    cheerio: {
      enabled: true,
      name: 'Cheerio',
      description: 'Parser HTML léger et rapide (recommandé pour sites simples)',
    },
    puppeteer: {
      enabled: true,
      name: 'Puppeteer',
      description: 'Navigateur headless complet (pour sites JavaScript complexes)',
    },
  });
  const [savingEngines, setSavingEngines] = useState(false);

  // Fetch user API keys on component mount
  useEffect(() => {
    const fetchUserApiKeys = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoadingKeys(false);
          return;
        }

        const response = await apiClient.get('/ai-billing/api-keys/user');
        const data = response.data;
        if (data) {
          // Populate LLM API keys states
          if (data.openaiApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              openai: { ...prev.openai, apiKey: data.openaiApiKey },
            }));
          }
          if (data.anthropicApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              anthropic: { ...prev.anthropic, apiKey: data.anthropicApiKey },
            }));
          }
          if (data.geminiApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              gemini: { ...prev.gemini, apiKey: data.geminiApiKey },
            }));
          }
          if (data.deepseekApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              deepseek: { ...prev.deepseek, apiKey: data.deepseekApiKey },
            }));
          }
          if (data.mistralApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              mistral: { ...prev.mistral, apiKey: data.mistralApiKey },
            }));
          }
          if (data.openrouterApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              openrouter: { ...prev.openrouter, apiKey: data.openrouterApiKey },
            }));
          }
          if (data.grokApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              grok: { ...prev.grok, apiKey: data.grokApiKey },
            }));
          }

          // Populate scraping API keys states
          if (data.firecrawlApiKey) {
            setScrapingApiKeyStates((prev) => ({
              ...prev,
              firecrawl: { ...prev.firecrawl, apiKey: data.firecrawlApiKey },
            }));
            setScrapingKeys((prev) => ({ ...prev, firecrawlApiKey: data.firecrawlApiKey }));
          }
          if (data.serpApiKey) {
            setScrapingApiKeyStates((prev) => ({
              ...prev,
              serpapi: { ...prev.serpapi, apiKey: data.serpApiKey },
            }));
            setScrapingKeys((prev) => ({ ...prev, serpApiKey: data.serpApiKey }));
          }
          if (data.picaApiKey) {
            setScrapingApiKeyStates((prev) => ({
              ...prev,
              pica: { ...prev.pica, apiKey: data.picaApiKey },
            }));
            setScrapingKeys((prev) => ({ ...prev, picaApiKey: data.picaApiKey }));
          }

          // Set default provider and model if available
          if (data.defaultProvider) {
            const provider = data.defaultProvider;
            if (data.defaultModel && apiKeyStates[provider]) {
              setApiKeyStates((prev) => ({
                ...prev,
                [provider]: {
                  ...prev[provider],
                  selectedModel: data.defaultModel,
                },
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user API keys:', error);
      } finally {
        setLoadingKeys(false);
      }
    };

    const fetchEnginesConfig = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await apiClient.get('/ai-billing/api-keys/scraping-engines');
        const data = response.data;
        if (data) {
          setInternalEngines({
            cheerio: {
              enabled: data.cheerioEnabled,
              name: 'Cheerio',
              description: 'Parser HTML léger et rapide (recommandé pour sites simples)',
            },
            puppeteer: {
              enabled: data.puppeteerEnabled,
              name: 'Puppeteer',
              description: 'Navigateur headless complet (pour sites JavaScript complexes)',
            },
          });
        }
      } catch (error) {
        console.error('Error fetching engines config:', error);
      }
    };

    fetchUserApiKeys();
    fetchEnginesConfig();
  }, []);

  // Load communications settings when tab is activated
  useEffect(() => {
    if (activeTab === 'communications' && !commLoading && commSettings === DEFAULT_COMM_SETTINGS) {
      loadCommSettings();
    }
  }, [activeTab]);

  // ========== Tracking: load, save, test ==========
  useEffect(() => {
    if (activeTab === 'tracking' && !trackingLoaded) {
      loadAllTrackingSections();
    }
  }, [activeTab, trackingLoaded]);

  const loadAllTrackingSections = async () => {
    try {
      const results = await Promise.all(
        TRACKING_SECTIONS.map((sec) =>
          apiClient
            .get(`/settings/${sec.id}`)
            .then((r) => ({ id: sec.id, data: r.data }))
            .catch(() => ({ id: sec.id, data: [] }))
        )
      );
      setTrackingSections((prev) => {
        const next = { ...prev };
        let firstUnconfiguredExpanded = false;
        results.forEach(({ id, data }) => {
          const vals: Record<string, string> = {};
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item.key) vals[item.key] = item.value || '';
            });
          }
          const section = TRACKING_SECTIONS.find((s) => s.id === id);
          const hasValues = section?.fields.some((f) => vals[f.key]?.trim()) || false;
          // Auto-expand la première section non configurée pour guider l'utilisateur
          const shouldExpand = !hasValues && !firstUnconfiguredExpanded;
          if (shouldExpand) firstUnconfiguredExpanded = true;
          next[id] = {
            ...next[id],
            values: vals,
            loading: false,
            dirty: false,
            expanded: shouldExpand || next[id].expanded,
          };
        });
        return next;
      });
      setTrackingLoaded(true);
    } catch (err) {
      console.error('Error loading tracking settings:', err);
    }
  };

  const updateTrackingValue = (sectionId: string, key: string, value: string) => {
    setTrackingSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        values: { ...prev[sectionId].values, [key]: value },
        dirty: true,
      },
    }));
  };

  const toggleTrackingExpanded = (sectionId: string) => {
    setTrackingSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], expanded: !prev[sectionId].expanded },
    }));
  };

  const toggleTrackingSecret = (sectionId: string, key: string) => {
    setTrackingSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        showSecrets: { ...prev[sectionId].showSecrets, [key]: !prev[sectionId].showSecrets[key] },
      },
    }));
  };

  const handleTrackingSave = async (sectionId: string) => {
    const section = TRACKING_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    setTrackingSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], saving: true, testResult: null },
    }));
    try {
      const values = trackingSections[sectionId].values;
      const settings = section.fields.map((f) => ({
        key: f.key,
        value: values[f.key] || '',
        encrypted: !!f.secret,
      }));
      await apiClient.post(`/settings/${sectionId}/bulk`, { settings });
      setTrackingSections((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          saving: false,
          dirty: false,
          testResult: { success: true, message: 'Configuration sauvegardée' },
        },
      }));
    } catch (err: any) {
      setTrackingSections((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          saving: false,
          testResult: {
            success: false,
            error: err?.response?.data?.message || 'Erreur de sauvegarde',
          },
        },
      }));
    }
  };

  const handleTrackingTest = async (sectionId: string) => {
    setTrackingSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], testing: true, testResult: null },
    }));
    try {
      const res = await apiClient.post(`/settings/${sectionId}/test`);
      setTrackingSections((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          testing: false,
          testResult: { success: true, message: res.data?.message || 'Test réussi' },
        },
      }));
    } catch (err: any) {
      setTrackingSections((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          testing: false,
          testResult: { success: false, error: err?.response?.data?.message || 'Échec du test' },
        },
      }));
    }
  };

  const loadCommSettings = async () => {
    try {
      setCommLoading(true);
      const response = await apiClient.get('/communications/settings');
      setCommSettings({ ...DEFAULT_COMM_SETTINGS, ...response.data });
    } catch (err: any) {
      console.error('Error loading comm settings:', err);
    } finally {
      setCommLoading(false);
    }
  };

  const handleCommSave = async () => {
    setCommSaving(true);
    setCommMessage(null);
    try {
      await apiClient.put('/communications/settings', commSettings);
      setCommMessage({ type: 'success', text: 'Configuration sauvegardée avec succès' });
      await loadCommSettings();
    } catch (err: any) {
      setCommMessage({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la sauvegarde',
      });
    } finally {
      setCommSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setCommTesting(true);
    setCommMessage(null);
    try {
      const response = await apiClient.post('/communications/smtp/test-connection');
      if (response.data.success) {
        setCommMessage({ type: 'success', text: 'Connexion SMTP réussie !' });
      } else {
        setCommMessage({
          type: 'error',
          text: response.data.message || 'Échec de la connexion SMTP',
        });
      }
    } catch (err: any) {
      setCommMessage({ type: 'error', text: 'Erreur lors du test SMTP' });
    } finally {
      setCommTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!commTestEmail) {
      setCommMessage({ type: 'error', text: 'Entrez une adresse email de destination' });
      return;
    }
    setCommSendingTest(true);
    setCommMessage(null);
    try {
      const response = await apiClient.post('/communications/smtp/test-email', {
        to: commTestEmail,
      });
      if (response.data.success) {
        setCommMessage({ type: 'success', text: `Email de test envoyé à ${commTestEmail}` });
      } else {
        setCommMessage({
          type: 'error',
          text: response.data.message || 'Échec envoi email de test',
        });
      }
    } catch (err: any) {
      setCommMessage({ type: 'error', text: "Erreur lors de l'envoi du test" });
    } finally {
      setCommSendingTest(false);
    }
  };

  const setComm = (field: keyof CommSettings, value: any) => {
    setCommSettings((prev) => ({ ...prev, [field]: value }));
    setCommMessage(null);
  };

  const testApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: false,
            error: 'Veuillez entrer une clé API',
          },
        },
      }));
      return;
    }

    // Check if API key is masked (contains ***)
    if (apiKey.includes('*')) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: true,
            message:
              '🔒 Clé déjà sauvegardée (masquée pour sécurité). Entrez une nouvelle clé pour tester.',
          },
        },
      }));
      return;
    }

    // Start testing
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        testing: true,
        testResult: null,
      },
    }));

    try {
      // Call the direct API validator (no backend needed)
      const result = await validateApiKey(provider, apiKey);

      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: result,
        },
      }));

      // If validation successful, load available models
      if (result.success) {
        loadModels(provider, apiKey);
      }
    } catch (error) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: {
            success: false,
            error: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          },
        },
      }));
    }
  };

  const loadModels = async (provider: string, apiKey: string) => {
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        loadingModels: true,
      },
    }));

    try {
      const models = await getAvailableModels(provider, apiKey);
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          models,
          loadingModels: false,
          selectedModel: models.length > 0 ? models[0] : '',
        },
      }));
    } catch (error) {
      console.error('Error loading models:', error);
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          loadingModels: false,
        },
      }));
    }
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: value,
        // Clear test result when user changes the key
        testResult: null,
      },
    }));
  };

  const handleModelSelect = (provider: string, model: string) => {
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        selectedModel: model,
      },
    }));
  };

  // Scraping API key handlers
  const testScrapingApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: false,
            error: 'Veuillez entrer une clé API',
          },
        },
      }));
      return;
    }

    // Check if API key is masked (contains ***)
    if (apiKey.includes('*')) {
      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: true,
            message:
              '🔒 Clé déjà sauvegardée (masquée pour sécurité). Entrez une nouvelle clé pour tester.',
          },
        },
      }));
      return;
    }

    // Start testing
    setScrapingApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        testing: true,
        testResult: null,
      },
    }));

    try {
      // Call the scraping API validator
      const result = await validateScrapingApiKey(provider, apiKey);

      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: result,
        },
      }));

      // Update the legacy scrapingKeys state for saving
      if (result.success) {
        if (provider === 'firecrawl') {
          setScrapingKeys((prev) => ({ ...prev, firecrawlApiKey: apiKey }));
        } else if (provider === 'serpapi') {
          setScrapingKeys((prev) => ({ ...prev, serpApiKey: apiKey }));
        } else if (provider === 'pica') {
          setScrapingKeys((prev) => ({ ...prev, picaApiKey: apiKey }));
        }
      }
    } catch (error) {
      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: {
            success: false,
            error: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          },
        },
      }));
    }
  };

  const handleScrapingApiKeyChange = (provider: string, value: string) => {
    setScrapingApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: value,
        // Clear test result when user changes the key
        testResult: null,
      },
    }));

    // Also update the legacy scrapingKeys state
    if (provider === 'firecrawl') {
      setScrapingKeys((prev) => ({ ...prev, firecrawlApiKey: value }));
    } else if (provider === 'serpapi') {
      setScrapingKeys((prev) => ({ ...prev, serpApiKey: value }));
    } else if (provider === 'pica') {
      setScrapingKeys((prev) => ({ ...prev, picaApiKey: value }));
    }
  };

  const handleSaveLLMKeys = async () => {
    setSavingLLM(true);
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage('❌ Authentification requise. Veuillez vous connecter.');
        setSavingLLM(false);
        return;
      }

      // Préparer les données à envoyer
      const dataToSend: any = {};

      // Ajouter les clés API validées
      if (apiKeyStates.openai.apiKey) {
        dataToSend.openaiApiKey = apiKeyStates.openai.apiKey;
        if (apiKeyStates.openai.selectedModel) {
          dataToSend.defaultProvider = 'openai';
          dataToSend.defaultModel = apiKeyStates.openai.selectedModel;
        }
      }
      if (apiKeyStates.anthropic.apiKey) {
        dataToSend.anthropicApiKey = apiKeyStates.anthropic.apiKey;
        if (apiKeyStates.anthropic.selectedModel && !dataToSend.defaultProvider) {
          dataToSend.defaultProvider = 'anthropic';
          dataToSend.defaultModel = apiKeyStates.anthropic.selectedModel;
        }
      }
      if (apiKeyStates.gemini.apiKey) {
        dataToSend.geminiApiKey = apiKeyStates.gemini.apiKey;
        if (apiKeyStates.gemini.selectedModel && !dataToSend.defaultProvider) {
          dataToSend.defaultProvider = 'gemini';
          dataToSend.defaultModel = apiKeyStates.gemini.selectedModel;
        }
      }
      if (apiKeyStates.deepseek.apiKey) {
        dataToSend.deepseekApiKey = apiKeyStates.deepseek.apiKey;
        if (apiKeyStates.deepseek.selectedModel && !dataToSend.defaultProvider) {
          dataToSend.defaultProvider = 'deepseek';
          dataToSend.defaultModel = apiKeyStates.deepseek.selectedModel;
        }
      }
      if (apiKeyStates.mistral.apiKey) dataToSend.mistralApiKey = apiKeyStates.mistral.apiKey;
      if (apiKeyStates.openrouter.apiKey)
        dataToSend.openrouterApiKey = apiKeyStates.openrouter.apiKey;
      if (apiKeyStates.grok.apiKey) dataToSend.grokApiKey = apiKeyStates.grok.apiKey;

      // Vérifier qu'au moins une clé est remplie
      if (Object.keys(dataToSend).length === 0) {
        setMessage('⚠️ Veuillez entrer au moins une clé API');
        setSavingLLM(false);
        return;
      }

      console.log('📤 Sending LLM keys:', dataToSend);

      const response = await apiClient.put('/ai-billing/api-keys/user', dataToSend);
      if (response.data) {
        console.log('✅ Save response:', response.data);
        setMessage('✅ Clés LLM sauvegardées avec succès!');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage(
        `❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    } finally {
      setSavingLLM(false);
    }
  };

  const handleSaveScrapingKeys = async () => {
    setSavingScraping(true);
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage('❌ Authentification requise. Veuillez vous connecter.');
        setSavingScraping(false);
        return;
      }

      // Filtrer les clés vides
      const dataToSend: any = {};
      if (scrapingKeys.firecrawlApiKey) dataToSend.firecrawlApiKey = scrapingKeys.firecrawlApiKey;
      if (scrapingKeys.serpApiKey) dataToSend.serpApiKey = scrapingKeys.serpApiKey;
      if (scrapingKeys.picaApiKey) dataToSend.picaApiKey = scrapingKeys.picaApiKey;

      // Vérifier qu'au moins une clé est remplie
      if (Object.keys(dataToSend).length === 0) {
        setMessage('⚠️ Veuillez entrer au moins une clé API');
        setSavingScraping(false);
        return;
      }

      console.log('📤 Sending Scraping keys:', dataToSend);

      const response = await apiClient.put('/ai-billing/api-keys/user', dataToSend);
      if (response.data) {
        console.log('✅ Save response:', response.data);
        setMessage('✅ Clés Scraping sauvegardées avec succès!');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage(
        `❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    } finally {
      setSavingScraping(false);
    }
  };

  const renderApiKeyInput = (
    provider: string,
    label: string,
    placeholder: string,
    description: string
  ) => {
    const state = apiKeyStates[provider];

    return (
      <div key={provider}>
        <Label>{label}</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="password"
            placeholder={placeholder}
            value={state.apiKey}
            onChange={(e) => handleApiKeyChange(provider, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => testApiKey(provider, state.apiKey)}
            disabled={state.testing || !state.apiKey.trim()}
            className="whitespace-nowrap"
          >
            {state.testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Test...
              </>
            ) : (
              'Tester'
            )}
          </Button>
        </div>
        {state.testResult && (
          <div
            className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${
              state.testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {state.testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p
                className={
                  state.testResult.success ? 'text-sm text-green-800' : 'text-sm text-red-800'
                }
              >
                {state.testResult.success
                  ? state.testResult.message || 'Clé API valide'
                  : state.testResult.error || 'Erreur de validation'}
              </p>
            </div>
          </div>
        )}

        {/* Models Dropdown - Show only if validation was successful and models were loaded */}
        {state.testResult?.success && state.models.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="text-blue-900 font-semibold">📊 Modèles disponibles</Label>
            {state.loadingModels ? (
              <div className="mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Chargement des modèles...</span>
              </div>
            ) : (
              <select
                value={state.selectedModel}
                onChange={(e) => handleModelSelect(provider, e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez un modèle</option>
                {state.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            )}
            {state.selectedModel && (
              <div className="mt-2 p-2 bg-white rounded border border-blue-300">
                <p className="text-sm font-medium text-blue-900">
                  ✅ Sélectionné:{' '}
                  <span className="font-mono text-blue-700">{state.selectedModel}</span>
                </p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    );
  };

  const renderScrapingApiKeyInput = (
    provider: string,
    label: string,
    placeholder: string,
    description: string
  ) => {
    const state = scrapingApiKeyStates[provider];

    return (
      <div key={provider}>
        <Label>{label}</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="password"
            placeholder={placeholder}
            value={state.apiKey}
            onChange={(e) => handleScrapingApiKeyChange(provider, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => testScrapingApiKey(provider, state.apiKey)}
            disabled={state.testing || !state.apiKey.trim()}
            className="whitespace-nowrap"
          >
            {state.testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Test...
              </>
            ) : (
              'Tester'
            )}
          </Button>
        </div>
        {state.testResult && (
          <div
            className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${
              state.testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {state.testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p
                className={
                  state.testResult.success ? 'text-sm text-green-800' : 'text-sm text-red-800'
                }
              >
                {state.testResult.success
                  ? state.testResult.message || 'Clé API valide'
                  : state.testResult.error || 'Erreur de validation'}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    );
  };

  const otherLLMModels = [
    {
      id: 'cohere',
      name: 'Cohere',
      description: 'Modèles de génération et classification de texte',
    },
    {
      id: 'together',
      name: 'Together AI',
      description: "Plateforme d'inférence optimisée pour LLM",
    },
    { id: 'replicate', name: 'Replicate', description: 'Exécutez des modèles ML en nuage' },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: "Modèles d'IA avec accès à Internet en temps réel",
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      description: "Plateforme communautaire d'IA open-source",
    },
    { id: 'aleph', name: 'Aleph Alpha', description: "Modèles d'IA multilingues et multimodaux" },
    { id: 'nlp_cloud', name: 'NLP Cloud', description: 'API NLP sans infrastructure' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // TODO: Implémenter la sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage('Profil mis à jour avec succès');
    } catch (error) {
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (tab: TabType, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          </div>
          <p className="text-gray-600">Gérez vos préférences et configuration</p>
        </div>

        {/* Message Display */}
        {message && (
          <Card className="mb-6 border-l-4 border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-blue-900">{message}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {renderTabButton('profile', 'Profil', <User className="h-4 w-4" />)}
          {renderTabButton('api-keys', 'API Keys', <Key className="h-4 w-4" />)}
          {renderTabButton('llm', 'LLM/IA', <Brain className="h-4 w-4" />)}
          {renderTabButton('communications', 'Communications', <Mail className="h-4 w-4" />)}
          {renderTabButton('security', 'Sécurité', <Shield className="h-4 w-4" />)}
          {renderTabButton('tracking', 'Tracking', <BarChart3 className="h-4 w-4" />)}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* User Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <Input
                        placeholder="Votre prénom"
                        defaultValue={user?.firstName || ''}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input
                        placeholder="Votre nom"
                        defaultValue={user?.lastName || ''}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      defaultValue={user?.email || ''}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications par email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications push</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels des rendez-vous</p>
                    <p className="text-sm text-gray-600">
                      Recevoir des rappels avant les rendez-vous
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: API Keys Configuration */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            {/* LLM Models Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  LLM - Modèles d'IA
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Configurez vos clés API pour les modèles d'IA avancés
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderApiKeyInput(
                  'openai',
                  'OpenAI API Key',
                  'sk-...',
                  'Votre clé API OpenAI pour accéder aux modèles GPT-4o, GPT-4, etc.'
                )}
                {renderApiKeyInput(
                  'anthropic',
                  'Anthropic API Key',
                  'sk-ant-...',
                  'Clé API pour Claude 3 Opus, Sonnet et autres modèles Anthropic'
                )}
                {renderApiKeyInput(
                  'gemini',
                  'Google Gemini API Key',
                  'AIza...',
                  'Clé API Google pour Gemini 2.0 et autres modèles Google'
                )}
                {renderApiKeyInput(
                  'deepseek',
                  'Deepseek API Key',
                  'sk-...',
                  "Clé API pour Deepseek - Modèles d'IA haute performance et cost-effective"
                )}
                {renderApiKeyInput(
                  'mistral',
                  'Mistral API Key',
                  '...',
                  'Clé API pour Mistral - Modèles optimisés pour la performance et la latence'
                )}
                {renderApiKeyInput(
                  'openrouter',
                  'Open Router API Key',
                  'sk-or-...',
                  'Clé API pour Open Router - Accédez à plusieurs modèles via une seule API'
                )}
                {renderApiKeyInput(
                  'grok',
                  'Grok API Key',
                  '...',
                  "Clé API pour Grok (xAI) - Modèles d'IA avec compréhension du contexte en temps réel"
                )}
                <div>
                  <Label>Autres Modèles LLM (BYOK)</Label>
                  <select
                    value={selectedOtherLLM}
                    onChange={(e) => setSelectedOtherLLM(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                  >
                    {otherLLMModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-blue-900">
                    {otherLLMModels.find((m) => m.id === selectedOtherLLM)?.name} API Key
                  </Label>
                  <Input
                    type="password"
                    placeholder={`Clé API pour ${otherLLMModels.find((m) => m.id === selectedOtherLLM)?.name}`}
                    className="mt-2 bg-white"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    {otherLLMModels.find((m) => m.id === selectedOtherLLM)?.description}
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLLMKeys}
                    disabled={savingLLM}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingLLM ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer les clés LLM'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Web Scraping Engines Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-orange-600" />
                  Moteurs de Scraping Web
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Configurez vos clés API pour les services de web scraping et extraction de données
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderScrapingApiKeyInput(
                  'firecrawl',
                  'Firecrawl API Key',
                  'fcrawl-...',
                  'Clé API pour Firecrawl - Web scraping LLM-friendly avec support des PDFs'
                )}
                {renderScrapingApiKeyInput(
                  'serpapi',
                  'SERP API Key',
                  '...',
                  'Clé API pour SerpAPI - Scraping des résultats de recherche (Google, Bing, etc.)'
                )}
                {renderScrapingApiKeyInput(
                  'pica',
                  'Pica API Key',
                  '...',
                  'Clé API pour Pica - Scraping de données web structurées et non-structurées'
                )}
                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveScrapingKeys}
                    disabled={savingScraping}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingScraping ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer les clés API'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Moteurs de Scraping Internes
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Activez ou désactivez les moteurs de scraping locaux installés sur votre serveur
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(internalEngines).map(([key, engine]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{engine.name}</h4>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            engine.enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {engine.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{engine.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={engine.enabled}
                        onChange={(e) => {
                          setInternalEngines((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], enabled: e.target.checked },
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Ordre de priorité</p>
                      <p className="mt-1">
                        Par défaut, le système utilise Cheerio en premier pour économiser les
                        ressources. Puppeteer est utilisé automatiquement pour les sites JavaScript
                        complexes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to defaults
                      setInternalEngines({
                        cheerio: {
                          enabled: true,
                          name: 'Cheerio',
                          description:
                            'Parser HTML léger et rapide (recommandé pour sites simples)',
                        },
                        puppeteer: {
                          enabled: true,
                          name: 'Puppeteer',
                          description:
                            'Navigateur headless complet (pour sites JavaScript complexes)',
                        },
                      });
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Réinitialiser
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSavingEngines(true);
                      setMessage('');

                      try {
                        const token = localStorage.getItem('auth_token');
                        if (!token) {
                          setMessage('❌ Authentification requise. Veuillez vous connecter.');
                          setSavingEngines(false);
                          return;
                        }

                        const response = await apiClient.put(
                          '/ai-billing/api-keys/scraping-engines',
                          {
                            cheerioEnabled: internalEngines.cheerio.enabled,
                            puppeteerEnabled: internalEngines.puppeteer.enabled,
                          }
                        );
                        if (response.data) {
                          setMessage('✅ Configuration des moteurs sauvegardée!');
                        }
                      } catch (error) {
                        setMessage(
                          `❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
                        );
                      } finally {
                        setSavingEngines(false);
                      }
                    }}
                    disabled={savingEngines}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingEngines ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer la configuration'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Appels API ce mois</p>
                    <p className="text-2xl font-bold mt-2">2,450</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tokens utilisés</p>
                    <p className="text-2xl font-bold mt-2">125K</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Coût estimé</p>
                    <p className="text-2xl font-bold mt-2">$12.50</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: LLM/IA Configuration */}
        {activeTab === 'llm' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Configuration LLM / IA
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Paramétrez le modèle d'IA et ses préférences
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Modèle IA Principal</Label>
                  <select className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white">
                    <option>GPT-4o</option>
                    <option>Claude 3 Opus</option>
                    <option>Gemini 2.0</option>
                    <option>Mistral Large</option>
                  </select>
                </div>

                <div>
                  <Label>Température (Créativité)</Label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue="0.7"
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Déterministe | 2 = Très créatif</p>
                </div>

                <div>
                  <Label>Max Tokens par requête</Label>
                  <Input type="number" defaultValue="4000" className="mt-1" />
                </div>

                <div>
                  <Label>Système de prompt personnalisé</Label>
                  <textarea
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md min-h-[120px]"
                    placeholder="Entrez vos instructions système personnalisées..."
                    defaultValue="Tu es un assistant immobilier expert..."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" id="retry" defaultChecked className="h-4 w-4" />
                      <label htmlFor="retry" className="ml-2 text-sm">
                        Réessayer automatiquement en cas d'erreur
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="stream" defaultChecked className="h-4 w-4" />
                      <label htmlFor="stream" className="ml-2 text-sm">
                        Streaming des réponses
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="cache" className="h-4 w-4" />
                      <label htmlFor="cache" className="ml-2 text-sm">
                        Activer le cache des requêtes
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        'ℹ️ Configuration LLM - Cette fonctionnalité sera implémentée prochainement'
                      )
                    }
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Enregistrer la configuration
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modèles Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ GPT-4o (4K tokens)</p>
                  <p>✓ Claude 3 Opus (100K tokens)</p>
                  <p>✓ Gemini 2.0 (100K tokens)</p>
                  <p>✓ Mistral Large (32K tokens)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label>Mot de passe actuel</Label>
                    <Input
                      type="password"
                      placeholder="Entrez votre mot de passe actuel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Nouveau mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="Entrez un nouveau mot de passe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Confirmer le mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                      Changer le mot de passe
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sessions actives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Chrome sur Windows</p>
                      <p className="text-sm text-gray-600">Dernière activité: il y a 5 minutes</p>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Déconnecter
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Safari sur iPhone</p>
                      <p className="text-sm text-gray-600">Dernière activité: hier</p>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Déconnecter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authentification à deux facteurs (2FA)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Renforcez la sécurité de votre compte avec la 2FA
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Activer la 2FA
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Zone Danger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Supprimer définitivement votre compte et toutes les données associées
                </p>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Supprimer le compte
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 5: Communications */}
        {activeTab === 'communications' && (
          <div className="space-y-6">
            {commLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* Status indicators */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${commSettings.smtpConfigured ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                  >
                    {commSettings.smtpConfigured ? (
                      <Wifi className="h-4 w-4" />
                    ) : (
                      <WifiOff className="h-4 w-4" />
                    )}
                    Email {commSettings.smtpConfigured ? 'configuré' : 'non configuré'}
                  </div>
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${commSettings.twilioConfigured ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                  >
                    {commSettings.twilioConfigured ? (
                      <Wifi className="h-4 w-4" />
                    ) : (
                      <WifiOff className="h-4 w-4" />
                    )}
                    SMS/WhatsApp {commSettings.twilioConfigured ? 'configuré' : 'non configuré'}
                  </div>
                </div>

                {/* Message */}
                {commMessage && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm ${commMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
                  >
                    {commMessage.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    {commMessage.text}
                  </div>
                )}

                {/* Email Provider Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      Fournisseur d&apos;email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {(['smtp', 'resend', 'sendgrid'] as EmailProvider[]).map((provider) => (
                        <button
                          key={provider}
                          onClick={() => setComm('emailProvider', provider)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${commSettings.emailProvider === provider ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                          {provider === 'smtp'
                            ? 'SMTP personnalisé'
                            : provider === 'resend'
                              ? 'Resend'
                              : 'SendGrid'}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* SMTP Configuration */}
                {commSettings.emailProvider === 'smtp' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-500" />
                        Configuration SMTP
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="smtpHost">Hôte SMTP</Label>
                          <Input
                            id="smtpHost"
                            placeholder="smtp.gmail.com"
                            value={commSettings.smtpHost}
                            onChange={(e) => setComm('smtpHost', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="smtpPort">Port</Label>
                          <Input
                            id="smtpPort"
                            type="number"
                            placeholder="587"
                            value={commSettings.smtpPort}
                            onChange={(e) => setComm('smtpPort', parseInt(e.target.value) || 587)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="smtpSecure"
                          checked={commSettings.smtpSecure}
                          onChange={(e) => setComm('smtpSecure', e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-500"
                        />
                        <Label htmlFor="smtpSecure" className="cursor-pointer">
                          Connexion sécurisée SSL/TLS (port 465)
                        </Label>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpUser">Utilisateur / Email</Label>
                        <Input
                          id="smtpUser"
                          placeholder="votre@email.com"
                          value={commSettings.smtpUser}
                          onChange={(e) => setComm('smtpUser', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpPassword">Mot de passe / App Password</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          placeholder="••••••••"
                          value={commSettings.smtpPassword}
                          onChange={(e) => setComm('smtpPassword', e.target.value)}
                        />
                        <p className="text-xs text-slate-500">
                          Pour Gmail : utilisez un <em>App Password</em> depuis la sécurité Google.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpFrom">Adresse d&apos;expéditeur</Label>
                        <Input
                          id="smtpFrom"
                          placeholder="Immo Agence <noreply@monagence.com>"
                          value={commSettings.smtpFrom}
                          onChange={(e) => setComm('smtpFrom', e.target.value)}
                        />
                      </div>
                      {/* Test SMTP */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <p className="text-sm font-medium text-slate-700">Tester la connexion</p>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTestSmtp}
                            disabled={commTesting}
                            className="gap-2"
                          >
                            {commTesting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wifi className="h-4 w-4" />
                            )}
                            Tester SMTP
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="email@test.com"
                            value={commTestEmail}
                            onChange={(e) => setCommTestEmail(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendTestEmail}
                            disabled={commSendingTest}
                            className="gap-2 shrink-0"
                          >
                            {commSendingTest ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Envoyer test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resend Configuration */}
                {commSettings.emailProvider === 'resend' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        Resend
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="resendApiKey">Clé API Resend</Label>
                        <Input
                          id="resendApiKey"
                          type="password"
                          placeholder="re_••••••••"
                          value={commSettings.resendApiKey}
                          onChange={(e) => setComm('resendApiKey', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpFromResend">Adresse d&apos;expéditeur</Label>
                        <Input
                          id="smtpFromResend"
                          placeholder="Immo Agence <noreply@monagence.com>"
                          value={commSettings.smtpFrom}
                          onChange={(e) => setComm('smtpFrom', e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Créez votre clé sur <strong>resend.com/api-keys</strong>. L&apos;adresse
                        d&apos;expéditeur doit appartenir à un domaine vérifié.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* SendGrid Configuration */}
                {commSettings.emailProvider === 'sendgrid' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        SendGrid
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sendgridApiKey">Clé API SendGrid</Label>
                        <Input
                          id="sendgridApiKey"
                          type="password"
                          placeholder="SG.••••••••"
                          value={commSettings.sendgridApiKey}
                          onChange={(e) => setComm('sendgridApiKey', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtpFromSendgrid">Adresse d&apos;expéditeur</Label>
                        <Input
                          id="smtpFromSendgrid"
                          placeholder="Immo Agence <noreply@monagence.com>"
                          value={commSettings.smtpFrom}
                          onChange={(e) => setComm('smtpFrom', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SMS Twilio */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      SMS — Twilio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="twilioAccountSid">Account SID</Label>
                      <Input
                        id="twilioAccountSid"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={commSettings.twilioAccountSid}
                        onChange={(e) => setComm('twilioAccountSid', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="twilioAuthToken">Auth Token</Label>
                      <Input
                        id="twilioAuthToken"
                        type="password"
                        placeholder="••••••••"
                        value={commSettings.twilioAuthToken}
                        onChange={(e) => setComm('twilioAuthToken', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="twilioPhoneNumber">Numéro Twilio</Label>
                      <Input
                        id="twilioPhoneNumber"
                        placeholder="+33600000000"
                        value={commSettings.twilioPhoneNumber}
                        onChange={(e) => setComm('twilioPhoneNumber', e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Trouvez ces informations sur <strong>console.twilio.com</strong>.
                    </p>
                  </CardContent>
                </Card>

                {/* WhatsApp Business */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      WhatsApp Business API
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="whatsappApiKey">Token d&apos;accès permanent</Label>
                      <Input
                        id="whatsappApiKey"
                        type="password"
                        placeholder="••••••••"
                        value={commSettings.whatsappApiKey}
                        onChange={(e) => setComm('whatsappApiKey', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
                      <Input
                        id="whatsappPhoneNumberId"
                        placeholder="1234567890"
                        value={commSettings.whatsappPhoneNumberId}
                        onChange={(e) => setComm('whatsappPhoneNumberId', e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Depuis le <strong>Meta Business Manager</strong> → WhatsApp → Configuration.
                    </p>
                  </CardContent>
                </Card>

                {/* Meta Platform — Messenger & Instagram */}
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Meta — Messenger & Instagram
                      {commSettings.metaConfigured && (
                        <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-600">
                          <Wifi className="h-3 w-3" /> Connecté
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Synchronisez Facebook Messenger et Instagram Direct via la Graph API Meta. Les
                      messages entrants seront automatiquement routés vers le module Communications.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Application Meta */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                        <Globe className="h-3.5 w-3.5" />
                        Application Meta
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="metaAppId">App ID</Label>
                          <Input
                            id="metaAppId"
                            placeholder="123456789012345"
                            value={commSettings.metaAppId}
                            onChange={(e) => setComm('metaAppId', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="metaAppSecret">App Secret</Label>
                          <Input
                            id="metaAppSecret"
                            type="password"
                            placeholder="••••••••"
                            value={commSettings.metaAppSecret}
                            onChange={(e) => setComm('metaAppSecret', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="metaGraphApiVersion">Version Graph API</Label>
                        <Input
                          id="metaGraphApiVersion"
                          placeholder="v21.0"
                          value={commSettings.metaGraphApiVersion}
                          onChange={(e) => setComm('metaGraphApiVersion', e.target.value)}
                        />
                        <p className="text-xs text-slate-400">
                          Version de l&apos;API Meta Graph (ex : v21.0). Voir{' '}
                          <a
                            href="https://developers.facebook.com/docs/graph-api/changelog"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 underline"
                          >
                            changelog
                          </a>
                          .
                        </p>
                      </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Facebook Messenger */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                        Facebook Messenger
                        {commSettings.metaConfigured && (
                          <span className="text-xs font-normal text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Actif
                          </span>
                        )}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="metaPageId">Page ID</Label>
                          <Input
                            id="metaPageId"
                            placeholder="123456789012345"
                            value={commSettings.metaPageId}
                            onChange={(e) => setComm('metaPageId', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="metaPageAccessToken">Page Access Token</Label>
                          <Input
                            id="metaPageAccessToken"
                            type="password"
                            placeholder="••••••••"
                            value={commSettings.metaPageAccessToken}
                            onChange={(e) => setComm('metaPageAccessToken', e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Depuis <strong>Meta for Developers</strong> → Votre App → Messenger →
                        Settings. Utilisez un <em>long-lived Page Access Token</em> pour éviter
                        l&apos;expiration.
                      </p>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Instagram Direct */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                        <Instagram className="h-3.5 w-3.5 text-pink-500" />
                        Instagram Direct
                        {commSettings.instagramConfigured && (
                          <span className="text-xs font-normal text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Actif
                          </span>
                        )}
                      </h4>
                      <div className="space-y-1.5">
                        <Label htmlFor="metaInstagramAccountId">Instagram Account ID</Label>
                        <Input
                          id="metaInstagramAccountId"
                          placeholder="17841400000000000"
                          value={commSettings.metaInstagramAccountId}
                          onChange={(e) => setComm('metaInstagramAccountId', e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Votre compte Instagram doit être un <strong>Compte Professionnel</strong>{' '}
                        lié à la même Page Facebook. L&apos;ID se trouve via l&apos;endpoint{' '}
                        <code className="bg-slate-100 px-1 rounded text-xs">/me/accounts</code> de
                        la Graph API.
                      </p>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Webhooks */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                        <Link2 className="h-3.5 w-3.5 text-slate-600" />
                        Configuration Webhook
                      </h4>
                      <div className="space-y-1.5">
                        <Label htmlFor="metaWebhookVerifyToken">Token de vérification</Label>
                        <Input
                          id="metaWebhookVerifyToken"
                          placeholder="mon_token_verification_secret"
                          value={commSettings.metaWebhookVerifyToken}
                          onChange={(e) => setComm('metaWebhookVerifyToken', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>URL Callback (à configurer dans Meta)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={
                              typeof window !== 'undefined'
                                ? `${window.location.origin}/api/webhooks/meta`
                                : '/api/webhooks/meta'
                            }
                            className="bg-slate-50 text-xs font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/api/webhooks/meta`;
                              navigator.clipboard.writeText(url);
                              setCommMessage({ type: 'success', text: 'URL copiée !' });
                              setTimeout(() => setCommMessage(null), 2000);
                            }}
                          >
                            Copier
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
                        <p className="font-semibold flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Permissions requises
                        </p>
                        <p>
                          <code className="bg-white px-1 rounded">pages_messaging</code>
                          {' · '}
                          <code className="bg-white px-1 rounded">pages_manage_metadata</code>
                          {' · '}
                          <code className="bg-white px-1 rounded">instagram_basic</code>
                          {' · '}
                          <code className="bg-white px-1 rounded">instagram_manage_messages</code>
                        </p>
                        <p className="mt-1">
                          Abonnements Webhook :{' '}
                          <code className="bg-white px-1 rounded">messages</code>
                          {' · '}
                          <code className="bg-white px-1 rounded">messaging_postbacks</code>
                          {' · '}
                          <code className="bg-white px-1 rounded">messaging_optins</code>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ===================== TIKTOK BUSINESS ===================== */}
                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                      <Video className="h-5 w-5 text-gray-400" />
                      TikTok Business
                      {commSettings.tiktokConfigured && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-green-400 bg-green-900/40 border border-green-700 px-2 py-0.5 rounded-full">
                          <Wifi className="h-3 w-3" /> Connecté
                        </span>
                      )}
                      {!commSettings.tiktokConfigured && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                          <WifiOff className="h-3 w-3" /> Non configuré
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Application TikTok */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        Application TikTok
                      </h4>
                      <p className="text-xs text-gray-500">
                        Créez une app sur{' '}
                        <a
                          href="https://developers.tiktok.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          TikTok for Developers
                        </a>
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400 text-xs">App ID</Label>
                          <Input
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="xxxxxxxxxxxxxxxx"
                            value={commSettings.tiktokAppId}
                            onChange={(e) =>
                              setCommSettings((s) => ({ ...s, tiktokAppId: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">App Secret</Label>
                          <Input
                            type="password"
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="••••••••"
                            value={commSettings.tiktokAppSecret}
                            onChange={(e) =>
                              setCommSettings((s) => ({ ...s, tiktokAppSecret: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Compte Business TikTok */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        Compte Business
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400 text-xs">Access Token</Label>
                          <Input
                            type="password"
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="••••••••"
                            value={commSettings.tiktokAccessToken}
                            onChange={(e) =>
                              setCommSettings((s) => ({ ...s, tiktokAccessToken: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">
                            Business ID (Advertiser ID)
                          </Label>
                          <Input
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="xxxxxxxxxxxxxxxx"
                            value={commSettings.tiktokBusinessId}
                            onChange={(e) =>
                              setCommSettings((s) => ({ ...s, tiktokBusinessId: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs">Webhook Secret</Label>
                        <Input
                          className="bg-gray-800 border-gray-700 text-white mt-1"
                          placeholder="Secret de vérification webhook"
                          value={commSettings.tiktokWebhookSecret}
                          onChange={(e) =>
                            setCommSettings((s) => ({ ...s, tiktokWebhookSecret: e.target.value }))
                          }
                        />
                      </div>
                      <div className="rounded-lg bg-gray-800 border border-gray-700 p-3 text-xs text-gray-400 space-y-1">
                        <p className="font-semibold flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Scopes TikTok requis
                        </p>
                        <p>
                          <code className="bg-gray-900 px-1 rounded">user.info.basic</code>
                          {' · '}
                          <code className="bg-gray-900 px-1 rounded">video.list</code>
                          {' · '}
                          <code className="bg-gray-900 px-1 rounded">video.publish</code>
                          {' · '}
                          <code className="bg-gray-900 px-1 rounded">business.manage</code>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ===================== LINKEDIN PAGE ===================== */}
                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                      <Linkedin className="h-5 w-5 text-gray-400" />
                      LinkedIn Page
                      {commSettings.linkedinConfigured && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-green-400 bg-green-900/40 border border-green-700 px-2 py-0.5 rounded-full">
                          <Wifi className="h-3 w-3" /> Connecté
                        </span>
                      )}
                      {!commSettings.linkedinConfigured && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                          <WifiOff className="h-3 w-3" /> Non configuré
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Application LinkedIn */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        Application LinkedIn
                      </h4>
                      <p className="text-xs text-gray-500">
                        Créez une app sur{' '}
                        <a
                          href="https://www.linkedin.com/developers/apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          LinkedIn Developers
                        </a>
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400 text-xs">Client ID</Label>
                          <Input
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="xxxxxxxxxxxxxxxx"
                            value={commSettings.linkedinClientId}
                            onChange={(e) =>
                              setCommSettings((s) => ({ ...s, linkedinClientId: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Client Secret</Label>
                          <Input
                            type="password"
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="••••••••"
                            value={commSettings.linkedinClientSecret}
                            onChange={(e) =>
                              setCommSettings((s) => ({
                                ...s,
                                linkedinClientSecret: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Page LinkedIn */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        Page Entreprise
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400 text-xs">Access Token</Label>
                          <Input
                            type="password"
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="••••••••"
                            value={commSettings.linkedinAccessToken}
                            onChange={(e) =>
                              setCommSettings((s) => ({
                                ...s,
                                linkedinAccessToken: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Organization ID</Label>
                          <Input
                            className="bg-gray-800 border-gray-700 text-white mt-1"
                            placeholder="urn:li:organization:12345678"
                            value={commSettings.linkedinOrganizationId}
                            onChange={(e) =>
                              setCommSettings((s) => ({
                                ...s,
                                linkedinOrganizationId: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="rounded-lg bg-blue-950 border border-blue-800 p-3 text-xs text-blue-300 space-y-1">
                        <p className="font-semibold flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Permissions LinkedIn requises
                        </p>
                        <p>
                          <code className="bg-blue-900 px-1 rounded">r_organization_social</code>
                          {' · '}
                          <code className="bg-blue-900 px-1 rounded">w_organization_social</code>
                          {' · '}
                          <code className="bg-blue-900 px-1 rounded">rw_organization_admin</code>
                          {' · '}
                          <code className="bg-blue-900 px-1 rounded">r_basicprofile</code>
                        </p>
                        <p className="mt-1">
                          Products à activer :{' '}
                          <code className="bg-blue-900 px-1 rounded">
                            Marketing Developer Platform
                          </code>
                          {' · '}
                          <code className="bg-blue-900 px-1 rounded">Community Management API</code>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save button */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setActiveTab('profile')}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCommSave}
                    disabled={commSaving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {commSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== TRACKING TAB ========== */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tracking & Analytics</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configurez vos pixels de suivi, outils d&apos;analytics et de conversion.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {
                    TRACKING_SECTIONS.filter((s) => {
                      const st = trackingSections[s.id];
                      return st && s.fields.some((f) => st.values[f.key]?.trim());
                    }).length
                  }
                  /{TRACKING_SECTIONS.length} configurés
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allExpanded = TRACKING_SECTIONS.every(
                      (s) => trackingSections[s.id]?.expanded
                    );
                    setTrackingSections((prev) => {
                      const next = { ...prev };
                      TRACKING_SECTIONS.forEach((s) => {
                        if (next[s.id]) next[s.id] = { ...next[s.id], expanded: !allExpanded };
                      });
                      return next;
                    });
                  }}
                  className="gap-1.5"
                >
                  {TRACKING_SECTIONS.every((s) => trackingSections[s.id]?.expanded) ? (
                    <>
                      <ChevronDown className="h-4 w-4" /> Tout replier
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4" /> Tout déplier
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {TRACKING_SECTIONS.map((section) => {
                const state = trackingSections[section.id];
                if (!state) return null;
                const colors = TRACKING_COLOR_MAP[section.color] || TRACKING_COLOR_MAP.blue;
                const Icon = section.icon;
                const hasValues = section.fields.some((f) => state.values[f.key]?.trim());

                return (
                  <Card key={section.id} className={`${colors.border} shadow-sm overflow-hidden`}>
                    <CardHeader
                      className={`pb-4 cursor-pointer hover:bg-slate-50 transition-colors ${state.expanded ? 'bg-slate-50' : ''}`}
                      onClick={() => toggleTrackingExpanded(section.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <Icon className={`h-5 w-5 ${colors.icon}`} />
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                              {section.title}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-normal mt-0.5">
                              {section.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasValues ? (
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${colors.badge}`}
                            >
                              Configuré
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-0.5 rounded-full border border-gray-200 bg-gray-100 text-gray-500 font-medium">
                              Non configuré
                            </span>
                          )}
                          {state.expanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Expanded content */}
                    {state.expanded && (
                      <CardContent className="pt-4 border-t border-gray-100 bg-white">
                        {state.loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-500 text-sm">Chargement...</span>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {/* AI Hint */}
                            {section.aiHint && (
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                                <Bot className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-blue-800">{section.aiHint}</p>
                              </div>
                            )}

                            {/* Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                              {section.fields.map((field) => (
                                <div
                                  key={field.key}
                                  className={
                                    section.fields.length === 1 ||
                                    (field.secret && section.fields.length % 2 !== 0)
                                      ? 'md:col-span-2 space-y-1.5'
                                      : 'space-y-1.5'
                                  }
                                >
                                  <Label className="text-gray-700">{field.label}</Label>
                                  <div className="relative">
                                    <Input
                                      type={
                                        field.secret && !state.showSecrets[field.key]
                                          ? 'password'
                                          : 'text'
                                      }
                                      value={state.values[field.key] || ''}
                                      onChange={(e) =>
                                        updateTrackingValue(section.id, field.key, e.target.value)
                                      }
                                      placeholder={field.placeholder}
                                      className={field.secret ? 'pr-10' : ''}
                                    />
                                    {field.secret && (
                                      <button
                                        type="button"
                                        onClick={() => toggleTrackingSecret(section.id, field.key)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      >
                                        {state.showSecrets[field.key] ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  {field.hint && (
                                    <p className="text-xs text-gray-500 flex items-start gap-1">
                                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {field.hint}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Test Result */}
                            {state.testResult && (
                              <div
                                className={`p-3 rounded-lg text-sm flex items-center gap-2 ${state.testResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
                              >
                                {state.testResult.success ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span>{state.testResult.message || state.testResult.error}</span>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              {section.docsUrl ? (
                                <a
                                  href={section.docsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 font-medium"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> Documentation
                                </a>
                              ) : (
                                <div />
                              )}

                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => handleTrackingTest(section.id)}
                                  disabled={state.testing || !hasValues}
                                  className="gap-1.5"
                                >
                                  {state.testing ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4 text-gray-500" />
                                  )}
                                  Tester
                                </Button>
                                <Button
                                  onClick={() => handleTrackingSave(section.id)}
                                  disabled={state.saving || !state.dirty}
                                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {state.saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                  Sauvegarder
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
