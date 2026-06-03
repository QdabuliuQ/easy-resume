import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import Loading from '@/components/loading';
import { LocaleHtmlLang } from '@/components/localeHtmlLang';
import Title from '@/components/title';

describe('components basic behaviors', () => {
  it('renders title text', () => {
    render(<Title title='My Title' />);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders loading text from i18n messages', () => {
    render(
      <NextIntlClientProvider locale='zh' messages={{ Loading: { text: '加载中...' } }}>
        <Loading />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('updates html lang attribute based on locale', () => {
    const { rerender } = render(
      <NextIntlClientProvider locale='zh' messages={{}}>
        <LocaleHtmlLang />
      </NextIntlClientProvider>,
    );
    expect(document.documentElement.lang).toBe('zh-CN');

    rerender(
      <NextIntlClientProvider locale='en' messages={{}}>
        <LocaleHtmlLang />
      </NextIntlClientProvider>,
    );
    expect(document.documentElement.lang).toBe('en');
  });
});
