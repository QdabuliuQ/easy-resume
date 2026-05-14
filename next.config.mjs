import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const basePath = '/easy-resume';
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};
export default withNextIntl(nextConfig);