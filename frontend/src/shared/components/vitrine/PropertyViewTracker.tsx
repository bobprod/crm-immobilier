import { useEffect, useRef } from 'react';

/**
 * Composant pour tracker automatiquement les vues de biens immobiliers
 * et les interactions avec les boutons sur les pages vitrines
 *
 * Tracking précis :
 * - Vue d'un bien (impression visible à l'écran)
 * - Temps passé sur un bien
 * - Clics sur boutons (voir détails, contacter, télécharger, etc.)
 * - Scroll jusqu'au bien
 * - Hover sur le bien
 *
 * Usage:
 * <PropertyViewTracker
 *   agencyId={userId}
 *   propertyId={property.id}
 *   propertyData={{
 *     title: property.title,
 *     price: property.price,
 *     city: property.city,
 *     type: property.type,
 *     category: property.category
 *   }}
 * />
 */

interface PropertyData {
  title: string;
  price: number;
  city: string;
  type: string;
  category: 'sale' | 'rent';
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
}

interface PropertyViewTrackerProps {
  agencyId: string;
  propertyId: string;
  propertyData: PropertyData;
  elementRef?: React.RefObject<HTMLElement>; // Ref de l'élément à observer
  enabled?: boolean;
}

export function PropertyViewTracker({
  agencyId,
  propertyId,
  propertyData,
  elementRef,
  enabled = true,
}: PropertyViewTrackerProps) {
  const viewStartTime = useRef<number | null>(null);
  const hasTrackedImpression = useRef(false);
  const sessionId = useRef<string>(generateSessionId());

  useEffect(() => {
    if (!enabled || !agencyId || !propertyId) return;

    // Tracker l'impression (visible à l'écran)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedImpression.current) {
            // Le bien est visible à l'écran
            trackImpression();
            hasTrackedImpression.current = true;
            viewStartTime.current = Date.now();
          } else if (!entry.isIntersecting && viewStartTime.current) {
            // Le bien n'est plus visible, calculer le temps passé
            const timeSpent = Date.now() - viewStartTime.current;
            if (timeSpent > 1000) {
              // Seulement si > 1 seconde
              trackTimeSpent(timeSpent);
            }
            viewStartTime.current = null;
          }
        });
      },
      {
        threshold: 0.5, // 50% du bien doit être visible
      },
    );

    // Observer l'élément
    const element = elementRef?.current || document.getElementById(`property-${propertyId}`);
    if (element) {
      observer.observe(element);
    }

    // Tracker les clics sur les boutons
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button, a[href]');

      if (button && element?.contains(button)) {
        const buttonText =
          button.textContent?.trim() ||
          button.getAttribute('aria-label') ||
          button.getAttribute('title') ||
          'Unknown Button';

        const buttonType = identifyButtonType(buttonText, button);

        trackButtonClick(buttonType, buttonText, button);
      }
    };

    document.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      if (element) {
        observer.unobserve(element);
      }
      document.removeEventListener('click', handleClick);

      // Envoyer le temps final si l'utilisateur quitte
      if (viewStartTime.current) {
        const finalTime = Date.now() - viewStartTime.current;
        if (finalTime > 1000) {
          trackTimeSpent(finalTime);
        }
      }
    };
  }, [agencyId, propertyId, enabled, elementRef]);

  const trackImpression = async () => {
    try {
      await sendEvent('PropertyImpression', {
        propertyId,
        propertyData,
        visibility: 'visible',
        scrollDepth: window.scrollY,
      });

      console.log('[PropertyTracker] Impression:', propertyId, propertyData.title);
    } catch (error) {
      console.error('[PropertyTracker] Failed to track impression:', error);
    }
  };

  const trackTimeSpent = async (timeMs: number) => {
    try {
      await sendEvent('PropertyTimeSpent', {
        propertyId,
        propertyData,
        timeSpent: timeMs,
        timeSpentSeconds: Math.round(timeMs / 1000),
      });

      console.log(
        '[PropertyTracker] Time spent:',
        propertyId,
        Math.round(timeMs / 1000) + 's',
      );
    } catch (error) {
      console.error('[PropertyTracker] Failed to track time spent:', error);
    }
  };

  const trackButtonClick = async (
    buttonType: string,
    buttonText: string,
    button: Element,
  ) => {
    try {
      const href = button.getAttribute('href');

      await sendEvent('PropertyButtonClick', {
        propertyId,
        propertyData,
        buttonType,
        buttonText,
        buttonHref: href,
        clickPosition: {
          x: (button as HTMLElement).offsetLeft,
          y: (button as HTMLElement).offsetTop,
        },
      });

      console.log('[PropertyTracker] Button click:', buttonType, propertyId);

      // Si c'est un bouton de contact, tracker comme Lead
      if (buttonType === 'contact' || buttonType === 'call') {
        await sendEvent('Lead', {
          propertyId,
          propertyData,
          source: 'property_card_button',
          buttonType,
        });
      }
    } catch (error) {
      console.error('[PropertyTracker] Failed to track button click:', error);
    }
  };

  const sendEvent = async (eventName: string, eventData: any) => {
    const apiUrl = '/api/marketing-tracking/track';

    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: agencyId,
        platform: 'vitrine',
        eventName,
        eventData: {
          ...eventData,
          sessionId: sessionId.current,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  };

  return null; // Ce composant n'affiche rien
}

