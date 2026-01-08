import { useEffect } from 'react';

/**
 * Composant pour charger automatiquement les pixels de tracking dans les pages vitrines
 *
 * Usage:
 * <TrackingPixelsLoader agencyId={userId} />
 *
 * Ce composant charge automatiquement le script de tracking qui injecte
 * tous les pixels configurés (Meta, GTM, GA4, TikTok, LinkedIn, etc.)
 */
interface TrackingPixelsLoaderProps {
  /**
   * ID de l'agence (userId) pour laquelle charger les pixels
   */
  agencyId: string;

  /**
   * Si true, charge les pixels même en mode développement
   * Par défaut: false (pixels désactivés en dev)
   */
  loadInDev?: boolean;
}

export function TrackingPixelsLoader({
  agencyId,
  loadInDev = false,
}: TrackingPixelsLoaderProps) {
  useEffect(() => {
    // Ne pas charger les pixels en développement sauf si explicitement demandé
    if (process.env.NODE_ENV === 'development' && !loadInDev) {
      console.log('[Tracking Pixels] Disabled in development mode');
      return;
    }

    if (!agencyId) {
      console.warn('[Tracking Pixels] No agency ID provided');
      return;
    }

    // Charger le script de tracking
    const script = document.createElement('script');
    script.src = `/api/vitrine/tracking-script/${agencyId}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[Tracking Pixels] Script loaded successfully');
    };

    script.onerror = () => {
      console.error('[Tracking Pixels] Failed to load tracking script');
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [agencyId, loadInDev]);

  return null; // Ce composant n'affiche rien
}

/**
 * Hook pour tracker des événements personnalisés depuis les pages vitrines
 *
 * Usage:
 * const { trackEvent, trackPropertyView, trackLead, trackSearch } = useVitrineTracking();
 *
 * trackPropertyView('property-id-123', {
 *   title: 'Villa avec piscine',
 *   price: 500000,
 *   currency: 'TND'
 * });
 */
export function useVitrineTracking() {
  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).CRMTracking) {
      (window as any).CRMTracking.trackEvent(eventName, eventData);
    } else {
      console.warn('[Tracking] CRMTracking not loaded yet');
    }
  };

  const trackPropertyView = (propertyId: string, propertyData: any) => {
    if (typeof window !== 'undefined' && (window as any).CRMTracking) {
      (window as any).CRMTracking.trackPropertyView(propertyId, propertyData);
    }
  };

  const trackLead = (formData: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).CRMTracking) {
      (window as any).CRMTracking.trackLead(formData);
    }
  };

  const trackSearch = (searchParams: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).CRMTracking) {
      (window as any).CRMTracking.trackSearch(searchParams);
    }
  };

  return {
    trackEvent,
    trackPropertyView,
    trackLead,
    trackSearch,
  };
}

/**
 * Exemple d'utilisation dans une page vitrine
 *
 * import { TrackingPixelsLoader, useVitrineTracking } from '@/shared/components/vitrine/TrackingPixelsLoader';
 *
 * export default function PublicVitrineProperty({ agencyId, property }) {
 *   const { trackPropertyView } = useVitrineTracking();
 *
 *   useEffect(() => {
 *     // Tracker automatiquement la vue de la propriété
 *     trackPropertyView(property.id, {
 *       title: property.title,
 *       price: property.price,
 *       currency: property.currency,
 *       type: property.type,
 *       city: property.city
 *     });
 *   }, [property]);
 *
 *   return (
 *     <div>
 *       <TrackingPixelsLoader agencyId={agencyId} />
 *       <h1>{property.title}</h1>
 *       <p>{property.description}</p>
 *       {/* Reste du contenu *\/}
 *     </div>
 *   );
 * }
 */
