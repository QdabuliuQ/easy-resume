# 青松简历 API（Cloudflare Workers + D1）

无第三方运行时依赖。本地 `wrangler --local` 使用独立 SQLite，**不读写云端 D1**。

## 双地址隔离（必读）

| | 主站 Next | 本 Worker |
|--|-----------|-----------|
| 域名 | `https://resume.qdabuliuq.cn` | `https://easy-resume-db.easy-resume.workers.dev`（或独立子域） |
| 登录 | `/api/admin/login`、NextAuth `/api/github` | **无登录接口** |
| 数据 | 浏览器调 `/api/admin/stats`、`/api/resume/cloud` 等（Next 代理） | 真实 D1：`/api/admin/stats`、`/api/resume/*`、`/api/user/sync` |
| 谁访问 | 浏览器 | **仅 Next 服务端**（`CF_API_BASE_URL` + 密钥） |

```
浏览器 ──► resume.qdabuliuq.cn (Next :3010)
                │  Cookie / Session
                ▼
           服务端 fetch(CF_API_BASE_URL + 路径)
                │  X-CF-Key / X-Admin-Key
                ▼
           easy-resume-db…workers.dev (本仓库)
```

**禁止** Cloudflare Routes：`resume.qdabuliuq.cn/api/*` → 本 Worker（会抢走登录，返回 404）。  
Nginx 主站只反代本机 Next；本 Worker 只用独立域名。

国内访问 `workers.dev` 若超时：给 Worker 绑 `api.resume.qdabuliuq.cn`，`CF_API_BASE_URL` 改成该子域即可（仍勿绑主站 `/api/*`）。

## 目录

```
cf-api/
  wrangler.toml
  .dev.vars.example
  schema.sql
  src/index.js
  README.md
```

## 表结构

| 表 | 字段 |
|----|------|
| `users` | `id` UUID PK, `github_id` UNIQUE, `username`, `avatar`, `email`, `create_at` |
| `resume_header` | `id` UUID PK, `user_id` → users, `update_at` |
| `resume_module` | `id` UUID PK, `resume_id` → resume_header, `module_type`, `module_json` |

`module_type`：`base` / `education` / `work` / `project` / `skill`

## 本 Worker 接口（数据层）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/sync` | 同步用户（`X-CF-Key`） |
| GET | `/api/admin/stats` | 后台统计（`X-Admin-Key`） |
| GET | `/api/admin/resumes?uid=&q=` | 后台简历列表 |
| GET | `/api/admin/resume?id=` | 后台预览 |
| DELETE | `/api/admin/resume?id=` | 后台删除 |
| GET | `/api/resume/list?uid=` | 用户简历列表（`X-CF-Key`） |
| GET | `/api/resume/get?id=&uid=` | 单份简历 |
| POST | `/api/resume/save` | 保存 |
| DELETE | `/api/resume/remove?id=&uid=` | 删除 |
| GET | `/api/health` | 健康检查 |

**没有** `/api/admin/login`（登录在主站 Next）。

## 一、创建 D1（仅首次）

```bash
cd cf-api && npm install
npx wrangler d1 create easy-resume --location apac
# 把 database_id 填进 wrangler.toml
```

## 二、建表

```bash
npx wrangler d1 execute easy-resume --local --file=./schema.sql
npx wrangler d1 execute easy-resume --remote --file=./schema.sql
```

## 三、本地调试

```bash
cp .dev.vars.example .dev.vars   # ADMIN_SECRET / CF_API_SECRET
npx wrangler dev --local --port 8787
```

根目录 `.env.local`：

```bash
CF_API_BASE_URL=http://127.0.0.1:8787
ADMIN_SECRET=与.dev.vars一致
CF_API_SECRET=与.dev.vars一致   # 可选
```

```bash
curl -s http://127.0.0.1:8787/api/health
```

## 四、线上部署（可在本机执行）

```bash
npx wrangler secret put CF_API_SECRET
npx wrangler secret put ADMIN_SECRET
npx wrangler deploy
```

Next 生产环境：

```bash
CF_API_BASE_URL=https://easy-resume-db.easy-resume.workers.dev
# 或自定义子域 https://api.resume.qdabuliuq.cn
```

`wrangler.toml` 保持 `workers_dev = true`（若继续用 workers.dev）。  
**不要**在 Dashboard 给主站加 `/api/*` Worker 路由。

## 五、示例（直接打 Worker，需密钥）

```bash
KEY=your-secret
BASE=https://easy-resume-db.easy-resume.workers.dev

curl -s "$BASE/api/health"
curl -s "$BASE/api/admin/stats" -H "X-Admin-Key: $KEY"
```

## 六、安全

- 数据接口必须带 `X-CF-Key` 或 `X-Admin-Key`
- 密钥只在 Next 与 Worker secret，不下发浏览器
- `uid` 由 NextAuth session 注入后再调本 Worker
