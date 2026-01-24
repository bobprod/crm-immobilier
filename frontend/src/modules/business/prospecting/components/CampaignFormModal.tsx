import React, { useState } from 'react';
import { CampaignType } from '@/shared/utils/prospecting-api';
import { UnifiedTargeting, UnifiedTargetingConfig } from './UnifiedTargeting';

interface CampaignFormData {
  name: string;
  description: string;
  type: CampaignType;
  targetCount: number;
  targetingConfig: UnifiedTargetingConfig;
  scrapingEngines: string[];
  scrapingConfig: {
    query: string;
    urls: string[];
    maxResults: number;
    engine: string;
  };
}

interface CampaignFormModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (campaign: CampaignFormData) => void;
}

const SCRAPING_ENGINES = [
  { id: 'firecrawl', name: 'Firecrawl', icon: '🔥', description: 'Scraping web rapide et fiable' },
  { id: 'cheerio', name: 'Cheerio', icon: '🎯', description: 'Parser HTML léger' },
  { id: 'serp', name: 'Google SERP', icon: '🔍', description: 'Résultats de recherche Google' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Profils professionnels' },
  { id: 'pica', name: 'Pica API', icon: '📡', description: 'API immobilière tunisienne' },
  { id: 'jina', name: 'Jina Reader', icon: '📖', description: 'Extraction de contenu IA' },
];

/**
 * Formulaire de création de campagne simplifié (3 étapes)
 */
export const CampaignFormModal: React.FC<CampaignFormModalProps> = ({
  show,
  onClose,
  onCreate,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    type: 'requete',
    targetCount: 100,
    targetingConfig: {
      zones: [],
      demographics: {
        ageRange: { min: 25, max: 65 },
        incomeRange: { min: 2000, max: 15000 },
        familyStatus: [],
        propertyIntent: [],
        propertyTypes: [],
        budgetRange: { min: 100000, max: 500000 },
        urgency: [],
        interests: [],
        professions: [],
      },
    },
    scrapingEngines: [],
    scrapingConfig: {
      query: '',
      urls: [],
      maxResults: 50,
      engine: 'firecrawl',
    },
  });

  if (!show) return null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onCreate(formData);
    // Reset form
    setFormData({
      name: '',
      description: '',
      type: 'requete',
      targetCount: 100,
      targetingConfig: {
        zones: [],
        demographics: {
          ageRange: { min: 25, max: 65 },
          incomeRange: { min: 2000, max: 15000 },
          familyStatus: [],
          propertyIntent: [],
          propertyTypes: [],
          budgetRange: { min: 100000, max: 500000 },
          urgency: [],
          interests: [],
          professions: [],
        },
      },
      scrapingEngines: [],
      scrapingConfig: {
        query: '',
        urls: [],
        maxResults: 50,
        engine: 'firecrawl',
      },
    });
    setStep(1);
  };

  const toggleEngine = (engineId: string) => {
    setFormData((prev) => ({
      ...prev,
      scrapingEngines: prev.scrapingEngines.includes(engineId)
        ? prev.scrapingEngines.filter((e) => e !== engineId)
        : [...prev.scrapingEngines, engineId],
    }));
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim() !== '' && formData.type !== null;
    if (step === 2) return formData.targetingConfig.zones.length > 0;
    if (step === 3) return formData.scrapingEngines.length > 0;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Nouvelle Campagne</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-purple-100">Étape {step} sur 3</div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded-full transition ${
                    s <= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Configuration de Base */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration de Base</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la campagne *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Prospection Tunis Centre"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Décrivez l'objectif de cette campagne..."
                      rows={3}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de lead *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'requete' }))}
                        className={`p-4 border-2 rounded-xl transition ${
                          formData.type === 'requete'
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">🔍</div>
                        <div className="font-semibold text-gray-900">Requête</div>
                        <div className="text-xs text-gray-600 mt-1">Chercheurs de biens</div>
                      </button>
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'mandat' }))}
                        className={`p-4 border-2 rounded-xl transition ${
                          formData.type === 'mandat'
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">🏠</div>
                        <div className="font-semibold text-gray-900">Mandat</div>
                        <div className="text-xs text-gray-600 mt-1">Propriétaires vendeurs</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de leads cible
                    </label>
                    <input
                      type="number"
                      value={formData.targetCount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, targetCount: Number(e.target.value) }))
                      }
                      min="10"
                      max="1000"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Entre 10 et 1000 leads</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Ciblage Unifié (Géo + Démo) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ciblage Complet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Définissez les zones géographiques et le profil démographique de vos prospects
                </p>
              </div>
              <UnifiedTargeting
                onChange={(config) =>
                  setFormData((prev) => ({ ...prev, targetingConfig: config }))
                }
                initialConfig={formData.targetingConfig}
              />
            </div>
          )}

          {/* STEP 3: Sources & Scraping */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Sources de Données & Scraping
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les moteurs de scraping pour collecter les leads
                </p>
              </div>

              {/* Scraping Engines */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Moteurs de scraping *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SCRAPING_ENGINES.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => toggleEngine(engine.id)}
                      className={`p-4 border-2 rounded-xl transition text-left ${
                        formData.scrapingEngines.includes(engine.id)
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl">{engine.icon}</span>
                        {formData.scrapingEngines.includes(engine.id) && (
                          <span className="text-purple-600">✓</span>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900">{engine.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{engine.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional: Search Query */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requête de recherche (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.scrapingConfig.query}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      scrapingConfig: { ...prev.scrapingConfig, query: e.target.value },
                    }))
                  }
                  placeholder="Ex: appartement tunis"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Optional: URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URLs à scraper (optionnel, une par ligne)
                </label>
                <textarea
                  value={formData.scrapingConfig.urls.join('\n')}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      scrapingConfig: {
                        ...prev.scrapingConfig,
                        urls: e.target.value.split('\n').filter((url) => url.trim() !== ''),
                      },
                    }))
                  }
                  placeholder="https://example.com/page1&#10;https://example.com/page2"
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                />
              </div>

              {/* Max Results */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre maximum de résultats par source
                </label>
                <input
                  type="number"
                  value={formData.scrapingConfig.maxResults}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      scrapingConfig: {
                        ...prev.scrapingConfig,
                        maxResults: Number(e.target.value),
                      },
                    }))
                  }
                  min="10"
                  max="500"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Entre 10 et 500 résultats</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {step === 1 && 'Étape 1: Informations de base'}
              {step === 2 && 'Étape 2: Ciblage complet'}
              {step === 3 && 'Étape 3: Sources de données'}
            </div>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Précédent
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>✓</span>
                  Créer la Campagne
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignFormModal;
