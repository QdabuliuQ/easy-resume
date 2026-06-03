import type { GlobalStyle } from '@/modules/utils/common.type';

export const baseGlobalStyle: GlobalStyle = {
  pageSize: 'A4',
  fontSize: 14,
  lineHeight: 1.5,
  moduleMargin: 12,
  padding: 24,
  color: '#1677ff',
  backgroundColor: '#ffffff',
  headerType: 1,
  resumeFont: 'system',
  layout: 'default'
};

export function makeGlobalStyle(overrides: Partial<GlobalStyle> = {}): GlobalStyle {
  return {
    ...baseGlobalStyle,
    ...overrides
  };
}
