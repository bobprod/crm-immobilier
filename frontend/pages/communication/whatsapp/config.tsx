import React, { useState } from 'react';
import Head from 'next/head';
import { Settings, Trash2, Power, PowerOff, Save, ExternalLink, RefreshCw } from 'lucide-react';
import { useWhatsAppConfig } from '../../../src/modules/communication/whatsapp/hooks/useWhatsAppConfig';
import { ConfigWizard } from '../../../src/modules/communication/whatsapp/components/ConfigWizard';
import { WhatsAppProvider } from '../../../src/modules/communication/whatsapp/types/whatsapp.types';

/**
 * WhatsApp Configuration Page
 * Manage WhatsApp integration settings
 */
export default function WhatsAppConfigPage() {
  const {
    config,
    isLoading,
    hasConfig,
    updateConfig,
    deleteConfig,
    toggleActive,
    toggleAutoReply,
    getWebhookUrl,
    isUpdating,
    isDeleting,
  } = useWhatsAppConfig();

  const [showWizard, setShowWizard] = useState(!hasConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    businessHoursStart: config?.businessHoursStart || '09:00',
    businessHoursEnd: config?.businessHoursEnd || '18:00',
  });

  const handleSaveSettings = async () => {
    try {
      await updateConfig(editData);
      setIsEditing(false);
      alert('Paramètres mis à jour avec succès !');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteConfig();
      setShowWizard(true);
      alert('Configuration supprimée avec succès');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  if (showWizard || !hasConfig) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <Head>
          <title>Configuration WhatsApp - CRM Immobilier</title>
        </Head>

        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration WhatsApp</h1>
          <p className="text-gray-600">Assistant de configuration pour connecter WhatsApp Business API</p>
        </div>

        <ConfigWizard
          onComplete={() => {
            setShowWizard(false);
            window.location.reload();
          }}
          onCancel={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Configuration WhatsApp - CRM Immobilier</title>
      </Head>

      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Configuration WhatsApp
            </h1>
            <p className="text-gray-600 mt-1">Gérez vos paramètres WhatsApp Business</p>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Reconfigurer
          </button>
        </div>

        {/* Status Card */}
        <div className={`mb-6 p-6 rounded-lg border-2 ${config?.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {config?.isActive ? (
                <Power className="w-10 h-10 text-green-600" />
              ) : (
                <PowerOff className="w-10 h-10 text-gray-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {config?.isActive ? 'Actif' : 'Inactif'}
                </h3>
                <p className="text-sm text-gray-600">
                  {config?.isActive
                    ? 'Votre intégration WhatsApp fonctionne'
                    : 'Activez pour recevoir et envoyer des messages'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleActive}
              disabled={isUpdating}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                config?.isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50`}
            >
              {config?.isActive ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        </div>

        {/* Provider Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fournisseur</h2>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl ${
              config?.provider === WhatsAppProvider.META
                ? 'bg-gradient-to-br from-green-400 to-green-600'
                : 'bg-gradient-to-br from-red-400 to-red-600'
            }`}>
              {config?.provider === WhatsAppProvider.META ? 'M' : 'T'}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {config?.provider === WhatsAppProvider.META ? 'Meta Cloud API' : 'Twilio'}
              </h3>
              <p className="text-sm text-gray-600">
                {config?.provider === WhatsAppProvider.META ? 'API officielle WhatsApp' : 'Service tiers'}
              </p>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Identifiants</h2>
          <dl className="space-y-3">
            {config?.provider === WhatsAppProvider.META ? (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-gray-600">Phone Number ID:</dt>
                  <dd className="font-mono text-sm text-gray-900">{config.phoneNumberId || '-'}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-gray-600">Business Account ID:</dt>
                  <dd className="font-mono text-sm text-gray-900">{config.businessAccountId || '-'}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-gray-600">Access Token:</dt>
                  <dd className="font-mono text-sm text-gray-900">••••••••••••••••</dd>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-gray-600">Account SID:</dt>
                  <dd className="font-mono text-sm text-gray-900">{config?.twilioAccountSid || '-'}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-gray-600">Phone Number:</dt>
                  <dd className="font-mono text-sm text-gray-900">{config?.twilioPhoneNumber || '-'}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-gray-600">Auth Token:</dt>
                  <dd className="font-mono text-sm text-gray-900">••••••••••••••••</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* Webhook URL */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook</h2>
          <div className="bg-gray-50 rounded p-3 mb-3">
            <code className="text-sm text-gray-900 break-all">
              {config && getWebhookUrl(config.provider)}
            </code>
          </div>
          <a
            href={config?.provider === WhatsAppProvider.META
              ? 'https://developers.facebook.com/apps'
              : 'https://console.twilio.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            Ouvrir la console {config?.provider === WhatsAppProvider.META ? 'Meta' : 'Twilio'}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Paramètres</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Modifier
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Auto Reply */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Réponse Automatique</h3>
                <p className="text-sm text-gray-600">Message de bienvenue automatique</p>
              </div>
              <button
                onClick={toggleAutoReply}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  config?.autoReplyEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {config?.autoReplyEnabled ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            {/* Business Hours */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Heures d'Ouverture</h3>
                  <p className="text-sm text-gray-600">Limiter aux heures d'ouverture</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  config?.businessHoursOnly
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {config?.businessHoursOnly ? 'Activé' : 'Désactivé'}
                </span>
              </div>

              {config?.businessHoursOnly && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ouverture</label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editData.businessHoursStart}
                        onChange={(e) => setEditData({ ...editData, businessHoursStart: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="font-medium">{config.businessHoursStart || '09:00'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Fermeture</label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editData.businessHoursEnd}
                        onChange={(e) => setEditData({ ...editData, businessHoursEnd: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    ) : (
                      <p className="font-medium">{config.businessHoursEnd || '18:00'}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg border-2 border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Zone Dangereuse</h2>
          <p className="text-sm text-gray-600 mb-4">
            La suppression de votre configuration est permanente et irréversible.
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer la Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
