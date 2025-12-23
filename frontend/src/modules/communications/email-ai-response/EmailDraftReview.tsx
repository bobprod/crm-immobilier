import React, { useState } from 'react';
import { Send, X, Edit2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { emailAIResponseApi, EmailDraft } from '../../../shared/utils/quick-wins-api';

interface EmailDraftReviewProps {
  draft: EmailDraft;
  onClose: () => void;
  onSent: () => void;
}

export const EmailDraftReview: React.FC<EmailDraftReviewProps> = ({
  draft,
  onClose,
  onSent,
}) => {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setSending(true);
    setError(null);

    try {
      await emailAIResponseApi.approveAndSend({
        draftId: draft.draftId,
        subject,
        body,
      });
      setSuccess(true);
      setTimeout(() => {
        onSent();
      }, 1500);
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'email');
      console.error('Failed to send email:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Réviser le brouillon
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Email envoyé avec succès !
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* To Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinataire
            </label>
            <input
              type="email"
              value={draft.to}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Objet de l'email"
            />
          </div>

          {/* Body Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Corps de l'email"
            />
            <p className="mt-2 text-xs text-gray-500">
              Vous pouvez modifier le contenu avant l'envoi
            </p>
          </div>

          {/* Attachment Suggestions */}
          {draft.attachmentSuggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-900">
                  Pièces jointes suggérées
                </h4>
              </div>
              <ul className="space-y-2">
                {draft.attachmentSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-blue-800">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-blue-700">
                Note: Les pièces jointes doivent être ajoutées manuellement avant l'envoi
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={sending || success}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={sending || success || !subject.trim() || !body.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Envoyer l'email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailDraftReview;
