import React, { useState } from 'react';
import { EmailAIResponseDashboard, EmailDraftReview, EmailAnalyzer } from '../modules/communications/email-ai-response';
import { EmailDraft } from '../shared/utils/quick-wins-api';

const EmailAIResponsePage: React.FC = () => {
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const handleDraftSelect = (draft: EmailDraft) => {
    setSelectedDraft(draft);
  };

  const handleDraftClose = () => {
    setSelectedDraft(null);
  };

  const handleDraftSent = () => {
    setSelectedDraft(null);
    // Refresh the dashboard
    window.location.reload();
  };

  const handleDraftGenerated = (draft: EmailDraft) => {
    setShowAnalyzer(false);
    setSelectedDraft(draft);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Email AI Auto-Response
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion intelligente des réponses aux emails avec validation humaine
              </p>
            </div>
            <button
              onClick={() => setShowAnalyzer(!showAnalyzer)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAnalyzer ? 'Masquer l\'analyseur' : 'Analyser un email'}
            </button>
          </div>
        </div>

        {/* Email Analyzer (collapsible) */}
        {showAnalyzer && (
          <div className="mb-8">
            <EmailAnalyzer onDraftGenerated={handleDraftGenerated} />
          </div>
        )}

        {/* Dashboard */}
        <EmailAIResponseDashboard onDraftSelect={handleDraftSelect} />

        {/* Draft Review Modal */}
        {selectedDraft && (
          <EmailDraftReview
            draft={selectedDraft}
            onClose={handleDraftClose}
            onSent={handleDraftSent}
          />
        )}
      </div>
    </div>
  );
};

export default EmailAIResponsePage;
