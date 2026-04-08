import React from 'react';

export interface FaqAccordionProps {
  title: string;
  subtitle: string;
  items: { question: string; answer: string }[];
  backgroundColor: string;
  accentColor: string;
  padding: string;
  maxWidth: string;
}

const defaults: FaqAccordionProps = {
  title: 'Questions fréquentes',
  subtitle: 'Trouvez rapidement les réponses à vos questions',
  items: [
    { question: 'Comment estimer la valeur de mon bien ?', answer: 'Nous proposons une estimation gratuite basée sur une analyse comparative du marché, une visite physique du bien et notre connaissance approfondie du secteur.' },
    { question: 'Quels sont vos honoraires ?', answer: 'Nos honoraires sont transparents et compétitifs. Ils varient en fonction du type de transaction et de la valeur du bien. Contactez-nous pour un devis personnalisé.' },
    { question: 'Combien de temps faut-il pour vendre un bien ?', answer: 'Le délai moyen de vente est de 3 à 6 mois, mais cela dépend du marché local, du prix et de l\'état du bien. Nous mettons tout en œuvre pour optimiser ce délai.' },
    { question: 'Proposez-vous la gestion locative ?', answer: 'Oui, nous offrons un service complet de gestion locative : recherche de locataires, rédaction des baux, états des lieux, encaissement des loyers et gestion des travaux.' },
  ],
  backgroundColor: '#fff',
  accentColor: '#1E40AF',
  padding: '60px 20px',
  maxWidth: '800px',
};

const AccordionItem: React.FC<{ item: { question: string; answer: string }; accentColor: string }> = ({ item, accentColor }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderBottom: '1px solid #eee' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>{item.question}</span>
        <span style={{ fontSize: 20, color: accentColor, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>▼</span>
      </button>
      <div style={{ maxHeight: open ? 500 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <p style={{ padding: '0 0 18px', color: '#666', lineHeight: 1.7, fontSize: 14 }}>{item.answer}</p>
      </div>
    </div>
  );
};

export const FaqAccordion: React.FC<Partial<FaqAccordionProps>> = (props) => {
  const p = { ...defaults, ...props };

  return (
    <div style={{ backgroundColor: p.backgroundColor, padding: p.padding }}>
      <div style={{ maxWidth: p.maxWidth, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{p.subtitle}</p>
        </div>
        {p.items.map((item, i) => (
          <AccordionItem key={i} item={item} accentColor={p.accentColor} />
        ))}
      </div>
    </div>
  );
};

export const faqAccordionConfig = {
  label: 'FAQ Accordéon',
  fields: {
    title: { type: 'text' as const, label: 'Titre' },
    subtitle: { type: 'text' as const, label: 'Sous-titre' },
    backgroundColor: { type: 'text' as const, label: 'Couleur fond' },
    accentColor: { type: 'text' as const, label: 'Couleur accent' },
    padding: { type: 'text' as const, label: 'Padding' },
    maxWidth: { type: 'text' as const, label: 'Largeur max' },
  },
  defaultProps: defaults,
  render: (props: FaqAccordionProps) => <FaqAccordion {...props} />,
};
