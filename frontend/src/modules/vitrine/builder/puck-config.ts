import type { Config } from '@measured/puck';
import React from 'react';
import {
  heroSliderConfig,
  heroVideoConfig,
  textBlockConfig,
  propertyGridConfig,
  propertyCarouselConfig,
  propertySearchConfig,
  contactFormConfig,
  teamGridConfig,
  statsCounterConfig,
  ctaBannerConfig,
  faqAccordionConfig,
  testimonialsConfig,
  galleryConfig,
  mapEmbedConfig,
  youtubeEmbedConfig,
  neighborhoodsConfig,
  iconBoxesConfig,
  separatorConfig,
  spacerConfig,
  columnsConfig,
  headerNavConfig,
  footerConfig,
  imageTextConfig,
  partnerLogosConfig,
} from './sections';
import { ImageUploadField } from './ImageUploadField';

// Custom image field for Puck
const imageField = {
  type: 'custom' as const,
  label: 'Image (upload ou URL)',
  render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
    React.createElement(ImageUploadField, { value: value || '', onChange }),
};

// Override image fields with upload support
const imageTextConfigWithUpload = {
  ...imageTextConfig,
  fields: { ...imageTextConfig.fields, image: imageField },
};

const heroSliderConfigWithUpload = {
  ...heroSliderConfig,
  fields: {
    ...heroSliderConfig.fields,
    slides: { type: 'custom' as const, label: 'Slides', render: () => React.createElement('p', { style: { fontSize: 12, color: '#666' } }, 'Éditez les slides via le JSON — ou utilisez l\'upload d\'images sur les autres sections') },
  },
};

// Cast needed because Puck's Config type expects PuckComponent signatures
// but our section configs use simpler (props) => JSX signatures
export const puckConfig = {
  categories: {
    'hero': {
      title: '🏠 Hero & En-tête',
      components: ['HeroSlider', 'HeroVideo', 'HeaderNav'],
    },
    'immobilier': {
      title: '🏡 Immobilier',
      components: ['PropertyGrid', 'PropertyCarousel', 'PropertySearch', 'Neighborhoods'],
    },
    'contenu': {
      title: '📝 Contenu',
      components: ['TextBlock', 'ImageText', 'Columns', 'IconBoxes'],
    },
    'social': {
      title: '💬 Social & Avis',
      components: ['Testimonials', 'TeamGrid', 'PartnerLogos'],
    },
    'media': {
      title: '🎬 Média',
      components: ['Gallery', 'YoutubeEmbed', 'MapEmbed'],
    },
    'action': {
      title: '🎯 Call-to-Action',
      components: ['CtaBanner', 'ContactForm', 'StatsCounter', 'FaqAccordion'],
    },
    'structure': {
      title: '⚙️ Structure',
      components: ['Separator', 'Spacer', 'Footer'],
    },
  },
  components: {
    HeroSlider: heroSliderConfigWithUpload,
    HeroVideo: heroVideoConfig,
    HeaderNav: headerNavConfig,
    PropertyGrid: propertyGridConfig,
    PropertyCarousel: propertyCarouselConfig,
    PropertySearch: propertySearchConfig,
    Neighborhoods: neighborhoodsConfig,
    TextBlock: textBlockConfig,
    ImageText: imageTextConfigWithUpload,
    Columns: columnsConfig,
    IconBoxes: iconBoxesConfig,
    Testimonials: testimonialsConfig,
    TeamGrid: teamGridConfig,
    PartnerLogos: partnerLogosConfig,
    Gallery: galleryConfig,
    YoutubeEmbed: youtubeEmbedConfig,
    MapEmbed: mapEmbedConfig,
    CtaBanner: ctaBannerConfig,
    ContactForm: contactFormConfig,
    StatsCounter: statsCounterConfig,
    FaqAccordion: faqAccordionConfig,
    Separator: separatorConfig,
    Spacer: spacerConfig,
    Footer: footerConfig,
  },
};

export type PuckComponentKey = keyof typeof puckConfig.components;
