import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect vers Documents > onglet Générer
 * La génération est maintenant intégrée dans la page Documents.
 */
export default function GenerateRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/documents?tab=generate');
  }, [router]);
  return null;
}
