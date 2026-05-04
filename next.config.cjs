/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverExternalPackages: ['puppeteer'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
