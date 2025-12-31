import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, UserCircle, Tag, X, Check, Users, MoreVertical, Archive, AlertCircle } from 'lucide-react';
import { useConversations } from '../../../../src/modules/communication/whatsapp/hooks/useConversations';
import { ChatInterface, ChatEmptyState } from '../../../../src/modules/communication/whatsapp/components/ChatInterface';
import { WhatsAppConversation, ConversationStatus } from '../../../../src/modules/communication/whatsapp/types/whatsapp.types';

/**
 * WhatsApp Conversation Detail Page
 * Full chat interface with conversation management
 */
export default function ConversationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const conversationId = id as string;

  const {
    getConversation,
    updateConversation,
    closeConversation,
    assignConversation,
    addTags,
    removeTag,
    changeStatus,
    isUpdating,
  } = useConversations();

  const [conversation, setConversation] = useState<WhatsAppConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch conversation
  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      const data = await getConversation(conversationId);
      setConversation(data);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (status: ConversationStatus) => {
    try {
      const updated = await changeStatus(conversationId, status);
      setConversation(updated);
    } catch (error: any) {
      alert(error.message || 'Erreur lors du changement de statut');
    }
  };

  // Handle close
  const handleClose = async () => {
    if (!confirm('Êtes-vous sûr de vouloir fermer cette conversation ?')) return;

    try {
      await closeConversation(conversationId);
      router.push('/communication/whatsapp/conversations');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la fermeture');
    }
  };

  // Handle add tag
  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      const updated = await addTags(conversationId, [newTag.trim().toLowerCase()]);
      setConversation(updated);
      setNewTag('');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'ajout du tag');
    }
  };

  // Handle remove tag
  const handleRemoveTag = async (tag: string) => {
    try {
      const updated = await removeTag(conversationId, tag);
      setConversation(updated);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression du tag');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation non trouvée</h2>
          <p className="text-gray-600 mb-4">Cette conversation n'existe pas ou a été supprimée</p>
          <Link
            href="/communication/whatsapp/conversations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux conversations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{conversation.contactName || conversation.phoneNumber} - Conversation WhatsApp</title>
      </Head>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/communication/whatsapp/conversations"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <h1 className="font-semibold text-gray-900">
                {conversation.contactName || 'Contact Inconnu'}
              </h1>
              <p className="text-xs text-gray-500">{conversation.phoneNumber}</p>
            </div>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface
            conversation={conversation}
            onBack={() => router.push('/communication/whatsapp/conversations')}
          />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  {conversation.contactName
                    ? conversation.contactName
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)
                    : '?'}
                </div>
                <h2 className="font-semibold text-gray-900 text-lg">
                  {conversation.contactName || 'Contact Inconnu'}
                </h2>
                <p className="text-sm text-gray-500">{conversation.phoneNumber}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={conversation.status}
                  onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                  disabled={isUpdating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value={ConversationStatus.OPEN}>Ouvert</option>
                  <option value={ConversationStatus.ASSIGNED}>Assigné</option>
                  <option value={ConversationStatus.RESOLVED}>Résolu</option>
                  <option value={ConversationStatus.CLOSED}>Fermé</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>

                {/* Current Tags */}
                {conversation.tags && conversation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {conversation.tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Tag */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Ajouter un tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{conversation.messageCount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Non lus</p>
                  <p className="text-2xl font-bold text-gray-900">{conversation.unreadCount}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Assigner à un agent
                </button>

                <button
                  onClick={handleClose}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  Fermer la conversation
                </button>
              </div>

              {/* Linked Contact */}
              {(conversation.leadId || conversation.prospectId) && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Lié à</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {conversation.leadId ? 'Lead' : 'Prospect'}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {conversation.leadId || conversation.prospectId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal (simplified) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Assigner la conversation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cette fonctionnalité sera bientôt disponible
            </p>
            <button
              onClick={() => setShowAssignModal(false)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
