import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, Filter, Plus, X, TrendingUp, FileText } from 'lucide-react';
import { useTemplates } from '../../../../src/modules/communication/whatsapp/hooks/useTemplates';
import { TemplateGrid } from '../../../../src/modules/communication/whatsapp/components/TemplateCard';
import { TemplateStatus, TemplateCategory } from '../../../../src/modules/communication/whatsapp/types/whatsapp.types';

/**
 * WhatsApp Templates List Page
 * Browse and manage all message templates
 */
export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TemplateStatus | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>();

  const {
    templates,
    isLoading,
    isDeleting,
    filterTemplates,
    deleteTemplate,
    duplicateTemplate,
    getCategoryCounts,
    getStatusCounts,
    getTopTemplates,
  } = useTemplates();

  // Apply filters
  const filteredTemplates = filterTemplates({
    status: selectedStatus,
    category: selectedCategory,
    language: selectedLanguage,
    search: searchQuery,
  });

  const statusCounts = getStatusCounts();
  const categoryCounts = getCategoryCounts();
  const topTemplates = getTopTemplates(3);

  // Handle delete
  const handleDelete = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      await deleteTemplate(templateId);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  // Handle duplicate
  const handleDuplicate = async (templateId: string) => {
    try {
      const newTemplate = await duplicateTemplate(templateId);
      alert(`Template "${newTemplate.name}" créé avec succès`);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la duplication');
    }
  };

  // Handle edit
  const handleEdit = (templateId: string) => {
    router.push(`/communication/whatsapp/templates/create?id=${templateId}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedStatus(undefined);
    setSelectedCategory(undefined);
    setSelectedLanguage(undefined);
    setSearchQuery('');
    setShowFilters(false);
  };

  const hasActiveFilters = selectedStatus || selectedCategory || selectedLanguage || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Templates WhatsApp - CRM Immobilier</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates WhatsApp</h1>
            <p className="text-gray-600 mt-1">
              {filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/communication/whatsapp"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </Link>

            <Link
              href="/communication/whatsapp/templates/create"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau Template
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Templates */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          {/* Approved */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approuvés</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⏱</span>
              </div>
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">✕</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Templates */}
        {topTemplates.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Templates les plus performants</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {topTemplates.map((template) => {
                const successRate = template.sentCount > 0
                  ? ((template.deliveredCount / template.sentCount) * 100).toFixed(0)
                  : '0';
                return (
                  <Link
                    key={template.id}
                    href={`/communication/whatsapp/templates/create?id=${template.id}`}
                    className="px-3 py-2 bg-white border border-green-300 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{template.name}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        {successRate}% ✓
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-1 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedStatus(undefined)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              !selectedStatus
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Tous</span>
            <span className="ml-2 text-sm">({templates.length})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(TemplateStatus.APPROVED)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              selectedStatus === TemplateStatus.APPROVED
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Approuvés</span>
            <span className="ml-2 text-sm">({statusCounts.approved})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(TemplateStatus.PENDING)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              selectedStatus === TemplateStatus.PENDING
                ? 'bg-yellow-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">En attente</span>
            <span className="ml-2 text-sm">({statusCounts.pending})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(TemplateStatus.REJECTED)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-md transition-colors ${
              selectedStatus === TemplateStatus.REJECTED
                ? 'bg-red-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Rejetés</span>
            <span className="ml-2 text-sm">({statusCounts.rejected})</span>
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
              placeholder="Rechercher par nom ou contenu..."
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
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Réinitialiser
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes</option>
                  <option value={TemplateCategory.MARKETING}>Marketing ({categoryCounts.marketing})</option>
                  <option value={TemplateCategory.UTILITY}>Utilitaire ({categoryCounts.utility})</option>
                  <option value={TemplateCategory.AUTHENTICATION}>Authentification ({categoryCounts.authentication})</option>
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select
                  value={selectedLanguage || ''}
                  onChange={(e) => setSelectedLanguage(e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes</option>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
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

            {selectedCategory && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                Catégorie: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {selectedLanguage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                Langue: {selectedLanguage.toUpperCase()}
                <button
                  onClick={() => setSelectedLanguage(undefined)}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {searchQuery && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                Recherche: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Templates Grid */}
        <TemplateGrid
          templates={filteredTemplates}
          onEdit={(template) => handleEdit(template.id)}
          onDuplicate={(template) => handleDuplicate(template.id)}
          onDelete={(template) => handleDelete(template.id)}
          onView={(template) => handleEdit(template.id)}
          isLoading={isLoading}
        />

        {/* Empty State */}
        {!isLoading && filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? 'Aucun template trouvé' : 'Aucun template'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre premier template pour commencer'}
            </p>
            {!hasActiveFilters && (
              <Link
                href="/communication/whatsapp/templates/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Créer un template
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
