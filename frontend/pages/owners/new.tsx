import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ownersAPI, CreateOwnerDTO } from '@/shared/utils/owners-api';
import { OwnerForm } from '@/modules/business/owners/components/OwnerForm';

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
    router.push('/owners');
  };

  return (
    <>
      <Head>
        <title>Nouveau propriétaire - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
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
                  <span className="ml-4 text-gray-500">Nouveau</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Nouveau propriétaire
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Créez un nouveau profil de propriétaire pour gérer ses biens immobiliers
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <OwnerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
}
