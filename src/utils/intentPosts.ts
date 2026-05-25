export function intentPostsFromResumeConfig(
  config: {
    pages?: { modules?: { type?: string; options?: { intentPosts?: string } }[] }[];
  } | null,
): string {
  for (const page of config?.pages ?? []) {
    for (const m of page.modules ?? []) {
      if (m.type === 'info1' && m.options?.intentPosts != null) {
        return String(m.options.intentPosts).trim();
      }
    }
  }
  return '';
}
