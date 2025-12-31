import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Zap,
  TrendingDown,
  Clock
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category: 'budget' | 'performance' | 'system' | 'job';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationCenterProps {
  maxNotifications?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxNotifications = 50
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Mock notifications - En production, fetch depuis API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'warning',
        category: 'budget',
        title: 'Budget Alert: Claude Provider',
        message: 'Vous avez dépassé 90% de votre budget mensuel pour Claude (Anthropic). Coût actuel: $45.50 / $50',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        actionUrl: '/settings/providers',
        actionLabel: 'Voir les détails'
      },
      {
        id: '2',
        type: 'error',
        category: 'job',
        title: 'Scraping Job Failed',
        message: 'Le job de scraping #JOB-2024-123 a échoué après 3 tentatives. Erreur: Rate limit exceeded',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: false,
        actionUrl: '/scraping/jobs/JOB-2024-123',
        actionLabel: 'Réessayer'
      },
      {
        id: '3',
        type: 'success',
        category: 'job',
        title: 'Prospection Completed',
        message: '52 nouveaux leads qualifiés trouvés pour votre campagne "Paris 15ème"',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: true,
        actionUrl: '/prospecting',
        actionLabel: 'Voir les leads'
      },
      {
        id: '4',
        type: 'warning',
        category: 'performance',
        title: 'Performance Degradation',
        message: 'OpenAI GPT-4 a un taux de succès de 92% aujourd\'hui (vs 97% habituel)',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: true,
        actionUrl: '/analytics/providers',
        actionLabel: 'Voir analytics'
      },
      {
        id: '5',
        type: 'info',
        category: 'system',
        title: 'New Provider Available',
        message: 'Mistral Large est maintenant disponible. Configurez-le pour bénéficier d\'un provider européen.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        actionUrl: '/settings/providers',
        actionLabel: 'Configurer'
      }
    ];

    setNotifications(mockNotifications.slice(0, maxNotifications));
  }, [maxNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'budget':
        return <DollarSign className="w-4 h-4" />;
      case 'performance':
        return <TrendingDown className="w-4 h-4" />;
      case 'job':
        return <Zap className="w-4 h-4" />;
      case 'system':
        return <Info className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {unreadCount > 0 ? `${unreadCount} non lues` : 'Toutes lues'}
                  </span>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Tout marquer lu
                      </button>
                    )}
                    <button
                      onClick={clearAll}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Tout effacer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 text-center">
                    Aucune notification
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-purple-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-purple-600 rounded-full" />
                              )}
                            </div>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span
                                className={`px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                  notification.type === 'success'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : notification.type === 'error'
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : notification.type === 'warning'
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                }`}
                              >
                                {getCategoryIcon(notification.category)}
                                {notification.category}
                              </span>
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </div>

                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                              >
                                {notification.actionLabel || 'Voir'}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Toast notification component for real-time alerts
export interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 w-96 rounded-lg shadow-2xl border-2 p-4 animate-slide-up z-50 ${
        notification.type === 'success'
          ? 'bg-green-50 border-green-300'
          : notification.type === 'error'
          ? 'bg-red-50 border-red-300'
          : notification.type === 'warning'
          ? 'bg-yellow-50 border-yellow-300'
          : 'bg-blue-50 border-blue-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-700">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
