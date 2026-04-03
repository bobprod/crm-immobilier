import React from 'react';

export interface SpacerProps {
  height: string;
  backgroundColor: string;
}

const defaults: SpacerProps = {
  height: '60px',
  backgroundColor: 'transparent',
};

export const Spacer: React.FC<Partial<SpacerProps>> = (props) => {
  const p = { ...defaults, ...props };
  return <div style={{ height: p.height, backgroundColor: p.backgroundColor }} />;
};

export const spacerConfig = {
  label: 'Espacement',
  fields: {
    height: { type: 'text' as const, label: 'Hauteur' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
  },
  defaultProps: defaults,
  render: (props: SpacerProps) => <Spacer {...props} />,
};
