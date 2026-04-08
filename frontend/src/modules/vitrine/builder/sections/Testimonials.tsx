import React from 'react';

export interface TestimonialsProps {
  title: string;
  subtitle: string;
  testimonials: { name: string; text: string; rating: number; photo: string; role: string }[];
  columns: number;
  backgroundColor: string;
  accentColor: string;
  padding: string;
}

const defaults: TestimonialsProps = {
  title: 'Ce que disent nos clients',
  subtitle: 'Découvrez les témoignages de ceux qui nous ont fait confiance',
  testimonials: [
    { name: 'Jean-Marc L.', text: 'Un accompagnement exceptionnel du début à la fin. Notre agent a su trouver la maison parfaite pour notre famille.', rating: 5, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', role: 'Acheteur' },
    { name: 'Claire D.', text: 'Vente réalisée en moins de 2 mois ! Professionnalisme et réactivité sont les maîtres mots de cette agence.', rating: 5, photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', role: 'Vendeuse' },
    { name: 'Thomas R.', text: 'Excellente gestion locative. Je recommande vivement pour la tranquillité d\'esprit que cela apporte.', rating: 4, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', role: 'Propriétaire bailleur' },
  ],
  columns: 3,
  backgroundColor: '#f8f9fa',
  accentColor: '#F59E0B',
  padding: '60px 20px',
};

export const Testimonials: React.FC<Partial<TestimonialsProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{p.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: 24 }}>
          {p.testimonials.map((t, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {Array.from({ length: 5 }).map((_, si) => (
                  <span key={si} style={{ color: si < t.rating ? p.accentColor : '#ddd', fontSize: 18 }}>★</span>
                ))}
              </div>
              <p style={{ color: '#555', lineHeight: 1.7, marginBottom: 16, fontSize: 14, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundImage: `url(${t.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</p>
                  <p style={{ color: '#888', fontSize: 12 }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const testimonialsConfig = {
  label: 'Témoignages',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    columns: { type: 'number' as const, label: 'Colonnes', min: 1, max: 4 },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    accentColor: { type: 'text' as const, label: 'Couleur étoiles' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: TestimonialsProps) => <Testimonials {...props} />,
};
