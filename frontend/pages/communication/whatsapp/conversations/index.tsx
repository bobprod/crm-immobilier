import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Search, Filter, Plus, X, Tag, User } from 'lucide-react';
import { useConversations } from '../../../../src/modules/communication/whatsapp/hooks/useConversations';
import { ConversationList } from '../../../../src/modules/communication/whatsapp/components/ConversationList';
import { SendMessageModal } from '../../../../src/modules/communication/whatsapp/components/SendMessageModal';
import { ConversationStatus } from '../../../../src/modules/communication/whatsapp/types/whatsapp.types';
import { useRouter } from 'next/router';

/**
 * WhatsApp Conversations List Page
 * Browse and filter all conversations
 */
export default function ConversationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ConversationStatus | undefined>();
  const [selectedTag, setSelectedTag] = useState<string>();

  // Build filters
  const filters = {
    status: selectedStatus,
    phoneNumber: searchQuery.trim() || undefined,
    tags: selectedTag ? [selectedTag] : undefined,
    limit: 50,
    offset: 0,
  };

  const {
    conversations,
    total,
    isLoading,
    getStatusCounts,
  } = useConversations(filters);

  const statusCounts = getStatusCounts();

  // Mock tags (replace with real data)
  const availableTags = ['important', 'urgent', 'follow-up', 'new-lead', 'vip'];

  // Handle new message success
  const handleNewMessageSuccess = (conversationId: string) => {
    router.push(`/communication/whatsapp/conversations/${conversationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Conversations WhatsApp - CRM Immobilier</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversations WhatsApp</h1>
            <p className="text-gray-600 mt-1">
              {total} conversation{total > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/communication/whatsapp"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </Link>

            <button
              onClick={() => setShowNewMessage(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau Message
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-1 flex gap-1">
          <button
            onClick={() => setSelectedStatus(undefined)}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              !selectedStatus
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Toutes</span>
            <span className="ml-2 text-sm">({total})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(ConversationStatus.OPEN)}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              selectedStatus === ConversationStatus.OPEN
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Ouvertes</span>
            <span className="ml-2 text-sm">({statusCounts.open})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(ConversationStatus.ASSIGNED)}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              selectedStatus === ConversationStatus.ASSIGNED
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Assignées</span>
            <span className="ml-2 text-sm">({statusCounts.assigned})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(ConversationStatus.RESOLVED)}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              selectedStatus === ConversationStatus.RESOLVED
                ? 'bg-gray-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Résolues</span>
            <span className="ml-2 text-sm">({statusCounts.resolved})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(ConversationStatus.CLOSED)}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              selectedStatus === ConversationStatus.CLOSED
                ? 'bg-gray-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Fermées</span>
            <span className="ml-2 text-sm">({statusCounts.closed})</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par numéro, nom..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filtres</h3>
              <button
                onClick={() => {
                  setSelectedTag(undefined);
                  setShowFilters(false);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Réinitialiser
              </button>
            </div>

            <div className="space-y-4">
              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedTag === tag
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedTag || selectedStatus) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedStatus && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus(undefined)}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {selectedTag && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                Tag: {selectedTag}
                <button
                  onClick={() => setSelectedTag(undefined)}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
          />

          {!isLoading && conversations.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Aucune conversation trouvée</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || selectedStatus || selectedTag
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez une nouvelle conversation'}
              </p>
              <button
                onClick={() => setShowNewMessage(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouveau Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <SendMessageModal
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onSuccess={handleNewMessageSuccess}
      />
    </div>
  );
}
