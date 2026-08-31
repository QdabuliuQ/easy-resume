import { describe, expect, it } from 'vitest';
import { isLegacyTemplatePreviewKey } from '@/lib/qiniuManage';

describe('isLegacyTemplatePreviewKey', () => {
  const ids = new Set(['fe', 'be', 'ui-designer']);

  it('keeps new flat previews', () => {
    expect(isLegacyTemplatePreviewKey('easy-resume/previews/fe.jpg', ids)).toBe(false);
  });

  it('matches old id/timestamp and easy-resume/id paths', () => {
    expect(isLegacyTemplatePreviewKey('fe/171000.jpg', ids)).toBe(true);
    expect(isLegacyTemplatePreviewKey('easy-resume/be/171000.jpg', ids)).toBe(true);
    expect(isLegacyTemplatePreviewKey('other/x.jpg', ids)).toBe(false);
  });
});
