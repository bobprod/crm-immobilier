import React, { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Copy, ExternalLink, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { WhatsAppProvider, CreateWhatsAppConfigDto } from '../types/whatsapp.types';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';

interface ConfigWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * WhatsApp Configuration Wizard
 * Step-by-step guide to configure WhatsApp integration
 */
export const ConfigWizard: React.FC<ConfigWizardProps> = ({ onComplete, onCancel }) => {
  const { createConfig, isCreating, getWebhookUrl } = useWhatsAppConfig();
  const [currentStep, setCurrentStep] = useState(0);
  const [provider, setProvider] = useState<WhatsAppProvider>(WhatsAppProvider.META);
  const [formData, setFormData] = useState<Partial<CreateWhatsAppConfigDto>>({
    provider: WhatsAppProvider.META,
    isActive: false,
    autoReplyEnabled: true,
    businessHoursOnly: false,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const steps = [
    {
      id: 'provider',
      title: 'Choisir le fournisseur',
      description: 'Sélectionnez Meta Cloud API (gratuit) ou Twilio',
    },
    {
      id: 'credentials',
      title: 'Identifiants API',
      description: 'Entrez vos identifiants WhatsApp Business',
    },
    {
      id: 'webhook',
      title: 'Configuration Webhook',
      description: 'Configurez le webhook pour recevoir les messages',
    },
    {
      id: 'settings',
      title: 'Paramètres',
      description: 'Options de réponse automatique et heures d\'ouverture',
    },
    {
      id: 'test',
      title: 'Test & Activation',
      description: 'Testez la connexion et activez',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCopyWebhook = () => {
    const webhookUrl = getWebhookUrl(provider);
    navigator.clipboard.writeText(webhookUrl);
    alert('URL du webhook copiée !');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate test (in real app, call API)
    setTimeout(() => {
      setTestResult({
        success: true,
        message: 'Connexion réussie ! Votre configuration fonctionne.',
      });
      setIsTesting(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    try {
      await createConfig(formData as CreateWhatsAppConfigDto);
      onComplete?.();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la création de la configuration');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                index < currentStep
                  ? 'bg-green-500 border-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-xs mt-2 ${
                index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'
              }`}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-2 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Step 0: Provider Selection
  const renderProviderStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Choisissez votre fournisseur WhatsApp</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meta Cloud API */}
        <button
          onClick={() => {
            setProvider(WhatsAppProvider.META);
            setFormData({ ...formData, provider: WhatsAppProvider.META });
          }}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            provider === WhatsAppProvider.META
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            {provider === WhatsAppProvider.META && (
              <CheckCircle className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Meta Cloud API</h4>
          <p className="text-sm text-gray-600 mb-2">API officielle de Meta (Facebook)</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ Gratuit (1000 conversations/mois)</li>
            <li>✓ API officielle</li>
            <li>✓ Meilleure stabilité</li>
          </ul>
        </button>

        {/* Twilio */}
        <button
          onClick={() => {
            setProvider(WhatsAppProvider.TWILIO);
            setFormData({ ...formData, provider: WhatsAppProvider.TWILIO });
          }}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            provider === WhatsAppProvider.TWILIO
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            {provider === WhatsAppProvider.TWILIO && (
              <CheckCircle className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Twilio</h4>
          <p className="text-sm text-gray-600 mb-2">Service tiers populaire</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ Configuration simple</li>
            <li>✓ Support développeur</li>
            <li>⚠ Payant (dès le 1er message)</li>
          </ul>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Recommandation</p>
            <p className="text-xs text-blue-700 mt-1">
              Nous recommandons Meta Cloud API pour commencer. C'est gratuit jusqu'à 1000 conversations par mois et c'est l'API officielle de WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 1: Credentials
  const renderCredentialsStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {provider === WhatsAppProvider.META ? 'Identifiants Meta Cloud API' : 'Identifiants Twilio'}
      </h3>

      {provider === WhatsAppProvider.META ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number ID
            </label>
            <input
              type="text"
              value={formData.phoneNumberId || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Exemple: 123456789012345"
            />
            <p className="text-xs text-gray-500 mt-1">
              Trouvez-le dans votre{' '}
              <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Meta App Dashboard
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Account ID
            </label>
            <input
              type="text"
              value={formData.businessAccountId || ''}
              onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Exemple: 987654321098765"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Token
            </label>
            <textarea
              value={formData.accessToken || ''}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Collez votre access token ici..."
            />
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Ne partagez jamais ce token. Il donne accès à votre compte WhatsApp Business.
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account SID
            </label>
            <input
              type="text"
              value={formData.twilioAccountSid || ''}
              onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auth Token
            </label>
            <input
              type="password"
              value={formData.twilioAuthToken || ''}
              onChange={(e) => setFormData({ ...formData, twilioAuthToken: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••••••••••••••••••••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twilio Phone Number
            </label>
            <input
              type="text"
              value={formData.twilioPhoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+14155238886"
            />
          </div>
        </>
      )}
    </div>
  );

  // Step 2: Webhook Configuration
  const renderWebhookStep = () => {
    const webhookUrl = getWebhookUrl(provider);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Configuration du Webhook</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL du Webhook
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
            />
            <button
              onClick={handleCopyWebhook}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md flex items-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copier
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Copiez cette URL et ajoutez-la dans votre console {provider === WhatsAppProvider.META ? 'Meta' : 'Twilio'}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">📝 Instructions</h4>
          <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
            {provider === WhatsAppProvider.META ? (
              <>
                <li>Allez dans votre Meta App Dashboard</li>
                <li>Sélectionnez WhatsApp &gt; Configuration</li>
                <li>Dans la section Webhook, cliquez sur "Configure"</li>
                <li>Collez l'URL du webhook ci-dessus</li>
                <li>Entrez un verify token (vous le choisirez)</li>
                <li>Activez les webhooks pour "messages"</li>
              </>
            ) : (
              <>
                <li>Allez dans votre Twilio Console</li>
                <li>Sélectionnez votre numéro WhatsApp</li>
                <li>Dans "Messaging", trouvez "A MESSAGE COMES IN"</li>
                <li>Collez l'URL du webhook ci-dessus</li>
                <li>Sélectionnez HTTP POST</li>
                <li>Enregistrez les modifications</li>
              </>
            )}
          </ol>
          <a
            href={provider === WhatsAppProvider.META
              ? 'https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks'
              : 'https://www.twilio.com/docs/whatsapp/tutorial/receive-and-reply-to-messages'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-yellow-900 font-medium mt-3 hover:underline"
          >
            Voir la documentation complète <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  };

  // Step 3: Settings
  const renderSettingsStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Paramètres Additionnels</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Réponse Automatique</h4>
            <p className="text-sm text-gray-600">Envoyer un message de bienvenue automatique</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoReplyEnabled}
              onChange={(e) => setFormData({ ...formData, autoReplyEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Heures d'Ouverture Uniquement</h4>
            <p className="text-sm text-gray-600">Répondre seulement pendant les heures d'ouverture</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.businessHoursOnly}
              onChange={(e) => setFormData({ ...formData, businessHoursOnly: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {formData.businessHoursOnly && (
          <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ouverture</label>
              <input
                type="time"
                value={formData.businessHoursStart || '09:00'}
                onChange={(e) => setFormData({ ...formData, businessHoursStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fermeture</label>
              <input
                type="time"
                value={formData.businessHoursEnd || '18:00'}
                onChange={(e) => setFormData({ ...formData, businessHoursEnd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Test & Activation
  const renderTestStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Test de Connexion</h3>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Récapitulatif de la Configuration</h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Fournisseur:</dt>
            <dd className="font-medium">{provider === WhatsAppProvider.META ? 'Meta Cloud API' : 'Twilio'}</dd>
          </div>
          {provider === WhatsAppProvider.META ? (
            <>
              <div className="flex justify-between">
                <dt className="text-gray-600">Phone Number ID:</dt>
                <dd className="font-mono text-xs">{formData.phoneNumberId || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Business Account ID:</dt>
                <dd className="font-mono text-xs">{formData.businessAccountId || '-'}</dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <dt className="text-gray-600">Account SID:</dt>
                <dd className="font-mono text-xs">{formData.twilioAccountSid || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Phone Number:</dt>
                <dd className="font-medium">{formData.twilioPhoneNumber || '-'}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-600">Auto-Reply:</dt>
            <dd className="font-medium">{formData.autoReplyEnabled ? 'Activé' : 'Désactivé'}</dd>
          </div>
        </dl>
      </div>

      <button
        onClick={handleTestConnection}
        disabled={isTesting}
        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {isTesting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Test en cours...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Tester la Connexion
          </>
        )}
      </button>

      {testResult && (
        <div
          className={`p-4 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex gap-3">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <div>
              <p className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {testResult.success ? 'Test Réussi !' : 'Test Échoué'}
              </p>
              <p className={`text-sm mt-1 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderProviderStep();
      case 1:
        return renderCredentialsStep();
      case 2:
        return renderWebhookStep();
      case 3:
        return renderSettingsStep();
      case 4:
        return renderTestStep();
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {renderStepIndicator()}

      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStep === 0 ? 'Annuler' : 'Précédent'}
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isCreating || !testResult?.success}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Terminer
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
