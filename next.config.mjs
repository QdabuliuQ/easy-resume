/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/easy-resume",
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
