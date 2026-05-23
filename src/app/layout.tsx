import type { Metadata } from 'next';
import Script from 'next/script';
import '../index.css';
import { AntdProvider } from './providers';
import {
  BYTEGOOFY_PUSH_SCRIPT_SRC,
  SITE_DESCRIPTION_DEFAULT,
  SITE_NAME_ZH,
  getSiteUrl,
  siteSoftwareApplicationJsonLd,
} from '@/lib/siteMeta';
import { logo } from '@/lib/brandAssets';

const FAVICON_VERSION = '20260523';
const FAVICON_HREF = `/favicon.ico?v=${FAVICON_VERSION}`;

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME_ZH,
  description: SITE_DESCRIPTION_DEFAULT,
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: [{ url: FAVICON_HREF, type: 'image/x-icon' }],
    shortcut: FAVICON_HREF,
    apple: logo.src,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeBootstrap = `(function(){try{var t=localStorage.getItem('easy-resume-theme');var r;if(t==='light')r='light';else if(t==='dark')r='dark';else if(t==='system')r=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';else r='dark';var el=document.documentElement;el.dataset.theme=r;if(r==='dark')el.dataset.prefersColorScheme='dark';else delete el.dataset.prefersColorScheme;}catch(e){var el=document.documentElement;el.dataset.theme='dark';el.dataset.prefersColorScheme='dark';}})();`;
  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <head>
        <link rel='icon' type='image/x-icon' href={FAVICON_HREF} />
        <link rel='shortcut icon' href={FAVICON_HREF} />
        <script
          key='theme-bootstrap'
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
        <script
          key='json-ld-software'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteSoftwareApplicationJsonLd()),
          }}
        />
        <Script id='ttzz' src={BYTEGOOFY_PUSH_SCRIPT_SRC} strategy='beforeInteractive' />
      </head>
      <body className='min-h-screen overflow-x-clip bg-background antialiased'>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
