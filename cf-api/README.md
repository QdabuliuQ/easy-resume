# 青松简历 API（Cloudflare Workers + D1）

无第三方运行时依赖。本地 `wrangler --local` 使用独立 SQLite，**不读写云端 D1**。

GitHub 登录由 **Next.js NextAuth** 完成；本 Worker 只存用户/简历数据，并校验服务端密钥。

## 目录

```
cf-api/
  wrangler.toml          # Worker + D1 绑定 + 线上 [vars]
  .dev.vars.example      # 复制为 .dev.vars（仅本地，勿提交）
  schema.sql             # users / resume_header / resume_module
  src/index.js           # 全部接口
  README.md
```

## 表结构

| 表 | 字段 |
|----|------|
| `users` | `id` UUID PK, `github_id` UNIQUE, `username`, `avatar`, `email`, `create_at` |
| `resume_header` | `id` UUID PK, `user_id` → users, `update_at` |
| `resume_module` | `id` UUID PK, `resume_id` → resume_header, `module_type`, `module_json` |

`module_type`：`base` / `education` / `work` / `project` / `skill`  
关联：`users` 1:N `resume_header` 1:N `resume_module`

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/sync` | NextAuth 登录后同步用户（需 `X-CF-Key`） |
| GET | `/api/admin/stats` | 后台统计（需 `X-Admin-Key`） |
| GET | `/api/admin/resumes?uid=&q=` | 后台简历列表 |
| GET | `/api/admin/resume?id=` | 后台预览 |
| DELETE | `/api/admin/resume?id=` | 后台删除 |
| GET | `/api/resume/list?uid=` | 用户简历列表（需 `X-CF-Key`） |
| GET | `/api/resume/get?id=&uid=` | 单份简历（密钥 + 归属） |
| POST | `/api/resume/save` | 保存（需 `X-CF-Key`） |
| DELETE | `/api/resume/remove?id=&uid=` | 删除（密钥 + 归属） |
| GET | `/api/health` | 健康检查 |
| GET | `/api/github/login\|callback` | **已停用**，返回 410 |

CORS：`http://localhost:3000`、`https://resume.qdabuliuq.cn`。

---

## 一、创建 D1（仅首次）

```bash
cd cf-api
npm install
npx wrangler d1 create easy-resume --location apac
```

把输出的 `database_id` 填进 `wrangler.toml`。

## 二、建表

```bash
# 本地隔离库
npx wrangler d1 execute easy-resume --local --file=./schema.sql

# 云端
npx wrangler d1 execute easy-resume --remote --file=./schema.sql
```

## 三、本地调试

```bash
cd cf-api
cp .dev.vars.example .dev.vars
# 填写 ADMIN_SECRET、CF_API_SECRET（可与根目录 .env.local 相同）

npx wrangler dev --local --port 8787
```

根目录 `.env.local`：

```bash
CF_API_BASE_URL=http://127.0.0.1:8787
ADMIN_SECRET=...          # 与 .dev.vars 一致
CF_API_SECRET=...         # 可选；不设则用 ADMIN_SECRET
```

验证：

```bash
curl -s http://127.0.0.1:8787/api/health
```

Next 前端继续用 `npm run dev`（默认 3000）。

## 四、线上部署

```bash
cd cf-api

# 密钥（与 Next 服务器环境变量一致）
npx wrangler secret put CF_API_SECRET
npx wrangler secret put ADMIN_SECRET

npx wrangler deploy
```

部署成功后记下 `https://xxx.workers.dev`，写入 Next 生产环境的 `CF_API_BASE_URL`。

`wrangler.toml [vars]` 仅保留非密钥项（如 `FRONTEND_URL`）。

浏览器应只打 Next；**不要**让前端直连 Worker 并携带密钥。

## 五、示例（需密钥）

```bash
KEY=your-cf-api-secret

curl -s -X POST http://127.0.0.1:8787/api/resume/save \
  -H "Content-Type: application/json" \
  -H "X-CF-Key: $KEY" \
  -d '{"uid":"用户UUID","content":{"name":"张三","globalStyle":{},"pages":[{"modules":[]}]}}'

curl -s "http://127.0.0.1:8787/api/resume/list?uid=用户UUID" -H "X-CF-Key: $KEY"

curl -s -X DELETE "http://127.0.0.1:8787/api/resume/remove?id=简历UUID&uid=用户UUID" \
  -H "X-CF-Key: $KEY"
```

## 六、安全说明

- `/api/resume/*`、`/api/user/sync`：`X-CF-Key` = `CF_API_SECRET`（或回退 `ADMIN_SECRET`）
- 管理接口：`X-Admin-Key` = `ADMIN_SECRET`
- 密钥仅存 Next 服务端与 Worker secret，不下发浏览器
- `uid` 由 NextAuth session 注入，CF 侧再校验简历归属
