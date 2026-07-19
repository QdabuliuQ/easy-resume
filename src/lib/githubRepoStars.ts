const REPO = 'QdabuliuQ/easy-resume';

export async function fetchGithubRepoStars(
  repo = REPO,
): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const n = (await res.json() as { stargazers_count?: unknown }).stargazers_count;
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}
