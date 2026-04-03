import React from 'react';

export interface PropertyCarouselProps {
  title: string;
  subtitle: string;
  autoScroll: boolean;
  scrollInterval: number;
  cardWidth: string;
  backgroundColor: string;
  padding: string;
  apiSlug: string;
  limit: number;
}

const defaults: PropertyCarouselProps = {
  title: 'Nouveautés',
  subtitle: 'Les derniers biens ajoutés',
  autoScroll: true,
  scrollInterval: 4000,
  cardWidth: '320px',
  backgroundColor: '#fff',
  padding: '60px 20px',
  apiSlug: '',
  limit: 8,
};

const fallbackItems = [
  { id: '1', title: 'Appartement T2 Lumineux', price: 195000, area: 48, images: null },
  { id: '2', title: 'Maison de Charme', price: 380000, area: 120, images: null },
  { id: '3', title: 'Penthouse Vue Mer', price: 650000, area: 95, images: null },
];

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
  : 'http://localhost:3001/api';

export const PropertyCarousel: React.FC<Partial<PropertyCarouselProps>> = (props) => {
  const p = { ...defaults, ...props };
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [items, setItems] = React.useState<any[]>(fallbackItems);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!p.apiSlug || loaded) return;
    fetch(`${API_BASE}/vitrine/public/slug/${p.apiSlug}/properties?limit=${p.limit}&sort=date_desc`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data?.length) setItems(data.data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [p.apiSlug, p.limit, loaded]);

  React.useEffect(() => {
    if (!p.autoScroll || !scrollRef.current) return;
    const el = scrollRef.current;
    const timer = setInterval(() => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }, p.scrollInterval);
    return () => clearInterval(timer);
  }, [p.autoScroll, p.scrollInterval]);

  const getImage = (item: any) => {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500';
  };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666' }}>{p.subtitle}</p>
        </div>
        <div ref={scrollRef} style={{ display: 'flex', gap: 20, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, scrollbarWidth: 'thin' }}>
          {items.map((item, idx) => (
            <div key={item.id || idx} style={{ minWidth: p.cardWidth, scrollSnapAlign: 'start', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', flexShrink: 0 }}>
              <div style={{ height: 180, backgroundImage: `url(${getImage(item)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>{item.area || item.surface || '–'} m²</p>
                <p style={{ fontWeight: 700, color: '#1E40AF', fontSize: '1.1rem' }}>{(item.price || 0).toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const propertyCarouselConfig = {
  label: 'Carrousel Biens',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    apiSlug: { type: 'text' as const, label: 'Slug agence (API)' },
    limit: { type: 'number' as const, label: 'Nombre de biens' },
    autoScroll: { type: 'radio' as const, label: 'Défilement auto', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    scrollInterval: { type: 'number' as const, label: 'Intervalle (ms)' },
    cardWidth: { type: 'text' as const, label: 'Largeur carte' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: PropertyCarouselProps) => <PropertyCarousel {...props} />,
};
