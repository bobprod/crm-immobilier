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
      const element = (e.target as HTMLElement).tagName.toLowerCase();
      const classes = (e.target as HTMLElement).className;
      const selector = `${element}${classes ? '.' + classes.split(' ').join('.') : ''}`;

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

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

function getDeviceType(screenWidth: number): 'desktop' | 'mobile' | 'tablet' {
  if (screenWidth < 768) return 'mobile';
  if (screenWidth < 1024) return 'tablet';
  return 'desktop';
}
