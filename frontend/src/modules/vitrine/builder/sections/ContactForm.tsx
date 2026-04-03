import React from 'react';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
  : 'http://localhost:3001/api';

export interface ContactFormProps {
  title: string;
  subtitle: string;
  fields: ('name' | 'email' | 'phone' | 'subject' | 'message')[];
  submitText: string;
  successMessage: string;
  backgroundColor: string;
  accentColor: string;
  padding: string;
  layout: 'single' | 'split';
  showMap: boolean;
  address: string;
  phone: string;
  email: string;
  apiSlug: string;
  leadType: 'CONTACT' | 'VISIT_REQUEST' | 'ESTIMATION';
}

const defaults: ContactFormProps = {
  title: 'Contactez-nous',
  subtitle: 'Notre équipe est à votre disposition',
  fields: ['name', 'email', 'phone', 'subject', 'message'],
  submitText: 'Envoyer le message',
  successMessage: 'Merci, votre message a bien été envoyé !',
  backgroundColor: '#fff',
  accentColor: '#1E40AF',
  padding: '60px 20px',
  layout: 'split',
  showMap: false,
  address: '12 Rue de la Paix, 75002 Paris',
  phone: '01 23 45 67 89',
  email: 'contact@agence.fr',
  apiSlug: '',
  leadType: 'CONTACT',
};

const fieldLabels: Record<string, string> = { name: 'Nom complet', email: 'Email', phone: 'Téléphone', subject: 'Sujet', message: 'Message' };

export const ContactForm: React.FC<Partial<ContactFormProps>> = (props) => {
  const p = { ...defaults, ...props };
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p.apiSlug) { setStatus('success'); return; }
    if (!formData.email) { setErrorMsg('Email requis'); setStatus('error'); return; }

    setStatus('sending');
    try {
      const nameParts = (formData.name || '').trim().split(/\s+/);
      const body = {
        firstName: nameParts[0] || 'Visiteur',
        lastName: nameParts.slice(1).join(' ') || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        message: [formData.subject, formData.message].filter(Boolean).join(' — ') || undefined,
        type: p.leadType,
      };
      const res = await fetch(`${API_BASE}/vitrine/public/slug/${p.apiSlug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({});
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || 'Erreur lors de l\'envoi');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Erreur réseau');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>{p.successMessage}</h2>
          <button onClick={() => setStatus('idle')} style={{ padding: '10px 24px', background: p.accentColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', marginTop: 16 }}>
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{p.subtitle}</p>
        </div>
        <div style={{ display: p.layout === 'split' ? 'grid' : 'block', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {status === 'error' && <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, fontSize: 13 }}>{errorMsg}</div>}
            {p.fields.map((f) => (
              <div key={f}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14, color: '#333' }}>{fieldLabels[f]}</label>
                {f === 'message' ? (
                  <textarea rows={5} placeholder={fieldLabels[f]} value={formData[f] || ''} onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
                ) : (
                  <input type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'} placeholder={fieldLabels[f]} value={formData[f] || ''} onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
                )}
              </div>
            ))}
            <button type="submit" disabled={status === 'sending'} style={{ padding: '12px 32px', background: status === 'sending' ? '#999' : p.accentColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              {status === 'sending' ? 'Envoi en cours...' : p.submitText}
            </button>
          </form>
          {p.layout === 'split' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Nos coordonnées</h3>
                <p style={{ marginBottom: 8, color: '#555' }}>📍 {p.address}</p>
                <p style={{ marginBottom: 8, color: '#555' }}>📞 {p.phone}</p>
                <p style={{ color: '#555' }}>✉️ {p.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const contactFormConfig = {
  label: 'Formulaire Contact',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    apiSlug: { type: 'text' as const, label: 'Slug agence (API)' },
    leadType: { type: 'select' as const, label: 'Type de demande', options: [{ label: 'Contact', value: 'CONTACT' }, { label: 'Demande visite', value: 'VISIT_REQUEST' }, { label: 'Estimation', value: 'ESTIMATION' }] },
    submitText: { type: 'text' as const, label: 'Texte bouton' },
    successMessage: { type: 'text' as const, label: 'Message succès' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    accentColor: { type: 'text' as const, label: 'Couleur accent' },
    padding: { type: 'text' as const, label: 'Padding' },
    layout: { type: 'select' as const, label: 'Disposition', options: [{ label: 'Simple', value: 'single' }, { label: 'Avec infos', value: 'split' }] },
    address: { type: 'text' as const, label: 'Adresse' },
    phone: { type: 'text' as const, label: 'Téléphone' },
    email: { type: 'text' as const, label: 'Email' },
  },
  defaultProps: defaults,
  render: (props: ContactFormProps) => <ContactForm {...props} />,
};
