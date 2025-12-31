import React, { useState } from 'react';
import { Smartphone, RefreshCw } from 'lucide-react';
import { WhatsAppTemplate, TemplateButton, TemplateButtonType } from '../types/whatsapp.types';

interface TemplatePreviewProps {
  template?: Partial<WhatsAppTemplate> | {
    name?: string;
    header?: string;
    body?: string;
    footer?: string;
    buttons?: TemplateButton[];
    variables?: string[];
  };
  sampleData?: Record<string, string>;
}

/**
 * Template Preview Component
 * Live mobile preview of WhatsApp template
 */
export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  sampleData = {},
}) => {
  const [customSampleData, setCustomSampleData] = useState<Record<string, string>>(sampleData);

  // Default sample data
  const getDefaultSampleData = (): Record<string, string> => {
    const defaults: Record<string, string> = {};
    template?.variables?.forEach((variable, index) => {
      const varNum = variable.toString();
      defaults[varNum] = customSampleData[varNum] || `Exemple ${index + 1}`;
    });
    return defaults;
  };

  // Replace variables in text
  const replaceVariables = (text: string): string => {
    if (!text) return '';

    let result = text;
    const sampleValues = { ...getDefaultSampleData(), ...customSampleData };

    Object.entries(sampleValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  };

  // Reset sample data
  const resetSampleData = () => {
    setCustomSampleData({});
  };

  return (
    <div className="space-y-4">
      {/* Variable Inputs (if template has variables) */}
      {template?.variables && template.variables.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Données de test
            </h4>
            <button
              onClick={resetSampleData}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Réinitialiser
            </button>
          </div>

          <div className="space-y-2">
            {template.variables.map((variable) => (
              <div key={variable}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Variable {`{{${variable}}}`}
                </label>
                <input
                  type="text"
                  value={customSampleData[variable.toString()] || ''}
                  onChange={(e) =>
                    setCustomSampleData({
                      ...customSampleData,
                      [variable.toString()]: e.target.value,
                    })
                  }
                  placeholder={`Exemple ${variable}`}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Phone Mockup */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-80 bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
            {/* Phone Notch */}
            <div className="bg-black rounded-[2rem] overflow-hidden">
              {/* Status Bar */}
              <div className="bg-[#075E54] px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-semibold">
                    📱
                  </div>
                  <div>
                    <div className="text-white text-xs font-medium">Aperçu Template</div>
                    <div className="text-white/70 text-[10px]">en ligne</div>
                  </div>
                </div>
                <Smartphone className="w-4 h-4 text-white" />
              </div>

              {/* Chat Background */}
              <div
                className="h-[500px] overflow-y-auto p-4 bg-[#e5ddd5]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                <div className="flex justify-start mb-2">
                  <div className="max-w-[85%]">
                    {/* Message Bubble */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      {/* Header */}
                      {template?.header && (
                        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {replaceVariables(template.header)}
                          </h3>
                        </div>
                      )}

                      {/* Body */}
                      {template?.body && (
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {replaceVariables(template.body)}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      {template?.footer && (
                        <div className="px-4 pb-3 pt-1">
                          <p className="text-xs text-gray-500 italic">
                            {replaceVariables(template.footer)}
                          </p>
                        </div>
                      )}

                      {/* Buttons */}
                      {template?.buttons && template.buttons.length > 0 && (
                        <div className="border-t border-gray-200">
                          {template.buttons.map((button, index) => (
                            <button
                              key={index}
                              className={`w-full px-4 py-3 text-sm font-medium text-blue-600 hover:bg-gray-50 transition-colors text-center ${
                                index < template.buttons!.length - 1 ? 'border-b border-gray-200' : ''
                              }`}
                            >
                              {button.type === TemplateButtonType.URL && '🔗 '}
                              {button.type === TemplateButtonType.PHONE_NUMBER && '📞 '}
                              {button.text || 'Bouton'}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="px-4 pb-2 pt-1 flex items-center justify-end gap-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date().toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Bar (disabled, just for show) */}
              <div className="bg-[#f0f0f0] px-2 py-2 flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full px-4 py-2">
                  <p className="text-xs text-gray-400">Message</p>
                </div>
                <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🎤</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Button */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full"></div>
        </div>
      </div>

      {/* Empty State */}
      {!template?.body && (
        <div className="text-center py-8">
          <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Remplissez le formulaire pour voir l'aperçu
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          💡 Ceci est un aperçu approximatif. L'apparence réelle peut varier selon le téléphone du destinataire.
        </p>
      </div>
    </div>
  );
};

/**
 * Compact Template Preview (for cards/lists)
 */
interface CompactTemplatePreviewProps {
  template: WhatsAppTemplate | Partial<WhatsAppTemplate>;
  maxLines?: number;
}

export const CompactTemplatePreview: React.FC<CompactTemplatePreviewProps> = ({
  template,
  maxLines = 3,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
      {/* Header */}
      {template.header && (
        <div className="font-semibold text-gray-900 mb-1 truncate">
          {template.header}
        </div>
      )}

      {/* Body */}
      {template.body && (
        <div
          className="text-gray-700 mb-2"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {template.body}
        </div>
      )}

      {/* Footer */}
      {template.footer && (
        <div className="text-xs text-gray-500 italic mb-2">
          {template.footer}
        </div>
      )}

      {/* Buttons */}
      {template.buttons && template.buttons.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.buttons.map((button, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200"
            >
              {button.type === TemplateButtonType.URL && '🔗 '}
              {button.type === TemplateButtonType.PHONE_NUMBER && '📞 '}
              {button.text || 'Bouton'}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="flex justify-end mt-2">
        <span className="text-[10px] text-gray-400">
          {new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};

/**
 * Side-by-side Template Editor with Preview
 */
interface TemplateSideBySideProps {
  children: React.ReactNode; // Editor component
  template?: Partial<WhatsAppTemplate>;
  sampleData?: Record<string, string>;
}

export const TemplateSideBySide: React.FC<TemplateSideBySideProps> = ({
  children,
  template,
  sampleData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Édition</h3>
        {children}
      </div>

      {/* Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 lg:sticky lg:top-4 lg:self-start">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h3>
        <TemplatePreview template={template} sampleData={sampleData} />
      </div>
    </div>
  );
};
