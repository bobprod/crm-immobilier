import React from 'react';

export interface ColumnsProps {
  columns: number;
  gap: string;
  padding: string;
  backgroundColor: string;
  maxWidth: string;
  items: { content: string; backgroundColor: string }[];
}

const defaults: ColumnsProps = {
  columns: 2,
  gap: '32px',
  padding: '60px 20px',
  backgroundColor: '#fff',
  maxWidth: '1200px',
  items: [
    { content: '<h3>Colonne 1</h3><p>Contenu de la première colonne. Utilisez du HTML pour le formatage.</p>', backgroundColor: 'transparent' },
    { content: '<h3>Colonne 2</h3><p>Contenu de la deuxième colonne. Adaptable à vos besoins.</p>', backgroundColor: 'transparent' },
  ],
};

export const Columns: React.FC<Partial<ColumnsProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: p.maxWidth, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: p.gap }}>
        {p.items.map((item, i) => (
          <div key={i} style={{ backgroundColor: item.backgroundColor, padding: 16, lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: item.content }} />
        ))}
      </div>
    </div>
  );
};

export const columnsConfig = {
  label: 'Colonnes',
  fields: {
    columns: { type: 'number' as const, label: 'Nombre de colonnes', min: 1, max: 6 },
    gap: { type: 'text' as const, label: 'Espacement' },
    padding: { type: 'text' as const, label: 'Padding' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    maxWidth: { type: 'text' as const, label: 'Largeur max' },
  },
  defaultProps: defaults,
  render: (props: ColumnsProps) => <Columns {...props} />,
};
