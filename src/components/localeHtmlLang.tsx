'use client';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';
export function LocaleHtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
  }, [locale]);
  return null;
}
