import { describe, expect, it } from 'vitest';
import { buildShareUrl } from '@/lib/shareResumeUrl';

describe('buildShareUrl', () => {
  it('builds locale share path', () => {
    expect(buildShareUrl('https://resume.example.com/', 'zh', 'abcTOKEN')).toBe(
      'https://resume.example.com/zh/s/abcTOKEN',
    );
    expect(buildShareUrl('https://resume.example.com', 'en', 't+1')).toBe(
      'https://resume.example.com/en/s/t%2B1',
    );
  });
});
