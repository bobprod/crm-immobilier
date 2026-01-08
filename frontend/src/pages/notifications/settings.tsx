import React, { useState, useEffect } from 'react';
import { notificationsAPI, NotificationPreferences, NotificationChannel } from '../../shared/utils/notifications-api';

/**
 * 🎛️ Page de Configuration des Notifications Smart AI
 *
 * Permet à l'utilisateur de configurer:
 * - Canaux de notification par type
 * - Quiet hours (plages horaires)
 * - Rate limiting
 * - Optimisation AI
 * - Digest quotidien
 */
export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getSettings();
      setPreferences(data);
    } catch (error: any) {
      setErrorMessage('Erreur lors du chargement des préférences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      await notificationsAPI.updateSettings(preferences);
      setSuccessMessage('✅ Préférences enregistrées avec succès !');

      // Masquer le message après 3 secondes
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage('Erreur lors de l\'enregistrement: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConfiguration = async () => {
    try {
      setTesting(true);
      const result = await notificationsAPI.testConfiguration();
      setTestResult(result);
    } catch (error: any) {
      setErrorMessage('Erreur lors du test: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const updateChannelPreference = (notifType: string, channel: NotificationChannel, enabled: boolean) => {
    if (!preferences) return;

    const currentChannels = preferences.channels[notifType] || [];
    const newChannels = enabled
      ? [...currentChannels, channel]
      : currentChannels.filter(c => c !== channel);

    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [notifType]: newChannels,
      },
    });
  };

  const isChannelEnabled = (notifType: string, channel: NotificationChannel): boolean => {
    if (!preferences) return false;
    return (preferences.channels[notifType] || []).includes(channel);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des préférences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-800">Erreur</h2>
        <p className="text-red-600">Impossible de charger les préférences.</p>
        <button
          onClick={loadPreferences}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const notificationTypes = [
    { key: 'appointment', label: '📅 Rendez-vous', icon: '📅' },
    { key: 'task', label: '⏰ Tâches', icon: '⏰' },
    { key: 'lead', label: '🎯 Prospects', icon: '🎯' },
    { key: 'system', label: '🔔 Système', icon: '🔔' },
    { key: 'property', label: '🏠 Biens', icon: '🏠' },
    { key: 'message', label: '💬 Messages', icon: '💬' },
  ];

  const channels: { key: NotificationChannel; label: string; icon: string }[] = [
    { key: 'in_app', label: 'Dans l\'app', icon: '📱' },
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'sms', label: 'SMS', icon: '💬' },
    { key: 'push', label: 'Push', icon: '🔔' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '💚' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 Configuration des Notifications Smart AI
        </h1>
        <p className="text-gray-600">
          Personnalisez vos préférences de notification. L'intelligence artificielle
          optimisera automatiquement le canal de livraison pour maximiser votre engagement.
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-green-800">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Canaux par type de notification */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📡 Canaux de notification par type
        </h2>
        <p className="text-gray-600 mb-6">
          Sélectionnez les canaux autorisés pour chaque type de notification.
          L'AI choisira le meilleur canal en fonction de votre historique d'engagement.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                {channels.map(channel => (
                  <th key={channel.key} className="text-center p-3 font-semibold text-gray-700">
                    {channel.icon} {channel.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notificationTypes.map(notifType => (
                <tr key={notifType.key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">
                    {notifType.icon} {notifType.label}
                  </td>
                  {channels.map(channel => (
                    <td key={channel.key} className="text-center p-3">
                      <input
                        type="checkbox"
                        checked={isChannelEnabled(notifType.key, channel.key)}
                        onChange={(e) => updateChannelPreference(notifType.key, channel.key, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🌙 Horaires de tranquillité (Quiet Hours)
        </h2>
        <p className="text-gray-600 mb-4">
          Définissez une plage horaire pendant laquelle vous ne souhaitez pas recevoir de notifications
          (sauf urgences).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Début
            </label>
            <input
              type="time"
              value={preferences.quietHours?.start || ''}
              onChange={(e) => setPreferences({
                ...preferences,
                quietHours: {
                  ...preferences.quietHours,
                  start: e.target.value,
                  end: preferences.quietHours?.end || '08:00',
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fin
            </label>
            <input
              type="time"
              value={preferences.quietHours?.end || ''}
              onChange={(e) => setPreferences({
                ...preferences,
                quietHours: {
                  ...preferences.quietHours,
                  start: preferences.quietHours?.start || '22:00',
                  end: e.target.value,
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <input
              type="text"
              value={preferences.quietHours?.timezone || 'Europe/Paris'}
              onChange={(e) => setPreferences({
                ...preferences,
                quietHours: {
                  ...preferences.quietHours,
                  start: preferences.quietHours?.start || '22:00',
                  end: preferences.quietHours?.end || '08:00',
                  timezone: e.target.value,
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Europe/Paris"
            />
          </div>
        </div>
      </div>

      {/* Rate Limiting & AI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rate Limiting */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔢 Limite de fréquence
          </h2>
          <p className="text-gray-600 mb-4">
            Nombre maximum de notifications par heure pour éviter la surcharge.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max par heure: {preferences.maxPerHour}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={preferences.maxPerHour}
              onChange={(e) => setPreferences({
                ...preferences,
                maxPerHour: parseInt(e.target.value),
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* AI Optimization */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🤖 Optimisation AI
          </h2>
          <p className="text-gray-600 mb-4">
            Laissez l'AI choisir le meilleur canal basé sur votre historique.
          </p>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.aiOptimization}
              onChange={(e) => setPreferences({
                ...preferences,
                aiOptimization: e.target.checked,
              })}
              className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-lg font-medium text-gray-800">
              {preferences.aiOptimization ? '✅ Activée' : '❌ Désactivée'}
            </span>
          </label>

          {preferences.aiOptimization && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 L'AI analyse vos taux d'ouverture par canal et optimise automatiquement
                le routage pour maximiser votre engagement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Digest & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Digest */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📮 Digest quotidien
          </h2>
          <p className="text-gray-600 mb-4">
            Recevez un résumé quotidien de vos notifications par email.
          </p>

          <label className="flex items-center space-x-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={preferences.dailyDigest}
              onChange={(e) => setPreferences({
                ...preferences,
                dailyDigest: e.target.checked,
              })}
              className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-lg font-medium text-gray-800">
              {preferences.dailyDigest ? '✅ Activé' : '❌ Désactivé'}
            </span>
          </label>

          {preferences.dailyDigest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure d'envoi
              </label>
              <input
                type="time"
                value={preferences.digestTime || '09:00'}
                onChange={(e) => setPreferences({
                  ...preferences,
                  digestTime: e.target.value,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Minimum Priority */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎚️ Priorité minimale
          </h2>
          <p className="text-gray-600 mb-4">
            Recevez uniquement les notifications d'importance égale ou supérieure.
          </p>

          <select
            value={preferences.minPriority}
            onChange={(e) => setPreferences({
              ...preferences,
              minPriority: e.target.value as any,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">🟢 Basse (toutes les notifications)</option>
            <option value="medium">🟡 Moyenne (important uniquement)</option>
            <option value="high">🔴 Haute (urgent uniquement)</option>
          </select>
        </div>
      </div>

      {/* Test Configuration */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Tester la configuration
        </h2>
        <p className="text-gray-600 mb-4">
          Testez votre configuration Smart AI et voyez quels canaux seront utilisés pour chaque type.
        </p>

        <button
          onClick={handleTestConfiguration}
          disabled={testing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {testing ? '🔄 Test en cours...' : '🧪 Tester ma configuration'}
        </button>

        {testResult && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-300">
            <h3 className="font-bold text-lg mb-2">Résultats du test:</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                {testResult.status.canSendNow ? '✅ Peut envoyer' : '⏸️ En quiet hours'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Rate limit:</span>{' '}
                {testResult.status.withinRateLimit ? '✅ OK' : '❌ Dépassé'}
              </p>
              <p className="text-sm">
                <span className="font-medium">AI Optimization:</span>{' '}
                {testResult.status.aiOptimizationActive ? '🤖 Active' : '❌ Inactive'}
              </p>
              <div className="mt-3">
                <p className="font-medium text-sm mb-2">Canaux optimaux:</p>
                <ul className="space-y-1 text-sm">
                  {Object.entries(testResult.optimalChannels).map(([type, channel]) => (
                    <li key={type}>
                      <span className="font-medium">{type}:</span> {String(channel)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={loadPreferences}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
        >
          ↺ Réinitialiser
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? '💾 Enregistrement...' : '💾 Enregistrer les préférences'}
        </button>
      </div>
    </div>
  );
}
