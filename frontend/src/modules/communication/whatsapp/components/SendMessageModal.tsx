import React, { useState } from 'react';
import { X, Send, User, FileText } from 'lucide-react';
import { useMessages } from '../hooks/useMessages';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (conversationId: string) => void;
}

/**
 * Send New Message Modal
 * For starting new conversations
 */
export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { sendTextMessage, sendTemplateMessage, isSending } = useMessages();
  const [step, setStep] = useState<'contact' | 'message'>('contact');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'template'>('text');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Mock templates (replace with real data)
  const templates = [
    { name: 'welcome_message', body: 'Bonjour! Merci de nous contacter.' },
    { name: 'appointment_reminder', body: 'Rappel: Votre rendez-vous est prévu demain.' },
  ];

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('contact');
    setPhoneNumber('');
    setMessageText('');
    setMessageType('text');
    setSelectedTemplate('');
    onClose();
  };

  const handleNext = () => {
    if (step === 'contact' && phoneNumber.trim()) {
      setStep('message');
    }
  };

  const handleSend = async () => {
    try {
      let result;

      if (messageType === 'text') {
        result = await sendTextMessage({
          phoneNumber: phoneNumber.trim(),
          message: messageText.trim(),
        });
      } else {
        result = await sendTemplateMessage({
          phoneNumber: phoneNumber.trim(),
          templateName: selectedTemplate,
          parameters: [],
        });
      }

      if (result.conversationId) {
        onSuccess?.(result.conversationId);
      }

      handleClose();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'envoi du message');
    }
  };

  const canSend = () => {
    if (messageType === 'text') {
      return phoneNumber.trim() && messageText.trim() && !isSending;
    }
    return phoneNumber.trim() && selectedTemplate && !isSending;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nouveau Message</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'contact' ? (
            /* Step 1: Contact */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+33612345678"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format international requis (ex: +33612345678)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-1">💡 Conseil</p>
                <p className="text-xs text-blue-700">
                  Assurez-vous que le numéro est au format E.164 et que le contact a WhatsApp.
                </p>
              </div>
            </div>
          ) : (
            /* Step 2: Message */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinataire
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                  {phoneNumber}
                </div>
              </div>

              {/* Message Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de message
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMessageType('text')}
                    className={`px-4 py-3 border-2 rounded-lg transition-all ${
                      messageType === 'text'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Send className="w-5 h-5" />
                      <span className="text-sm font-medium">Texte</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setMessageType('template')}
                    className={`px-4 py-3 border-2 rounded-lg transition-all ${
                      messageType === 'template'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">Template</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Text Message */}
              {messageType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={5}
                    placeholder="Tapez votre message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {messageText.length} caractères
                  </p>
                </div>
              )}

              {/* Template Selection */}
              {messageType === 'template' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un template
                  </label>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => setSelectedTemplate(template.name)}
                        className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                          selectedTemplate === template.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.body}</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Les templates doivent être pré-approuvés par WhatsApp
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          {step === 'message' && (
            <button
              onClick={() => setStep('contact')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Retour
            </button>
          )}

          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>

            {step === 'contact' ? (
              <button
                onClick={handleNext}
                disabled={!phoneNumber.trim()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend()}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
