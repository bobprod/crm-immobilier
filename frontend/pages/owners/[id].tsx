import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ownersAPI, Owner, getOwnerFullName, formatOwnerAddress, getOwnerStatusColor } from '@/shared/utils/owners-api';
import apiClient from '@/shared/utils/api-client';
import { MainLayout } from '../../src/shared/components/layout';

export default function OwnerDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [owner, setOwner] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ properties: 0, mandates: 0, invoices: 0 });

  useEffect(() => {
    if (id) {
      loadOwner();
    }
  }, [id]);

  const loadOwner = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ownersAPI.getById(id as string);
      setOwner(data);

      // Fetch related counts separately (PrismaService doesn't support _count)
      try {
        const [propsRes, mandatesRes, invoicesRes] = await Promise.allSettled([
          apiClient.get('/properties', { params: { ownerId: id, limit: 0 } }),
          apiClient.get('/mandates', { params: { ownerId: id, limit: 0 } }),
          apiClient.get('/finance/invoices', { params: { ownerId: id, limit: 0 } }),
        ]);
        setCounts({
          properties: propsRes.status === 'fulfilled' ? (Array.isArray(propsRes.value.data) ? propsRes.value.data.length : propsRes.value.data?.total || 0) : 0,
          mandates: mandatesRes.status === 'fulfilled' ? (Array.isArray(mandatesRes.value.data) ? mandatesRes.value.data.length : mandatesRes.value.data?.total || 0) : 0,
          invoices: invoicesRes.status === 'fulfilled' ? (Array.isArray(invoicesRes.value.data) ? invoicesRes.value.data.length : invoicesRes.value.data?.total || 0) : 0,
        });
      } catch (_) { /* counts are non-critical */ }
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err);
      setError(err.message || 'Erreur lors du chargement du propriétaire');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!owner || !confirm(`Êtes-vous sûr de vouloir supprimer ${getOwnerFullName(owner)} ?`)) {
      return;
    }

    try {
      await ownersAPI.delete(owner.id);
      router.push('/owners');
    } catch (err: any) {
      alert('Erreur lors de la suppression: ' + (err.message || 'Erreur inconnue'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Propriétaire" breadcrumbs={[{ label: 'Propriétaires', href: '/gestion-immobiliere?tab=owners' }]}>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (error || !owner) {
    return (
      <MainLayout title="Erreur" breadcrumbs={[{ label: 'Propriétaires', href: '/gestion-immobiliere?tab=owners' }]}>
        <div className="text-center py-24">
          <p className="text-gray-600 mb-4">{error || 'Propriétaire non trouvé'}</p>
          <Link href="/gestion-immobiliere?tab=owners" className="text-blue-600 hover:text-blue-800">
            Retour à la liste
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={getOwnerFullName(owner)}
      breadcrumbs={[
        { label: 'Gestion Immobilière', href: '/gestion-immobiliere' },
        { label: 'Propriétaires', href: '/gestion-immobiliere?tab=owners' },
        { label: getOwnerFullName(owner) },
      ]}
    >
      <div>}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">
                      {owner.firstName.charAt(0)}{owner.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {getOwnerFullName(owner)}
                  </h1>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOwnerStatusColor(owner)}`}>
                      {owner.isActive ? 'Actif' : 'Inactif'}
                    </span>
                    {owner.taxId && (
                      <span className="text-sm text-gray-500">
                        MF: {owner.taxId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
              <Link
                href={`/mandates/new?ownerId=${owner.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                + Mandat
              </Link>
              <Link
                href={`/owners/${owner.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Modifier
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Coordonnées */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Coordonnées</h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  {owner.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={`mailto:${owner.email}`} className="text-blue-600 hover:text-blue-800">
                          {owner.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {owner.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={`tel:${owner.phone}`} className="text-blue-600 hover:text-blue-800">
                          {owner.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {owner.address && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatOwnerAddress(owner)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Informations administratives */}
              {(owner.taxId || owner.idCard) && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Informations administratives
                  </h2>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    {owner.taxId && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Matricule fiscal</dt>
                        <dd className="mt-1 text-sm text-gray-900">{owner.taxId}</dd>
                      </div>
                    )}
                    {owner.idCard && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Numéro CIN</dt>
                        <dd className="mt-1 text-sm text-gray-900">{owner.idCard}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Notes */}
              {owner.notes && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{owner.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistiques */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Propriétés</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {counts.properties}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Mandats</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {counts.mandates}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Factures</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {counts.invoices}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Métadonnées */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informations système</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(owner.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Modifié le</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(owner.updatedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
