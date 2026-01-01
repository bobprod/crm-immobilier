import React from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Tag, Users, MessageCircle, Calendar, Ban, MoreVertical } from 'lucide-react';
import { WhatsAppContact, formatPhoneNumber, getInitials } from '../hooks/useContacts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContactCardProps {
  contact: WhatsAppContact;
  onEdit?: (contact: WhatsAppContact) => void;
  onDelete?: (contact: WhatsAppContact) => void;
  onToggleBlock?: (contact: WhatsAppContact) => void;
  showActions?: boolean;
}

/**
 * Contact Card Component
 * Displays a WhatsApp contact with stats and actions
 */
export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onToggleBlock,
  showActions = true,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {contact.profilePicture ? (
              <img
                src={contact.profilePicture}
                alt={contact.name || contact.phoneNumber}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{getInitials(contact.name)}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {contact.name || 'Sans nom'}
              </h3>
              {contact.isBlocked && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  <Ban className="w-3 h-3 inline mr-1" />
                  Bloqué
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-3 h-3" />
              <span>{formatPhoneNumber(contact.phoneNumber)}</span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(contact);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                  {onToggleBlock && (
                    <button
                      onClick={() => {
                        onToggleBlock(contact);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                    >
                      {contact.isBlocked ? 'Débloquer' : 'Bloquer'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(contact);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Email */}
      {contact.email && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Mail className="w-3 h-3" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              <Tag className="w-3 h-3 inline mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Groups */}
      {contact.groups.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.groups.map((group) => (
            <span
              key={group}
              className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full"
            >
              <Users className="w-3 h-3 inline mr-1" />
              {group}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <MessageCircle className="w-3 h-3 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {contact.stats.totalMessages}
          </p>
          <p className="text-xs text-gray-500">Messages</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3 h-3 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {contact.stats.totalConversations}
          </p>
          <p className="text-xs text-gray-500">Conversations</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {contact.lastMessageAt
              ? formatDistanceToNow(new Date(contact.lastMessageAt), {
                  addSuffix: false,
                  locale: fr,
                })
              : '-'}
          </p>
          <p className="text-xs text-gray-500">Dernier msg</p>
        </div>
      </div>

      {/* View Details Link */}
      <Link
        href={`/communication/whatsapp/contacts/${contact.id}`}
        className="block mt-3 text-center text-sm text-blue-600 hover:underline"
      >
        Voir les détails
      </Link>
    </div>
  );
};

/**
 * Contact Card Skeleton
 */
export const ContactCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="animate-pulse">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-full mb-3" />
        <div className="flex gap-2 mb-3">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-gray-200 rounded w-8 mx-auto mb-1" />
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Contact Grid Layout
 */
interface ContactGridProps {
  contacts: WhatsAppContact[];
  onEdit?: (contact: WhatsAppContact) => void;
  onDelete?: (contact: WhatsAppContact) => void;
  onToggleBlock?: (contact: WhatsAppContact) => void;
  isLoading?: boolean;
}

export const ContactGrid: React.FC<ContactGridProps> = ({
  contacts,
  onEdit,
  onDelete,
  onToggleBlock,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ContactCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-2">Aucun contact trouvé</p>
        <p className="text-sm text-gray-400">Ajoutez votre premier contact pour commencer</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleBlock={onToggleBlock}
        />
      ))}
    </div>
  );
};
