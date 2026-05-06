/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/easy-resume",
  reactStrictMode: true,
  swcMinify: true,
  serverExternalPackages: ['puppeteer'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig