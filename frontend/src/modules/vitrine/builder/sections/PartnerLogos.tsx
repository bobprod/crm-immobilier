import React from 'react';

export interface PartnerLogosProps {
  title: string;
  logos: { name: string; image: string; url: string }[];
  backgroundColor: string;
  padding: string;
  grayscale: boolean;
  logoHeight: string;
}

const defaults: PartnerLogosProps = {
  title: 'Ils nous font confiance',
  logos: [
    { name: 'Partenaire 1', image: 'https://via.placeholder.com/200x80/f0f0f0/999?text=Partenaire+1', url: '#' },
    { name: 'Partenaire 2', image: 'https://via.placeholder.com/200x80/f0f0f0/999?text=Partenaire+2', url: '#' },
    { name: 'Partenaire 3', image: 'https://via.placeholder.com/200x80/f0f0f0/999?text=Partenaire+3', url: '#' },
    { name: 'Partenaire 4', image: 'https://via.placeholder.com/200x80/f0f0f0/999?text=Partenaire+4', url: '#' },
    { name: 'Partenaire 5', image: 'https://via.placeholder.com/200x80/f0f0f0/999?text=Partenaire+5', url: '#' },
  ],
  backgroundColor: '#fff',
  padding: '40px 20px',
  grayscale: true,
  logoHeight: '50px',
};

export const PartnerLogos: React.FC<Partial<PartnerLogosProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {p.title && <h3 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 500, color: '#999', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 2 }}>{p.title}</h3>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {p.logos.map((logo, i) => (
            <a key={i} href={logo.url} style={{ display: 'block' }}>
              <img src={logo.image} alt={logo.name} style={{ height: p.logoHeight, objectFit: 'contain', filter: p.grayscale ? 'grayscale(100%)' : 'none', opacity: p.grayscale ? 0.6 : 1, transition: 'filter 0.3s, opacity 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { if (p.grayscale) { e.currentTarget.style.filter = 'grayscale(100%)'; e.currentTarget.style.opacity = '0.6'; }}} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export const partnerLogosConfig = {
  label: 'Logos Partenaires',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
    grayscale: { type: 'radio' as const, label: 'Niveaux de gris', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    logoHeight: { type: 'text' as const, label: 'Hauteur logos' },
  },
  defaultProps: defaults,
  render: (props: PartnerLogosProps) => <PartnerLogos {...props} />,
};
