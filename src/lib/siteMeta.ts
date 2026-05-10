export const SITE_NAME = 'EasyResume';

export const SITE_DESCRIPTION_DEFAULT =
  'AI 辅助的在线简历编辑器：模块化编排、富文本、画布预览，导出 PDF / PNG / JSON，数据可本地备份。';

/** 须含部署子路径，如 https://example.com/easy-resume；缺省为本地带 basePath */
export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      return u;
    } catch {
      /* fallthrough */
    }
  }
  return new URL('http://localhost:3010/easy-resume');
}

export function siteJsonLdGraph(opts?: { locale?: string }): Record<string, unknown> {
  const base = getSiteUrl().href.replace(/\/$/, '');
  const inLanguage = opts?.locale === 'en' ? 'en' : 'zh-CN';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: SITE_NAME,
        url: base,
        description: SITE_DESCRIPTION_DEFAULT,
        inLanguage,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${base}/#software`,
        name: SITE_NAME,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'ResumeEditor',
        operatingSystem: 'Web',
        browserRequirements: '需要启用 JavaScript',
        description: SITE_DESCRIPTION_DEFAULT,
        url: base,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY',
        },
      },
    ],
  };
}
