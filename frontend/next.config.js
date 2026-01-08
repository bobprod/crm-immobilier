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
};

module.exports = nextConfig;
