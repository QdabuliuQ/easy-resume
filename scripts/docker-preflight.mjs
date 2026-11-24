#!/usr/bin/env node
/**
 * 容器启动前自检：只打印警告，不阻断启动。
 *
 * 目的：让「clone 下来直接 docker compose up」的人一眼看到哪些东西还是默认值，
 * 避免把默认密钥带到公网，也避免导出失败时以为项目坏了。
 */
const DEFAULTS = [
  ['AUTH_SECRET', 'dev-only-auth-secret-change-me', '登录会话签名密钥'],
  ['CF_API_SECRET', 'dev-only-cf-api-secret-change-me', '主站与数据层通信密钥'],
  ['ADMIN_SECRET', 'dev-only-admin-secret-change-me', '后台接口密钥'],
];

const warn = (msg) => console.warn(`\x1b[33m[preflight]\x1b[0m ${msg}`);
const info = (msg) => console.log(`\x1b[36m[preflight]\x1b[0m ${msg}`);

// 未设置 或 仍是占位值，都需要提醒
const usingDefaults = DEFAULTS.filter(([key, def]) => {
  const v = process.env[key] ?? '';
  return v === '' || v === def;
});

if (usingDefaults.length > 0) {
  warn('以下密钥未设置或仍是默认值，请勿用于公网环境：');
  for (const [key, , desc] of usingDefaults) {
    warn(`  ${key}  (${desc})`);
  }
  warn('改法：编辑 .env 后重新 docker compose up -d');
} else {
  info('密钥已自定义');
}

// 字体缺失只影响导出，提前说清楚
import { existsSync } from 'node:fs';
import path from 'node:path';

const fontsDir = path.join(process.cwd(), 'public', 'fonts');
const required = [
  'NotoSansSC-Regular.woff2',
  'NotoSansSC-Bold.woff2',
  'NotoSerifSC-Regular.woff2',
  'NotoSerifSC-Bold.woff2',
];
const missing = required.filter((f) => !existsSync(path.join(fontsDir, f)));

if (missing.length > 0) {
  warn(`缺少 ${missing.length} 个导出字体，PDF/DOCX 导出会失败：`);
  warn('  ' + missing.join(', '));
  warn('补齐：把字体放到 public/fonts/ 后重新 build，或设置 RESUME_FONT_BASE_URL');
} else {
  info('导出字体齐备');
}

// 可选能力状态，帮助使用者判断问题出在哪
const optional = [
  ['DEEPSEEK_API_KEY', 'AI 润色 / 改稿 / 面试'],
  ['AUTH_GITHUB_ID', 'GitHub 登录'],
  ['ADMIN_USERNAME', '运维后台'],
  ['UPSTASH_REDIS_REST_URL', 'AI 面试会话存储'],
];
const off = optional.filter(([key]) => !process.env[key]).map(([, label]) => label);
if (off.length > 0) {
  info(`未启用（不影响编辑与导出）：${off.join('、')}`);
}
