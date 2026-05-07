# Easy Resume

基于 **Next.js 14（App Router）** 的在线简历编辑器：可视化编排模块、富文本编辑、拖拽布局，并支持通过 **Puppeteer** 导出 PDF / PNG。

## 功能概览

- 简历模块编辑（个人信息、工作经历、项目、教育、技能、证书等）
- 画布预览与网格布局（`react-grid-layout`）
- Quill 富文本与 HTML 安全处理（DOMPurify）
- 服务端渲染简历 HTML，PDF/PNG 导出 API
- AI 相关能力（智谱 BigModel / ChatAnywhere 转发，需配置密钥）
- 生产环境构建版本检测提示（`/api/version`）

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 14、React 19、TypeScript |
| UI | Ant Design 5、Tailwind CSS 4 |
| 状态 | MobX、mobx-react |
| 编辑器 / 布局 | Quill、@dnd-kit、react-grid-layout |
| 导出 | Puppeteer |
| 规范 | ESLint 9、Prettier、Husky、Commitlint |

## 环境要求

- **Node.js** ≥ 18.17（见 `package.json` `engines`）
- **PDF/PNG**：生产环境需可用的 Chromium；默认期望可执行文件为 `/usr/bin/chromium-browser`，或通过环境变量指定（见下表）

## 快速开始

```bash
npm install
# 若出现 React / Next  peer 依赖冲突，可使用：
# npm install --legacy-peer-deps

npm run dev
```

开发服务器默认由 Next 分配端口；应用配置了 **`basePath: /easy-resume`**，本地访问路径形如：`http://localhost:3000/easy-resume/edit`（端口以终端输出为准）。

生产构建与启动：

```bash
npm run build
npm run start
```

`start` 脚本固定监听 **3010** 端口。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动（端口 3010） |
| `npm run lint` | ESLint |
| `npm run lint:pritter` | Prettier 格式化 `src/` |
| `npm run prepare` | 安装 Husky（`npm install` 后自动执行） |
| `npm run commit` | Gitmoji 交互式提交（需全局或本地安装 `gitmoji-cli`） |

## 环境变量

按需创建 `.env.local`（勿提交密钥到仓库）。

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_BASE_PATH` | 一般由 `next.config.mjs` 注入为 `/easy-resume`，与部署子路径一致 |
| `NEXT_PUBLIC_SITE_URL` | 站点根 URL；PDF 内相对链接补全时的备选基准 |
| `PDF_LINK_BASE_URL` | PDF 中 `<a href>` 解析基准 URL（优先于 `NEXT_PUBLIC_SITE_URL`） |
| `VERCEL_URL` | Vercel 部署时由平台提供，用于链接补全 |
| `BIGMODEL_API_KEY` | 智谱 BigModel API 密钥 |
| `CHATANYWHERE_API_KEY` / `BASE_API_KEY` | ChatAnywhere 转发用密钥 |
| `PUPPETEER_EXECUTABLE_PATH` | 生产环境 Chromium 可执行文件路径 |

## 目录结构（摘要）

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

## 部署说明

- **`basePath`** 当前为 `/easy-resume`，反向代理或静态托管时需将站点挂载在同一子路径，或按需修改 `next.config.mjs` 中的 `basePath` 并同步 CDN/网关规则。
- 服务器导出 PDF/PNG 时请确保 Chromium 可用，并正确设置 `PUPPETEER_EXECUTABLE_PATH`（或使用镜像内默认路径）。