/**
 * Identifier le type de bouton selon son texte et attributs
 */
function identifyButtonType(text: string, button: Element): string {
  const textLower = text.toLowerCase();
  const href = button.getAttribute('href')?.toLowerCase() || '';

  // Contact
  if (
    textLower.includes('contact') ||
    textLower.includes('nous contacter') ||
    href.includes('contact')
  ) {
    return 'contact';
  }

  // Appel téléphonique
  if (
    textLower.includes('appel') ||
    textLower.includes('téléphone') ||
    href.startsWith('tel:')
  ) {
    return 'call';
  }

  // Email
  if (textLower.includes('email') || textLower.includes('mail') || href.startsWith('mailto:')) {
    return 'email';
  }

  // Voir détails / Plus d'infos
  if (
    textLower.includes('détail') ||
    textLower.includes('voir') ||
    textLower.includes('plus') ||
    textLower.includes('info')
  ) {
    return 'view_details';
  }

  // Télécharger
  if (textLower.includes('télécharger') || textLower.includes('download')) {
    return 'download';
  }

  // Partager
  if (textLower.includes('partag')) {
    return 'share';
  }

  // Favoris / Sauvegarder
  if (textLower.includes('favoris') || textLower.includes('sauvegard')) {
    return 'save';
  }

  // Visite / Rendez-vous
  if (textLower.includes('visite') || textLower.includes('rendez-vous') || textLower.includes('rdv')) {
    return 'schedule_visit';
  }

  // Simulateur
  if (textLower.includes('simulateur') || textLower.includes('simul')) {
    return 'calculator';
  }

  // Galerie photos
  if (textLower.includes('photo') || textLower.includes('galerie') || textLower.includes('image')) {
    return 'gallery';
  }

  // Par défaut
  return 'other';
}

/**
 * Générer un ID de session unique
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

/**
 * Hook pour tracker facilement les interactions avec les propriétés
 */
export function usePropertyTracking(agencyId: string) {
  const trackPropertyView = (propertyId: string, propertyData: PropertyData) => {
    if (typeof window !== 'undefined' && (window as any).CRMTracking) {
      (window as any).CRMTracking.trackPropertyView(propertyId, propertyData);
    }
  };

  const trackPropertyClick = (
    propertyId: string,
    propertyData: PropertyData,
    action: string,
  ) => {
    if (typeof window !== 'undefined' && (window as any).CRMTracking) {
      (window as any).CRMTracking.trackEvent('PropertyInteraction', {
        propertyId,
        propertyData,
        action,
      });
    }
  };

  return {
    trackPropertyView,
    trackPropertyClick,
  };
}
