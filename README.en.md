<h1 align="center">EasyResume</h1>

<p align="center">
  <a href="./README.md">简体中文</a>
  &nbsp;|&nbsp;
  <strong>English</strong>
</p>

<p align="center">
  Modular online resume editor · WYSIWYG · Local export · Cloud sync · AI-assisted
</p>

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

## Overview

**EasyResume (青松简历)** is an online resume editor for job seekers. Edit with modular blocks and a live canvas preview—no sign-in required for local editing and export. Sign in for cloud sync, share links, and AI polish, scoring, and chat-based edits.

## ✨ Features

### Editing & layout

- Modular resume: profile, work, projects, education, skills, certifications, etc.
- Live canvas preview with drag-and-drop grid (`react-grid-layout`)
- Quill rich text with sanitized HTML (DOMPurify)
- Multiple templates, accent colors, fonts, page padding
- Chinese / English UI (`next-intl`)

### Export

| Format | Where | Notes |
|--------|-------|-------|
| PDF (high quality) | Server (Puppeteer) | Best fidelity; needs Chromium |
| PDF (fast) | Browser | pdfkit; no server browser |
| PDF (image) | Browser | Full-page screenshots |
| DOCX | Browser | Beta; embeds preview fonts |
| Image | Browser | PNG |
| JSON | Browser | Config backup |

### AI

| Feature | Model | Notes |
|---------|-------|-------|
| AI polish | SenseNova | Streaming rewrite for job/project descriptions |
| AI score | DeepSeek | Multi-dimension scoring and suggestions |
| AI modify | DeepSeek | Chat-based edits |
| AI mock interview | DeepSeek | Practice from your resume |
| Resume import | Baidu OCR + LLM | Fill from PDF/image |

### Account & cloud

- GitHub / QQ sign-in (NextAuth)
- Cloud resume sync (Cloudflare Workers + D1)
- Share links (read-only preview)
- Admin console (`/zh/admin`): users and resumes

## 🛠️ Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 14, React 19, TypeScript |
| UI | Ant Design 5, Tailwind CSS 4 |
| State | MobX |
| Editor / layout | Quill, @dnd-kit, react-grid-layout |
| Export | Puppeteer (server PDF), pdfkit / docx / snapdom (browser) |
| AI | LangChain, DeepSeek, SenseNova |
| Auth | Auth.js / next-auth |
| Cloud data | Cloudflare Workers + D1 (`cf-api/`) |
| Tooling | Vitest, ESLint, Prettier, Husky |

## 💻 Requirements

- **Node.js** ≥ 18.17
- **High-quality PDF**: Chromium in production (`PUPPETEER_EXECUTABLE_PATH` or default `/usr/bin/chromium-browser`)
- **Cloud sync (optional)**: local `cf-api` Worker or deployed Worker URL

## 🚀 Quick start

```bash
git clone https://github.com/QdabuliuQ/easy-resume.git
cd easy-resume
npm install

cp .env.local.example .env.local
# Add AI keys as needed; AUTH_* / CF_API_* / ADMIN_* for cloud sync

npm run dev
```

Open: `http://localhost:3000/en/edit` (port from terminal).

### Local cloud API

Separate terminal:

```bash
cd cf-api
cp .dev.vars.example .dev.vars
npm install
npx wrangler d1 execute easy-resume --local --file=./schema.sql   # first time
npx wrangler dev --local --port 8787
```

Root `.env.local`:

```bash
CF_API_BASE_URL=http://127.0.0.1:8787
CF_API_SECRET=same-as-dev-vars
ADMIN_SECRET=same-as-dev-vars
```

See [cf-api/README.md](./cf-api/README.md).

### Production

```bash
npm run build
npm run start   # port 3010
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

Create `.env.local` at repo root (never commit secrets). Full list: `.env.local.example`.

### AI

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | No | AI score, modify, mock interview |
| `SENSENOVA_API_KEY` | No | AI polish |
| `BAIDU_OCR_API_KEY` / `BAIDU_OCR_SECRET_KEY` | No | Resume PDF/image import |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | No | AI rate limit & cache |

### Auth + cloud + admin

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth; callback `/api/auth/callback/github` |
| `AUTH_QQ_ID` / `AUTH_QQ_SECRET` | QQ Connect (optional) |
| `AUTH_TRUST_HOST` | Set `true` behind reverse proxy |
| `CF_API_BASE_URL` | Worker base URL (**not** the main site domain) |
| `CF_API_SECRET` | Server→CF key (`X-CF-Key`) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login (`/zh/admin`) |
| `ADMIN_SECRET` | Admin cookie signing + CF admin API |

### Deploy

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL; set **before** `npm run build` |
| `EXPORT_BASE_URL` | Puppeteer export page (default `http://127.0.0.1:3010`) |
| `PUPPETEER_EXECUTABLE_PATH` | Production Chromium path |
| `RESUME_PROJECT_ROOT` | Absolute project path on server |

## 📂 Layout

```
src/
  app/              # App Router: pages, API
  views/edit/       # Editor shell
  views/admin/      # Admin console
  modules/          # Resume module render (canvas)
  components/       # Shared UI
  mobx/             # Global state
  lib/              # Export, AI, fonts, etc.
  json/             # Defaults & templates
cf-api/             # Cloudflare Workers + D1
public/fonts/       # Resume fonts
tests/              # Vitest
```

## 🔒 Deploy & security

**Cloudflare routing (important)**

- **Do not** route main site `resume.qdabuliuq.cn/api/*` to Worker (breaks login with 404)
- **Do** proxy the main site to Next on `:3010`; use a separate Worker domain (e.g. `api.resume.qdabuliuq.cn`)

**Security**

- Browser only talks to the main site; secrets stay server-side
- Next injects `uid` from session, then calls CF with `X-CF-Key`
- Direct CF access without key → 401
- Admin login is rate-limited

## 🐳 Docker

```bash
docker-compose up -d
```

Open: `http://localhost:3010/en`

## 📄 License

[MIT](./LICENSE)
