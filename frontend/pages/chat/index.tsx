import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect vers Communications > Chat Équipe
 * Le module Chat a été fusionné dans Communications.
 */
export default function ChatRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/communications-dashboard?tab=chat');
  }, [router]);
  return null;
}
