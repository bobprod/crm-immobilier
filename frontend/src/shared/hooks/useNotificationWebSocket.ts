import { useEffect, useRef, useState, useCallback } from 'react';
import { Notification } from '../utils/notifications-api';

/**
 * 🔌 Hook WebSocket pour les notifications en temps réel
 *
 * Fonctionnalités:
 * - Connexion WebSocket persistante
 * - Reconnexion automatique
 * - Gestion des erreurs
 * - État de connexion
 * - Callback pour nouvelles notifications
 *
 * Usage:
 * ```tsx
 * const { notifications, isConnected, error } = useNotificationWebSocket({
 *   onNotification: (notif) => {
 *     // Afficher toast, jouer son, etc.
 *     toast.info(notif.message);
 *   }
 * });
 * ```
 */

export interface UseNotificationWebSocketOptions {
  /**
   * URL du serveur WebSocket
   * Default: ws://localhost:3001/notifications
   */
  url?: string;

  /**
   * Token d'authentification JWT
   */
  token?: string;

  /**
   * Callback appelé à chaque nouvelle notification
   */
  onNotification?: (notification: Notification) => void;

  /**
   * Callback appelé lors de la connexion
   */
  onConnect?: () => void;

  /**
   * Callback appelé lors de la déconnexion
   */
  onDisconnect?: () => void;

  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Event) => void;

  /**
   * Activer la reconnexion automatique
   * Default: true
   */
  autoReconnect?: boolean;

  /**
   * Délai avant reconnexion (ms)
   * Default: 3000
   */
  reconnectDelay?: number;

  /**
   * Nombre maximum de tentatives de reconnexion
   * Default: 5
   */
  maxReconnectAttempts?: number;
}

export interface UseNotificationWebSocketReturn {
  /** Notifications reçues en temps réel */
  notifications: Notification[];

  /** État de la connexion WebSocket */
  isConnected: boolean;

  /** Erreur de connexion */
  error: string | null;

  /** Nombre de tentatives de reconnexion */
  reconnectAttempts: number;

  /** Envoyer un message au serveur */
  send: (message: any) => void;

  /** Déconnecter manuellement */
  disconnect: () => void;

  /** Reconnecter manuellement */
  reconnect: () => void;

  /** Vider la liste des notifications */
  clearNotifications: () => void;
}

export function useNotificationWebSocket(
  options: UseNotificationWebSocketOptions = {}
): UseNotificationWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/notifications',
    token,
    onNotification,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  // Fonction de connexion
  const connect = useCallback(() => {
    // Ne pas reconnecter si déjà connecté
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Construire l'URL avec le token si fourni
      const wsUrl = token ? `${url}?token=${token}` : url;

      // Créer la connexion WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Handler: Connexion ouverte
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);

        // Appeler le callback
        onConnect?.();
      };

      // Handler: Message reçu
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Si c'est une notification
          if (data.type === 'notification' && data.notification) {
            const notification: Notification = data.notification;

            // Ajouter à la liste
            setNotifications((prev) => [notification, ...prev]);

            // Appeler le callback
            onNotification?.(notification);
          }

          // Autres types de messages (ping, status, etc.)
          if (data.type === 'ping') {
            // Répondre au ping
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      // Handler: Erreur
      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('Erreur de connexion WebSocket');

        // Appeler le callback
        onError?.(event);
      };

      // Handler: Connexion fermée
      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsConnected(false);

        // Appeler le callback
        onDisconnect?.();

        // Reconnexion automatique
        if (
          shouldReconnectRef.current &&
          autoReconnect &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          console.log(`🔄 Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

          setReconnectAttempts((prev) => prev + 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError(`Échec de la reconnexion après ${maxReconnectAttempts} tentatives`);
        }
      };
    } catch (err: any) {
      console.error('❌ Failed to connect WebSocket:', err);
      setError(err.message || 'Erreur de connexion');
    }
  }, [
    url,
    token,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
    reconnectAttempts,
    onConnect,
    onDisconnect,
    onError,
    onNotification,
  ]);

  // Fonction de déconnexion
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    // Annuler le timeout de reconnexion
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Fermer la connexion
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Fonction de reconnexion manuelle
  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    setReconnectAttempts(0);
    setError(null);
    connect();
  }, [disconnect, connect]);

  // Fonction d'envoi de message
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  // Fonction pour vider les notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Effet: Connexion au montage
  useEffect(() => {
    connect();

    // Cleanup à la déconnexion
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    notifications,
    isConnected,
    error,
    reconnectAttempts,
    send,
    disconnect,
    reconnect,
    clearNotifications,
  };
}

export default useNotificationWebSocket;
