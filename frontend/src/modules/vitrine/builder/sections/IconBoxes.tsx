import React from 'react';

export interface IconBoxesProps {
  title: string;
  subtitle: string;
  items: { icon: string; title: string; description: string }[];
  columns: number;
  iconSize: string;
  accentColor: string;
  backgroundColor: string;
  padding: string;
}

const defaults: IconBoxesProps = {
  title: 'Nos services',
  subtitle: 'Un accompagnement complet pour tous vos projets',
  items: [
    { icon: '🏠', title: 'Vente immobilière', description: 'Estimation, mise en valeur et commercialisation de votre bien' },
    { icon: '🔑', title: 'Location', description: 'Recherche de locataires et gestion locative complète' },
    { icon: '📊', title: 'Estimation gratuite', description: 'Analyse du marché et estimation précise de votre bien' },
    { icon: '📋', title: 'Conseil juridique', description: 'Accompagnement dans toutes vos démarches administratives' },
    { icon: '🏗️', title: 'Neuf & VEFA', description: 'Accès aux meilleurs programmes neufs de la région' },
    { icon: '💼', title: 'Investissement', description: 'Conseil en investissement locatif et défiscalisation' },
  ],
  columns: 3,
  iconSize: '48px',
  accentColor: '#1E40AF',
  backgroundColor: '#f8f9fa',
  padding: '60px 20px',
};

export const IconBoxes: React.FC<Partial<IconBoxesProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{p.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: 24 }}>
          {p.items.map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}>
              <div style={{ fontSize: p.iconSize, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>{item.title}</h3>
              <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const iconBoxesConfig = {
  label: 'Boîtes Icônes',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    columns: { type: 'number' as const, label: 'Colonnes', min: 1, max: 6 },
    iconSize: { type: 'text' as const, label: 'Taille icônes' },
    accentColor: { type: 'text' as const, label: 'Couleur accent' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: IconBoxesProps) => <IconBoxes {...props} />,
};
