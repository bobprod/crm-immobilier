import { useState, useEffect, useCallback, useRef } from 'react';
import propertiesAPI, { Property, PropertyFilters } from '../utils/properties-api';

interface UseInfinitePropertiesResult {
  properties: Property[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  total: number;
}

/**
 * Hook for infinite scroll pagination of properties
 * @param filters Optional filters to apply
 * @param pageSize Number of items per page (default: 20)
 */
export function useInfiniteProperties(
  filters?: PropertyFilters,
  pageSize = 20
): UseInfinitePropertiesResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>();
  const isInitialMount = useRef(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const result = await propertiesAPI.getPaginated(cursor, pageSize, filters);

      setProperties((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor || undefined);
      setHasMore(result.hasNextPage);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, pageSize, filters]);

  const refresh = useCallback(() => {
    setProperties([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);
    // Trigger reload
    setTimeout(() => {
      loadMore();
    }, 0);
  }, [loadMore]);

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadMore();
    }
  }, [loadMore]);

  // Reload when filters change
  const filtersString = JSON.stringify(filters);
  useEffect(() => {
    if (!isInitialMount.current) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersString, refresh]);

  return {
    properties,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
  };
}
