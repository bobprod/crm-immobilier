import React from 'react';

export interface TeamGridProps {
  title: string;
  subtitle: string;
  columns: number;
  members: { name: string; role: string; photo: string; phone: string; email: string }[];
  showContact: boolean;
  cardStyle: 'card' | 'minimal' | 'overlay';
  backgroundColor: string;
  padding: string;
  apiSlug: string;
}

const fallbackMembers = [
  { name: 'Marie Dupont', role: 'Directrice', photo: '', phone: '06 12 34 56 78', email: 'marie@agence.fr' },
  { name: 'Pierre Martin', role: 'Agent Senior', photo: '', phone: '06 23 45 67 89', email: 'pierre@agence.fr' },
  { name: 'Sophie Bernard', role: 'Négociatrice', photo: '', phone: '06 34 56 78 90', email: 'sophie@agence.fr' },
];

const defaults: TeamGridProps = {
  title: 'Notre équipe',
  subtitle: 'Des professionnels à votre service',
  columns: 3,
  members: fallbackMembers,
  showContact: true,
  cardStyle: 'card',
  backgroundColor: '#f8f9fa',
  padding: '60px 20px',
  apiSlug: '',
};

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
  : 'http://localhost:3001/api';

export const TeamGrid: React.FC<Partial<TeamGridProps>> = (props) => {
  const p = { ...defaults, ...props };
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!p.apiSlug || loaded) return;
    fetch(`${API_BASE}/vitrine/public/slug/${p.apiSlug}/agents`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data.filter((a: any) => a.isActive !== false));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [p.apiSlug, loaded]);

  const displayMembers = agents.length > 0
    ? agents.map((a) => ({
        name: a.displayName || 'Agent',
        role: a.role || a.speciality || 'Agent',
        photo: a.photo || '',
        phone: a.phone || '',
        email: '',
      }))
    : p.members;

  const getPhoto = (photo: string) => {
    if (photo && photo.startsWith('http')) return photo;
    if (photo && photo.startsWith('/')) return `${API_BASE.replace('/api', '')}${photo}`;
    return '';
  };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{p.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: 24 }}>
          {displayMembers.map((m, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{
                height: 280,
                backgroundImage: getPhoto(m.photo) ? `url(${getPhoto(m.photo)})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                backgroundColor: getPhoto(m.photo) ? 'transparent' : '#e5e7eb',
                display: getPhoto(m.photo) ? 'block' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: getPhoto(m.photo) ? 'inherit' : '64px',
              }}>
                {!getPhoto(m.photo) && '👤'}
              </div>
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{m.name}</h3>
                <p style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>{m.role}</p>
                {p.showContact && (m.phone || m.email) && (
                  <div style={{ fontSize: 13, color: '#555' }}>
                    {m.phone && <p>📞 {m.phone}</p>}
                    {m.email && <p>✉️ {m.email}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const teamGridConfig = {
  label: 'Grille Équipe',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    columns: { type: 'number' as const, label: 'Colonnes', min: 1, max: 4 },
    showContact: { type: 'radio' as const, label: 'Afficher contact', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    apiSlug: { type: 'text' as const, label: 'Slug agence (auto)' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: TeamGridProps) => <TeamGrid {...props} />,
};
