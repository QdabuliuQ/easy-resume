export const SITE_NAME = 'EasyResume';

export const BAIDU_SITE_VERIFICATION = 'codeva-1cW7ZWxH7V';
export const BING_SITE_VERIFICATION = 'A57DE6B0DEE3B356C208709D84FE45B5';

export const SITE_DESCRIPTION_DEFAULT =
  'AI 辅助的在线简历编辑器：模块化编排、富文本、画布预览，导出 PDF / 图片(JPEG) / JSON，数据可本地备份。';

/** 站点根 URL；缺省为本地开发地址 */
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
  return new URL('http://localhost:3010');
}

export const SITE_JSON_LD_SOFTWARE_NAME = 'EasyResume 简历编辑器';

export const SITE_JSON_LD_SOFTWARE_DESCRIPTION =
  '在线免费简历编辑、PDF导出、模板下载工具';

/** 根 layout 注入：SoftwareApplication（百度 / Google 富结果） */
export function siteSoftwareApplicationJsonLd(): Record<string, unknown> {
  const base = getSiteUrl().href.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_JSON_LD_SOFTWARE_NAME,
    url: base,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    description: SITE_JSON_LD_SOFTWARE_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
  };
}

export function siteJsonLdGraph(opts?: { locale?: string }): Record<string, unknown> {
  const base = getSiteUrl().href.replace(/\/$/, '');
  const inLanguage = opts?.locale === 'en' ? 'en' : 'zh-CN';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: SITE_NAME,
    url: base,
    description: SITE_DESCRIPTION_DEFAULT,
    inLanguage,
  };
}
