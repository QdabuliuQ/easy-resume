# syntax=docker/dockerfile:1
# 青松简历（easy-resume）生产镜像
#
# 设计要点：
# 1. 多阶段：devDeps 只留在 builder，运行镜像只含生产依赖
# 2. 依赖必须在容器内安装：宿主机 node_modules 含 darwin 原生二进制（sharp/swc 等），
#    带入 Linux 容器会在运行时崩溃
# 3. 不使用 output:standalone —— 本项目有 puppeteer / pdfkit / subset-font /
#    harfbuzzjs / fontverter 等多个 serverComponentsExternalPackages 与自定义
#    webpack loader，standalone 的依赖追踪对这类包不可靠，宁可镜像大一些
# 4. 密钥绝不进镜像：所有敏感变量运行时注入

# ---------------------------------------------------------------------------
# base：公共系统依赖（无头 Chromium 运行库 + 中文字体）
# 注意：这里不设 NODE_ENV=production，否则 builder 阶段 npm ci 会跳过 devDeps
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS base

# HUSKY=0：容器内没有 .git，跳过 husky install，否则 npm ci 可能失败
# PUPPETEER_SKIP_DOWNLOAD=1：跳过 npm ci 自动下载，改用下方统一安装的匹配版本
# PUPPETEER_CACHE_DIR：固定浏览器位置，便于跨阶段复制与运行时查找
ENV HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    PUPPETEER_CACHE_DIR=/opt/puppeteer

# fonts-noto-cjk 提供中文字体，缺失会导致导出的 PDF 中文变成豆腐块
# 其余为 Chromium 无头运行的系统依赖
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fonts-noto-cjk \
    fonts-liberation \
    fonts-ipafont-gothic \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------------------------------------------------------------------------
# prod-deps：生产依赖 + 与 puppeteer 版本匹配的 Chrome
# ---------------------------------------------------------------------------
FROM base AS prod-deps

COPY package.json package-lock.json .npmrc ./

RUN npm ci --omit=dev --no-audit --no-fund

# 安装与 puppeteer 配对的 Chrome。apt 自带的 chromium 版本通常明显落后，
# 与 puppeteer 24.x 的 CDP 协议可能不匹配，导致 PDF/PNG 导出失败。
# Chrome for Testing 不保证所有架构都有产物（如 linux/arm64 部分版本缺失），
# 因此失败时回退到发行版 chromium，保证镜像仍可构建。
RUN mkdir -p "$PUPPETEER_CACHE_DIR" \
  && (npx puppeteer browsers install chrome \
      || (apt-get update \
          && apt-get install -y --no-install-recommends chromium \
          && rm -rf /var/lib/apt/lists/*))

# ---------------------------------------------------------------------------
# builder：全量依赖 + 构建
# ---------------------------------------------------------------------------
FROM base AS builder

COPY package.json package-lock.json .npmrc ./

# 此处必须安装 devDeps（typescript、tailwind、eslint 配置等参与构建）
RUN npm ci --no-audit --no-fund

COPY . .

# NEXT_PUBLIC_* 在构建时被打进前端 bundle，运行时改不了，只能通过 build-arg 注入
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3010
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# 导出字体：public/fonts 未纳入仓库，脚本会按「已有 woff2 → 同名 ttf 转换 →
# RESUME_FONT_BASE_URL 下载」的顺序尽力补齐，全部失败也只警告、不中断构建
ARG RESUME_FONT_BASE_URL=""
ENV RESUME_FONT_BASE_URL=${RESUME_FONT_BASE_URL}

RUN node scripts/prepare-resume-fonts.mjs || true

RUN npm run build

# ---------------------------------------------------------------------------
# runner：最终镜像
# ---------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production \
    PORT=3010 \
    EXPORT_BASE_URL=http://127.0.0.1:3010 \
    TEMPLATE_OVERRIDES_PATH=/data/template-overrides.json

# 浏览器
COPY --from=prod-deps /opt/puppeteer /opt/puppeteer

# 运行期依赖与应用产物
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
# 启动自检脚本（entrypoint 会调用）
COPY --from=builder /app/scripts/docker-preflight.mjs ./scripts/docker-preflight.mjs

# 启动脚本：自动生成 AUTH_SECRET、解析 Chromium 路径
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh && mkdir -p /data

EXPOSE 3010

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "start"]
