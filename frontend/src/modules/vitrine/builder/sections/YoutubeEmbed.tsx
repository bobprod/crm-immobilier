import React from 'react';

export interface YoutubeEmbedProps {
  title: string;
  videoId: string;
  aspectRatio: string;
  maxWidth: string;
  borderRadius: number;
  padding: string;
  backgroundColor: string;
  showTitle: boolean;
}

const defaults: YoutubeEmbedProps = {
  title: 'Découvrez notre agence en vidéo',
  videoId: 'dQw4w9WgXcQ',
  aspectRatio: '16/9',
  maxWidth: '800px',
  borderRadius: 12,
  padding: '60px 20px',
  backgroundColor: '#fff',
  showTitle: true,
};

export const YoutubeEmbed: React.FC<Partial<YoutubeEmbedProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: p.maxWidth, margin: '0 auto' }}>
        {p.showTitle && p.title && (
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 32 }}>{p.title}</h2>
        )}
        <div style={{ aspectRatio: p.aspectRatio, borderRadius: p.borderRadius, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${p.videoId}`}
            width="100%" height="100%"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={p.title}
          />
        </div>
      </div>
    </div>
  );
};

export const youtubeEmbedConfig = {
  label: 'Vidéo YouTube',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    videoId: { type: 'text' as const, label: 'ID vidéo YouTube' },
    aspectRatio: { type: 'text' as const, label: 'Ratio (ex: 16/9)' },
    maxWidth: { type: 'text' as const, label: 'Largeur max' },
    borderRadius: { type: 'number' as const, label: 'Bord arrondi (px)' },
    showTitle: { type: 'radio' as const, label: 'Afficher titre', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: YoutubeEmbedProps) => <YoutubeEmbed {...props} />,
};
