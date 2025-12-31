import React from 'react';
import Link from 'next/link';
import { User, Check, CheckCheck, Clock, Tag } from 'lucide-react';
import { WhatsAppConversation, ConversationStatus } from '../types/whatsapp.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversationListProps {
  conversations: WhatsAppConversation[];
  isLoading?: boolean;
  selectedId?: string;
}

/**
 * WhatsApp Conversation List Component
 * Displays a list of conversations
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  selectedId,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucune conversation</p>
        <p className="text-sm text-gray-400">Les nouvelles conversations apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedId}
        />
      ))}
    </div>
  );
};

/**
 * Single Conversation Item
 */
interface ConversationItemProps {
  conversation: WhatsAppConversation;
  isSelected?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isSelected }) => {
  // Format relative time
  const formatTime = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  // Get status color
  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case ConversationStatus.OPEN:
        return 'bg-green-100 text-green-700';
      case ConversationStatus.ASSIGNED:
        return 'bg-blue-100 text-blue-700';
      case ConversationStatus.RESOLVED:
        return 'bg-gray-100 text-gray-700';
      case ConversationStatus.CLOSED:
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status label
  const getStatusLabel = (status: ConversationStatus) => {
    switch (status) {
      case ConversationStatus.OPEN:
        return 'Ouvert';
      case ConversationStatus.ASSIGNED:
        return 'Assigné';
      case ConversationStatus.RESOLVED:
        return 'Résolu';
      case ConversationStatus.CLOSED:
        return 'Fermé';
      default:
        return status;
    }
  };

  // Get initials from name
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Link
      href={`/communication/whatsapp/conversations/${conversation.id}`}
      className={`block p-4 rounded-lg transition-all ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
          {getInitials(conversation.contactName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: Name and Time */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {conversation.contactName || 'Contact Inconnu'}
              </h3>
              <p className="text-xs text-gray-500">{conversation.phoneNumber}</p>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTime(conversation.lastMessageAt)}
            </span>
          </div>

          {/* Last message */}
          {conversation.lastMessage && (
            <p className="text-sm text-gray-600 truncate mb-2">
              {conversation.lastMessage.direction === 'outbound' && (
                <span className="inline-flex mr-1">
                  {conversation.lastMessage.status === 'read' ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : conversation.lastMessage.status === 'delivered' ? (
                    <CheckCheck className="w-3 h-3 text-gray-400" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              )}
              {conversation.lastMessage.content || '[Média]'}
            </p>
          )}

          {/* Bottom row: Status, Tags, Unread */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status badge */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
              {getStatusLabel(conversation.status)}
            </span>

            {/* Tags */}
            {conversation.tags && conversation.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {conversation.tags.slice(0, 2).join(', ')}
                  {conversation.tags.length > 2 && ` +${conversation.tags.length - 2}`}
                </span>
              </div>
            )}

            {/* Unread count */}
            {conversation.unreadCount > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * Conversation List Skeleton Loader
 */
export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex gap-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
