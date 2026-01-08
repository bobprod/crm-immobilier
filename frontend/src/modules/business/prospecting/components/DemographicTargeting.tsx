import React, { useState, useEffect } from 'react';

// Types
interface DemographicCriteria {
  ageRange: { min: number; max: number };
  incomeRange: { min: number; max: number };
  familyStatus: string[];
  propertyIntent: ('buy' | 'rent' | 'sell' | 'invest')[];
  propertyTypes: string[];
  budgetRange: { min: number; max: number };
  urgency: ('immediate' | 'short_term' | 'long_term')[];
  interests: string[];
  professions: string[];
}

interface DemographicTargetingProps {
  onChange: (criteria: DemographicCriteria) => void;
  initialCriteria?: Partial<DemographicCriteria>;
  disabled?: boolean;
}

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Appartement', icon: '🏢' },
  { id: 'villa', label: 'Villa', icon: '🏡' },
  { id: 'house', label: 'Maison', icon: '🏠' },
  { id: 'studio', label: 'Studio', icon: '🛏️' },
  { id: 'duplex', label: 'Duplex', icon: '🏘️' },
  { id: 'land', label: 'Terrain', icon: '🌍' },
  { id: 'commercial', label: 'Local commercial', icon: '🏪' },
  { id: 'office', label: 'Bureau', icon: '🏢' },
];

const FAMILY_STATUS = [
  { id: 'single', label: 'Celibataire', icon: '👤' },
  { id: 'couple', label: 'Couple sans enfants', icon: '👫' },
  { id: 'family_small', label: 'Famille (1-2 enfants)', icon: '👨‍👩‍👧' },
  { id: 'family_large', label: 'Famille nombreuse', icon: '👨‍👩‍👧‍👦' },
  { id: 'retired', label: 'Retraite', icon: '👴' },
];

const PROPERTY_INTENTS = [
  { id: 'buy', label: 'Acheter', icon: '🏠', color: 'green' },
  { id: 'rent', label: 'Louer', icon: '🔑', color: 'blue' },
  { id: 'sell', label: 'Vendre', icon: '💰', color: 'orange' },
  { id: 'invest', label: 'Investir', icon: '📈', color: 'purple' },
];

const URGENCY_LEVELS = [
  { id: 'immediate', label: 'Immediat (< 1 mois)', icon: '🔥', color: 'red' },
  { id: 'short_term', label: 'Court terme (1-6 mois)', icon: '⚡', color: 'orange' },
  { id: 'long_term', label: 'Long terme (> 6 mois)', icon: '📅', color: 'blue' },
];

const INTERESTS = [
  'Investissement locatif',
  'Residence principale',
  'Residence secondaire',
  'Defiscalisation',
  'Premiere acquisition',
  'Agrandissement',
  'Proximite travail',
  'Proximite ecoles',
  'Vue mer',
  'Jardin/Terrasse',
  'Parking',
  'Piscine',
];

const PROFESSIONS = [
  'Cadre superieur',
  'Profession liberale',
  'Entrepreneur',
  'Fonctionnaire',
  'Commercial',
  'Ingenieur',
  'Medecin',
  'Avocat',
  'Enseignant',
  'Expatrie',
  'Investisseur',
  'Retraite',
];

