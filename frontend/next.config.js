/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // experimental: {
    //     appDir: false,
    // },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@/shared': require('path').resolve(__dirname, 'src/shared'),
            '@/lib': require('path').resolve(__dirname, 'src/shared/utils'),
            '@/modules': require('path').resolve(__dirname, 'src/modules'),
            '@/components': require('path').resolve(__dirname, 'src/components'),
            '@/hooks': require('path').resolve(__dirname, 'src/shared/hooks'),
        };
        return config;
    },
};

module.exports = nextConfig;
