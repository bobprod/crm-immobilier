import React from 'react';

export interface HeroVideoProps {
  videoUrl: string;
  posterImage: string;
  title: string;
  subtitle: string;
  height: string;
  overlay: boolean;
  overlayColor: string;
  muted: boolean;
  loop: boolean;
}

const defaults: HeroVideoProps = {
  videoUrl: '',
  posterImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600',
  title: 'Bienvenue dans votre agence',
  subtitle: 'Découvrez nos services immobiliers',
  height: '600px',
  overlay: true,
  overlayColor: 'rgba(0,0,0,0.45)',
  muted: true,
  loop: true,
};

export const HeroVideo: React.FC<Partial<HeroVideoProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ position: 'relative', height: p.height, overflow: 'hidden', background: '#111' }}>
      {p.videoUrl ? (
        <video autoPlay muted={p.muted} loop={p.loop} playsInline poster={p.posterImage}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
          <source src={p.videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${p.posterImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      {p.overlay && <div style={{ position: 'absolute', inset: 0, backgroundColor: p.overlayColor }} />}
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: 16 }}>{p.title}</h1>
        <p style={{ fontSize: '1.25rem', maxWidth: 600 }}>{p.subtitle}</p>
      </div>
    </div>
  );
};

export const heroVideoConfig = {
  label: 'Hero Vidéo',
  fields: {
    videoUrl: { type: 'text' as const, label: 'URL vidéo (MP4)' },
    posterImage: { type: 'text' as const, label: 'Image poster' },
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'textarea' as const, label: 'Sous-titre' },
    height: { type: 'text' as const, label: 'Hauteur' },
    overlay: { type: 'radio' as const, label: 'Overlay', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    overlayColor: { type: 'text' as const, label: 'Couleur overlay' },
  },
  defaultProps: defaults,
  render: (props: HeroVideoProps) => <HeroVideo {...props} />,
};
