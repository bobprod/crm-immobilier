import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect vers le tableau de bord Communications unifié.
 * La gestion des templates est intégrée dans CommunicationsDashboard.
 */
export default function TemplatesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/communications-dashboard');
  }, [router]);
  return null;
}
