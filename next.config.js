/** @type {import('next').NextConfig} */
const nextConfig = {
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
