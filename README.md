<h1 align="center">青松简历</h1>

<p align="center">
  <strong>简体中文</strong>
  &nbsp;|&nbsp;
  <a href="./README.en.md">English</a>
</p>

<p align="center">AI 简历编辑器 | 快捷编辑 · GitHub 登录云同步 · 本地备份 · AI 协助</p>
<p align="center">基于 Next.js 14（App Router） 的在线简历编辑器：可视化编排模块、富文本编辑、拖拽布局，支持 Puppeteer 导出 PDF / PNG，以及 Cloudflare D1 云端简历同步。
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

**禁止：** Cloudflare 给主站配置 `resume.qdabuliuq.cn/api/* → Worker`（会导致登录 404）。  
**正确：** 主站 Nginx 全部反代到本机 Next `:3010`；Worker 只用独立域名。

国内若 `workers.dev` 超时，生产用已绑的 `api.resume.qdabuliuq.cn`，仍不要绑主站 `/api/*`。

## ✨ 功能概览

- 简历模块编辑（个人信息、工作经历、项目、教育、技能、证书等）
- 画布预览与网格布局（`react-grid-layout`）
- Quill 富文本与 HTML 安全处理（DOMPurify）
- 服务端渲染简历 HTML，PDF/PNG 导出 API
- AI 相关能力（润色、评分、导入等）
- **GitHub 登录**（NextAuth）+ **云端简历**同步（Cloudflare Workers + D1）
- **运维后台**（`/zh/admin`）：用户与简历列表、预览、删除

## 🛠️ 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 14、React 19、TypeScript |
| UI | Ant Design 5、Tailwind CSS 4 |
| 状态 | MobX、mobx-react |
| 编辑器 / 布局 | Quill、@dnd-kit、react-grid-layout |
| 导出 | Puppeteer |
| 登录 | Auth.js / next-auth（GitHub OAuth） |
| 云端数据 | Cloudflare Workers + D1（见 `cf-api/`） |
| 规范 | ESLint 9、Prettier、Husky、Commitlint |

## 💻 环境要求

- **Node.js** ≥ 18.17（见 `package.json` `engines`）
- **PDF/PNG**：生产环境需可用的 Chromium；默认期望可执行文件为 `/usr/bin/chromium-browser`，或通过环境变量指定（见下表）
- **云端同步（可选）**：本地另起 `cf-api` Worker（`wrangler dev --local`），或指向已部署的 Worker URL

## 🚀 快速开始

```bash
npm install
# 若出现 React / Next  peer 依赖冲突，可使用：
# npm install --legacy-peer-deps

cp .env.local.example .env.local
# 按需填写 AI Key；云同步再填 AUTH_* / CF_API_* / ADMIN_*

npm run dev
```

开发服务器默认由 Next 分配端口；本地访问路径形如：`http://localhost:3000/zh/edit`（端口以终端输出为准）。

云端 API 本地联调（另开终端）：

```bash
cd cf-api
cp .dev.vars.example .dev.vars   # 填写 ADMIN_SECRET / CF_API_SECRET
npm install
npx wrangler d1 execute easy-resume --local --file=./schema.sql   # 首次
npx wrangler dev --local --port 8787
```

根目录 `.env.local` 中设置：

```bash
CF_API_BASE_URL=http://127.0.0.1:8787
CF_API_SECRET=与.dev.vars相同   # 或不设，回退 ADMIN_SECRET
ADMIN_SECRET=与.dev.vars相同
```

详细步骤见 [cf-api/README.md](./cf-api/README.md)。

生产构建与启动：

```bash
npm run build
npm run start
```

`start` 脚本固定监听 **3010** 端口。

## 📜 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动（端口 3010） |
| `npm run test` | Vitest 单元测试 |
| `npm run lint` | ESLint |
| `npm run lint:pritter` | Prettier 格式化 `src/` |
| `npm run prepare` | 安装 Husky（`npm install` 后自动执行） |

## 🔐 环境变量

在项目根目录创建 `.env.local`（勿提交密钥到仓库）。完整注释见 `.env.local.example`。

### 本地开发（AI / 导出）

| 变量 | 必填 | 说明 |
|------|------|------|
| `XFYUN_MAAS_API_KEY` | 二选一 | [讯飞星辰 Coding Plan](https://www.xfyun.cn/doc/spark/CodingPlan.html) API Key（`appId:apiSecret`） |
| `CHATANYWHERE_API_KEY` | 二选一 | [ChatAnywhere 免费 API](https://github.com/chatanywhere/GPT_API_free)；讯飞不可用时降级 |
| `DEEPSEEK_API_KEY` | 否 | DeepSeek（AI 对话修改） |
| `BAIDU_OCR_API_KEY` / `BAIDU_OCR_SECRET_KEY` | 否 | 百度 OCR（简历导入） |
| `PUPPETEER_EXECUTABLE_PATH` | 否 | 导出用浏览器路径；开发未设时用 Puppeteer 自带 Chromium |

### GitHub 登录 + 云端简历 + 后台

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | NextAuth 密钥（`openssl rand -base64 32`） |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App；回调 `/api/github/callback` |
| `AUTH_TRUST_HOST` | 反代下建议 `true` |
| `CF_API_BASE_URL` | **Worker 根地址**（生产：`https://api.resume.qdabuliuq.cn`；本地：`http://127.0.0.1:8787`）。**不要**填主站域名 |
| `CF_API_SECRET` | Next→CF 服务端密钥（Header `X-CF-Key`）；不设则回退 `ADMIN_SECRET` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 后台账号密码（路径 `/zh/admin`，走主站） |
| `ADMIN_SECRET` | 后台 cookie 签名 + 调 CF 管理接口（`X-Admin-Key`）；需与 Worker 侧一致 |

> 浏览器**只**访问主站；密钥不下发前端。  
> Worker 密钥：本地 `cf-api/.dev.vars`，线上 `wrangler secret put`。

### 部署专用

| 变量 | 说明 |
|------|------|
| `RESUME_PROJECT_ROOT` | 项目在服务器上的绝对路径 |
| `NEXT_PUBLIC_SITE_URL` | 站点对外根 URL；**需在 `npm run build` 前配置** |
| `EXPORT_BASE_URL` | Puppeteer 打开导出页；默认生产 `http://127.0.0.1:3010` |
| `PUPPETEER_EXECUTABLE_PATH` | 生产 Chromium 路径 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | 可选，AI 限流与缓存 |

## 📂 目录结构（摘要）

```
src/
  app/           # App Router：页面、Layout、API（含 /api/github、/api/resume/cloud、/api/admin）
  components/    # 通用组件（含 auth）
  views/edit/    # 编辑器主界面
  views/admin/   # 运维后台壳
  modules/       # 简历各模块渲染
  mobx/          # 全局状态（含 cloudResumeStore）
  lib/           # 工具（含 cfApi、adminAuth）
  json/          # 默认简历与模板
cf-api/          # Cloudflare Workers + D1 API（详见该目录 README）
public/          # 静态资源
tests/           # Vitest
```

## 🔒 安全要点（云同步）

- **双地址隔离**：登录在主站；数据在 Worker（见上文）
- 用户简历：Next session 注入 `uid`，再带 `X-CF-Key` 调 CF
- CF 直连无密钥 → 401；无 `/api/admin/login`（故意没有）
- 后台登录有失败次数限制

## 🐳 Docker 部署

```bash
docker-compose up -d
```

访问：`http://localhost:3010/zh`
