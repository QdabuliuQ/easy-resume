import type { Metadata } from 'next';
import '../index.css';
import { VersionUpdateNotifier } from '@/components/versionUpdateNotifier';
import { AntdProvider } from './providers';

export const metadata: Metadata = {
  title: 'EasyResume',
  description: 'Resume editor',
  icons: {
    icon: '/easy-resume/logo.png',
    shortcut: '/easy-resume/logo.png',
    apple: '/easy-resume/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 在 hydration 前同步设置 data-theme，避免首屏闪烁
  const themeBootstrap = `(function(){try{var t=localStorage.getItem('easy-resume-theme');if(t==='dark'){document.documentElement.dataset.theme='dark';}else{document.documentElement.dataset.theme='light';}}catch(e){}})();`;
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <AntdProvider>
          <VersionUpdateNotifier />
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
