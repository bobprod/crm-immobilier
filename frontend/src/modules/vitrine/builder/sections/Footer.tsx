import React from 'react';

export interface FooterProps {
  agencyName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: { label: string; url: string }[];
  columns: { title: string; links: { label: string; href: string }[] }[];
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  copyright: string;
}

const defaults: FooterProps = {
  agencyName: 'Mon Agence Immobilière',
  description: 'Votre partenaire de confiance pour tous vos projets immobiliers depuis 2005.',
  address: '12 Rue de la Paix, 75002 Paris',
  phone: '01 23 45 67 89',
  email: 'contact@agence.fr',
  socialLinks: [
    { label: 'Facebook', url: '#' },
    { label: 'Instagram', url: '#' },
    { label: 'LinkedIn', url: '#' },
  ],
  columns: [
    { title: 'Nos services', links: [{ label: 'Vente', href: '/biens' }, { label: 'Location', href: '/biens' }, { label: 'Estimation', href: '/contact' }, { label: 'Gestion', href: '/contact' }] },
    { title: 'Informations', links: [{ label: 'À propos', href: '/' }, { label: 'Notre équipe', href: '/agents' }, { label: 'Contact', href: '/contact' }, { label: 'Mentions légales', href: '#' }] },
  ],
  backgroundColor: '#1a1a2e',
  textColor: '#ccc',
  accentColor: '#93C5FD',
  copyright: '© 2025 Mon Agence. Tous droits réservés.',
};

export const Footer: React.FC<Partial<FooterProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <footer style={{ backgroundColor: p.backgroundColor, color: p.textColor, padding: '48px 20px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `2fr ${p.columns.map(() => '1fr').join(' ')}`, gap: 40, marginBottom: 40 }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>{p.agencyName}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{p.description}</p>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <p>📍 {p.address}</p>
              <p>📞 {p.phone}</p>
              <p>✉️ {p.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {p.socialLinks.map((s, i) => (
                <a key={i} href={s.url} style={{ color: p.accentColor, fontSize: 13, textDecoration: 'none' }}>{s.label}</a>
              ))}
            </div>
          </div>
          {p.columns.map((col, i) => (
            <div key={i}>
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map((link, j) => (
                  <li key={j} style={{ marginBottom: 10 }}>
                    <a href={link.href} style={{ color: p.textColor, textDecoration: 'none', fontSize: 14 }}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: 20, textAlign: 'center', fontSize: 13, color: '#888' }}>
          {p.copyright}
        </div>
      </div>
    </footer>
  );
};

export const footerConfig = {
  label: 'Pied de page',
  fields: {
    agencyName: { type: 'text' as const, label: 'Nom agence' },
    description: { type: 'textarea' as const, label: 'Description' },
    address: { type: 'text' as const, label: 'Adresse' },
    phone: { type: 'text' as const, label: 'Téléphone' },
    email: { type: 'text' as const, label: 'Email' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    textColor: { type: 'text' as const, label: 'Couleur texte' },
    accentColor: { type: 'text' as const, label: 'Couleur accent' },
    copyright: { type: 'text' as const, label: 'Copyright' },
  },
  defaultProps: defaults,
  render: (props: FooterProps) => <Footer {...props} />,
};
