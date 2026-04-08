import React from 'react';

export interface NeighborhoodsProps {
  title: string;
  subtitle: string;
  neighborhoods: { name: string; image: string; propertyCount: number; description: string }[];
  columns: number;
  backgroundColor: string;
  padding: string;
}

const defaults: NeighborhoodsProps = {
  title: 'Nos quartiers',
  subtitle: 'Découvrez les meilleurs secteurs de la ville',
  neighborhoods: [
    { name: 'Centre-Ville', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600', propertyCount: 24, description: 'Commerces, restaurants et vie culturelle' },
    { name: 'Bord de Mer', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', propertyCount: 18, description: 'Vue mer et plages à proximité' },
    { name: 'Quartier Résidentiel', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600', propertyCount: 32, description: 'Calme, écoles et espaces verts' },
    { name: 'Collines', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', propertyCount: 15, description: 'Vues panoramiques et nature' },
  ],
  columns: 4,
  backgroundColor: '#fff',
  padding: '60px 20px',
};

export const Neighborhoods: React.FC<Partial<NeighborhoodsProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{p.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: 20 }}>
          {p.neighborhoods.map((n, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', aspectRatio: '3/4' }}>
              <img src={n.image} alt={n.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.75))' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, color: '#fff' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{n.name}</h3>
                <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>{n.description}</p>
                <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 12 }}>{n.propertyCount} biens</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const neighborhoodsConfig = {
  label: 'Quartiers',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    columns: { type: 'number' as const, label: 'Colonnes', min: 2, max: 6 },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: NeighborhoodsProps) => <Neighborhoods {...props} />,
};
