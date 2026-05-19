import type { Metadata } from 'next';
import '../index.css';
import { AntdProvider } from './providers';
import {
  SITE_DESCRIPTION_DEFAULT,
  SITE_NAME,
  getSiteUrl,
} from '@/lib/siteMeta';

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION_DEFAULT,
  referrer: 'origin-when-cross-origin',
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeBootstrap = `(function(){try{var t=localStorage.getItem('easy-resume-theme');var r;if(t==='light')r='light';else if(t==='dark')r='dark';else if(t==='system')r=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';else r='dark';document.documentElement.dataset.theme=r;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <head>
        <script
          key='theme-bootstrap'
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
      </head>
      <body className='min-h-screen bg-background antialiased'>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
