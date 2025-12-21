import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  notificationsAPI,
  Notification,
  NotificationType,
  getNotificationTypeIcon,
  getNotificationTypeColor,
  getNotificationTypeLabel,
  formatNotificationDate,
} from '@/shared/utils/notifications-api';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Filter,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data =
        filter === 'unread'
          ? await notificationsAPI.getUnread()
          : await notificationsAPI.getNotifications(100);
      setNotifications(data);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err.message || 'Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const notificationTypes: (NotificationType | 'all')[] = [
    'all',
    'lead_new',
    'lead_qualified',
    'lead_converted',
    'match_found',
    'appointment_reminder',
    'task_due',
    'campaign_completed',
    'info',
    'success',
    'warning',
    'error',
    'system',
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="h-6 w-6 text-purple-600" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white ml-2">{unreadCount}</Badge>
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Restez informé de vos activités CRM</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadNotifications} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                >
                  {markingAll ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-1" />
                  )}
                  Tout marquer lu
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 mr-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtrer:</span>
          </div>

          {/* Read/Unread filter */}
          <div className="flex bg-white rounded-lg border shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-lg transition ${
                filter === 'unread' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Non lues
            </button>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
            className="px-3 py-1.5 text-sm border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous les types</option>
            {notificationTypes
              .filter((t) => t !== 'all')
              .map((type) => (
                <option key={type} value={type}>
                  {getNotificationTypeIcon(type as NotificationType)}{' '}
                  {getNotificationTypeLabel(type as NotificationType)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={loadNotifications} className="ml-2 underline hover:no-underline">
              Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BellOff className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? 'Vous avez lu toutes vos notifications'
                  : "Vous n'avez pas encore de notifications"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Notification Card Component
interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationCard({ notification, onMarkAsRead, onDelete }: NotificationCardProps) {
  const icon = getNotificationTypeIcon(notification.type);
  const colorClass = getNotificationTypeColor(notification.type);
  const typeLabel = getNotificationTypeLabel(notification.type);
  const timeAgo = formatNotificationDate(notification.createdAt);

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        !notification.read ? 'border-l-4 border-l-purple-500 bg-purple-50/50' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${colorClass}`}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4
                  className={`font-medium text-gray-900 ${
                    !notification.read ? 'font-semibold' : ''
                  }`}
                >
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge variant="outline" className="text-xs">
                  {typeLabel}
                </Badge>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{timeAgo}</span>

              <div className="flex items-center gap-2">
                {notification.link && (
                  <Link
                    href={notification.link}
                    className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                  >
                    Voir <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
                {!notification.read && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-gray-500 hover:text-green-600 p-1 rounded transition"
                    title="Marquer comme lu"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(notification.id)}
                  className="text-gray-500 hover:text-red-600 p-1 rounded transition"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
