<h1 align="center">EasyResume</h1>

<p align="center">
  <a href="./README.md">简体中文</a>
  &nbsp;|&nbsp;
  <strong>English</strong>
</p>

<p align="center">AI resume editor · Fast editing · GitHub cloud sync · Local backup · AI-assisted</p>
<p align="center">Online resume editor on Next.js 14 (App Router): visual modules, rich text, drag-and-drop layout, Puppeteer PDF/PNG export, and Cloudflare D1 cloud sync.</p>

<p align="center">
  <a href="https://resume.qdabuliuq.cn/"><strong>🌐 Live demo</strong></a>
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
  <img src="https://img.qdabuliuq.cn/easy-resume/preview.webp" width="800" alt="EasyResume preview">
</p>

## ✨ Features

- Modular resume editing (profile, work, projects, education, skills, certifications, etc.)
- Canvas preview with grid layout (`react-grid-layout`)
- Quill rich text with sanitized HTML (DOMPurify)
- Server-rendered resume HTML; PDF/PNG export APIs
- AI-assisted polish, scoring, import, etc.
- **GitHub sign-in** (NextAuth) + **cloud resumes** (Cloudflare Workers + D1)
- **Admin console** (`/zh/admin`): users, resumes, preview, delete

## 🛠️ Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 14, React 19, TypeScript |
| UI | Ant Design 5, Tailwind CSS 4 |
| State | MobX, mobx-react |
| Editor / layout | Quill, @dnd-kit, react-grid-layout |
| Export | Puppeteer |
| Auth | Auth.js / next-auth (GitHub OAuth) |
| Cloud data | Cloudflare Workers + D1 (`cf-api/`) |
| Tooling | ESLint 9, Prettier, Husky, Commitlint |

## 💻 Requirements

- **Node.js** ≥ 18.17 (see `package.json` `engines`)
- **PDF/PNG**: Chromium in production (`PUPPETEER_EXECUTABLE_PATH` or default `/usr/bin/chromium-browser`)
- **Cloud sync (optional)**: local `cf-api` via `wrangler dev --local`, or a deployed Worker URL

## 🚀 Quick start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Cloud API (separate terminal):

```bash
cd cf-api
cp .dev.vars.example .dev.vars
npx wrangler d1 execute easy-resume --local --file=./schema.sql   # first time
npx wrangler dev --local --port 8787
```

In root `.env.local`:

```bash
CF_API_BASE_URL=http://127.0.0.1:8787
ADMIN_SECRET=same-as-dev-vars
CF_API_SECRET=same-as-dev-vars   # optional; falls back to ADMIN_SECRET
```

See [cf-api/README.md](./cf-api/README.md).

```bash
npm run build && npm run start   # port 3010
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development |
| `npm run build` | Production build |
| `npm run start` | Production (port 3010) |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |
| `npm run lint:pritter` | Prettier `src/` |

## 🔐 Environment variables

See `.env.local.example`. Highlights:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` / `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | NextAuth GitHub OAuth; callback `/api/github/callback` |
| `CF_API_BASE_URL` | Worker base URL |
| `CF_API_SECRET` | Server→CF key (`X-CF-Key`); falls back to `ADMIN_SECRET` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SECRET` | Admin console at `/zh/admin` |

Never ship `CF_API_SECRET` / `ADMIN_SECRET` to the browser. Worker secrets: local `.dev.vars`, production `wrangler secret put`.

## 📂 Layout

```
src/app/          # App Router (incl. /api/github, /api/resume/cloud, /api/admin)
src/views/admin/  # Admin shell
cf-api/           # Cloudflare Workers + D1
tests/            # Vitest
```

## 🔒 Cloud security

- Next injects `uid` from session, then calls CF with `X-CF-Key`
- Direct CF `/api/resume/*` without key → 401
- Admin login is rate-limited; legacy CF GitHub OAuth routes return 410

## 🐳 Docker

```bash
docker-compose up -d
```

Open: `http://localhost:3010/zh`
