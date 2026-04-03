import React from 'react';

export interface HeaderNavProps {
  logoText: string;
  logoImage: string;
  menuItems: { label: string; href: string }[];
  backgroundColor: string;
  textColor: string;
  sticky: boolean;
  transparent: boolean;
  showPhone: boolean;
  phone: string;
}

const defaults: HeaderNavProps = {
  logoText: 'Mon Agence',
  logoImage: '',
  menuItems: [
    { label: 'Accueil', href: '/' },
    { label: 'Nos biens', href: '/biens' },
    { label: 'Notre équipe', href: '/agents' },
    { label: 'Contact', href: '/contact' },
  ],
  backgroundColor: '#fff',
  textColor: '#333',
  sticky: true,
  transparent: false,
  showPhone: true,
  phone: '01 23 45 67 89',
};

export const HeaderNav: React.FC<Partial<HeaderNavProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <header style={{
      backgroundColor: p.transparent ? 'transparent' : p.backgroundColor,
      position: p.sticky ? 'sticky' : 'relative',
      top: 0, zIndex: 100,
      boxShadow: p.transparent ? 'none' : '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {p.logoImage ? (
            <img src={p.logoImage} alt={p.logoText} style={{ height: 40 }} />
          ) : (
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: p.textColor }}>{p.logoText}</span>
          )}
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {p.menuItems.map((item, i) => (
            <a key={i} href={item.href} style={{ color: p.textColor, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{item.label}</a>
          ))}
          {p.showPhone && (
            <a href={`tel:${p.phone}`} style={{ color: p.textColor, fontSize: 14, fontWeight: 600 }}>📞 {p.phone}</a>
          )}
        </nav>
      </div>
    </header>
  );
};

export const headerNavConfig = {
  label: 'En-tête Navigation',
  fields: {
    logoText: { type: 'text' as const, label: 'Texte logo' },
    logoImage: { type: 'text' as const, label: 'URL logo (image)' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    textColor: { type: 'text' as const, label: 'Couleur texte' },
    sticky: { type: 'radio' as const, label: 'Fixe en haut', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    transparent: { type: 'radio' as const, label: 'Transparent', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    showPhone: { type: 'radio' as const, label: 'Afficher téléphone', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    phone: { type: 'text' as const, label: 'Téléphone' },
  },
  defaultProps: defaults,
  render: (props: HeaderNavProps) => <HeaderNav {...props} />,
};
