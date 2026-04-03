import React from 'react';

export interface PropertySearchProps {
  title: string;
  placeholder: string;
  showFilters: boolean;
  filters: ('type' | 'transaction' | 'priceRange' | 'rooms' | 'city')[];
  backgroundColor: string;
  accentColor: string;
  padding: string;
  layout: 'horizontal' | 'vertical';
}

const defaults: PropertySearchProps = {
  title: 'Rechercher un bien',
  placeholder: 'Ville, quartier, code postal...',
  showFilters: true,
  filters: ['type', 'transaction', 'priceRange', 'rooms', 'city'],
  backgroundColor: '#f0f4f8',
  accentColor: '#1E40AF',
  padding: '40px 20px',
  layout: 'horizontal',
};

const filterOptions: Record<string, { label: string; options: string[] }> = {
  type: { label: 'Type de bien', options: ['Tous', 'Appartement', 'Maison', 'Villa', 'Terrain', 'Commerce'] },
  transaction: { label: 'Transaction', options: ['Toutes', 'Vente', 'Location'] },
  priceRange: { label: 'Budget', options: ['Tous', '< 100 000 €', '100 000 - 300 000 €', '300 000 - 500 000 €', '> 500 000 €'] },
  rooms: { label: 'Pièces', options: ['Toutes', '1', '2', '3', '4', '5+'] },
  city: { label: 'Ville', options: ['Toutes', 'Paris', 'Lyon', 'Marseille', 'Bordeaux'] },
};

export const PropertySearch: React.FC<Partial<PropertySearchProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {p.title && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>{p.title}</h2>}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: p.showFilters ? 16 : 0, flexDirection: p.layout === 'vertical' ? 'column' : 'row' }}>
            <input type="text" placeholder={p.placeholder} style={{ flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
            <button style={{ padding: '12px 32px', background: p.accentColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              🔍 Rechercher
            </button>
          </div>
          {p.showFilters && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {p.filters.map((f) => (
                <select key={f} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555', background: '#fff' }}>
                  {filterOptions[f]?.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const propertySearchConfig = {
  label: 'Recherche Biens',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    placeholder: { type: 'text' as const, label: 'Placeholder' },
    showFilters: { type: 'radio' as const, label: 'Afficher filtres', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    accentColor: { type: 'text' as const, label: 'Couleur accent' },
    padding: { type: 'text' as const, label: 'Padding' },
    layout: { type: 'select' as const, label: 'Disposition', options: [{ label: 'Horizontal', value: 'horizontal' }, { label: 'Vertical', value: 'vertical' }] },
  },
  defaultProps: defaults,
  render: (props: PropertySearchProps) => <PropertySearch {...props} />,
};
