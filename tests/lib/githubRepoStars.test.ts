import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchGithubRepoStars } from '@/lib/githubRepoStars';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchGithubRepoStars', () => {
  it('returns stargazers_count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ stargazers_count: 42 }),
      })),
    );
    await expect(fetchGithubRepoStars()).resolves.toBe(42);
  });

  it('returns null on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    await expect(fetchGithubRepoStars()).resolves.toBeNull();
  });
});
