import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OwnersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/gestion-immobiliere?tab=owners');
  }, []);
  return null;
}
