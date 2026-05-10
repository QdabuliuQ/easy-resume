import type { Metadata } from 'next';
import HomeClient from './home-client';
import { SITE_NAME, getSiteUrl } from '@/lib/siteMeta';

const title = 'AI 在线简历编辑与导出';
const description =
  '模块化编辑工作经历、项目与技能，画布实时预览，一键导出 PDF、PNG、JSON，并可用 AI 优化表述。';

const originBase = getSiteUrl().href.replace(/\/$/, '');

export const metadata: Metadata = {
  title,
  description,
  keywords: ['简历', '简历编辑器', '在线简历', 'PDF 简历', '求职', 'EasyResume', 'AI 简历'],
  alternates: { canonical: './' },
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'zh_CN',
    siteName: SITE_NAME,
    url: originBase,
    images: [
      {
        url: `${originBase}/preview.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} 界面预览`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function Page() {
  return <HomeClient />;
}
