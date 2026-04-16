import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect vers le tableau de bord Communications unifié.
 * L'envoi d'email est intégré dans le compositeur de CommunicationsDashboard.
 */
export default function EmailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/communications-dashboard');
  }, [router]);
  return null;
}