export const DemographicTargeting: React.FC<DemographicTargetingProps> = ({
  onChange,
  initialCriteria,
}) => {
  const [criteria, setCriteria] = useState<DemographicCriteria>({
    ageRange: { min: 25, max: 65 },
    incomeRange: { min: 2000, max: 15000 },
    familyStatus: [],
    propertyIntent: [],
    propertyTypes: [],
    budgetRange: { min: 100000, max: 500000 },
    urgency: [],
    interests: [],
    professions: [],
    ...initialCriteria,
  });

  useEffect(() => {
    onChange(criteria);
  }, [criteria, onChange]);

  const toggleArrayItem = <K extends keyof DemographicCriteria>(key: K, value: string) => {
    setCriteria((prev) => {
      const arr = prev[key] as string[];
      const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  // Calcul de la portee estimee
  const calculateReach = () => {
    let base = 100000;

    // Ajuster selon les criteres
    const ageSpan = criteria.ageRange.max - criteria.ageRange.min;
    base = base * (ageSpan / 40);

    if (criteria.familyStatus.length > 0) {
      base = base * (criteria.familyStatus.length / 5);
    }

    if (criteria.propertyIntent.length > 0) {
      base = base * (criteria.propertyIntent.length / 4);
    }

    return Math.round(base);
  };

  const estimatedReach = calculateReach();

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>👥</span> Ciblage Demographique
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Definissez le profil de vos prospects ideaux
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{(estimatedReach / 1000).toFixed(0)}k</div>
            <div className="text-purple-100 text-sm">portee estimee</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Age Range */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎂</span> Tranche d&apos;age
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-600">De {criteria.ageRange.min} ans</label>
              <input
                type="range"
                min="18"
                max="80"
                value={criteria.ageRange.min}
                onChange={(e) =>
                  setCriteria((prev) => ({
                    ...prev,
                    ageRange: { ...prev.ageRange, min: Number(e.target.value) },
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600">A {criteria.ageRange.max} ans</label>
              <input
                type="range"
                min="18"
                max="80"
                value={criteria.ageRange.max}
                onChange={(e) =>
                  setCriteria((prev) => ({
                    ...prev,
                    ageRange: { ...prev.ageRange, max: Number(e.target.value) },
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium">
              {criteria.ageRange.min} - {criteria.ageRange.max} ans
            </span>
          </div>
        </div>

        {/* Property Intent */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎯</span> Intention immobiliere
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROPERTY_INTENTS.map((intent) => (
              <button
                key={intent.id}
                onClick={() => toggleArrayItem('propertyIntent', intent.id)}
                className={`p-4 rounded-xl border-2 transition-all ${criteria.propertyIntent.includes(intent.id as any)
                    ? `border-${intent.color}-500 bg-${intent.color}-50 shadow-md`
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-3xl mb-2">{intent.icon}</div>
                <div className="font-medium text-gray-900">{intent.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Property Types */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏠</span> Types de biens recherches
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleArrayItem('propertyTypes', type.id)}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${criteria.propertyTypes.includes(type.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="font-medium text-gray-900">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💰</span> Budget
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Budget minimum</label>
              <div className="relative">
                <input
                  type="number"
                  value={criteria.budgetRange.min}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      budgetRange: { ...prev.budgetRange, min: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-4 py-2 border rounded-lg pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">TND</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Budget maximum</label>
              <div className="relative">
                <input
                  type="number"
                  value={criteria.budgetRange.max}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      budgetRange: { ...prev.budgetRange, max: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-4 py-2 border rounded-lg pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">TND</span>
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-purple-500"
              style={{
                marginLeft: `${(criteria.budgetRange.min / 2000000) * 100}%`,
                width: `${((criteria.budgetRange.max - criteria.budgetRange.min) / 2000000) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>500k</span>
            <span>1M</span>
            <span>1.5M</span>
            <span>2M TND</span>
          </div>
        </div>

        {/* Family Status */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>👨‍👩‍👧‍👦</span> Situation familiale
          </h3>
          <div className="flex flex-wrap gap-2">
            {FAMILY_STATUS.map((status) => (
              <button
                key={status.id}
                onClick={() => toggleArrayItem('familyStatus', status.id)}
                className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${criteria.familyStatus.includes(status.id)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span>{status.icon}</span>
                <span>{status.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>⏰</span> Urgence du projet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => toggleArrayItem('urgency', level.id)}
                className={`p-4 rounded-xl border-2 transition-all ${criteria.urgency.includes(level.id as any)
                    ? `border-${level.color}-500 bg-${level.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-2xl mb-1">{level.icon}</div>
                <div className="font-medium text-gray-900">{level.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Professions */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💼</span> Professions cibles
          </h3>
          <div className="flex flex-wrap gap-2">
            {PROFESSIONS.map((prof) => (
              <button
                key={prof}
                onClick={() => toggleArrayItem('professions', prof)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${criteria.professions.includes(prof)
                    ? 'border-purple-500 bg-purple-100 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                {prof}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>❤️</span> Criteres et interets
          </h3>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleArrayItem('interests', interest)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${criteria.interests.includes(interest)
                    ? 'border-pink-500 bg-pink-100 text-pink-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Income Range */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> Revenu mensuel estime
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={criteria.incomeRange.min}
                onChange={(e) =>
                  setCriteria((prev) => ({
                    ...prev,
                    incomeRange: { ...prev.incomeRange, min: Number(e.target.value) },
                  }))
                }
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">
                {criteria.incomeRange.min} TND
              </div>
            </div>
            <span className="text-gray-400">-</span>
            <div className="flex-1">
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={criteria.incomeRange.max}
                onChange={(e) =>
                  setCriteria((prev) => ({
                    ...prev,
                    incomeRange: { ...prev.incomeRange, max: Number(e.target.value) },
                  }))
                }
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">
                {criteria.incomeRange.max} TND
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Resume du ciblage</h4>
            <p className="text-sm text-gray-600 mt-1">
              {criteria.propertyIntent.length} intention(s) •{criteria.propertyTypes.length} type(s)
              de bien •{criteria.familyStatus.length} profil(s) familial
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              ~{(estimatedReach / 1000).toFixed(0)}k
            </div>
            <div className="text-sm text-gray-500">prospects potentiels</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemographicTargeting;
