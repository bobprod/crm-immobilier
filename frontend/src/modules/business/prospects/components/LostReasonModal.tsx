import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

/**
 * LostReasonModal — inspired by Odoo CRM's "Mark as Lost" feature.
 * Captures the reason why a prospect/deal was lost to enable funnel analysis.
 */

const LOST_REASONS = [
  'Prix trop élevé',
  'Concurrent choisi',
  'Client injoignable',
  'Projet annulé',
  'Financement refusé',
  'Bien non adapté',
  'Délais trop longs',
  'Manque de confiance',
  'Autre raison',
];

interface LostReasonModalProps {
  prospectName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function LostReasonModal({
  prospectName,
  onConfirm,
  onCancel,
  loading = false,
}: LostReasonModalProps) {
  const [selected, setSelected] = useState('');
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (reason: string) => {
    setSelected(reason);
    setShowCustom(reason === 'Autre raison');
    if (reason !== 'Autre raison') setCustom('');
  };

  const handleConfirm = () => {
    const reason = showCustom ? custom.trim() || 'Autre raison' : selected;
    if (!reason) return;
    onConfirm(reason);
  };

  const finalReason = showCustom ? custom.trim() || '' : selected;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Marquer comme Perdu</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{prospectName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4">
            Pourquoi ce prospect est-il perdu ? Cette information aide à analyser le tunnel de vente.
          </p>

          <div className="grid grid-cols-1 gap-2">
            {LOST_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => handleSelect(reason)}
                className={`text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  selected === reason
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          {showCustom && (
            <div className="mt-3">
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={2}
                placeholder="Précisez la raison..."
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!finalReason || loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Enregistrement...' : 'Confirmer la perte'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LostReasonModal;
