export const SITE_NAME = 'EasyResume';

/** 首页 / 分享预览图（OG、thumbnail） */
export const SITE_OG_PREVIEW_IMAGE = 'https://resume.qdabuliuq.cn/preview.png';
export const SITE_OG_PREVIEW_WIDTH = 1200;
export const SITE_OG_PREVIEW_HEIGHT = 630;

export const BAIDU_SITE_VERIFICATION = 'codeva-1cW7ZWxH7V';
export const BING_SITE_VERIFICATION = 'A57DE6B0DEE3B356C208709D84FE45B5';
export const SOGOU_SITE_VERIFICATION = 'HfHGIFRatG';
export const BYTEDANCE_SITE_VERIFICATION = 'mZD9AKpG/j1o8DDIeXbp';
export const GOOGLE_SITE_VERIFICATION = 'Ey63mYPPiHyXAF3c_L9RW2oBN8LAkYy2hHaBgqAnNtA';

/** 头条/字节 push.js：用户浏览时自动提交链接给蜘蛛 */
export const BYTEGOOFY_PUSH_SCRIPT_SRC =
  'https://lf1-cdn-tos.bytegoofy.com/goofy/ttzz/push.js?a2e238a07fe015bff49e92c93f7ab1ec6f705268b424ef6d30f3a9e42be80c46b3e414cba65c376eba389ba56d9ee0846cad2206506a6529fe6ee21a7373effb434c445cf6444b10ea9756ea44e128a6';

export const SITE_DESCRIPTION_DEFAULT =
  'AI 辅助的在线简历编辑器：模块化编排、富文本、画布预览，导出 PDF / 图片(JPEG) / JSON，数据可本地备份。';

function resolveSiteUrlRaw(): string | undefined {
  const explicit =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;
  return undefined;
}

/** 站点根 URL；缺省为本地开发地址（构建期用 env / VERCEL_URL） */
export function getSiteUrl(): URL {
  const raw = resolveSiteUrlRaw();
  if (raw) {
    try {
      return new URL(raw);
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