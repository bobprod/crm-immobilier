import React from 'react';

export interface HeroSliderProps {
  slides: { image: string; title: string; subtitle: string }[];
  height: string;
  overlay: boolean;
  overlayColor: string;
  autoPlay: boolean;
  interval: number;
}

const defaults: HeroSliderProps = {
  slides: [
    { image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600', title: 'Trouvez votre bien idéal', subtitle: 'Des propriétés d\'exception vous attendent' },
    { image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600', title: 'Accompagnement sur mesure', subtitle: 'Notre équipe est à votre écoute' },
  ],
  height: '600px',
  overlay: true,
  overlayColor: 'rgba(0,0,0,0.4)',
  autoPlay: true,
  interval: 5000,
};

export const HeroSlider: React.FC<Partial<HeroSliderProps>> = (props) => {
  const p = { ...defaults, ...props };
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!p.autoPlay || p.slides.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % p.slides.length), p.interval);
    return () => clearInterval(timer);
  }, [p.autoPlay, p.interval, p.slides.length]);

  const slide = p.slides[current] || p.slides[0];

  return (
    <div style={{ position: 'relative', height: p.height, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${slide?.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'background-image 0.8s ease',
      }} />
      {p.overlay && <div style={{ position: 'absolute', inset: 0, backgroundColor: p.overlayColor }} />}
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: 16, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{slide?.title}</h1>
        <p style={{ fontSize: '1.25rem', maxWidth: 600, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{slide?.subtitle}</p>
      </div>
      {p.slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
          {p.slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', background: i === current ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  );
};

export const heroSliderConfig = {
  label: 'Hero Slider',
  fields: {
    slides: { type: 'custom' as const, label: 'Slides', render: () => <p style={{ fontSize: 12, color: '#666' }}>Éditez les slides via le JSON</p> },
    height: { type: 'text' as const, label: 'Hauteur' },
    overlay: { type: 'radio' as const, label: 'Overlay', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    overlayColor: { type: 'text' as const, label: 'Couleur overlay' },
    autoPlay: { type: 'radio' as const, label: 'Lecture auto', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    interval: { type: 'number' as const, label: 'Intervalle (ms)' },
  },
  defaultProps: defaults,
  render: (props: HeroSliderProps) => <HeroSlider {...props} />,
};
