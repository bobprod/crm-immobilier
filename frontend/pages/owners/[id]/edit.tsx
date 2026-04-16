import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ownersAPI, Owner, UpdateOwnerDTO } from '@/shared/utils/owners-api';
import { OwnerForm } from '@/modules/business/owners/components/OwnerForm';
import { MainLayout } from '../../../src/shared/components/layout';

export default function EditOwnerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [owner, setOwner] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadOwner(id);
    }
  }, [id]);

  const loadOwner = async (ownerId: string) => {
    try {
      setIsLoading(true);
      const data = await ownersAPI.getById(ownerId);
      setOwner(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err);
      setError(err.message || 'Propriétaire introuvable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateOwnerDTO) => {
    if (!id || typeof id !== 'string') return;
    try {
      setIsSaving(true);
      setError(null);
      await ownersAPI.update(id, data);
      router.push(`/owners/${id}`);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.message || 'Erreur lors de la mise à jour du propriétaire');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/owners/${id}`);
  };

  if (isLoading) {
    return (
      <MainLayout
        title="Modifier"
        breadcrumbs={[{ label: 'Propriétaires', href: '/gestion-immobiliere?tab=owners' }]}
      >
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (error && !owner) {
    return (
      <MainLayout
        title="Erreur"
        breadcrumbs={[{ label: 'Propriétaires', href: '/gestion-immobiliere?tab=owners' }]}
      >
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/gestion-immobiliere?tab=owners" className="text-blue-600 hover:text-blue-800">
            Retour à la liste
          </a>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={`Modifier ${owner?.firstName ?? ''} ${owner?.lastName ?? ''}`}
      breadcrumbs={[
        { label: 'Gestion Immobilière', href: '/gestion-immobiliere' },
        { label: 'Propriétaires', href: '/gestion-immobiliere?tab=owners' },
        { label: `${owner?.firstName ?? ''} ${owner?.lastName ?? ''}`, href: `/owners/${id}` },
        { label: 'Modifier' },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier le propriétaire</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {owner && (
          <OwnerForm
            owner={owner}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSaving}
          />
        )}
      </div>
    </MainLayout>
  );
}
