/** 浏览器 / Worker 里去掉 Node 伪装，避免 wawoff2 走 fs 分支后卡住 */
const g = globalThis as typeof globalThis & { importScripts?: unknown };
const isBrowser =
  typeof window !== 'undefined' || typeof g.importScripts === 'function';
if (isBrowser) {
  const proc = globalThis as typeof globalThis & {
    process?: { versions?: { node?: string } };
  };
  if (proc.process?.versions && typeof proc.process.versions.node === 'string') {
    delete (proc.process.versions as { node?: string }).node;
  }
}
