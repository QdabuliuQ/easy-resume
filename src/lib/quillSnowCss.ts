import fs from 'node:fs';
import path from 'node:path';

let cache: string | null = null;

/** Quill snow 主题 CSS 原文（供 PDF 文档注入与 juice 内联共用） */
export function readQuillSnowCss(): string {
  if (cache == null) {
    cache = fs.readFileSync(
      path.join(process.cwd(), 'node_modules/quill/dist/quill.snow.css'),
      'utf8',
    );
  }
  return cache;
}
