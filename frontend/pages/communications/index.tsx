import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect vers le tableau de bord Communications unifié.
 * L'ancien CommunicationCenter a été remplacé par CommunicationsDashboard.
 */
export default function CommunicationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/communications-dashboard');
  }, [router]);
  return null;
}
