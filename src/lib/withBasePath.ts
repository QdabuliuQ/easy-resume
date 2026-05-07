export function withBasePath(path: string): string {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!path.startsWith('/')) return bp ? `${bp}/${path}` : path;
  return bp ? `${bp}${path}` : path;
}
