import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, X, Tag, Users } from 'lucide-react';
import { CreateContactDto, UpdateContactDto, validatePhoneNumber } from '../hooks/useContacts';

interface ContactFormProps {
  initialData?: Partial<CreateContactDto>;
  onSave: (data: CreateContactDto | UpdateContactDto) => void;
  onCancel: () => void;
  isSaving?: boolean;
  mode?: 'create' | 'edit';
  availableTags?: string[];
  availableGroups?: string[];
}

/**
 * Contact Form Component
 * Form for creating and editing WhatsApp contacts
 */
export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
  mode = 'create',
  availableTags = [],
  availableGroups = [],
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [groups, setGroups] = useState<string[]>(initialData?.groups || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [customFields, setCustomFields] = useState<Record<string, any>>(
    initialData?.customFields || {}
  );

  const [newTag, setNewTag] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le numéro de téléphone est requis';
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Format invalide. Utilisez le format E.164 (ex: +33612345678)';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) return;

    const data: CreateContactDto | UpdateContactDto = {
      phoneNumber: phoneNumber.trim(),
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      groups: groups.length > 0 ? groups : undefined,
      notes: notes.trim() || undefined,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    };

    onSave(data);
  };

  // Add tag
  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Add group
  const handleAddGroup = () => {
    const trimmed = newGroup.trim();
    if (trimmed && !groups.includes(trimmed)) {
      setGroups([...groups, trimmed]);
      setNewGroup('');
    }
  };

  // Remove group
  const handleRemoveGroup = (group: string) => {
    setGroups(groups.filter((g) => g !== group));
  };

  return (
    <div className="space-y-6">
      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Numéro de téléphone *
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+33612345678"
          disabled={mode === 'edit'}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
          } ${mode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.phoneNumber}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">Format E.164 (ex: +33612345678)</p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jean Dupont"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jean.dupont@example.com"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="w-4 h-4 inline mr-1" />
          Tags
        </label>

        {/* Selected Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Tag */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Ajouter un tag"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            list="available-tags"
          />
          <datalist id="available-tags">
            {availableTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Groups */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="w-4 h-4 inline mr-1" />
          Groupes
        </label>

        {/* Selected Groups */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {groups.map((group) => (
              <span
                key={group}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
              >
                {group}
                <button
                  onClick={() => handleRemoveGroup(group)}
                  className="hover:bg-purple-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Group */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGroup())}
            placeholder="Ajouter un groupe"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            list="available-groups"
          />
          <datalist id="available-groups">
            {availableGroups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
          <button
            onClick={handleAddGroup}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Notes sur ce contact..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">{notes.length} caractères</p>
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
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : mode === 'create' ? (
            'Créer le contact'
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </div>
  );
};
