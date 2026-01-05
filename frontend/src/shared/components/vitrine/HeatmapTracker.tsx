import { useEffect, useRef } from 'react';

/**
 * Composant pour tracker automatiquement les clics, mouvements et scroll
 * sur les pages vitrines afin de générer des heatmaps.
 *
 * Usage:
 * <HeatmapTracker agencyId={userId} pageUrl={window.location.href} />
 */
interface HeatmapTrackerProps {
  agencyId: string;
  pageUrl?: string;
  enabled?: boolean;
  throttleMs?: number; // Throttle pour les events move/scroll
}

export function HeatmapTracker({
  agencyId,
  pageUrl,
  enabled = true,
  throttleMs = 500,
}: HeatmapTrackerProps) {
  const eventsBuffer = useRef<any[]>([]);
  const sessionId = useRef<string>(generateSessionId());
  const lastMoveTime = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !agencyId) return;

    const currentPageUrl = pageUrl || (typeof window !== 'undefined' ? window.location.href : '');

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const deviceType = getDeviceType(screenWidth);

    // Handler pour les clics
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const element = target.tagName.toLowerCase();
      const classes = target.className;
      const selector = `${element}${classes ? '.' + classes.split(' ').join('.') : ''}`;

      // Identifier le contexte du clic (bien immobilier, bouton, etc.)
      const context = identifyClickContext(target);

      addEvent({
        pageUrl: currentPageUrl,
        x: e.clientX,
        y: e.clientY + window.scrollY,
        type: 'click',
        element: selector,
        sessionId: sessionId.current,
        deviceType,
        screenWidth,
        screenHeight,
        ...context, // Contexte enrichi (propertyId, buttonType, etc.)
      });
    };

    // Handler pour les mouvements de souris (throttled)
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime.current < throttleMs) return;

      lastMoveTime.current = now;

      addEvent({
        pageUrl: currentPageUrl,
        x: e.clientX,
        y: e.clientY + window.scrollY,
        type: 'move',
        sessionId: sessionId.current,
        deviceType,
        screenWidth,
        screenHeight,
      });
    };

    // Handler pour le scroll (throttled)
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime.current < throttleMs) return;

      lastScrollTime.current = now;

      addEvent({
        pageUrl: currentPageUrl,
        x: window.scrollX,
        y: window.scrollY,
        type: 'scroll',
        sessionId: sessionId.current,
        deviceType,
        screenWidth,
        screenHeight,
      });
    };

    // Ajouter les event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Envoyer le buffer toutes les 10 secondes
    const flushInterval = setInterval(() => {
      flushEvents();
    }, 10000);

    // Envoyer avant le unload
    const handleBeforeUnload = () => {
      flushEvents();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(flushInterval);
      flushEvents(); // Flush final
    };
  }, [agencyId, enabled, pageUrl, throttleMs]);

  const addEvent = (event: any) => {
    eventsBuffer.current.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    // Flush si le buffer est trop grand
    if (eventsBuffer.current.length >= 50) {
      flushEvents();
    }
  };

  const flushEvents = async () => {
    if (eventsBuffer.current.length === 0) return;

    const events = [...eventsBuffer.current];
    eventsBuffer.current = [];

    try {
      await fetch('/api/marketing-tracking/heatmap/record-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: agencyId,
          events,
        }),
      });
    } catch (error) {
      console.error('Failed to send heatmap events:', error);
      // Remettre dans le buffer en cas d'échec
      eventsBuffer.current = [...events, ...eventsBuffer.current];
    }
  };

  return null; // Ce composant n'affiche rien
}

/**
 * Identifier le contexte du clic pour enrichir les données heatmap
 */
function identifyClickContext(target: HTMLElement): Record<string, any> {
  const context: Record<string, any> = {};

  // Chercher si on est dans une carte de bien immobilier
  const propertyCard = target.closest('[data-property-id], [id^="property-"]');
  if (propertyCard) {
    const propertyId =
      propertyCard.getAttribute('data-property-id') ||
      propertyCard.id.replace('property-', '');
    context.propertyId = propertyId;
    context.contextType = 'property';

    // Récupérer les données du bien si disponibles
    const propertyData = propertyCard.getAttribute('data-property-data');
    if (propertyData) {
      try {
        context.propertyData = JSON.parse(propertyData);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Identifier le type d'élément cliqué
  const button = target.closest('button, a[href]');
  if (button) {
    const buttonText =
      button.textContent?.trim() ||
      button.getAttribute('aria-label') ||
      button.getAttribute('title') ||
      '';

    context.buttonText = buttonText;
    context.buttonType = identifyButtonType(buttonText, button);
    context.isButton = true;

    const href = button.getAttribute('href');
    if (href) {
      context.buttonHref = href;
    }
  }

  // Identifier si c'est une image
  if (target.tagName.toLowerCase() === 'img' || target.closest('img')) {
    context.isImage = true;
    const img = target.tagName.toLowerCase() === 'img' ? target : target.closest('img');
    context.imageAlt = img?.getAttribute('alt');
    context.imageSrc = img?.getAttribute('src');
  }

  // Identifier si c'est un formulaire ou input
  const formElement = target.closest('form');
  if (formElement) {
    context.isForm = true;
    context.formId = formElement.id || formElement.getAttribute('name');
  }

  if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
    context.isInput = true;
    context.inputType = target.getAttribute('type');
    context.inputName = target.getAttribute('name');
  }

  return context;
}

/**
 * Identifier le type de bouton
 */
function identifyButtonType(text: string, button: Element): string {
  const textLower = text.toLowerCase();
  const href = button.getAttribute('href')?.toLowerCase() || '';

  if (
    textLower.includes('contact') ||
    textLower.includes('nous contacter') ||
    href.includes('contact')
  ) {
    return 'contact';
  }

  if (
    textLower.includes('appel') ||
    textLower.includes('téléphone') ||
    href.startsWith('tel:')
  ) {
    return 'call';
  }

  if (textLower.includes('email') || textLower.includes('mail') || href.startsWith('mailto:')) {
    return 'email';
  }

  if (
    textLower.includes('détail') ||
    textLower.includes('voir') ||
    textLower.includes('plus') ||
    textLower.includes('info')
  ) {
    return 'view_details';
  }

  if (textLower.includes('télécharger') || textLower.includes('download')) {
    return 'download';
  }

  if (textLower.includes('partag')) {
    return 'share';
  }

  if (textLower.includes('favoris') || textLower.includes('sauvegard')) {
    return 'save';
  }

  if (textLower.includes('visite') || textLower.includes('rendez-vous') || textLower.includes('rdv')) {
    return 'schedule_visit';
  }

  return 'other';
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

function getDeviceType(screenWidth: number): 'desktop' | 'mobile' | 'tablet' {
  if (screenWidth < 768) return 'mobile';
  if (screenWidth < 1024) return 'tablet';
  return 'desktop';
}
