// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/views/export/exportPrintFonts', () => ({
  default: () => null,
}));

vi.mock('@/views/edit/components/canvas/renderResumePageModules', () => ({
  renderResumePageModules: () => ({
    main: <div data-testid="main">内容</div>,
    sideSlot: null,
  }),
}));

import ResumeImageExportPage from '@/views/export/resumeImageExportPage';

describe('ResumeImageExportPage', () => {
  it('defaults to fixed paper (no continuous) so PDF/thumb paths stay safe', () => {
    const { container } = render(
      <ResumeImageExportPage
        config={{
          globalStyle: { pageSize: 'A4', padding: 20 },
          pages: [{ modules: [] }],
        }}
        mode="full"
      />,
    );
    const page = container.querySelector('[data-resume-export-page]') as HTMLElement;
    expect(page).toBeTruthy();
    expect(page.hasAttribute('data-resume-export-continuous')).toBe(false);
    expect(page.style.overflow).toBe('hidden');
  });

  it('continuous opt-in yields long page for JPEG export', () => {
    const { container } = render(
      <ResumeImageExportPage
        config={{
          globalStyle: { pageSize: 'A4', padding: 20 },
          pages: [{ modules: [] }],
        }}
        mode="full"
        continuous
      />,
    );
    const page = container.querySelector('[data-resume-export-page]') as HTMLElement;
    expect(page).toBeTruthy();
    expect(page.hasAttribute('data-resume-export-continuous')).toBe(true);
    expect(page.style.height).toBe('auto');
    expect(page.style.overflow).toBe('visible');
  });

  it('firstPage mode keeps fixed paper height for thumbs', () => {
    const { container } = render(
      <ResumeImageExportPage
        config={{
          globalStyle: { pageSize: 'A4', padding: 20 },
          pages: [{ modules: [] }],
        }}
        mode="firstPage"
      />,
    );
    const page = container.querySelector('[data-resume-export-page]') as HTMLElement;
    expect(page).toBeTruthy();
    expect(page.hasAttribute('data-resume-export-continuous')).toBe(false);
    expect(page.style.overflow).toBe('hidden');
  });
});
