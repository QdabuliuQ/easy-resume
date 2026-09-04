<h1 align="center">青松简历</h1>

<p align="center">
  <strong>简体中文</strong>
  &nbsp;|&nbsp;
  <a href="./README.en.md">English</a>
</p>

<p align="center">
  模块化在线简历编辑器 · 所见即所得 · 本地导出 · 云端同步 · AI 辅助
</p>

<p align="center">
  <a href="https://resume.qdabuliuq.cn/"><strong>🌐 在线预览</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Maintenance-Active-green" alt="Maintenance">
  <br>
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript">
  <br>
  <img src="https://img.shields.io/github/stars/QdabuliuQ/easy-resume?style=social" alt="Stars">
  <img src="https://img.shields.io/github/forks/QdabuliuQ/easy-resume?style=social" alt="Forks">
</p>

<p align="center">
  <img src="https://img.qdabuliuq.cn/easy-resume/preview.webp" width="800" alt="青松简历项目预览">
</p>

## 简介

**青松简历（EasyResume）** 是一款面向求职者的在线简历编辑器。支持模块化编辑与实时画布预览，无需登录即可本地编辑与导出；登录后可云端同步、分享链接，并接入 AI 润色、评分与对话改稿。

## ✨ 功能概览

### 编辑与排版

- 模块化简历：个人信息、工作经历、项目、教育、技能、证书等
- 画布实时预览，拖拽网格布局（`react-grid-layout`）
- Quill 富文本编辑，HTML 经 DOMPurify 安全处理
- 多模板、主题色、字体、页边距等全局样式
- 中英文界面（`next-intl`）

### 导出

| 格式 | 方式 | 说明 |
|------|------|------|
| PDF（高质量） | 服务端 Puppeteer | 还原度最高，需 Chromium |
| PDF（快速） | 浏览器本地 | pdfkit，无需服务端浏览器 |
| PDF（图片版） | 浏览器本地 | 整页截图合成 |
| DOCX | 浏览器本地 | Beta，嵌入预览字体 |
| 图片 | 浏览器本地 | PNG |
| JSON | 浏览器本地 | 配置备份 |

### AI 能力

| 能力 | 模型 | 说明 |
|------|------|------|
| AI 润色 | SenseNova | 工作/项目等描述流式润色 |
| AI 评分 | DeepSeek | 多维度评分与改进建议 |
| AI 帮改 | DeepSeek | 对话式改稿 |
| AI 模拟面试 | DeepSeek | 基于简历的面试练习 |
| 简历导入 | 百度 OCR + LLM | PDF/图片导入填入 |

### 账号与云端

- GitHub / QQ 登录（NextAuth）
- 云端简历同步与多份管理（Cloudflare Workers + D1）
- 分享链接（只读预览）
- 运维后台（`/zh/admin`）：用户与简历管理

## 🛠️ 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 14、React 19、TypeScript |
| UI | Ant Design 5、Tailwind CSS 4 |
| 状态 | MobX |
| 编辑 / 布局 | Quill、@dnd-kit、react-grid-layout |
| 导出 | Puppeteer（服务端 PDF）、pdfkit / docx / snapdom（浏览器本地） |
| AI | LangChain、DeepSeek、SenseNova |
| 登录 | Auth.js / next-auth |
| 云端数据 | Cloudflare Workers + D1（`cf-api/`） |
| 测试 / 规范 | Vitest、ESLint、Prettier、Husky |

## 💻 环境要求

- **Node.js** ≥ 18.17
- **PDF（高质量）**：生产环境需 Chromium（`PUPPETEER_EXECUTABLE_PATH` 或默认 `/usr/bin/chromium-browser`）
- **云端同步（可选）**：本地 `cf-api` Worker 或已部署的 Worker URL

## 🚀 快速开始

```bash
git clone https://github.com/QdabuliuQ/easy-resume.git
cd easy-resume
npm install

cp .env.local.example .env.local
# 按需填写 AI Key；云同步再填 AUTH_* / CF_API_* / ADMIN_*

npm run dev
```

本地访问：`http://localhost:3000/zh/edit`（端口以终端输出为准）。

### 云端 API 本地联调

另开终端：

```bash
cd cf-api
cp .dev.vars.example .dev.vars
npm install
npx wrangler d1 execute easy-resume --local --file=./schema.sql   # 首次
npx wrangler dev --local --port 8787
```

根目录 `.env.local`：

```bash
CF_API_BASE_URL=http://127.0.0.1:8787
CF_API_SECRET=与.dev.vars相同
ADMIN_SECRET=与.dev.vars相同
```

详见 [cf-api/README.md](./cf-api/README.md)。

### 生产构建

```bash
npm run build
npm run start   # 端口 3010
```

## 📜 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动（端口 3010） |
| `npm run test` | Vitest 单元测试 |
| `npm run lint` | ESLint |
| `npm run lint:pritter` | Prettier 格式化 `src/` |

## 🔐 环境变量

在项目根目录创建 `.env.local`（勿提交密钥）。完整注释见 `.env.local.example`。

### AI

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 否 | AI 评分、帮改、模拟面试 |
| `SENSENOVA_API_KEY` | 否 | AI 润色 |
| `BAIDU_OCR_API_KEY` / `BAIDU_OCR_SECRET_KEY` | 否 | 简历 PDF/图片导入 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | 否 | AI 限流与缓存 |

### 登录 + 云端 + 后台

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | NextAuth 密钥（`openssl rand -base64 32`） |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth；回调 `/api/auth/callback/github` |
| `AUTH_QQ_ID` / `AUTH_QQ_SECRET` | QQ 互联（可选） |
| `AUTH_TRUST_HOST` | 反代下建议 `true` |
| `CF_API_BASE_URL` | Worker 根地址（**不要**填主站域名） |
| `CF_API_SECRET` | Next→CF 服务端密钥（`X-CF-Key`） |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 后台登录（`/zh/admin`） |
| `ADMIN_SECRET` | 后台 cookie 签名 + CF 管理接口 |

### 部署

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点对外 URL；**需在 `npm run build` 前配置** |
| `EXPORT_BASE_URL` | Puppeteer 导出页地址（默认 `http://127.0.0.1:3010`） |
| `PUPPETEER_EXECUTABLE_PATH` | 生产 Chromium 路径 |
| `RESUME_PROJECT_ROOT` | 服务器项目绝对路径 |

## 📂 目录结构

```
src/
  app/              # App Router：页面、API
  views/edit/       # 编辑器主界面
  views/admin/      # 运维后台
  modules/          # 简历模块渲染（预览画布）
  components/       # 通用组件
  mobx/             # 全局状态
  lib/              # 工具（导出、AI、字体等）
  json/             # 默认简历与模板
cf-api/             # Cloudflare Workers + D1
public/fonts/       # 简历字体
tests/              # Vitest
```

## 🔒 部署与安全

**Cloudflare 路由（重要）**

- **禁止**：主站 `resume.qdabuliuq.cn/api/* → Worker`（会导致登录 404）
- **正确**：主站 Nginx 全部反代到 Next `:3010`；Worker 用独立域名（如 `api.resume.qdabuliuq.cn`）

**安全要点**

- 浏览器只访问主站；`CF_API_SECRET` / `ADMIN_SECRET` 不下发前端
- Next 从 session 注入 `uid`，再带 `X-CF-Key` 调 CF
- CF 直连无密钥 → 401
- 后台登录有失败次数限制

## 🐳 Docker

```bash
docker-compose up -d
```

访问：`http://localhost:3010/zh`

## 📄 许可

[MIT](./LICENSE)
