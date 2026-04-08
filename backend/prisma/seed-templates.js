const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const templates = [
    {
      id: 'tpl_elegance',
      name: 'Elegance',
      slug: 'elegance',
      description: 'Template light, minimaliste et aéré. Parfait pour les agences haut de gamme.',
      category: 'premium',
      isDefault: true,
      isActive: true,
      colors: {
        primary: '#B8860B',
        secondary: '#F5F0E8',
        accent: '#1a1a1a',
        background: '#FFFDF7',
        text: '#2D2D2D',
        muted: '#8C8C8C',
      },
      fonts: { heading: 'Playfair Display', body: 'Inter', accent: 'Cormorant' },
      defaultPages: [
        {
          slug: 'accueil',
          title: 'Accueil',
          isDefault: true,
          puckData: {
            content: [
              {
                type: 'HeroSlider',
                props: {
                  title: 'Bienvenue',
                  subtitle: 'Votre partenaire immobilier',
                  height: '80vh',
                  overlay: 0.3,
                },
              },
              { type: 'PropertyGrid', props: { columns: 3, limit: 6, title: 'Nos biens' } },
              { type: 'TeamGrid', props: { title: 'Notre équipe', columns: 3 } },
              { type: 'ContactForm', props: { title: 'Contactez-nous' } },
            ],
            root: { props: { template: 'elegance' } },
          },
        },
        {
          slug: 'biens',
          title: 'Nos biens',
          puckData: {
            content: [
              { type: 'PropertyGrid', props: { columns: 3, limit: 12, showFilters: true } },
            ],
            root: { props: { template: 'elegance' } },
          },
        },
        {
          slug: 'agents',
          title: 'Notre équipe',
          puckData: {
            content: [{ type: 'TeamGrid', props: { columns: 3, showDetails: true } }],
            root: { props: { template: 'elegance' } },
          },
        },
        {
          slug: 'contact',
          title: 'Contact',
          puckData: {
            content: [
              { type: 'ContactForm', props: { title: 'Contactez-nous', showMap: true } },
              { type: 'MapEmbed', props: { height: 400 } },
            ],
            root: { props: { template: 'elegance' } },
          },
        },
      ],
    },
    {
      id: 'tpl_moderne',
      name: 'Moderne',
      slug: 'moderne',
      description: 'Design bold et géométrique. Idéal pour les agences dynamiques.',
      category: 'general',
      isDefault: false,
      isActive: true,
      colors: {
        primary: '#1E40AF',
        secondary: '#FFFFFF',
        accent: '#3B82F6',
        background: '#F8FAFC',
        text: '#1E293B',
        muted: '#64748B',
      },
      fonts: { heading: 'Montserrat', body: 'Open Sans', accent: 'Poppins' },
      defaultPages: [
        {
          slug: 'accueil',
          title: 'Accueil',
          isDefault: true,
          puckData: {
            content: [
              { type: 'HeroVideo', props: { title: 'Trouvez votre bien idéal', overlay: 0.5 } },
              {
                type: 'StatsCounter',
                props: {
                  items: [
                    { value: 150, label: 'Biens' },
                    { value: 98, label: 'Clients satisfaits' },
                    { value: 15, label: "Ans d'expérience" },
                  ],
                },
              },
              { type: 'PropertyGrid', props: { columns: 4, limit: 8 } },
              { type: 'CtaBanner', props: { title: 'Estimez votre bien gratuitement' } },
            ],
            root: { props: { template: 'moderne' } },
          },
        },
        {
          slug: 'biens',
          title: 'Biens',
          puckData: {
            content: [
              { type: 'PropertySearch', props: {} },
              { type: 'PropertyGrid', props: { columns: 4, limit: 16, showFilters: true } },
            ],
            root: { props: { template: 'moderne' } },
          },
        },
        {
          slug: 'agents',
          title: 'Équipe',
          puckData: {
            content: [{ type: 'TeamGrid', props: { columns: 4 } }],
            root: { props: { template: 'moderne' } },
          },
        },
        {
          slug: 'contact',
          title: 'Contact',
          puckData: {
            content: [
              { type: 'ContactForm', props: {} },
              { type: 'MapEmbed', props: {} },
            ],
            root: { props: { template: 'moderne' } },
          },
        },
      ],
    },
    {
      id: 'tpl_prestige',
      name: 'Prestige',
      slug: 'prestige',
      description: "Style luxe et sombre. Pour les biens d'exception.",
      category: 'premium',
      isDefault: false,
      isActive: true,
      colors: {
        primary: '#C9A84C',
        secondary: '#1A1A1A',
        accent: '#D4AF37',
        background: '#0D0D0D',
        text: '#F5F5F5',
        muted: '#9CA3AF',
      },
      fonts: { heading: 'Cormorant Garamond', body: 'Lato', accent: 'Italiana' },
      defaultPages: [
        {
          slug: 'accueil',
          title: 'Accueil',
          isDefault: true,
          puckData: {
            content: [
              {
                type: 'HeroSlider',
                props: { height: '100vh', overlay: 0.6, title: "L'excellence immobilière" },
              },
              { type: 'PropertyCarousel', props: { limit: 6, autoScroll: true } },
              { type: 'Testimonials', props: { autoRotate: true } },
              { type: 'TeamGrid', props: { columns: 3 } },
              { type: 'ContactForm', props: {} },
            ],
            root: { props: { template: 'prestige' } },
          },
        },
        {
          slug: 'biens',
          title: 'Collection',
          puckData: {
            content: [
              { type: 'PropertyGrid', props: { columns: 2, limit: 12, showFilters: true } },
            ],
            root: { props: { template: 'prestige' } },
          },
        },
        {
          slug: 'agents',
          title: 'Conseillers',
          puckData: {
            content: [{ type: 'TeamGrid', props: { columns: 2, showDetails: true } }],
            root: { props: { template: 'prestige' } },
          },
        },
        {
          slug: 'contact',
          title: 'Contact',
          puckData: {
            content: [
              { type: 'ContactForm', props: {} },
              { type: 'MapEmbed', props: {} },
            ],
            root: { props: { template: 'prestige' } },
          },
        },
      ],
    },
    {
      id: 'tpl_nature',
      name: 'Nature',
      slug: 'nature',
      description: 'Ambiance organique et chaleureuse. Idéal pour le résidentiel.',
      category: 'general',
      isDefault: false,
      isActive: true,
      colors: {
        primary: '#6B7B3A',
        secondary: '#FDF8F0',
        accent: '#8B9556',
        background: '#FEFCF6',
        text: '#3D3D3D',
        muted: '#7C7C6F',
      },
      fonts: { heading: 'DM Serif Display', body: 'Nunito', accent: 'Josefin Sans' },
      defaultPages: [
        {
          slug: 'accueil',
          title: 'Accueil',
          isDefault: true,
          puckData: {
            content: [
              {
                type: 'HeroSlider',
                props: { title: 'Un chez-vous qui vous ressemble', height: '70vh' },
              },
              { type: 'TextBlock', props: { title: 'Notre philosophie', layout: 'image-right' } },
              { type: 'PropertyGrid', props: { columns: 2, limit: 4 } },
              { type: 'Neighborhoods', props: { title: 'Nos quartiers' } },
              { type: 'ContactForm', props: {} },
              { type: 'MapEmbed', props: {} },
            ],
            root: { props: { template: 'nature' } },
          },
        },
        {
          slug: 'biens',
          title: 'Propriétés',
          puckData: {
            content: [
              { type: 'PropertyGrid', props: { columns: 2, limit: 12, showFilters: true } },
            ],
            root: { props: { template: 'nature' } },
          },
        },
        {
          slug: 'agents',
          title: 'Notre équipe',
          puckData: {
            content: [{ type: 'TeamGrid', props: { columns: 3 } }],
            root: { props: { template: 'nature' } },
          },
        },
        {
          slug: 'contact',
          title: 'Contact',
          puckData: {
            content: [
              { type: 'ContactForm', props: {} },
              { type: 'MapEmbed', props: {} },
            ],
            root: { props: { template: 'nature' } },
          },
        },
      ],
    },
    {
      id: 'tpl_urbain',
      name: 'Urbain',
      slug: 'urbain',
      description: 'Style industriel et grid. Pour les agences city.',
      category: 'general',
      isDefault: false,
      isActive: true,
      colors: {
        primary: '#374151',
        secondary: '#F97316',
        accent: '#FB923C',
        background: '#F3F4F6',
        text: '#111827',
        muted: '#6B7280',
      },
      fonts: { heading: 'Space Grotesk', body: 'Work Sans', accent: 'JetBrains Mono' },
      defaultPages: [
        {
          slug: 'accueil',
          title: 'Accueil',
          isDefault: true,
          puckData: {
            content: [
              { type: 'HeroVideo', props: { title: "L'immobilier urbain" } },
              { type: 'StatsCounter', props: {} },
              { type: 'PropertyGrid', props: { columns: 3, limit: 9 } },
              { type: 'FaqAccordion', props: { title: 'Questions fréquentes' } },
              { type: 'CtaBanner', props: { title: 'Discutons de votre projet' } },
            ],
            root: { props: { template: 'urbain' } },
          },
        },
        {
          slug: 'biens',
          title: 'Offres',
          puckData: {
            content: [
              { type: 'PropertySearch', props: {} },
              { type: 'PropertyGrid', props: { columns: 3, limit: 15, showFilters: true } },
            ],
            root: { props: { template: 'urbain' } },
          },
        },
        {
          slug: 'agents',
          title: 'Team',
          puckData: {
            content: [{ type: 'TeamGrid', props: { columns: 4 } }],
            root: { props: { template: 'urbain' } },
          },
        },
        {
          slug: 'contact',
          title: 'Contact',
          puckData: {
            content: [
              { type: 'ContactForm', props: {} },
              { type: 'MapEmbed', props: {} },
            ],
            root: { props: { template: 'urbain' } },
          },
        },
      ],
    },
  ];

  for (const t of templates) {
    await prisma.vitrineTemplate.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  const count = await prisma.vitrineTemplate.count();
  console.log('✅ Templates insérés:', count);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
