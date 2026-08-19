import fs from 'fs';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const hbWasmSrc = path.join(process.cwd(), 'node_modules/harfbuzzjs/hb-subset.wasm');
const hbWasmDest = path.join(process.cwd(), 'public/wasm/hb-subset.wasm');
if (fs.existsSync(hbWasmSrc)) {
  fs.mkdirSync(path.dirname(hbWasmDest), { recursive: true });
  fs.copyFileSync(hbWasmSrc, hbWasmDest);
}
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
      'pdfkit',
      'fontkit',
      'subset-font',
      'harfbuzzjs',
      'fontverter',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals ?? []),
        'puppeteer',
        'puppeteer-core',
        'pdfkit',
      ];
    } else {
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        zlib: false,
        module: false,
      };
      config.module.noParse = [
        ...(Array.isArray(config.module.noParse)
          ? config.module.noParse
          : config.module.noParse
            ? [config.module.noParse]
            : []),
        /pdfkit[\\/]js[\\/]pdfkit\.standalone\.js$/,
      ];
      config.module.rules.unshift({
        test: /wawoff2[\\/]build[\\/]decompress_binding\.js$/,
        loader: path.resolve(process.cwd(), 'scripts/export-emscripten-module.cjs'),
      });
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
      {
        protocol: 'https',
        hostname: 'thirdqq.qlogo.cn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'q.qlogo.cn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qzapp.qlogo.cn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.qlogo.cn',
        pathname: '/**',
      },
      // QQ 偶发仅 http 可访问；优先业务侧已升 https，此处兜底
      {
        protocol: 'http',
        hostname: '**.qlogo.cn',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
export default withNextIntl(nextConfig);
