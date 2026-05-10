<h1 align="center">Easy Resume</h1>

<p align="center">
  <a href="./README.md">English</a>
  &nbsp;|&nbsp;
  <a href="./README.zh.md">简体中文</a>
</p>

<p align="center">AI resume editor · Fast editing · Data security · Local storage backup · AI-assisted</p>
<p align="center">Online resume editor built on Next.js 14 (App Router): visually compose modules, rich text editing, drag-and-drop layout, with PDF / PNG export via Puppeteer.</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/github/v/release/QdabuliuQ/easy-resume" alt="Release">
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
  <img src="./screenshots/preview.png" width="800" alt="Easy Resume preview">
</p>

## ✨ Features

- Modular resume editing (profile, work experience, projects, education, skills, certifications, etc.)
- Canvas preview with grid layout (`react-grid-layout`)
- Quill rich text with sanitized HTML (DOMPurify)
- Server-rendered resume HTML; PDF/PNG export APIs
- AI-assisted polishing and optimization

## 🛠️ Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 14, React 19, TypeScript |
| UI | Ant Design 5, Tailwind CSS 4 |
| State | MobX, mobx-react |
| Editor / layout | Quill, @dnd-kit, react-grid-layout |
| Export | Puppeteer |
| Tooling | ESLint 9, Prettier, Husky, Commitlint |

## 💻 Requirements

- **Node.js** ≥ 18.17 (see `package.json` `engines`)
- **PDF/PNG**: Chromium must be available in production; default executable `/usr/bin/chromium-browser`, or set via environment variables (see table below)

## 🚀 Quick start

```bash
npm install
# If React / Next peer dependency conflicts:
# npm install --legacy-peer-deps

npm run dev
```

The dev server port is assigned by Next.js. This app uses **`basePath: /easy-resume`**, so local URLs look like `http://localhost:3000/easy-resume/edit` (use the port printed in the terminal).

Production build and run:

```bash
npm run build
npm run start
```

The `start` script listens on **3010**.

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development |
| `npm run build` | Production build |
| `npm run start` | Production server (port 3010) |
| `npm run lint` | ESLint |
| `npm run lint:pritter` | Prettier format `src/` |
| `npm run prepare` | Husky (runs after `npm install`) |
| `npm run commit` | Gitmoji interactive commit (install `gitmoji-cli` globally or locally) |

## 🔐 Environment variables

Create `.env.local` as needed (do not commit secrets).

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_PATH` | Usually `/easy-resume` from `next.config.mjs`, aligned with deploy subpath |
| `NEXT_PUBLIC_SITE_URL` | Site root URL; fallback base for resolving relative links in PDF |

## 📂 Project layout (summary)

```
src/
  app/           # App Router: pages, layout, API routes (pdf/png/version/chat, etc.)
  components/    # Shared components
  views/edit/    # Editor shell (canvas, sidebar, header, etc.)
  modules/       # Resume module renderers & types
  mobx/          # Global state
  lib/           # Puppeteer, fonts, API proxies, helpers
  utils/         # Utilities
  json/          # Default resume & template data
public/          # Static assets (fonts, etc.)
middleware.ts    # Next.js middleware
```

## 🐳 Docker deployment

```bash
docker-compose up -d
```

Open: `http://localhost:3010/easy-resume`
