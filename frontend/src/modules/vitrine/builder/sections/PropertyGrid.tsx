import React from 'react';

export interface PropertyGridProps {
  title: string;
  subtitle: string;
  columns: number;
  limit: number;
  showPrice: boolean;
  showBadge: boolean;
  apiSlug: string;
  backgroundColor: string;
  padding: string;
  transactionFilter: string;
}

const defaults: PropertyGridProps = {
  title: 'Nos biens à la vente',
  subtitle: 'Découvrez notre sélection de biens immobiliers',
  columns: 3,
  limit: 6,
  showPrice: true,
  showBadge: true,
  apiSlug: '',
  backgroundColor: '#f8f9fa',
  padding: '60px 20px',
  transactionFilter: '',
};

const fallbackProperties = [
  { id: '1', title: 'Appartement T3 Centre-Ville', price: 285000, type: 'Appartement', area: 75, bedrooms: 3, images: null, category: 'sale' },
  { id: '2', title: 'Maison avec Jardin', price: 450000, type: 'Maison', area: 140, bedrooms: 5, images: null, category: 'sale' },
  { id: '3', title: 'Studio Rénové', price: 125000, type: 'Studio', area: 28, bedrooms: 1, images: null, category: 'sale' },
];

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
  : 'http://localhost:3001/api';

export const PropertyGrid: React.FC<Partial<PropertyGridProps>> = (props) => {
  const p = { ...defaults, ...props };
  const [items, setItems] = React.useState<any[]>(fallbackProperties.slice(0, p.limit));
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!p.apiSlug || loaded) return;
    const params = new URLSearchParams({ limit: String(p.limit) });
    if (p.transactionFilter) params.set('category', p.transactionFilter);
    fetch(`${API_BASE}/vitrine/public/slug/${p.apiSlug}/properties?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data?.length) setItems(data.data.slice(0, p.limit));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [p.apiSlug, p.limit, p.transactionFilter, loaded]);

  const getImage = (item: any) => {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600';
  };

  const getLabel = (cat: string) => cat === 'sale' ? 'Vente' : cat === 'rent' ? 'Location' : cat;

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{p.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: 24 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s' }}>
              <div style={{ position: 'relative', height: 200, backgroundImage: `url(${getImage(item)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {p.showBadge && (
                  <span style={{ position: 'absolute', top: 12, left: 12, background: '#1E40AF', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{getLabel(item.category)}</span>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
                <div style={{ display: 'flex', gap: 12, color: '#666', fontSize: 13, marginBottom: 8 }}>
                  {item.area && <span>{item.area} m²</span>}
                  {item.bedrooms && <span>{item.bedrooms} ch.</span>}
                  <span>{item.type}</span>
                </div>
                {p.showPrice && (
                  <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E40AF' }}>{Number(item.price).toLocaleString('fr-FR')} €</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const propertyGridConfig = {
  label: 'Grille Biens',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    columns: { type: 'number' as const, label: 'Colonnes', min: 1, max: 4 },
    limit: { type: 'number' as const, label: 'Nombre de biens', min: 1, max: 12 },
    showPrice: { type: 'radio' as const, label: 'Afficher prix', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    showBadge: { type: 'radio' as const, label: 'Afficher badge', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    transactionFilter: { type: 'select' as const, label: 'Filtre type', options: [{ label: 'Tous', value: '' }, { label: 'Vente', value: 'sale' }, { label: 'Location', value: 'rent' }] },
    apiSlug: { type: 'text' as const, label: 'Slug agence (auto)' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: PropertyGridProps) => <PropertyGrid {...props} />,
};
