import React from 'react';

export interface StatsCounterProps {
  stats: { value: string; label: string; suffix: string }[];
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  padding: string;
  layout: 'row' | 'grid';
}

const defaults: StatsCounterProps = {
  stats: [
    { value: '500', label: 'Biens vendus', suffix: '+' },
    { value: '15', label: 'Années d\'expérience', suffix: 'ans' },
    { value: '98', label: 'Clients satisfaits', suffix: '%' },
    { value: '12', label: 'Agents experts', suffix: '' },
  ],
  backgroundColor: '#1E40AF',
  textColor: '#fff',
  accentColor: '#93C5FD',
  padding: '50px 20px',
  layout: 'row',
};

export const StatsCounter: React.FC<Partial<StatsCounterProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 32 }}>
        {p.stats.map((stat, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: 150 }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: p.textColor, lineHeight: 1 }}>
              {stat.value}<span style={{ fontSize: '1.5rem', color: p.accentColor }}>{stat.suffix}</span>
            </div>
            <p style={{ color: p.accentColor, marginTop: 8, fontSize: 14, fontWeight: 500 }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const statsCounterConfig = {
  label: 'Compteur Stats',
  fields: {
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    textColor: { type: 'text' as const, label: 'Couleur texte' },
    accentColor: { type: 'text' as const, label: 'Couleur accent' },
    padding: { type: 'text' as const, label: 'Padding' },
  },
  defaultProps: defaults,
  render: (props: StatsCounterProps) => <StatsCounter {...props} />,
};
