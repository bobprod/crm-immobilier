import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * /settings/integrations redirige vers /settings?tab=tracking
 * Toute la configuration tracking & communications est centralisée dans Settings.
 */
export default function IntegrationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings?tab=tracking');
  }, [router]);
  return null;
}
