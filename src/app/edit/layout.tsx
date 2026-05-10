import type { Metadata } from 'next';
import { SITE_NAME, getSiteUrl } from '@/lib/siteMeta';

const title = '简历编辑器';
const description =
  '在画布中编辑简历模块、全局样式与排版，支持导出 PDF、PNG、JSON 及本地文件夹备份。';

const canonicalEdit = `${getSiteUrl().href.replace(/\/$/, '')}/edit`;

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: canonicalEdit },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    type: 'website',
    locale: 'zh_CN',
    siteName: SITE_NAME,
    url: canonicalEdit,
  },
  twitter: {
    card: 'summary',
    title: `${title} | ${SITE_NAME}`,
    description,
  },
};

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
