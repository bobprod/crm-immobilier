import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ownersAPI, CreateOwnerDTO } from '@/shared/utils/owners-api';
import { OwnerForm } from '@/modules/business/owners/components/OwnerForm';
import { MainLayout } from '../../src/shared/components/layout';

export default function NewOwnerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateOwnerDTO) => {
    try {
      setIsLoading(true);
      setError(null);
      const owner = await ownersAPI.create(data);
      router.push(`/owners/${owner.id}`);
    } catch (err: any) {
      console.error('Erreur lors de la création:', err);
      setError(err.message || 'Erreur lors de la création du propriétaire');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/gestion-immobiliere?tab=owners');
  };

  return (
    <MainLayout
      title="Nouveau propriétaire"
      breadcrumbs={[
        { label: 'Gestion Immobilière', href: '/gestion-immobiliere' },
        { label: 'Propriétaires', href: '/gestion-immobiliere?tab=owners' },
        { label: 'Nouveau' },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nouveau propriétaire</h1>
          <p className="mt-1 text-sm text-gray-500">
            Créez un nouveau profil de propriétaire pour gérer ses biens immobiliers
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <OwnerForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
}
