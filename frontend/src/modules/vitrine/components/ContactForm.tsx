import React, { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { publicVitrineApi, type SubmitLeadData } from '@/shared/utils/public-vitrine-api';

interface ContactFormProps {
  slug: string;
  propertyId?: string;
  agentProfileId?: string;
  primaryColor?: string;
  defaultType?: SubmitLeadData['type'];
  onSuccess?: () => void;
}

const TYPES = [
  { value: 'CONTACT', label: 'Renseignements' },
  { value: 'VISIT_REQUEST', label: 'Demande de visite' },
  { value: 'ESTIMATION', label: 'Estimation gratuite' },
  { value: 'INVESTMENT', label: 'Conseil investissement' },
  { value: 'ALERT', label: 'Alerte bien' },
] as const;

export const ContactForm: React.FC<ContactFormProps> = ({
  slug,
  propertyId,
  agentProfileId,
  primaryColor,
  defaultType = 'CONTACT',
  onSuccess,
}) => {
  const [form, setForm] = useState<SubmitLeadData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    type: defaultType,
    propertyId,
    agentProfileId,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SubmitLeadData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  // Anti-spam honeypot
  const [honeypot, setHoneypot] = useState('');

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!form.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SubmitLeadData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot check — bot protection
    if (honeypot) return;
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');
    try {
      await publicVitrineApi.submitLead(slug, form);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <h3 className="text-lg font-bold text-gray-900">Message envoyé !</h3>
        <p className="text-gray-600 max-w-sm">
          Nous avons bien reçu votre demande. Notre équipe vous contactera dans les plus brefs
          délais.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleChange('type', t.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              form.type === t.value
                ? 'text-white border-transparent'
                : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
            }`}
            style={
              form.type === t.value
                ? {
                    backgroundColor: primaryColor || 'var(--agency-primary)',
                    borderColor: 'transparent',
                  }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Votre prénom"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              errors.firstName
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-200 focus:ring-blue-100'
            }`}
            style={{ '--tw-ring-color': `${primaryColor}33` } as any}
          />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Votre nom"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@exemple.com"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              errors.email
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-200 focus:ring-blue-100'
            }`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+216 XX XXX XXX"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="Décrivez votre demande..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </div>

      {/* Honeypot — hidden from humans */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
        <input
          tabIndex={-1}
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
        style={{ backgroundColor: primaryColor || 'var(--agency-primary)' }}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Envoyer ma demande
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Vos données sont protégées et ne seront jamais revendues.
      </p>
    </form>
  );
};

export default ContactForm;
