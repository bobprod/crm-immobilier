import React from 'react';

export interface GalleryProps {
  title: string;
  images: { src: string; alt: string }[];
  columns: number;
  gap: number;
  borderRadius: number;
  aspectRatio: string;
  backgroundColor: string;
  padding: string;
}

const defaults: GalleryProps = {
  title: '',
  images: [
    { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', alt: 'Propriété 1' },
    { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', alt: 'Propriété 2' },
    { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', alt: 'Propriété 3' },
    { src: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600', alt: 'Propriété 4' },
    { src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', alt: 'Propriété 5' },
    { src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', alt: 'Propriété 6' },
  ],
  columns: 3,
  gap: 8,
  borderRadius: 8,
  aspectRatio: '4/3',
  backgroundColor: '#fff',
  padding: '60px 20px',
};

export const Gallery: React.FC<Partial<GalleryProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {p.title && (
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 32 }}>{p.title}</h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: p.gap }}>
          {p.images.map((img, i) => (
            <div key={i} style={{ aspectRatio: p.aspectRatio, borderRadius: p.borderRadius, overflow: 'hidden', cursor: 'pointer' }}>
              <img src={img.src} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const galleryConfig = {
  label: 'Galerie',
  fields: {
    title: { type: 'text' as const, label: 'Titre (optionnel)' },
    columns: { type: 'number' as const, label: 'Colonnes', min: 1, max: 6 },
    gap: { type: 'number' as const, label: 'Espacement (px)' },
    borderRadius: { type: 'number' as const, label: 'Bord arrondi (px)' },
    aspectRatio: { type: 'text' as const, label: 'Ratio (ex: 4/3)' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: GalleryProps) => <Gallery {...props} />,
};
