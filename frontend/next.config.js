/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuration Turbopack (Next.js 16+)
  turbopack: {},
};

module.exports = nextConfig;
