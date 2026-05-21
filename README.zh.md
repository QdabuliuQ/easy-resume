<h1 align="center">Easy Resume</h1>

<p align="center">
  <a href="./README.md">English</a>
  &nbsp;|&nbsp;
  <a href="./README.zh.md">简体中文</a>
</p>

<p align="center">AI 简历编辑器 | 快捷编辑 · 数据安全 · 本地存储备份 · AI 协助</p>
<p align="center">基于 Next.js 14（App Router） 的在线简历编辑器：可视化编排模块、富文本编辑、拖拽布局，并支持通过 Puppeteer 导出 PDF / PNG。
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
  <img src="./screenshots/preview.png" width="800" alt="Easy Resume 项目预览">
</p>

## ✨ 功能概览

- 简历模块编辑（个人信息、工作经历、项目、教育、技能、证书等）
- 画布预览与网格布局（`react-grid-layout`）
- Quill 富文本与 HTML 安全处理（DOMPurify）
- 服务端渲染简历 HTML，PDF/PNG 导出 API
- AI 相关能力，支持 AI 润色优化

## 🛠️ 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 14、React 19、TypeScript |
| UI | Ant Design 5、Tailwind CSS 4 |
| 状态 | MobX、mobx-react |
| 编辑器 / 布局 | Quill、@dnd-kit、react-grid-layout |
| 导出 | Puppeteer |
| 规范 | ESLint 9、Prettier、Husky、Commitlint |

## 💻 环境要求

- **Node.js** ≥ 18.17（见 `package.json` `engines`）
- **PDF/PNG**：生产环境需可用的 Chromium；默认期望可执行文件为 `/usr/bin/chromium-browser`，或通过环境变量指定（见下表）

## 🚀 快速开始

```bash
npm install
# 若出现 React / Next  peer 依赖冲突，可使用：
# npm install --legacy-peer-deps

npm run dev
```

开发服务器默认由 Next 分配端口；本地访问路径形如：`http://localhost:3000/zh/edit`（端口以终端输出为准）。

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
| `npm run lint` | ESLint |
| `npm run lint:pritter` | Prettier 格式化 `src/` |
| `npm run prepare` | 安装 Husky（`npm install` 后自动执行） |
| `npm run commit` | Gitmoji 交互式提交（需全局或本地安装 `gitmoji-cli`） |

## 🔐 环境变量

在项目根目录创建 `.env.local`（勿提交密钥到仓库）。可参考 `.env.local.example`。

### 本地开发

| 变量 | 必填 | 说明 |
|------|------|------|
| `BIGMODEL_API_KEY` | 是 | [智谱 AI 开放平台](https://open.bigmodel.cn/) 的 API Key，用于 AI 润色、简历评分等（默认模型 GLM-4.7-Flash） |
| `CHATANYWHERE_API_KEY` | 是 | [ChatAnywhere 免费 API](https://github.com/chatanywhere/GPT_API_free) 的 Key；智谱请求失败时会自动降级走该中转（默认模型 deepseek-v4-flash） |
| `PUPPETEER_EXECUTABLE_PATH` | 否 | 导出 PDF/PNG 时 Puppeteer 使用的浏览器可执行文件路径。开发环境未设置时由 Puppeteer 自带 Chromium；生产环境 Linux 默认 `/usr/bin/chromium-browser` |

`PUPPETEER_EXECUTABLE_PATH` 示例：

| 系统 | 示例路径 |
|------|----------|
| macOS（Google Chrome） | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Windows（Google Chrome） | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Linux（Chromium） | `/usr/bin/chromium-browser` 或 `/usr/bin/chromium` |

### 部署专用

以下变量仅在服务器部署时需要配置：

| 变量 | 说明 |
|------|------|
| `RESUME_PROJECT_ROOT` | 项目在服务器上的绝对路径，例如 `/root/easy-resume`（PM2 / 脚本等工作目录） |
| `NEXT_PUBLIC_SITE_URL` | 站点对外访问的根 URL，例如 `https://resume.example.com`；用于 PDF 内相对链接补全、站点元信息。**需在 `npm run build` 前配置**，否则客户端 bundle 中不会生效 |

可选（启用 AI 评分限流与缓存时需配置，见 `.env.local.example`）：

| 变量 | 说明 |
|------|------|
| `UPSTASH_REDIS_REST_URL` | [Upstash Redis](https://console.upstash.com) REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token |

## 📂 目录结构（摘要）

```
src/
  app/           # App Router：页面、Layout、API Routes（pdf/png/version/chat 等）
  components/    # 通用组件
  views/edit/    # 编辑器主界面（画布、侧栏、头部等）
  modules/       # 简历各模块渲染与类型
  mobx/          # 全局状态
  lib/           # Puppeteer、字体、API 转发等工具
  utils/         # 通用工具函数
  json/          # 默认简历与模板数据
public/          # 静态资源（含字体等）
middleware.ts    # Next.js 中间件
```

## 🐳 Docker 部署

```bash
docker-compose up -d
```

访问：`http://localhost:3010/zh`
