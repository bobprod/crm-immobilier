import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PropertiesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/gestion-immobiliere?tab=properties');
  }, []);
  return null;
}
