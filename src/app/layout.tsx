import type { Metadata } from 'next';
import '../index.css';
import 'quill/dist/quill.snow.css';
import '../styles/resumeQuillEmbed.css';
import { AntdProvider } from './providers';

export const metadata: Metadata = {
  title: 'Easy Resume',
  description: 'Resume editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}