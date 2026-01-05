import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { TrackingEventsService } from '@/modules/marketing/tracking/services/tracking-events.service';

/**
 * Service pour gérer l'injection et le tracking des pixels sur les pages vitrines
 *
 * Chaque agence peut avoir ses propres pixels configurés qui seront automatiquement
 * injectés dans toutes ses pages vitrines publiques.
 */
@Injectable()
export class VitrineTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingEvents: TrackingEventsService,
  ) {}

  /**
   * Générer le script JavaScript d'injection des pixels pour une agence
   *
   * Ce script sera injecté dans toutes les pages vitrines de l'agence
   * et initialisera automatiquement tous les pixels configurés.
   */
  async generateTrackingScript(userId: string): Promise<string> {
    // Récupérer toutes les configurations de tracking actives
    const trackingConfigs = await this.prisma.trackingConfig.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (trackingConfigs.length === 0) {
      return '// Aucun pixel de tracking configuré';
    }

    const scripts: string[] = [];

    // En-tête du script
    scripts.push(`
// === CRM Immobilier - Tracking Pixels Auto-Injection ===
// Généré automatiquement pour userId: ${userId}
// Date: ${new Date().toISOString()}

(function() {
  'use strict';

  // Configuration globale
  window.CRMTracking = window.CRMTracking || {
    userId: '${userId}',
    configs: ${JSON.stringify(trackingConfigs)},
    ready: false,
    events: []
  };
`);

    // Générer le code pour chaque plateforme configurée
    for (const config of trackingConfigs) {
      switch (config.platform.toLowerCase()) {
        case 'facebook':
        case 'meta':
          scripts.push(this.generateMetaPixelScript(config));
          break;

        case 'google_tag_manager':
        case 'gtm':
          scripts.push(this.generateGTMScript(config));
          break;

        case 'google_analytics':
        case 'ga4':
          scripts.push(this.generateGA4Script(config));
          break;

        case 'google_ads':
          scripts.push(this.generateGoogleAdsScript(config));
          break;

        case 'tiktok':
          scripts.push(this.generateTikTokScript(config));
          break;

        case 'linkedin':
          scripts.push(this.generateLinkedInScript(config));
          break;

        case 'snapchat':
          scripts.push(this.generateSnapchatScript(config));
          break;
      }
    }

    // Ajouter les fonctions utilitaires
    scripts.push(this.generateUtilityFunctions());

    // Tracker automatiquement la page view
    scripts.push(`
  // Auto-track page view
  window.addEventListener('load', function() {
    window.CRMTracking.ready = true;
    window.CRMTracking.trackEvent('PageView', {
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer
    });
  });

})();
`);

    return scripts.join('\n');
  }

  /**
   * Meta Pixel (Facebook/Instagram)
   */
  private generateMetaPixelScript(config: any): string {
    const pixelConfig = config.platformConfig as any;
    const pixelId = pixelConfig?.pixelId || config.pixelId;

    if (!pixelId) return '';

    return `
  // === META PIXEL ===
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${pixelId}');
  console.log('[CRM Tracking] Meta Pixel initialized:', '${pixelId}');
`;
  }

  /**
   * Google Tag Manager
   */
  private generateGTMScript(config: any): string {
    const gtmConfig = config.platformConfig as any;
    const containerId = gtmConfig?.containerId || config.pixelId;

    if (!containerId) return '';

    return `
  // === GOOGLE TAG MANAGER ===
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${containerId}');
  console.log('[CRM Tracking] GTM initialized:', '${containerId}');
`;
  }

  /**
   * Google Analytics 4
   */
  private generateGA4Script(config: any): string {
    const ga4Config = config.platformConfig as any;
    const measurementId = ga4Config?.measurementId || config.pixelId;

    if (!measurementId) return '';

    return `
  // === GOOGLE ANALYTICS 4 ===
  var ga4Script = document.createElement('script');
  ga4Script.async = true;
  ga4Script.src = 'https://www.googletagmanager.com/gtag/js?id=${measurementId}';
  document.head.appendChild(ga4Script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
  console.log('[CRM Tracking] GA4 initialized:', '${measurementId}');
`;
  }

  /**
   * Google Ads
   */
  private generateGoogleAdsScript(config: any): string {
    const adsConfig = config.platformConfig as any;
    const conversionId = adsConfig?.conversionId || config.pixelId;

    if (!conversionId) return '';

    return `
  // === GOOGLE ADS ===
  var gadsScript = document.createElement('script');
  gadsScript.async = true;
  gadsScript.src = 'https://www.googletagmanager.com/gtag/js?id=${conversionId}';
  document.head.appendChild(gadsScript);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${conversionId}');
  console.log('[CRM Tracking] Google Ads initialized:', '${conversionId}');
`;
  }

  /**
   * TikTok Pixel
   */
  private generateTikTokScript(config: any): string {
    const tiktokConfig = config.platformConfig as any;
    const pixelCode = tiktokConfig?.pixelCode || config.pixelId;

    if (!pixelCode) return '';

    return `
  // === TIKTOK PIXEL ===
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load('${pixelCode}');
    ttq.page();
  }(window, document, 'ttq');
  console.log('[CRM Tracking] TikTok Pixel initialized:', '${pixelCode}');
`;
  }

  /**
   * LinkedIn Insight Tag
   */
  private generateLinkedInScript(config: any): string {
    const linkedinConfig = config.platformConfig as any;
    const partnerId = linkedinConfig?.partnerId || config.pixelId;

    if (!partnerId) return '';

    return `
  // === LINKEDIN INSIGHT TAG ===
  _linkedin_partner_id = "${partnerId}";
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(_linkedin_partner_id);
  (function(l) {
    if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}
    var s = document.getElementsByTagName("script")[0];
    var b = document.createElement("script");
    b.type = "text/javascript";b.async = true;
    b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b, s);
  })(window.lintrk);
  console.log('[CRM Tracking] LinkedIn Insight Tag initialized:', '${partnerId}');
`;
  }

  /**
   * Snapchat Pixel
   */
  private generateSnapchatScript(config: any): string {
    const snapConfig = config.platformConfig as any;
    const pixelId = snapConfig?.pixelId || config.pixelId;

    if (!pixelId) return '';

    return `
  // === SNAPCHAT PIXEL ===
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
  {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
  a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
  r.src=n;var u=t.getElementsByTagName(s)[0];
  u.parentNode.insertBefore(r,u);})(window,document,
  'https://sc-static.net/scevent.min.js');
  snaptr('init', '${pixelId}');
  snaptr('track', 'PAGE_VIEW');
  console.log('[CRM Tracking] Snapchat Pixel initialized:', '${pixelId}');
`;
  }

  /**
   * Fonctions utilitaires pour le tracking
   */
  private generateUtilityFunctions(): string {
    return `
  // === UTILITY FUNCTIONS ===

  /**
   * Tracker un événement personnalisé sur toutes les plateformes actives
   */
  window.CRMTracking.trackEvent = function(eventName, eventData) {
    eventData = eventData || {};

    console.log('[CRM Tracking] Event:', eventName, eventData);

    // Stocker l'événement
    window.CRMTracking.events.push({
      name: eventName,
      data: eventData,
      timestamp: new Date().toISOString()
    });

    // Envoyer à toutes les plateformes configurées
    window.CRMTracking.configs.forEach(function(config) {
      try {
        switch(config.platform.toLowerCase()) {
          case 'facebook':
          case 'meta':
            if (typeof fbq !== 'undefined') {
              fbq('track', eventName, eventData);
            }
            break;

          case 'google_tag_manager':
          case 'gtm':
            if (typeof dataLayer !== 'undefined') {
              dataLayer.push({
                event: eventName,
                ...eventData
              });
            }
            break;

          case 'google_analytics':
          case 'ga4':
            if (typeof gtag !== 'undefined') {
              gtag('event', eventName, eventData);
            }
            break;

          case 'tiktok':
            if (typeof ttq !== 'undefined') {
              ttq.track(eventName, eventData);
            }
            break;

          case 'linkedin':
            if (typeof lintrk !== 'undefined') {
              lintrk('track', { conversion_id: eventData.conversion_id || eventName });
            }
            break;

          case 'snapchat':
            if (typeof snaptr !== 'undefined') {
              snaptr('track', eventName.toUpperCase().replace(/\s/g, '_'), eventData);
            }
            break;
        }
      } catch (error) {
        console.error('[CRM Tracking] Error tracking event on', config.platform, error);
      }
    });

    // Envoyer au backend CRM pour analytics
    this.sendToBackend(eventName, eventData);
  };

  /**
   * Envoyer l'événement au backend CRM
   */
  window.CRMTracking.sendToBackend = function(eventName, eventData) {
    var apiUrl = window.location.origin + '/api/marketing-tracking/track';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'vitrine',
        eventName: eventName,
        eventData: {
          ...eventData,
          source: 'vitrine',
          userId: window.CRMTracking.userId,
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      })
    }).catch(function(error) {
      console.error('[CRM Tracking] Failed to send to backend:', error);
    });
  };

  /**
   * Tracker une vue de propriété
   */
  window.CRMTracking.trackPropertyView = function(propertyId, propertyData) {
    this.trackEvent('ViewContent', {
      content_type: 'property',
      content_ids: [propertyId],
      content_name: propertyData.title || 'Property',
      value: propertyData.price || 0,
      currency: propertyData.currency || 'TND'
    });
  };

  /**
   * Tracker une soumission de formulaire de contact
   */
  window.CRMTracking.trackLead = function(formData) {
    this.trackEvent('Lead', {
      content_name: 'Contact Form',
      ...formData
    });
  };

  /**
   * Tracker une recherche de propriété
   */
  window.CRMTracking.trackSearch = function(searchParams) {
    this.trackEvent('Search', {
      search_string: JSON.stringify(searchParams)
    });
  };

  console.log('[CRM Tracking] Utility functions loaded');
`;
  }

  /**
   * Tracker un événement vitrine (appelé depuis le backend)
   */
  async trackVitrineEvent(
    userId: string,
    eventName: string,
    eventData: Record<string, any>,
  ): Promise<void> {
    try {
      await this.trackingEvents.trackEvent({
        userId,
        platform: 'vitrine',
        eventName,
        eventData: {
          ...eventData,
          source: 'vitrine_public',
          timestamp: new Date().toISOString(),
        },
        sessionId: eventData.sessionId,
        userAgent: eventData.userAgent,
        ipAddress: eventData.ipAddress,
      });
    } catch (error) {
      console.error('Failed to track vitrine event:', error);
    }
  }

  /**
   * Obtenir les statistiques de tracking pour une vitrine
   */
  async getVitrineTrackingStats(userId: string, period: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(period);

    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        platform: 'vitrine',
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Calculer les statistiques
    const pageViews = events.filter((e) => e.eventName === 'PageView').length;
    const propertyViews = events.filter((e) => e.eventName === 'ViewContent').length;
    const leads = events.filter((e) => e.eventName === 'Lead').length;
    const searches = events.filter((e) => e.eventName === 'Search').length;

    return {
      period,
      totalEvents: events.length,
      pageViews,
      propertyViews,
      leads,
      searches,
      conversionRate: pageViews > 0 ? ((leads / pageViews) * 100).toFixed(2) : 0,
      events: events.slice(0, 20), // Derniers 20 événements
    };
  }

  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}
