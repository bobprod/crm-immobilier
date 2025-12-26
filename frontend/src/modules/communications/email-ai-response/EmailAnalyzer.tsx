import React, { useState } from 'react';
import { Mail, Send, Sparkles } from 'lucide-react';
import { emailAIResponseApi, EmailAnalysisResult, EmailDraft } from '../../../shared/utils/quick-wins-api';

interface EmailAnalyzerProps {
  onDraftGenerated?: (draft: EmailDraft) => void;
}

export const EmailAnalyzer: React.FC<EmailAnalyzerProps> = ({ onDraftGenerated }) => {
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<EmailAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!from || !subject || !body) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await emailAIResponseApi.analyzeEmail({
        from,
        subject,
        body,
      });
      setAnalysis(result);
    } catch (err) {
      setError('Erreur lors de l\'analyse de l\'email');
      console.error('Failed to analyze email:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!analysis) return;

    setGenerating(true);
    setError(null);

    try {
      const draft = await emailAIResponseApi.generateDraft({
        analysisId: analysis.analysisId,
      });
      onDraftGenerated?.(draft);
    } catch (err) {
      setError('Erreur lors de la génération du brouillon');
      console.error('Failed to generate draft:', err);
    } finally {
      setGenerating(false);
    }
  };

  const getIntentLabel = (intent: string) => {
    const labels: Record<string, string> = {
      information: 'Demande d\'information',
      appointment: 'Demande de rendez-vous',
      negotiation: 'Négociation',
      complaint: 'Réclamation',
      other: 'Autre',
    };
    return labels[intent] || intent;
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      information: 'bg-blue-100 text-blue-800',
      appointment: 'bg-green-100 text-green-800',
      negotiation: 'bg-yellow-100 text-yellow-800',
      complaint: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[intent] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">
          Analyser un email
        </h3>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Input Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            De (email expéditeur)
          </label>
          <input
            type="email"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="client@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Objet
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Demande d'information sur un appartement"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Corps du message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Bonjour, je suis intéressé par..."
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing || !from || !subject || !body}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Analyser l'email</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Résultat de l'analyse
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Intention détectée</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getIntentColor(analysis.intent)}`}>
                {getIntentLabel(analysis.intent)}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Confiance</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analysis.confidence}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analysis.confidence}%
                </span>
              </div>
            </div>
          </div>

          {analysis.keywords.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Mots-clés détectés</p>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.suggestedActions.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Actions suggérées</p>
              <ul className="space-y-1">
                {analysis.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleGenerateDraft}
            disabled={generating}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Génération du brouillon...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Générer une réponse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailAnalyzer;
