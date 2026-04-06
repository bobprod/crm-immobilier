import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import {
  Activity,
  Wifi,
  WifiOff,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface RealtimeEvent {
  id: string;
  platform: string;
  eventName: string;
  eventData: Record<string, any>;
  timestamp: Date;
}

export default function TrackingRealtimeDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    eventsPerMinute: 0,
    activeUsers: 0,
  });
  const [filters, setFilters] = useState({
    platforms: [] as string[],
    eventTypes: [] as string[],
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Récupérer le token JWT
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.error('No auth token found');
      return;
    }

    // Connexion WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const newSocket = io(`${socketUrl}/tracking-realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Event handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to tracking realtime');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from tracking realtime');
      setConnected(false);
    });

    newSocket.on('tracking:connected', (data) => {
      console.log('Tracking realtime ready:', data);
    });

    newSocket.on('tracking:new-event', (event: RealtimeEvent) => {
      console.log('New event:', event);

      setEvents((prev) => {
        const newEvents = [event, ...prev].slice(0, 100); // Garder les 100 derniers
        return newEvents;
      });

      setStats((prev) => ({
        ...prev,
        totalEvents: prev.totalEvents + 1,
      }));
    });

    newSocket.on('tracking:stats-update', (newStats) => {
      setStats((prev) => ({ ...prev, ...newStats }));
    });

    newSocket.on('tracking:alert', (alert) => {
      console.warn('Alert:', alert);
      // Afficher une notification
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Envoyer les filtres au serveur
    if (filters.platforms.length > 0 || filters.eventTypes.length > 0) {
      socket.emit('tracking:subscribe', filters);
    }
  }, [filters, socket]);

  useEffect(() => {
    // Auto-scroll vers le bas si activé
    if (autoScroll && eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop = eventsContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const platformColors: Record<string, string> = {
    facebook: 'bg-blue-500',
    meta: 'bg-blue-500',
    google_analytics: 'bg-orange-500',
    google_ads: 'bg-green-500',
    google_tag_manager: 'bg-purple-500',
    tiktok: 'bg-black',
    linkedin: 'bg-blue-600',
    snapchat: 'bg-yellow-400',
    vitrine: 'bg-indigo-500',
  };

  const togglePlatformFilter = (platform: string) => {
    setFilters((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const clearEvents = () => {
    setEvents([]);
    setStats((prev) => ({ ...prev, totalEvents: 0 }));
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8 text-red-600 animate-pulse" />
              Tracking Temps Réel
            </h1>
            <p className="text-gray-600 mt-2">
              Visualisez les événements de tracking en direct
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Status de connexion */}
            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600 animate-pulse" />
                  <Badge className="bg-green-500 text-white">Connecté</Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">Déconnecté</Badge>
                </>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={clearEvents}>
              Effacer
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Événements Total</p>
                <p className="text-3xl font-bold">{stats.totalEvents}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Direct</p>
                <p className="text-3xl font-bold">{events.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Événements/min</p>
                <p className="text-3xl font-bold">{stats.eventsPerMinute}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Filtres */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Auto-scroll */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-scroll</span>
                <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Plateformes</h4>
                <div className="space-y-2">
                  {['meta', 'google_tag_manager', 'google_analytics', 'tiktok', 'linkedin', 'vitrine'].map(
                    (platform) => (
                      <button
                        key={platform}
                        onClick={() => togglePlatformFilter(platform)}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          filters.platforms.includes(platform)
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <Badge className={platformColors[platform] || 'bg-gray-500'}>
                          {platform}
                        </Badge>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Types d'événements</h4>
                <div className="space-y-2">
                  {['PageView', 'ViewContent', 'Lead', 'Search', 'AddToCart'].map((eventType) => (
                    <button
                      key={eventType}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          eventTypes: prev.eventTypes.includes(eventType)
                            ? prev.eventTypes.filter((e) => e !== eventType)
                            : [...prev.eventTypes, eventType],
                        }))
                      }
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        filters.eventTypes.includes(eventType)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {eventType}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main - Liste des événements */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Événements en Direct
              </span>
              {connected && (
                <Badge className="bg-green-500 text-white animate-pulse">● LIVE</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!connected && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Connexion au serveur en cours...</p>
              </div>
            )}

            {connected && events.length === 0 && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">En attente d'événements...</p>
              </div>
            )}

            <div
              ref={eventsContainerRef}
              className="space-y-3 max-h-[600px] overflow-y-auto pr-2"
            >
              {events.map((event, index) => (
                <div
                  key={`${event.id}-${index}`}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors animate-in slide-in-from-top duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={platformColors[event.platform] || 'bg-gray-500'}>
                        {event.platform}
                      </Badge>
                      <span className="font-semibold">{event.eventName}</span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
                      </Badge>
                    </div>
                  </div>

                  {event.eventData && Object.keys(event.eventData).length > 0 && (
                    <div className="mt-2 bg-gray-50 rounded p-3 text-xs font-mono">
                      <pre className="overflow-x-auto">
                        {JSON.stringify(event.eventData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
