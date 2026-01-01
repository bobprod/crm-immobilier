import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, Filter, Plus, Upload, Download, X, ArrowLeft } from 'lucide-react';
import { useContacts } from '../../../../src/modules/communication/whatsapp/hooks/useContacts';
import { ContactGrid } from '../../../../src/modules/communication/whatsapp/components/ContactCard';
import { ContactForm } from '../../../../src/modules/communication/whatsapp/components/ContactForm';
import { ContactImport } from '../../../../src/modules/communication/whatsapp/components/ContactImport';
import { format } from 'date-fns';

/**
 * WhatsApp Contacts List Page
 * Browse and manage all contacts
 */
export default function ContactsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const {
    contacts,
    total,
    isLoading,
    isCreating,
    isDeleting,
    isImporting,
    isExporting,
    createContact,
    deleteContact,
    toggleBlock,
    getAllTags,
    getAllGroups,
    getStatsSummary,
    importContacts,
    exportContacts,
    downloadFile,
    mutate,
  } = useContacts({
    search: searchQuery || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    groups: selectedGroups.length > 0 ? selectedGroups : undefined,
    isBlocked: showBlocked ? true : undefined,
  });

  const allTags = getAllTags();
  const allGroups = getAllGroups();
  const stats = getStatsSummary();

  // Handle create
  const handleCreate = async (data: any) => {
    try {
      await createContact(data);
      setShowCreateForm(false);
      mutate();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la création');
    }
  };

  // Handle delete
  const handleDelete = async (contact: any) => {
    if (!confirm(`Supprimer ${contact.name || contact.phoneNumber} ?`)) return;

    try {
      await deleteContact(contact.id);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  // Handle toggle block
  const handleToggleBlock = async (contact: any) => {
    try {
      await toggleBlock(contact.id, !contact.isBlocked);
    } catch (error: any) {
      alert(error.message || 'Erreur');
    }
  };

  // Handle import
  const handleImport = async (file: File) => {
    return await importContacts(file);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await exportContacts();
      const filename = `contacts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadFile(blob, filename);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'export');
    }
  };

  const hasFilters = selectedTags.length > 0 || selectedGroups.length > 0 || showBlocked || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Contacts WhatsApp - CRM Immobilier</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/communication/whatsapp"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contacts WhatsApp</h1>
              <p className="text-gray-600 mt-1">{total} contact{total > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>

            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importer
            </button>

            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau contact
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Actifs</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeContacts}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Bloqués</p>
            <p className="text-2xl font-bold text-red-600">{stats.blockedContacts}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Messages</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalMessages}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, téléphone ou email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <select
                  multiple
                  value={selectedTags}
                  onChange={(e) =>
                    setSelectedTags(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  size={4}
                >
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Groups Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Groupes</label>
                <select
                  multiple
                  value={selectedGroups}
                  onChange={(e) =>
                    setSelectedGroups(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  size={4}
                >
                  {allGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blocked Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={showBlocked}
                    onChange={(e) => setShowBlocked(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Afficher seulement les bloqués</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedTags([]);
                setSelectedGroups([]);
                setShowBlocked(false);
                setSearchQuery('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Active Filters */}
        {hasFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                Tag: {tag}
                <button
                  onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedGroups.map((group) => (
              <span
                key={group}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
              >
                Groupe: {group}
                <button
                  onClick={() => setSelectedGroups(selectedGroups.filter((g) => g !== group))}
                  className="hover:bg-purple-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Contacts Grid */}
        <ContactGrid
          contacts={contacts}
          onEdit={(contact) => router.push(`/communication/whatsapp/contacts/${contact.id}`)}
          onDelete={handleDelete}
          onToggleBlock={handleToggleBlock}
          isLoading={isLoading}
        />
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nouveau contact</h2>
            <ContactForm
              onSave={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              isSaving={isCreating}
              availableTags={allTags}
              availableGroups={allGroups}
            />
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ContactImport
              onImport={handleImport}
              onClose={() => setShowImport(false)}
              isImporting={isImporting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
