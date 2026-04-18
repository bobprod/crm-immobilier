/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Force Turbopack workspace root to this frontend folder to avoid
  // creating symlinks outside the project on Windows (privilege issues).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Enable standalone output for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Internationalization
  i18n: {
    locales: ['fr', 'en', 'ar'],
    defaultLocale: 'fr',
    localeDetection: true,
  },
  // Tree-shake large icon/component libraries — only imports actually used
  // are bundled, significantly reducing JS chunk size.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
