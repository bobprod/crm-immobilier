import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MandatesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/gestion-immobiliere?tab=mandates');
  }, []);
  return null;
}
