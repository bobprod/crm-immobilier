import React from 'react';

export interface SeparatorProps {
  style: 'line' | 'dashed' | 'dotted' | 'gradient' | 'wave';
  color: string;
  width: string;
  thickness: number;
  margin: string;
}

const defaults: SeparatorProps = {
  style: 'line',
  color: '#e5e7eb',
  width: '100px',
  thickness: 2,
  margin: '32px auto',
};

export const Separator: React.FC<Partial<SeparatorProps>> = (props) => {
  const p = { ...defaults, ...props };

  const borderStyle = p.style === 'dashed' ? 'dashed' : p.style === 'dotted' ? 'dotted' : 'solid';

  if (p.style === 'gradient') {
    return (
      <div style={{ margin: p.margin, height: p.thickness, width: p.width, background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }} />
    );
  }

  if (p.style === 'wave') {
    return (
      <div style={{ margin: p.margin, textAlign: 'center' }}>
        <svg width={p.width} height="20" viewBox="0 0 200 20">
          <path d="M0 10 Q25 0 50 10 Q75 20 100 10 Q125 0 150 10 Q175 20 200 10" fill="none" stroke={p.color} strokeWidth={p.thickness} />
        </svg>
      </div>
    );
  }

  return (
    <hr style={{ margin: p.margin, border: 'none', borderTop: `${p.thickness}px ${borderStyle} ${p.color}`, width: p.width }} />
  );
};

export const separatorConfig = {
  label: 'Séparateur',
  fields: {
    style: { type: 'select' as const, label: 'Style', options: [{ label: 'Ligne', value: 'line' }, { label: 'Tirets', value: 'dashed' }, { label: 'Points', value: 'dotted' }, { label: 'Dégradé', value: 'gradient' }, { label: 'Vague', value: 'wave' }] },
    color: { type: 'text' as const, label: 'Couleur' },
    width: { type: 'text' as const, label: 'Largeur' },
    thickness: { type: 'number' as const, label: 'Épaisseur (px)' },
    margin: { type: 'text' as const, label: 'Marge' },
  },
  defaultProps: defaults,
  render: (props: SeparatorProps) => <Separator {...props} />,
};
