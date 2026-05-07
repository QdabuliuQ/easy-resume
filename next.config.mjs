const basePath = '/easy-resume';
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ["puppeteer"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};
export default nextConfig;
