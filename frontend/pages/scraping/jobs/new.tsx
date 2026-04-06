import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft, Play } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function NewScrapingJob() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    providerId: '',
    url: '',
    priority: 'normal',
    options: {
      maxPages: 10,
      delay: 1000,
    },
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/scraping/providers');
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/scraping-queue/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Erreur lors de la création du job');

      router.push('/scraping/jobs');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du job de scraping');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Nouveau Job de Scraping - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouveau Job de Scraping</h1>
              <p className="text-sm text-gray-500">Créez un nouveau job de scraping</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              {loading ? (
                <p className="text-gray-500">Chargement des providers...</p>
              ) : (
                <select
                  value={formData.providerId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, providerId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Sélectionnez un provider</option>
                  {providers
                    .filter((p) => p.isActive)
                    .map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} ({provider.type})
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL source</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/listings"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pages max</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.options.maxPages}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      options: { ...prev.options, maxPages: parseInt(e.target.value) || 10 },
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Délai (ms)</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={formData.options.delay}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      options: { ...prev.options, delay: parseInt(e.target.value) || 1000 },
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {submitting ? 'Création...' : 'Lancer le job'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
