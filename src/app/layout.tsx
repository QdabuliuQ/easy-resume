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
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        <AntdProvider>
          <VersionUpdateNotifier />
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
