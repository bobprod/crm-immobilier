import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { useTemplates } from '../../../../src/modules/communication/whatsapp/hooks/useTemplates';
import { TemplateEditor } from '../../../../src/modules/communication/whatsapp/components/TemplateEditor';
import { TemplatePreview } from '../../../../src/modules/communication/whatsapp/components/TemplatePreview';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  WhatsAppTemplate,
} from '../../../../src/modules/communication/whatsapp/types/whatsapp.types';

/**
 * WhatsApp Template Create/Edit Page
 * Form to create new templates or edit existing ones
 */
export default function CreateTemplatePage() {
  const router = useRouter();
  const { id } = router.query;
  const isEditMode = !!id;

  const {
    getTemplate,
    createTemplate,
    updateTemplate,
    isCreating,
    isUpdating,
  } = useTemplates();

  const [template, setTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewData, setPreviewData] = useState<Partial<WhatsAppTemplate>>({});

  // Load template if in edit mode
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    setIsLoadingTemplate(true);
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
      setPreviewData(data);
    } catch (error: any) {
      alert(error.message || 'Erreur lors du chargement du template');
      router.push('/communication/whatsapp/templates');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Handle save
  const handleSave = async (data: CreateTemplateDto | UpdateTemplateDto) => {
    try {
      if (isEditMode && template) {
        // Update existing template
        const updated = await updateTemplate(template.id, data);
        alert('Template mis à jour avec succès');
        router.push('/communication/whatsapp/templates');
      } else {
        // Create new template
        const created = await createTemplate(data as CreateTemplateDto);
        alert(`Template "${created.name}" créé avec succès. En attente d'approbation par WhatsApp.`);
        router.push('/communication/whatsapp/templates');
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les modifications non sauvegardées seront perdues.')) {
      router.push('/communication/whatsapp/templates');
    }
  };

  // Update preview data when editor changes
  const handleEditorChange = (data: Partial<WhatsAppTemplate>) => {
    setPreviewData(data);
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>
          {isEditMode ? 'Modifier le template' : 'Nouveau template'} - CRM Immobilier
        </title>
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/communication/whatsapp/templates"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? 'Modifier le template' : 'Nouveau template'}
              </h1>
              {isEditMode && template && (
                <p className="text-gray-600 mt-1">
                  {template.name}
                </p>
              )}
            </div>
          </div>

          {/* Preview Toggle (Mobile) */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4" />
                Masquer aperçu
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Voir aperçu
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {isLoadingTemplate && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du template...</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!isLoadingTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Save className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? 'Modification' : 'Création'}
                </h2>
              </div>

              {/* Warning for edit mode */}
              {isEditMode && template?.status === 'approved' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800 font-medium mb-1">
                    ⚠️ Attention
                  </p>
                  <p className="text-xs text-yellow-700">
                    Ce template est déjà approuvé. Toute modification nécessitera une nouvelle approbation par WhatsApp.
                  </p>
                </div>
              )}

              {/* Editor Component */}
              <div>
                <TemplateEditor
                  initialData={template || undefined}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isSaving={isSaving}
                  mode={isEditMode ? 'edit' : 'create'}
                />
              </div>
            </div>

            {/* Preview */}
            <div className={`bg-white border border-gray-200 rounded-lg p-6 lg:sticky lg:top-4 lg:self-start ${
              showPreview ? 'block' : 'hidden lg:block'
            }`}>
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Aperçu</h2>
              </div>

              <TemplatePreview
                template={previewData}
                sampleData={{}}
              />
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Conseils pour créer un bon template
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Bonnes pratiques</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Soyez concis et direct</li>
                <li>• Utilisez un langage professionnel</li>
                <li>• Personnalisez avec des variables</li>
                <li>• Testez avec des données réelles</li>
                <li>• Ajoutez un call-to-action clair</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">À éviter</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Contenu promotionnel excessif</li>
                <li>• Majuscules abusives</li>
                <li>• Emojis en excès</li>
                <li>• Informations trompeuses</li>
                <li>• Liens raccourcis</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Variables disponibles</h4>
            <p className="text-sm text-gray-700 mb-2">
              Utilisez des variables pour personnaliser vos messages:
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="px-2 py-1 bg-gray-100 text-blue-600 text-xs rounded font-mono">
                {'{{1}}'} - Première variable
              </code>
              <code className="px-2 py-1 bg-gray-100 text-blue-600 text-xs rounded font-mono">
                {'{{2}}'} - Deuxième variable
              </code>
              <code className="px-2 py-1 bg-gray-100 text-blue-600 text-xs rounded font-mono">
                {'{{3}}'} - Troisième variable
              </code>
              <span className="text-xs text-gray-500 self-center">etc...</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Les variables doivent être séquentielles ({{1}}, {{2}}, {{3}}...)
            </p>
          </div>
        </div>

        {/* Examples Section */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📝 Exemples de templates
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Example 1: Welcome */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  Marketing
                </span>
                <h4 className="font-medium text-gray-900 text-sm">Bienvenue</h4>
              </div>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700">
                Bonjour {'{{1}}'}, bienvenue chez CRM Immobilier ! 🏡
                <br /><br />
                Nous sommes ravis de vous accompagner dans votre projet immobilier.
              </div>
            </div>

            {/* Example 2: Appointment */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Utilitaire
                </span>
                <h4 className="font-medium text-gray-900 text-sm">Rendez-vous</h4>
              </div>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700">
                Bonjour {'{{1}}'}, votre rendez-vous est confirmé pour le {'{{2}}'} à {'{{3}}'}.
                <br /><br />
                Lieu: {'{{4}}'}
              </div>
            </div>

            {/* Example 3: OTP */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  Authentification
                </span>
                <h4 className="font-medium text-gray-900 text-sm">Code OTP</h4>
              </div>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700">
                Votre code de vérification est: {'{{1}}'}
                <br /><br />
                Ce code expire dans 10 minutes.
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Besoin d'aide ?{' '}
            <a
              href="https://developers.facebook.com/docs/whatsapp/message-templates"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Consultez la documentation WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
