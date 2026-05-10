import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always',
  localeDetection: false,
});
