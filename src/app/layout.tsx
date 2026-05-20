import type { Metadata } from 'next';
import Script from 'next/script';
import '../index.css';
import { AntdProvider } from './providers';
import {
  BYTEGOOFY_PUSH_SCRIPT_SRC,
  SITE_DESCRIPTION_DEFAULT,
  SITE_NAME,
  getSiteUrl,
  siteSoftwareApplicationJsonLd,
} from '@/lib/siteMeta';

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION_DEFAULT,
  referrer: 'origin-when-cross-origin',
  icons: { icon: '/logo.png', apple: '/logo.png' },
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
