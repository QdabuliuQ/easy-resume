#!/usr/bin/env node
/**
 * 准备导出用的 woff2 字体（F3.5：能装就装，装不上只警告、不中断构建）。
 *
 * 背景：
 *   src/lib/resumeFont.ts 里所有 LOCAL_FONTS 都指向 public/fonts/*.woff2，
 *   但 .gitignore 把整个 public/fonts 排除了，仓库里没有任何字体。
 *   直接构建出来的镜像导出 PDF/DOCX 会 404（浏览器侧）或抛
 *   `缺少字体文件 public/fonts/xxx`（服务端）。
 *
 * 这个脚本按下面的顺序尽力补齐，任何一步失败都只打印警告并退出 0：
 *   1. 已有 woff2          → 直接跳过
 *   2. 有同名 ttf          → 用 wawoff2 转成 woff2（保真，体积约 40%）
 *   3. 配了 RESUME_FONT_BASE_URL → 先试 {name}.woff2，再试 {name}.ttf 转换
 *   4. 都没有              → 警告，镜像仍可构建，仅导出功能缺字体
 *
 * 用法：
 *   node scripts/prepare-resume-fonts.mjs
 *   RESUME_FONT_BASE_URL=https://example.com/fonts node scripts/prepare-resume-fonts.mjs
 *
 * 实测提醒（2026-11）：
 *   国内网络下从公共 CDN 拉字体很不可靠——jsdelivr 会被 reset，
 *   npmmirror 下 4MB tarball 耗时 120s，本项目线上站点的 woff2 单文件约 86s。
 *   所以「构建时下载」只适合带本地缓存的场景；想稳定复现请把 woff2 放进仓库。
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fontsDir = path.join(root, 'public', 'fonts');

/** 只处理导出链路真正会用的字体；其余字体缺失不影响默认模板 */
const TARGETS = [
  { id: 'noto-sans-sc', family: 'Noto Sans SC', stem: 'NotoSansSC' },
  { id: 'noto-serif-sc', family: 'Noto Serif SC', stem: 'NotoSerifSC' },
];

const VARIANTS = [
  { suffix: 'Regular', weight: 400 },
  { suffix: 'Bold', weight: 700 },
];

const REMOTE_BASE = process.env.RESUME_FONT_BASE_URL?.trim().replace(/\/$/, '') || '';

const log = (...a) => console.log('[fonts]', ...a);
const warn = (...a) => console.warn('[fonts][warn]', ...a);

async function compressTtf(ttfPath, woff2Path) {
  // wawoff2 是 Next 的传递依赖，镜像内一定存在；按需加载避免顶层 import 失败
  const { compress } = await import('wawoff2');
  const ttf = await readFile(ttfPath);
  const woff2 = Buffer.from(await compress(ttf));
  await writeFile(woff2Path, woff2);
  const mb = (n) => (n / 1024 / 1024).toFixed(1) + 'MB';
  log(`转换 ${path.basename(ttfPath)} → ${path.basename(woff2Path)} (${mb(ttf.length)} → ${mb(woff2.length)})`);
}

async function download(url, dest) {
  const signal = AbortSignal.timeout(120_000);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error('响应过小，可能不是字体文件');
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await mkdir(fontsDir, { recursive: true });

  let converted = 0;
  let skipped = 0;
  const missing = [];

  for (const target of TARGETS) {
    for (const variant of VARIANTS) {
      const stem = `${target.stem}-${variant.suffix}`;
      const woff2Path = path.join(fontsDir, `${stem}.woff2`);
      const ttfPath = path.join(fontsDir, `${stem}.ttf`);

      if (existsSync(woff2Path)) {
        skipped++;
        continue;
      }

      try {
        if (!existsSync(ttfPath) && REMOTE_BASE) {
          // 优先直接拿现成 woff2（省掉转换），失败再退回 ttf 转换
          try {
            const woff2Url = `${REMOTE_BASE}/${stem}.woff2`;
            log(`下载 ${woff2Url}`);
            await download(woff2Url, woff2Path);
            converted++;
            continue;
          } catch (err) {
            log(`woff2 直连不可用（${err instanceof Error ? err.message : err}），改用 ttf`);
            const ttfUrl = `${REMOTE_BASE}/${stem}.ttf`;
            log(`下载 ${ttfUrl}`);
            await download(ttfUrl, ttfPath);
          }
        }

        if (existsSync(ttfPath)) {
          await compressTtf(ttfPath, woff2Path);
          converted++;
          continue;
        }

        missing.push(stem);
      } catch (err) {
        warn(`${stem} 处理失败：${err instanceof Error ? err.message : String(err)}`);
        missing.push(stem);
      }
    }
  }

  if (missing.length > 0) {
    warn('以下字体缺失，相关导出会失败（不影响页面编辑与启动）：');
    warn('  ' + missing.join(', '));
    warn('补齐方式（任选其一，放好后重新构建镜像）：');
    warn(`  1. 把同名 .ttf 或 .woff2 放到 ${path.relative(root, fontsDir)}/`);
    warn('  2. 设置 RESUME_FONT_BASE_URL 指向可下载 {name}.ttf 的地址后重新构建');
  } else if (converted > 0) {
    log(`完成：新转换 ${converted} 个，已存在 ${skipped} 个`);
  } else {
    log(`字体齐备（已存在 ${skipped} 个 woff2），无需处理`);
  }
}

main().catch((err) => {
  // 任何意外都不应阻断镜像构建
  warn('字体准备脚本异常（已忽略）：', err instanceof Error ? err.message : String(err));
});
