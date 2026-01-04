import { registerAs } from '@nestjs/config';

export default registerAs('tracking', () => ({
  // Meta (Facebook/Instagram)
  meta: {
    pixelId: process.env.FACEBOOK_PIXEL_ID,
    conversionApiToken: process.env.FACEBOOK_CONVERSION_API_TOKEN,
    testEventCode: process.env.FACEBOOK_TEST_EVENT_CODE,
  },

  // Google Tag Manager
  gtm: {
    containerId: process.env.GOOGLE_TAG_MANAGER_ID,
    serverContainerUrl: process.env.GTM_SERVER_CONTAINER_URL,
    serverContainerId: process.env.GTM_SERVER_CONTAINER_ID,
  },

  // Google Analytics 4
  ga4: {
    measurementId: process.env.GA4_MEASUREMENT_ID,
    apiSecret: process.env.GA4_API_SECRET,
  },

  // Google Ads
  googleAds: {
    conversionId: process.env.GOOGLE_ADS_CONVERSION_ID,
    conversionLabels: {
      lead: process.env.GOOGLE_ADS_CONVERSION_LABEL_LEAD,
      purchase: process.env.GOOGLE_ADS_CONVERSION_LABEL_PURCHASE,
      schedule: process.env.GOOGLE_ADS_CONVERSION_LABEL_SCHEDULE,
      contact: process.env.GOOGLE_ADS_CONVERSION_LABEL_CONTACT,
    },
  },

  // TikTok
  tiktok: {
    pixelId: process.env.TIKTOK_PIXEL_ID,
    accessToken: process.env.TIKTOK_ACCESS_TOKEN,
  },

  // LinkedIn
  linkedin: {
    partnerId: process.env.LINKEDIN_PARTNER_ID,
    conversionIds: {
      lead: process.env.LINKEDIN_CONVERSION_ID_LEAD,
      contact: process.env.LINKEDIN_CONVERSION_ID_CONTACT,
      download: process.env.LINKEDIN_CONVERSION_ID_DOWNLOAD,
    },
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
  },

  // Snapchat (optionnel)
  snapchat: {
    pixelId: process.env.SNAPCHAT_PIXEL_ID,
    accessToken: process.env.SNAPCHAT_ACCESS_TOKEN,
  },

  // Server-Side Tracking
  serverSide: {
    provider: process.env.SERVER_SIDE_PROVIDER || 'none',
    stape: {
      containerUrl: process.env.STAPE_CONTAINER_URL,
      apiKey: process.env.STAPE_API_KEY,
    },
    customEndpoint: process.env.CUSTOM_TRACKING_ENDPOINT,
  },
}));
