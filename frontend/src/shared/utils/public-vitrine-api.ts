import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const publicApi = axios.create({ baseURL: `${API_BASE}/vitrine/public/slug` });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VitrineConfig {
  id: string;
  agencyName: string;
  logo?: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  phone: string;
  email: string;
  address?: string;
  schedule?: Record<string, any>;
  socialLinks?: Record<string, any>;
  theme: string;
  heroImage?: string;
  aboutText?: string;
  services?: any[];
  testimonials?: any[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  slug?: string;
  whatsappNumber?: string;
  sectionsConfig?: Record<string, boolean>;
  themeConfig?: Record<string, any>;
}

export interface PublicProperty {
  id: string;
  reference?: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  city?: string;
  delegation?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images: string[];
  features: string[];
  tags: string[];
  status: string;
  latitude?: number;
  longitude?: number;
  viewsCount: number;
  createdAt: string;
  isFeatured?: boolean;
  contactCount?: number;
  seo?: { metaTitle?: string; metaDescription?: string; slug?: string; keywords?: string[] };
  similarProperties?: PublicProperty[];
  agencyConfig?: {
    agencyName: string;
    phone: string;
    whatsappNumber?: string;
    primaryColor: string;
    logo?: string;
  };
}

export interface PublicAgent {
  id: string;
  displayName: string;
  photo?: string;
  bio?: string;
  speciality?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  role: string;
  stats?: { totalSales?: number; activeListings?: number; yearsExp?: number };
}

export interface SubmitLeadData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  message?: string;
  type?: 'CONTACT' | 'VISIT_REQUEST' | 'ESTIMATION' | 'ALERT' | 'INVESTMENT';
  propertyId?: string;
  agentProfileId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export interface PropertyFilters {
  type?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  sort?: 'price_asc' | 'price_desc' | 'date_desc' | 'area_desc';
  page?: number;
  limit?: number;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export const publicVitrineApi = {
  /** Données complètes page d'accueil */
  getHome: async (slug: string) => {
    const { data } = await publicApi.get(`/${slug}`);
    return data as {
      config: VitrineConfig;
      featuredProperties: PublicProperty[];
      agents: PublicAgent[];
      stats: any;
    };
  },

  /** Liste paginée des biens avec filtres */
  getProperties: async (slug: string, filters: PropertyFilters = {}) => {
    const params = Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const { data } = await publicApi.get(`/${slug}/properties`, { params });
    return data as {
      data: PublicProperty[];
      meta: { total: number; page: number; limit: number; totalPages: number };
      filters: any;
    };
  },

  /** Détail d'un bien (id ou seo slug) */
  getProperty: async (slug: string, propertyRef: string) => {
    const { data } = await publicApi.get(`/${slug}/properties/${propertyRef}`);
    return data as PublicProperty;
  },

  /** Équipe de l'agence */
  getAgents: async (slug: string) => {
    const { data } = await publicApi.get(`/${slug}/agents`);
    return data as PublicAgent[];
  },

  /** Profil individuel d'un agent */
  getAgent: async (slug: string, agentId: string) => {
    const { data } = await publicApi.get(`/${slug}/agents/${agentId}`);
    return data as PublicAgent;
  },

  /** Soumettre un formulaire (contact, visite, estimation...) */
  submitLead: async (slug: string, leadData: SubmitLeadData) => {
    // Injection UTM depuis URL automatique
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      leadData.utmSource = leadData.utmSource || params.get('utm_source') || undefined;
      leadData.utmMedium = leadData.utmMedium || params.get('utm_medium') || undefined;
      leadData.utmCampaign = leadData.utmCampaign || params.get('utm_campaign') || undefined;
      leadData.referrer = leadData.referrer || document.referrer || undefined;
    }
    const { data } = await publicApi.post(`/${slug}/contact`, leadData);
    return data as { success: boolean; leadId: string; prospectId: string };
  },

  /** Tracker un événement vitrine */
  trackEvent: async (userId: string, eventName: string, eventData: Record<string, any> = {}) => {
    try {
      await axios.post(`${API_BASE}/vitrine/track-event`, { userId, eventName, eventData });
    } catch {
      // Non-bloquant
    }
  },
};

export default publicVitrineApi;
