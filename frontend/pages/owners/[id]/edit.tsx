import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ownersAPI, Owner, UpdateOwnerDTO } from '@/shared/utils/owners-api';
import { OwnerForm } from '@/modules/business/owners/components/OwnerForm';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !owner) {
    return (
      <>
        <Head>
          <title>Erreur - CRM Immobilier</title>
        </Head>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/owners" className="text-blue-600 hover:text-blue-800">
              Retour à la liste
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>
          Modifier {owner?.firstName} {owner?.lastName} - CRM Immobilier
        </title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/owners" className="text-gray-400 hover:text-gray-500">
                  Propriétaires
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Link href={`/owners/${id}`} className="ml-4 text-gray-400 hover:text-gray-500">
                    {owner?.firstName} {owner?.lastName}
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-4 text-gray-500">Modifier</span>
                </div>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifier le propriétaire</h1>

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
      </div>
    </>
  );
}
