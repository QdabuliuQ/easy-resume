/**
 * 方案 B：用 cn-font-split 把 public/fonts 完整 woff2 切成 unicode-range 小包。
 * 编辑器按需下载；导出仍用完整字体。
 *
 * 用法：
 *   npx cn-font-split i          # 首次安装原生核心
 *   npm run fonts:split          # 切割全部
 *   npm run fonts:split -- noto-sans-sc shanggu-serif
 */
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile, access, readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fontsDir = path.join(root, 'public', 'fonts');
const outRoot = path.join(fontsDir, 'split');
const cnFontSplitBin = path.join(root, 'node_modules', '.bin', 'cn-font-split');

/** @type {{ id: string; family: string; regular: string; bold: string }[]} */
const FONTS = [
  {
    id: 'noto-sans-sc',
    family: 'Noto Sans SC',
    regular: 'NotoSansSC-Regular.woff2',
    bold: 'NotoSansSC-Bold.woff2',
  },
  {
    id: 'noto-serif-sc',
    family: 'Noto Serif SC',
    regular: 'NotoSerifSC-Regular.woff2',
    bold: 'NotoSerifSC-Bold.woff2',
  },
  {
    id: 'qyn-flavor',
    family: '檎风黑体',
    regular: 'QynFlavorAltCHS-Regular.woff2',
    bold: 'QynFlavorAltCHS-Bold.woff2',
  },
  {
    id: 'chill-huo-fangsong',
    family: '寒蝉活仿宋',
    regular: 'ChillHuoFangSong-Regular.woff2',
    bold: 'ChillHuoFangSong-Bold.woff2',
  },
  {
    id: 'moon-stars-kai',
    family: '月星楷',
    regular: 'MoonStarsKai-Regular.woff2',
    bold: 'MoonStarsKai-Bold.woff2',
  },
  {
    id: 'shanggu-round',
    family: '尚古圆体',
    regular: 'ShangguRound-Regular.woff2',
    bold: 'ShangguRound-Bold.woff2',
  },
  {
    id: 'shanggu-serif',
    family: '尚古明体',
    regular: 'ShangguSerif-Regular.woff2',
    bold: 'ShangguSerif-Bold.woff2',
  },
  {
    id: 'chill-round-f',
    family: '寒蝉全圆体',
    regular: 'ChillRoundF-Regular.woff2',
    bold: 'ChillRoundF-Bold.woff2',
  },
  {
    id: 'acy',
    family: 'Acy手写体',
    regular: 'Acy-Regular.woff2',
    bold: 'Acy-Bold.woff2',
  },
];

/** 偏大一点：减少包数量与元数据膨胀，单次下载略增 */
const CHUNK_SIZE = 262_144;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function splitArgs(input, outDir, font, weight) {
  return [
    'run',
    '-i',
    input,
    '-o',
    outDir,
    '--css.fontFamily',
    font.family,
    '--css.fontWeight',
    String(weight),
    '--css.fontDisplay',
    'swap',
    '--css.fileName',
    'result.css',
    '--css.commentBase',
    'false',
    '--css.commentNameTable',
    'false',
    '--css.commentUnicodes',
    'false',
    '--css.compress',
    'true',
    '--testHtml',
    'false',
    '-c',
    String(CHUNK_SIZE),
  ];
}

/** 部分 woff2 会被 cn-font-split 判非法，先转 ttf 再切 */
async function toTempTtf(woff2Path) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'resume-font-'));
  const ttfPath = path.join(dir, `${path.basename(woff2Path, path.extname(woff2Path))}.ttf`);
  await run('python3', [
    path.join(__dirname, 'woff2-to-ttf.py'),
    woff2Path,
    ttfPath,
  ]);
  return { ttfPath, tmpDir: dir };
}

async function runSplit(input, outDir, font, weight) {
  await run(cnFontSplitBin, splitArgs(input, outDir, font, weight));
}

async function splitOne(font, weight, file) {
  const input = path.join(fontsDir, file);
  if (!(await exists(input))) {
    throw new Error(`missing font file: ${input}`);
  }
  if (!(await exists(cnFontSplitBin))) {
    throw new Error('cn-font-split not installed; run npm i && npm run fonts:split:install-core');
  }
  const outDir = path.join(outRoot, font.id, String(weight));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  console.log(`\n[split] ${font.id} weight=${weight} ← ${file}`);
  try {
    await runSplit(input, outDir, font, weight);
  } catch (err) {
    console.warn(`[split] woff2 failed, convert to ttf and retry: ${file}`);
    console.warn(String(err?.message || err));
    const { ttfPath, tmpDir } = await toTempTtf(input);
    try {
      await rm(outDir, { recursive: true, force: true });
      await mkdir(outDir, { recursive: true });
      await runSplit(ttfPath, outDir, font, weight);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
  const cssPath = path.join(outDir, 'result.css');
  if (!(await exists(cssPath))) {
    throw new Error(`split produced no result.css: ${cssPath}`);
  }
  // 去掉 local()，避免命中本机同名字体而跳过切片下载
  let css = await readFile(cssPath, 'utf8');
  css = css.replace(/local\("([^"]*)"\),?/g, '');
  await writeFile(cssPath, css);
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const list = only.length
    ? FONTS.filter((f) => only.includes(f.id))
    : FONTS;
  if (!list.length) {
    console.error('no matching font ids:', only.join(', '));
    process.exit(1);
  }

  await mkdir(outRoot, { recursive: true });
  /** @type {Record<string, { 400: string; 700: string }>} */
  const manifest = {};

  for (const font of list) {
    await splitOne(font, 400, font.regular);
    await splitOne(font, 700, font.bold);
    manifest[font.id] = {
      400: `/fonts/split/${font.id}/400/result.css`,
      700: `/fonts/split/${font.id}/700/result.css`,
    };
  }

  // 合并已有 manifest（只切部分字体时保留其它条目）
  const manifestPath = path.join(outRoot, 'manifest.json');
  let prev = {};
  if (await exists(manifestPath)) {
    try {
      prev = JSON.parse(await readFile(manifestPath, 'utf8'));
    } catch {
      prev = {};
    }
  }
  const next = { ...prev, ...manifest, generatedAt: new Date().toISOString() };
  await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`\n[split] done → ${manifestPath}`);
  console.log('[split] deploy 前请确保服务器含 public/fonts/split/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
