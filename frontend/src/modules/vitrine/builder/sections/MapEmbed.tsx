import React from 'react';

export interface MapEmbedProps {
  title: string;
  address: string;
  mapUrl: string;
  height: string;
  borderRadius: number;
  padding: string;
  backgroundColor: string;
  showTitle: boolean;
}

const defaults: MapEmbedProps = {
  title: 'Nous trouver',
  address: '12 Rue de la Paix, 75002 Paris',
  mapUrl: '',
  height: '400px',
  borderRadius: 12,
  padding: '60px 20px',
  backgroundColor: '#fff',
  showTitle: true,
};

export const MapEmbed: React.FC<Partial<MapEmbedProps>> = (props) => {
  const p = { ...defaults, ...props };
  const encodedAddress = encodeURIComponent(p.address);
  const src = p.mapUrl || `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {p.showTitle && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
            <p style={{ color: '#666' }}>📍 {p.address}</p>
          </div>
        )}
        <div style={{ borderRadius: p.borderRadius, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <iframe
            src={src}
            width="100%" height={p.height}
            style={{ border: 0 }}
            allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localisation de l'agence"
          />
        </div>
      </div>
    </div>
  );
};

export const mapEmbedConfig = {
  label: 'Carte Google Maps',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    address: { type: 'text' as const, label: 'Adresse' },
    mapUrl: { type: 'text' as const, label: 'URL embed (optionnel)' },
    height: { type: 'text' as const, label: 'Hauteur' },
    borderRadius: { type: 'number' as const, label: 'Bord arrondi (px)' },
    showTitle: { type: 'radio' as const, label: 'Afficher titre', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: MapEmbedProps) => <MapEmbed {...props} />,
};
