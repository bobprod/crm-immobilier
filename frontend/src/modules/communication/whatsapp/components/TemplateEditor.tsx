import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, X, Type, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateCategory,
  TemplateStatus,
  TemplateButton,
  TemplateButtonType,
} from '../types/whatsapp.types';

interface TemplateEditorProps {
  initialData?: Partial<CreateTemplateDto>;
  onSave: (data: CreateTemplateDto | UpdateTemplateDto) => void;
  onCancel: () => void;
  isSaving?: boolean;
  mode?: 'create' | 'edit';
}

/**
 * Template Editor Component
 * Rich editor for creating and editing WhatsApp templates
 */
export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
  mode = 'create',
}) => {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [language, setLanguage] = useState(initialData?.language || 'fr');
  const [category, setCategory] = useState<TemplateCategory>(
    initialData?.category || TemplateCategory.UTILITY
  );
  const [header, setHeader] = useState(initialData?.header || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [footer, setFooter] = useState(initialData?.footer || '');
  const [buttons, setButtons] = useState<TemplateButton[]>(initialData?.buttons || []);
  const [variables, setVariables] = useState<string[]>(initialData?.variables || []);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract variables from body text
  useEffect(() => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = body.match(regex);
    if (matches) {
      const extracted = Array.from(new Set(matches))
        .map((match) => match.replace(/\{\{|\}\}/g, ''))
        .sort((a, b) => parseInt(a) - parseInt(b));
      setVariables(extracted);
    } else {
      setVariables([]);
    }
  }, [body]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (!/^[a-z0-9_]+$/.test(name)) {
      newErrors.name = 'Le nom ne peut contenir que des lettres minuscules, chiffres et underscores';
    }

    // Body validation
    if (!body.trim()) {
      newErrors.body = 'Le corps du message est requis';
    } else if (body.length > 1024) {
      newErrors.body = 'Le corps ne peut pas dépasser 1024 caractères';
    }

    // Variables validation - must be sequential
    for (let i = 0; i < variables.length; i++) {
      if (parseInt(variables[i]) !== i + 1) {
        newErrors.variables = 'Les variables doivent être séquentielles ({{1}}, {{2}}, etc.)';
        break;
      }
    }

    // Header validation
    if (header && header.length > 60) {
      newErrors.header = 'L\'en-tête ne peut pas dépasser 60 caractères';
    }

    // Footer validation
    if (footer && footer.length > 60) {
      newErrors.footer = 'Le pied de page ne peut pas dépasser 60 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) return;

    const data: CreateTemplateDto | UpdateTemplateDto = {
      name: name.trim(),
      language,
      category,
      header: header.trim() || undefined,
      body: body.trim(),
      footer: footer.trim() || undefined,
      buttons: buttons.length > 0 ? buttons : undefined,
      variables,
    };

    onSave(data);
  };

  // Insert variable at cursor position
  const insertVariable = (textareaRef: HTMLTextAreaElement | null) => {
    if (!textareaRef) return;

    const nextVarNum = variables.length + 1;
    const varText = `{{${nextVarNum}}}`;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const newBody = body.substring(0, start) + varText + body.substring(end);

    setBody(newBody);

    // Set cursor position after inserted variable
    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(start + varText.length, start + varText.length);
    }, 0);
  };

  // Add button
  const addButton = (type: TemplateButtonType) => {
    if (buttons.length >= 3) return; // Max 3 buttons

    const newButton: TemplateButton = {
      type,
      text: '',
      ...(type === TemplateButtonType.URL && { url: '' }),
      ...(type === TemplateButtonType.PHONE_NUMBER && { phoneNumber: '' }),
    };

    setButtons([...buttons, newButton]);
  };

  // Update button
  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setButtons(newButtons);
  };

  // Remove button
  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du template *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="ex: welcome_message"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={mode === 'edit'} // Can't change name in edit mode
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Lettres minuscules, chiffres et underscores uniquement
          </p>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Langue *
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fr">Français (FR)</option>
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
            <option value="de">Deutsch (DE)</option>
            <option value="it">Italiano (IT)</option>
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catégorie *
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setCategory(TemplateCategory.MARKETING)}
            className={`px-4 py-3 border-2 rounded-lg transition-all ${
              category === TemplateCategory.MARKETING
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Marketing</div>
            <div className="text-xs text-gray-500 mt-1">Promotions, offres</div>
          </button>

          <button
            type="button"
            onClick={() => setCategory(TemplateCategory.UTILITY)}
            className={`px-4 py-3 border-2 rounded-lg transition-all ${
              category === TemplateCategory.UTILITY
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Utilitaire</div>
            <div className="text-xs text-gray-500 mt-1">Notifications, alertes</div>
          </button>

          <button
            type="button"
            onClick={() => setCategory(TemplateCategory.AUTHENTICATION)}
            className={`px-4 py-3 border-2 rounded-lg transition-all ${
              category === TemplateCategory.AUTHENTICATION
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Authentification</div>
            <div className="text-xs text-gray-500 mt-1">OTP, vérification</div>
          </button>
        </div>
      </div>

      {/* Header (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          En-tête (optionnel)
        </label>
        <input
          type="text"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder="Titre du message"
          maxLength={60}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.header ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.header && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.header}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {header.length}/60 caractères
        </p>
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Corps du message *
          </label>
          <button
            type="button"
            onClick={() => {
              const textarea = document.getElementById('body-textarea') as HTMLTextAreaElement;
              insertVariable(textarea);
            }}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Insérer variable
          </button>
        </div>
        <textarea
          id="body-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Bonjour {{1}}, votre rendez-vous est confirmé pour le {{2}}."
          maxLength={1024}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm ${
            errors.body ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.body && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.body}
          </p>
        )}
        {errors.variables && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.variables}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">
            {body.length}/1024 caractères
          </p>
          {variables.length > 0 && (
            <p className="text-xs text-blue-600">
              {variables.length} variable{variables.length > 1 ? 's' : ''} détectée{variables.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Footer (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pied de page (optionnel)
        </label>
        <input
          type="text"
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          placeholder="Merci de votre confiance"
          maxLength={60}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.footer ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.footer && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.footer}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {footer.length}/60 caractères
        </p>
      </div>

      {/* Buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Boutons (optionnel)
        </label>

        {/* Existing buttons */}
        {buttons.length > 0 && (
          <div className="space-y-3 mb-3">
            {buttons.map((button, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Button text */}
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => updateButton(index, { text: e.target.value })}
                      placeholder="Texte du bouton"
                      maxLength={20}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* URL for URL buttons */}
                    {button.type === TemplateButtonType.URL && (
                      <input
                        type="url"
                        value={button.url || ''}
                        onChange={(e) => updateButton(index, { url: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}

                    {/* Phone for phone buttons */}
                    {button.type === TemplateButtonType.PHONE_NUMBER && (
                      <input
                        type="tel"
                        value={button.phoneNumber || ''}
                        onChange={(e) => updateButton(index, { phoneNumber: e.target.value })}
                        placeholder="+33612345678"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeButton(index)}
                    className="p-2 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Type: {button.type === TemplateButtonType.URL ? 'Lien' : button.type === TemplateButtonType.PHONE_NUMBER ? 'Téléphone' : 'Réponse rapide'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add button */}
        {buttons.length < 3 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addButton(TemplateButtonType.QUICK_REPLY)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Type className="w-4 h-4" />
              Réponse rapide
            </button>
            <button
              type="button"
              onClick={() => addButton(TemplateButtonType.URL)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Lien
            </button>
            <button
              type="button"
              onClick={() => addButton(TemplateButtonType.PHONE_NUMBER)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Type className="w-4 h-4" />
              Téléphone
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Maximum 3 boutons • {buttons.length}/3
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">ℹ️ Information importante</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Les templates doivent être approuvés par WhatsApp avant utilisation</li>
          <li>• Le délai d'approbation peut prendre jusqu'à 24 heures</li>
          <li>• Les variables permettent de personnaliser les messages ({{1}}, {{2}}, etc.)</li>
          <li>• Une fois approuvé, le template ne peut plus être modifié</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            mode === 'create' ? 'Créer le template' : 'Enregistrer'
          )}
        </button>
      </div>
    </div>
  );
};
