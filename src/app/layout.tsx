import type { Metadata } from 'next';
import '../index.css';
import { VersionUpdateNotifier } from '@/components/versionUpdateNotifier';
import {
  SITE_DESCRIPTION_DEFAULT,
  SITE_NAME,
  getSiteUrl,
  siteJsonLdGraph,
} from '@/lib/siteMeta';
import { AntdProvider } from './providers';

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: `${SITE_NAME} — AI 简历编辑器`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION_DEFAULT,
  applicationName: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: '/easy-resume/logo.png',
    shortcut: '/easy-resume/logo.png',
    apple: '/easy-resume/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — AI 简历编辑器`,
    description: SITE_DESCRIPTION_DEFAULT,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — AI 简历编辑器`,
    description: SITE_DESCRIPTION_DEFAULT,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 在 hydration 前同步设置 data-theme，避免首屏闪烁
  const themeBootstrap = `(function(){try{var t=localStorage.getItem('easy-resume-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`;
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLdGraph()),
          }}
        />
        <AntdProvider>
          <VersionUpdateNotifier />
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
