import React from 'react';
import { CampaignSettings as CampaignSettingsType } from '../types/ai-prospection.types';

interface CampaignSettingsProps {
  value: CampaignSettingsType;
  onChange: (settings: CampaignSettingsType) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

export const CampaignSettings: React.FC<CampaignSettingsProps> = ({
  value,
  onChange,
  disabled = false,
  errors = {},
}) => {
  const handleChange = (field: keyof CampaignSettingsType, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Paramètres de la Campagne</h3>
      </div>

      {/* Campaign Name */}
      <div>
        <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-2">
          Nom de la campagne *
        </label>
        <input
          id="campaign-name"
          type="text"
          value={value.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={disabled}
          placeholder="Ex: Prospection Tunis Centre - Décembre 2024"
          className={`
            w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
            ${errors.name
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-purple-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Max Leads */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="max-leads" className="block text-sm font-medium text-gray-700">
            Nombre maximum de leads *
          </label>
          <span className="text-sm font-semibold text-purple-600">
            {value.maxLeads} leads
          </span>
        </div>
        <input
          id="max-leads"
          type="range"
          min="20"
          max="100"
          step="10"
          value={value.maxLeads}
          onChange={(e) => handleChange('maxLeads', parseInt(e.target.value, 10))}
          disabled={disabled}
          className={`
            w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            background: disabled
              ? '#E5E7EB'
              : `linear-gradient(to right, #9333EA 0%, #9333EA ${((value.maxLeads - 20) / 80) * 100}%, #E5E7EB ${((value.maxLeads - 20) / 80) * 100}%, #E5E7EB 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>20</span>
          <span>60</span>
          <span>100</span>
        </div>
        {errors.maxLeads && (
          <p className="mt-1 text-sm text-red-600">{errors.maxLeads}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Plus le nombre de leads est élevé, plus le temps de prospection et le coût API seront importants.
        </p>
      </div>

      {/* Max Cost (Budget API) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="max-cost" className="block text-sm font-medium text-gray-700">
            Budget API maximum *
          </label>
          <span className="text-sm font-semibold text-purple-600">
            ${value.maxCost.toFixed(2)} USD
          </span>
        </div>
        <input
          id="max-cost"
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={value.maxCost}
          onChange={(e) => handleChange('maxCost', parseFloat(e.target.value))}
          disabled={disabled}
          className={`
            w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            background: disabled
              ? '#E5E7EB'
              : `linear-gradient(to right, #9333EA 0%, #9333EA ${((value.maxCost - 0.5) / 9.5) * 100}%, #E5E7EB ${((value.maxCost - 0.5) / 9.5) * 100}%, #E5E7EB 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0.50</span>
          <span>$5.00</span>
          <span>$10.00</span>
        </div>
        {errors.maxCost && (
          <p className="mt-1 text-sm text-red-600">{errors.maxCost}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Budget pour les appels API (IA, scraping, recherche). La prospection s'arrêtera si le budget est atteint.
        </p>
      </div>

      {/* Cost Estimate */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">Estimation</p>
            <p className="text-xs text-purple-700 mt-1">
              Coût estimé par lead : <span className="font-semibold">${(value.maxCost / value.maxLeads).toFixed(3)}</span>
            </p>
            <p className="text-xs text-purple-700">
              Temps estimé : <span className="font-semibold">{Math.ceil((value.maxLeads / 10) * 30)}s - {Math.ceil((value.maxLeads / 10) * 60)}s</span>
            </p>
          </div>
        </div>
      </div>

      {/* Timeout (Advanced - Optional) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Paramètres avancés
        </summary>
        <div className="mt-4 pl-6 space-y-4">
          <div>
            <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-2">
              Timeout maximum (secondes)
            </label>
            <input
              id="timeout"
              type="number"
              min="60"
              max="600"
              step="30"
              value={value.timeout || 300}
              onChange={(e) => handleChange('timeout', parseInt(e.target.value, 10))}
              disabled={disabled}
              className={`
                w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                border-gray-300 focus:ring-purple-500
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              `}
            />
            <p className="mt-1 text-xs text-gray-500">
              Temps maximum avant abandon automatique (par défaut: 300s / 5min)
            </p>
          </div>
        </div>
      </details>
    </div>
  );
};
