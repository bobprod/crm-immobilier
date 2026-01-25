import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirection vers la page principale avec onglet Campagnes
 */
export default function CampaignsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/prospection?tab=campaigns');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );
}
