export const SITE_NAME_EN = 'EasyResume';
export const SITE_NAME_ZH = '青松简历';

export function getSiteName(locale?: string | null): string {
  return locale === 'en' ? SITE_NAME_EN : SITE_NAME_ZH;
}

export const BAIDU_SITE_VERIFICATION = 'codeva-1cW7ZWxH7V';
export const BING_SITE_VERIFICATION = 'A57DE6B0DEE3B356C208709D84FE45B5';
export const SOGOU_SITE_VERIFICATION = 'QMl8ijjXYf';
export const BYTEDANCE_SITE_VERIFICATION = 'mZD9AKpG/j1o8DDIeXbp';
export const GOOGLE_SITE_VERIFICATION = 'Ey63mYPPiHyXAF3c_L9RW2oBN8LAkYy2hHaBgqAnNtA';
export const SO360_SITE_VERIFICATION = '2004f1668ee6569ea7978203217a9efc';
export const SHENMA_SITE_VERIFICATION = 'e1c21fe48fccc47297b889d8a4fe29f8_1780746691';

/** 头条/字节 push.js：用户浏览时自动提交链接给蜘蛛 */
export const BYTEGOOFY_PUSH_SCRIPT_SRC =
  'https://lf1-cdn-tos.bytegoofy.com/goofy/ttzz/push.js?a2e238a07fe015bff49e92c93f7ab1ec6f705268b424ef6d30f3a9e42be80c46b3e414cba65c376eba389ba56d9ee0846cad2206506a6529fe6ee21a7373effb434c445cf6444b10ea9756ea44e128a6';

export const SITE_DESCRIPTION_DEFAULT =
  '青松简历（resume.qdabuliuq.cn）是专业在线求职简历制作网站，面向求职者免费使用，支持模块化编辑工作经历、项目案例、教育与专业技能，画布实时预览排版，AI 智能润色与重写建议，浏览器本地存储无需注册，一键导出 PDF、图片与 JSON，多设备 JSON 同步，助你快速打造高质量可投递简历。';

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

const WEB_APP_JSON_LD = {
  zh: {
    name: '青松简历在线简历编辑器',
    description:
      'AI 在线简历编辑与导出平台，模块化编辑工作经历、项目与技能，画布实时预览，支持 PDF、图片与 JSON 导出，数据本地存储。',
    browserRequirements: '需要启用 JavaScript',
  },
  en: {
    name: 'EasyResume Online Resume Editor',
    description:
      'AI-powered online resume editor and export platform with modular editing, live canvas preview, and PDF, JPEG, and JSON export with local-first storage.',
    browserRequirements: 'Requires JavaScript',
  },
} as const;

export function siteWebApplicationJsonLd(opts?: {
  locale?: string;
  image?: string;
}): Record<string, unknown> {
  const isEn = opts?.locale === 'en';
  const locale = isEn ? 'en' : 'zh';
  const base = getSiteUrl().href.replace(/\/$/, '');
  const copy = WEB_APP_JSON_LD[locale];
  const node: Record<string, unknown> = {
    '@type': 'WebApplication',
    '@id': `${base}/${locale}/#webapp`,
    name: copy.name,
    alternateName: isEn ? SITE_NAME_ZH : SITE_NAME_EN,
    url: `${base}/${locale}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    browserRequirements: copy.browserRequirements,
    description: copy.description,
    inLanguage: isEn ? 'en' : 'zh-CN',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
  };
  if (opts?.image) node.image = opts.image;
  return node;
}

/** @deprecated use siteWebApplicationJsonLd */
export function siteSoftwareApplicationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    ...siteWebApplicationJsonLd({ locale: 'zh' }),
  };
}

export function siteJsonLdGraph(opts?: {
  locale?: string;
  image?: string;
}): Record<string, unknown> {
  const base = getSiteUrl().href.replace(/\/$/, '');
  const locale = opts?.locale === 'en' ? 'en' : 'zh';
  const inLanguage = locale === 'en' ? 'en' : 'zh-CN';
  const description =
    locale === 'en'
      ? WEB_APP_JSON_LD.en.description
      : SITE_DESCRIPTION_DEFAULT;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: getSiteName(locale),
        url: `${base}/${locale}`,
        description,
        inLanguage,
      },
      siteWebApplicationJsonLd({ locale, image: opts?.image }),
    ],
  };
}