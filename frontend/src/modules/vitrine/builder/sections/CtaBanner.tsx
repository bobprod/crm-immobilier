import React from 'react';

export interface CtaBannerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  backgroundImage: string;
  overlay: boolean;
  overlayColor: string;
  textColor: string;
  buttonColor: string;
  height: string;
}

const defaults: CtaBannerProps = {
  title: 'Prêt à concrétiser votre projet ?',
  subtitle: 'Contactez-nous dès aujourd\'hui pour une estimation gratuite',
  buttonText: 'Demander une estimation',
  buttonUrl: '/contact',
  backgroundImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600',
  overlay: true,
  overlayColor: 'rgba(30,64,175,0.85)',
  textColor: '#fff',
  buttonColor: '#F59E0B',
  height: '350px',
};

export const CtaBanner: React.FC<Partial<CtaBannerProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ position: 'relative', height: p.height, backgroundImage: `url(${p.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {p.overlay && <div style={{ position: 'absolute', inset: 0, backgroundColor: p.overlayColor }} />}
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, color: p.textColor, marginBottom: 12 }}>{p.title}</h2>
        <p style={{ fontSize: '1.1rem', color: p.textColor, opacity: 0.9, marginBottom: 24, maxWidth: 600 }}>{p.subtitle}</p>
        <a href={p.buttonUrl} style={{ display: 'inline-block', padding: '14px 36px', background: p.buttonColor, color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {p.buttonText}
        </a>
      </div>
    </div>
  );
};

export const ctaBannerConfig = {
  label: 'Bannière CTA',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'textarea' as const, label: 'Sous-titre' },
    buttonText: { type: 'text' as const, label: 'Texte bouton' },
    buttonUrl: { type: 'text' as const, label: 'Lien bouton' },
    backgroundImage: { type: 'text' as const, label: 'Image fond' },
    overlay: { type: 'radio' as const, label: 'Overlay', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    overlayColor: { type: 'text' as const, label: 'Couleur overlay' },
    buttonColor: { type: 'text' as const, label: 'Couleur bouton' },
    height: { type: 'text' as const, label: 'Hauteur' },
  },
  defaultProps: defaults,
  render: (props: CtaBannerProps) => <CtaBanner {...props} />,
};
