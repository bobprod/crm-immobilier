import React from 'react';

export interface TextBlockProps {
  content: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: string;
  color: string;
  maxWidth: string;
  padding: string;
  backgroundColor: string;
}

const defaults: TextBlockProps = {
  content: '<h2>À propos de notre agence</h2><p>Depuis plus de 20 ans, nous accompagnons nos clients dans leurs projets immobiliers avec passion et expertise. Notre connaissance approfondie du marché local nous permet de vous offrir un service personnalisé et de qualité.</p>',
  alignment: 'center',
  fontSize: '16px',
  color: '#333',
  maxWidth: '800px',
  padding: '60px 20px',
  backgroundColor: 'transparent',
};

export const TextBlock: React.FC<Partial<TextBlockProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div
        style={{ maxWidth: p.maxWidth, margin: '0 auto', textAlign: p.alignment, fontSize: p.fontSize, color: p.color, lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: p.content }}
      />
    </div>
  );
};

export const textBlockConfig = {
  label: 'Bloc Texte',
  fields: {
    content: { type: 'textarea' as const, label: 'Contenu (HTML)' },
    alignment: { type: 'select' as const, label: 'Alignement', options: [{ label: 'Gauche', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Droite', value: 'right' }] },
    fontSize: { type: 'text' as const, label: 'Taille police' },
    color: { type: 'text' as const, label: 'Couleur texte' },
    maxWidth: { type: 'text' as const, label: 'Largeur max' },
    padding: { type: 'text' as const, label: 'Padding' },
    backgroundColor: { type: 'text' as const, label: 'Fond' },
  },
  defaultProps: defaults,
  render: (props: TextBlockProps) => <TextBlock {...props} />,
};
