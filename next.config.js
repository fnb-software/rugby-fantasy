/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      '*.mzn': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.module.rules.push({
      test: /\.mzn/,
      type: 'asset/source',
    });
    return config;
  },
};

module.exports = nextConfig;
