/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack disabled to avoid Windows symlink permission issues during CI/build
};

module.exports = nextConfig;
