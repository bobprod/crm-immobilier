import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Tag,
  Users,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { useContacts, WhatsAppContact, formatPhoneNumber, getInitials } from '../../../../src/modules/communication/whatsapp/hooks/useContacts';
import { ContactForm } from '../../../../src/modules/communication/whatsapp/components/ContactForm';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * WhatsApp Contact Detail Page
 * View and edit a specific contact with history
 */
export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    getContact,
    updateContact,
    deleteContact,
    toggleBlock,
    isUpdating,
    isDeleting,
    getAllTags,
    getAllGroups,
  } = useContacts();

  const [contact, setContact] = useState<WhatsAppContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  const allTags = getAllTags();
  const allGroups = getAllGroups();

  // Load contact
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadContact(id);
    }
  }, [id]);

  const loadContact = async (contactId: string) => {
    setIsLoading(true);
    try {
      const data = await getContact(contactId);
      setContact(data);
    } catch (error: any) {
      alert(error.message || 'Erreur lors du chargement');
      router.push('/communication/whatsapp/contacts');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update
  const handleUpdate = async (data: any) => {
    if (!contact) return;

    try {
      const updated = await updateContact(contact.id, data);
      setContact(updated);
      setShowEditForm(false);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la mise à jour');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!contact) return;
    if (!confirm(`Supprimer ${contact.name || contact.phoneNumber} ?`)) return;

    try {
      await deleteContact(contact.id);
      router.push('/communication/whatsapp/contacts');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  // Handle toggle block
  const handleToggleBlock = async () => {
    if (!contact) return;

    try {
      const updated = await toggleBlock(contact.id, !contact.isBlocked);
      setContact(updated);
    } catch (error: any) {
      alert(error.message || 'Erreur');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{contact.name || contact.phoneNumber} - Contacts WhatsApp</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/communication/whatsapp/contacts"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.name || 'Contact sans nom'}
              </h1>
              <p className="text-gray-600 mt-1">{formatPhoneNumber(contact.phoneNumber)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditForm(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>

            <button
              onClick={handleToggleBlock}
              disabled={isUpdating}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                contact.isBlocked
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {contact.isBlocked ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Débloquer
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  Bloquer
                </>
              )}
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
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

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {contact.name || 'Sans nom'}
                  </h2>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{formatPhoneNumber(contact.phoneNumber)}</span>
                    </div>

                    {contact.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>

                  {contact.isBlocked && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      <Ban className="w-4 h-4" />
                      Contact bloqué
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {contact.tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Groups */}
              {contact.groups.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Groupes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.groups.map((group) => (
                      <span
                        key={group}
                        className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {contact.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </div>

            {/* Activity History (Mock) */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique d'activité</h3>
              <div className="space-y-4">
                {/* Mock activity items */}
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">Message envoyé</p>
                    <p className="text-sm text-gray-600">Template de bienvenue</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="text-center py-8 text-gray-500 text-sm">
                  L'historique complet sera disponible prochainement
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Messages totaux</span>
                    <span className="text-lg font-bold text-gray-900">
                      {contact.stats.totalMessages}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-500">
                      Envoyés: {contact.stats.sentMessages}
                    </div>
                    <div className="text-gray-500">
                      Reçus: {contact.stats.receivedMessages}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conversations</span>
                    <span className="text-lg font-bold text-gray-900">
                      {contact.stats.totalConversations}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Actives: {contact.stats.activeConversations}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Temps de réponse moyen</span>
                    <span className="text-lg font-bold text-gray-900">
                      {contact.stats.avgResponseTime.toFixed(0)} min
                    </span>
                  </div>
                </div>

                {contact.lastMessageAt && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Dernier message
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(contact.lastMessageAt), 'PPP', { locale: fr })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(contact.lastMessageAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Link
                  href={`/communication/whatsapp/conversations?contact=${contact.id}`}
                  className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
                >
                  Voir les conversations
                </Link>
                <Link
                  href={`/communication/whatsapp?sendTo=${contact.phoneNumber}`}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                >
                  Envoyer un message
                </Link>
              </div>
            </div>

            {/* Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600">
                <strong>Créé le:</strong>{' '}
                {format(new Date(contact.createdAt), 'PPP', { locale: fr })}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                <strong>Mis à jour le:</strong>{' '}
                {format(new Date(contact.updatedAt), 'PPP', { locale: fr })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Modifier le contact</h2>
            <ContactForm
              initialData={contact}
              onSave={handleUpdate}
              onCancel={() => setShowEditForm(false)}
              isSaving={isUpdating}
              mode="edit"
              availableTags={allTags}
              availableGroups={allGroups}
            />
          </div>
        </div>
      )}
    </div>
  );
}
