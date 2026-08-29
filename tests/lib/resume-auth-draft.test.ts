import { afterEach, describe, expect, it } from 'vitest';
import {
  RESUME_AUTH_DRAFT_KEY,
  RESUME_AUTH_DRAFT_TTL_MS,
  clearResumeAuthDraft,
  consumeResumeAuthDraft,
  isEditPath,
  persistResumeAuthDraft,
} from '@/lib/resumeAuthDraft';

const sample = {
  name: '草稿',
  globalStyle: {},
  pages: [{ modules: [{ type: 'info1', id: '1', options: {} }] }],
};

afterEach(() => {
  sessionStorage.clear();
});

describe('resumeAuthDraft', () => {
  it('detects edit paths', () => {
    expect(isEditPath('/zh/edit')).toBe(true);
    expect(isEditPath('/en/edit/')).toBe(true);
    expect(isEditPath('/zh')).toBe(false);
  });

  it('persists and consumes draft once', () => {
    expect(persistResumeAuthDraft(sample)).toBe(true);
    const draft = consumeResumeAuthDraft();
    expect(draft).toEqual(sample);
    expect(consumeResumeAuthDraft()).toBeNull();
    expect(sessionStorage.getItem(RESUME_AUTH_DRAFT_KEY)).toBeNull();
  });

  it('rejects expired drafts', () => {
    const now = 1_000_000;
    persistResumeAuthDraft(sample, now);
    expect(consumeResumeAuthDraft(now + RESUME_AUTH_DRAFT_TTL_MS + 1)).toBeNull();
  });

  it('rejects invalid payloads', () => {
    expect(persistResumeAuthDraft({ name: 'x', pages: [] })).toBe(false);
    sessionStorage.setItem(RESUME_AUTH_DRAFT_KEY, '{bad');
    expect(consumeResumeAuthDraft()).toBeNull();
  });

  it('clears draft', () => {
    persistResumeAuthDraft(sample);
    clearResumeAuthDraft();
    expect(consumeResumeAuthDraft()).toBeNull();
  });
});
