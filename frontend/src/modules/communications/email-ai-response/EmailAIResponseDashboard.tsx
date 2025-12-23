import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Info,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  TrendingUp,
  Zap
} from 'lucide-react';
import { emailAIResponseApi, EmailDraft, EmailAIStats } from '../../../shared/utils/quick-wins-api';

interface EmailAIResponseDashboardProps {
  onDraftSelect?: (draft: EmailDraft) => void;
}

export const EmailAIResponseDashboard: React.FC<EmailAIResponseDashboardProps> = ({ 
  onDraftSelect 
}) => {
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [stats, setStats] = useState<EmailAIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('pending');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [draftsData, statsData] = await Promise.all([
        emailAIResponseApi.getDrafts(filter === 'all' ? undefined : filter),
        emailAIResponseApi.getStats(),
      ]);
      setDrafts(draftsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load email AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Envoyé
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📧 Email AI Auto-Response
          </h2>
          <p className="text-gray-600 mt-1">
            Réponses automatiques intelligentes avec validation humaine
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails analysés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyzed}</p>
              </div>
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Brouillons générés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDraftsGenerated}</p>
              </div>
              <FileText className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails envoyés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
              </div>
              <Send className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Temps de réponse</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgResponseTime}s
                </p>
              </div>
              <Zap className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Intent Distribution */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribution des intentions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.intentDistribution.information}
              </p>
              <p className="text-sm text-gray-600">Information</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.intentDistribution.appointment}
              </p>
              <p className="text-sm text-gray-600">Rendez-vous</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.intentDistribution.negotiation}
              </p>
              <p className="text-sm text-gray-600">Négociation</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.intentDistribution.complaint}
              </p>
              <p className="text-sm text-gray-600">Réclamation</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.intentDistribution.other}
              </p>
              <p className="text-sm text-gray-600">Autre</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              En attente ({drafts.filter(d => d.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'sent'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Envoyés ({drafts.filter(d => d.status === 'sent').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tous ({drafts.length})
            </button>
          </nav>
        </div>

        {/* Drafts List */}
        <div className="divide-y divide-gray-200">
          {drafts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucun brouillon à afficher</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.draftId}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onDraftSelect?.(draft)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(draft.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(draft.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      À: {draft.to}
                    </h4>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {draft.subject}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {draft.body.replace(/<[^>]*>/g, '')}
                    </p>
                    {draft.attachmentSuggestions.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {draft.attachmentSuggestions.length} pièce(s) jointe(s) suggérée(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {draft.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDraftSelect?.(draft);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Réviser
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailAIResponseDashboard;
