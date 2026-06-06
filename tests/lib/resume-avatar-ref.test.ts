import { describe, expect, it } from 'vitest';
import { resolveResumeAvatarRefsDeep } from '@/lib/resumeAvatarRef';

describe('resumeAvatarRef', () => {
  it('resolves resumeAvatar prefix in nested object', () => {
    const input = {
      options: { avatar: 'resumeAvatar:a0', name: 'x' },
      list: ['resumeAvatar:a0', 'plain'],
    };
    const out = resolveResumeAvatarRefsDeep(input);
    expect(out.options.avatar).toMatch(/^data:image\/png;base64,/);
    expect(out.list[0]).toMatch(/^data:image\/png;base64,/);
    expect(out.list[1]).toBe('plain');
    expect(out.options.name).toBe('x');
  });

  it('keeps unknown avatar key unchanged', () => {
    const out = resolveResumeAvatarRefsDeep({ avatar: 'resumeAvatar:missing' });
    expect(out.avatar).toBe('resumeAvatar:missing');
  });
});
