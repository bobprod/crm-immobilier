import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect vers Immo Market > Indicateurs
 * Le module Analytiques a été fusionné dans Immo Market.
 */
export default function AnalyticsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/investment?tab=indicators');
  }, [router]);
  return null;
}
