import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-core',
      '@puppeteer/browsers',
      '@xenova/transformers',
      'onnxruntime-node',
      'unpdf',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), 'puppeteer', 'puppeteer-core'];
    }
    return config;
  },
  async rewrites() {
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.qdabuliuq.cn',
        pathname: '/easy-resume/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
export default withNextIntl(nextConfig);
