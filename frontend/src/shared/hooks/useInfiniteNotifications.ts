import { useState, useCallback } from 'react';
import { notificationsAPI } from '@/shared/utils/notifications-api';

export function useInfiniteNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await notificationsAPI.getPaginated(cursor, 20);
      setNotifications(prev => [...prev, ...response.items]);
      setCursor(response.nextCursor);
      setHasMore(response.hasNextPage);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  return { notifications, loadMore, hasMore, loading, setNotifications };
}
