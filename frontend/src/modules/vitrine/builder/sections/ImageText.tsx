import React from 'react';

export interface ImageTextProps {
  title: string;
  text: string;
  image: string;
  imagePosition: 'left' | 'right';
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  accentColor: string;
  padding: string;
  imageRatio: string;
}

const defaults: ImageTextProps = {
  title: 'Pourquoi nous choisir ?',
  text: 'Avec plus de 15 ans d\'expérience dans l\'immobilier local, notre agence vous offre un accompagnement personnalisé à chaque étape de votre projet. Notre connaissance approfondie du marché et notre réseau nous permettent de trouver les meilleures opportunités pour vous.',
  image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  imagePosition: 'right',
  buttonText: 'En savoir plus',
  buttonUrl: '/contact',
  backgroundColor: '#fff',
  accentColor: '#1E40AF',
  padding: '60px 20px',
  imageRatio: '4/3',
};

export const ImageText: React.FC<Partial<ImageTextProps>> = (props) => {
  const p = { ...defaults, ...props };

  const textCol = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>{p.title}</h2>
      <p style={{ color: '#555', lineHeight: 1.8, marginBottom: 24, fontSize: '1rem' }}>{p.text}</p>
      {p.buttonText && (
        <a href={p.buttonUrl} style={{ display: 'inline-block', padding: '12px 28px', background: p.accentColor, color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14, alignSelf: 'flex-start' }}>
          {p.buttonText}
        </a>
      )}
    </div>
  );

  const imageCol = (
    <div style={{ aspectRatio: p.imageRatio, borderRadius: 12, overflow: 'hidden' }}>
      <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        {p.imagePosition === 'left' ? <>{imageCol}{textCol}</> : <>{textCol}{imageCol}</>}
      </div>
    </div>
  );
};

export const imageTextConfig = {
  label: 'Image + Texte',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    text: { type: 'textarea' as const, label: 'Texte' },
    image: { type: 'text' as const, label: 'URL image' },
    imagePosition: { type: 'select' as const, label: 'Position image', options: [{ label: 'Gauche', value: 'left' }, { label: 'Droite', value: 'right' }] },
    buttonText: { type: 'text' as const, label: 'Texte bouton' },
    buttonUrl: { type: 'text' as const, label: 'Lien bouton' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    accentColor: { type: 'text' as const, label: 'Couleur accent' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: ImageTextProps) => <ImageText {...props} />,
};
