import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    alert('Fonctionnalité en cours de développement. La campagne sera créée prochainement.');
    router.push('/communication/whatsapp/campaigns');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Nouvelle campagne - CRM Immobilier</title>
      </Head>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/communication/whatsapp/campaigns" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouvelle campagne</h1>
            <p className="text-gray-600 mt-1">Créez une campagne d'envoi en masse</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la campagne *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Promotion Printemps 2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez l'objectif de cette campagne..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>À venir:</strong> Sélection de templates, choix des destinataires, planification d'envoi, et bien plus encore.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/communication/whatsapp/campaigns"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </Link>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Créer la campagne
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
