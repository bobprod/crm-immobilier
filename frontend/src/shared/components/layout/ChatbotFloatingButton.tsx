import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Bot, X, MessageCircle, ArrowRight } from 'lucide-react';

/**
 * ChatbotFloatingButton - Bouton flottant IA (FAB pattern)
 *
 * UX Pattern: Floating Action Button + Quick-access panel
 * - Position: bottom-right, toujours visible
 * - Clic = ouvre un mini-panneau avec raccourcis IA
 * - Le bouton "Ouvrir l'assistant complet" redirige vers /ai-assistant
 * - Animation subtile pour attirer l'attention sans distraire
 * - Z-index \u00e9lev\u00e9 pour rester au-dessus du contenu
 */

export const ChatbotFloatingButton: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Ne pas afficher sur la page assistant IA elle-m\u00eame
  if (router.pathname === '/ai-assistant') return null;

  return (
    <>
      {/* Mini panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Assistant IA</h3>
                <p className="text-xs text-slate-400">Immobilier intelligent</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="p-4 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
              Actions rapides
            </p>

            {[
              { label: 'Estimer un bien', emoji: '\uD83C\uDFE0' },
              { label: 'Analyser le march\u00e9', emoji: '\uD83D\uDCC8' },
              { label: 'R\u00e9diger une annonce', emoji: '\u270D\uFE0F' },
              { label: 'Qualifier un prospect', emoji: '\uD83C\uDFAF' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setIsOpen(false);
                  router.push('/ai-assistant');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700
                           hover:bg-slate-50 transition-colors text-left group"
              >
                <span className="text-base">{action.emoji}</span>
                <span className="flex-1 font-medium">{action.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </button>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="px-4 pb-4">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/ai-assistant');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white
                         rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Ouvrir l&apos;assistant complet
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          ${
            isOpen
              ? 'bg-slate-800 rotate-0 shadow-slate-300'
              : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-200 hover:shadow-xl hover:scale-105'
          }
        `}
        title="Assistant IA"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}

        {/* Pulse indicator (quand ferm\u00e9) */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-300 border-2 border-white" />
          </span>
        )}
      </button>
    </>
  );
};
