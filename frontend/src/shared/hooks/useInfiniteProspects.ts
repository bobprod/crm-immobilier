import { useState, useEffect, useCallback } from 'react';
import prospectsAPI from '../utils/prospects-api';

export interface Prospect {
  id: string;
  userId: string;
  agencyId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type: string;
  currency: string;
  preferences?: Record<string, any>;
  source?: string;
  status: string;
  score: number;
  prospectType?: string;
  subType?: string;
  searchCriteria?: Record<string, any>;
  mandatInfo?: Record<string, any>;
  profiling?: Record<string, any>;
  timeline?: string;
  budget?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function useInfiniteProspects(filters?: any) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    try {
      const response = await prospectsAPI.getPaginated(cursor, 20, filters);
      setProspects((prev) => [...prev, ...response.items]);
      setCursor(response.nextCursor);
      setHasMore(response.hasNextPage);
    } catch (err) {
      console.error('Error loading prospects:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, filters]);

  useEffect(() => {
    loadMore();
  }, []);

  const reset = useCallback(() => {
    setProspects([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    loadMore();
  }, [loadMore]);

  return { prospects, loadMore, hasMore, loading, error, reset };
}
