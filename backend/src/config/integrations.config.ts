import { registerAs } from '@nestjs/config';

/**
 * Configuration des intégrations externes
 */
export const integrationsConfig = registerAs('integrations', () => ({
  // Pica API
  pica: {
    apiKey: process.env.PICA_API_KEY || '',
    apiUrl: process.env.PICA_API_URL || 'https://api.pica.io',
    isConfigured: !!process.env.PICA_API_KEY,
  },

  // SERP API
  serp: {
    apiKey: process.env.SERP_API_KEY || '',
    apiUrl: process.env.SERP_API_URL || 'https://serpapi.com/search',
    isConfigured: !!process.env.SERP_API_KEY,
  },

  // Firecrawl
  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY || '',
    apiUrl: process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev',
    isConfigured: !!process.env.FIRECRAWL_API_KEY,
  },

  // LinkedIn OAuth
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    callbackUrl:
      process.env.LINKEDIN_CALLBACK_URL ||
      'http://localhost:3000/api/integrations/linkedin/callback',
    isConfigured: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
}));

export default integrationsConfig;
