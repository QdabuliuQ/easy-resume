import type { Metadata } from 'next';
import '../index.css';
import { VersionUpdateNotifier } from '@/components/versionUpdateNotifier';
import { AntdProvider } from './providers';

export const metadata: Metadata = {
  title: 'Easy Resume',
  description: 'Resume editor',
  icons: {
    icon: '/printer-paper.ico',
    shortcut: '/printer-paper.ico',
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
