#!/bin/sh
# 青松简历容器启动脚本
#
# 职责：
# 1. 零配置可跑：未提供 AUTH_SECRET 时自动生成并持久化到 /data
#    （NextAuth v5 在 NODE_ENV=production 下缺少该变量会抛 MissingSecret）
# 2. 解析无头 Chromium 可执行文件路径（版本目录随安装变化，不能写死在镜像里）
# 3. 提示哪些可选功能因缺少配置而未启用
# 4. 调用 docker-preflight.mjs 做统一自检（密钥默认值、字体、可选能力）
set -eu

DATA_DIR="${DATA_DIR:-/data}"
SECRET_FILE="$DATA_DIR/auth-secret"

# ---------------------------------------------------------------------------
# 1. AUTH_SECRET
# ---------------------------------------------------------------------------
if [ -z "${AUTH_SECRET:-}" ]; then
  if [ -f "$SECRET_FILE" ]; then
    AUTH_SECRET="$(cat "$SECRET_FILE")"
    echo "[entrypoint] 复用已保存的 AUTH_SECRET ($SECRET_FILE)"
  else
    # 优先用 node 生成（镜像一定有），不依赖 openssl
    AUTH_SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))")"
    if mkdir -p "$DATA_DIR" 2>/dev/null && printf '%s' "$AUTH_SECRET" > "$SECRET_FILE" 2>/dev/null; then
      chmod 600 "$SECRET_FILE" 2>/dev/null || true
      echo "[entrypoint] 已生成 AUTH_SECRET 并保存到 $SECRET_FILE"
    else
      echo "[entrypoint] 警告：无法写入 $DATA_DIR，AUTH_SECRET 仅本次进程有效，重启后登录态会失效"
      echo "[entrypoint]       请为 /data 挂载可写 volume"
    fi
  fi
  export AUTH_SECRET
else
  echo "[entrypoint] 使用外部注入的 AUTH_SECRET"
fi

# ---------------------------------------------------------------------------
# 2. Chromium 可执行文件路径
#    getPuppeteerLaunchOptions() 在未显式配置时会回退到 /usr/bin/chromium*，
#    而本镜像的浏览器实际位置由构建期决定，需显式解析后导出
# ---------------------------------------------------------------------------
if [ -z "${PUPPETEER_EXECUTABLE_PATH:-}" ]; then
  CHROME_BIN="$(find "${PUPPETEER_CACHE_DIR:-/opt/puppeteer}" -type f -name chrome 2>/dev/null | head -n 1 || true)"
  # 回退：构建时 Chrome for Testing 下载失败会安装发行版 chromium
  if [ -z "$CHROME_BIN" ]; then
    for candidate in /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/google-chrome-stable; do
      if [ -x "$candidate" ]; then
        CHROME_BIN="$candidate"
        break
      fi
    done
  fi
  if [ -n "$CHROME_BIN" ]; then
    PUPPETEER_EXECUTABLE_PATH="$CHROME_BIN"
    export PUPPETEER_EXECUTABLE_PATH
    echo "[entrypoint] Chromium: $PUPPETEER_EXECUTABLE_PATH"
  else
    echo "[entrypoint] 警告：未找到 Chromium，PDF/PNG 导出将不可用"
  fi
fi

# ---------------------------------------------------------------------------
# 3. 未配置项提示（不阻断启动，对应功能会降级）
#    字体是否齐备、密钥是否仍为默认值由 docker-preflight.mjs 统一检查
# ---------------------------------------------------------------------------
warn_missing() {
  echo "[entrypoint] 未配置 $1 —— $2"
}

[ -n "${DEEPSEEK_API_KEY:-}" ] || warn_missing DEEPSEEK_API_KEY "AI 润色 / 对话修改 / 模拟面试不可用"
[ -n "${CF_API_BASE_URL:-}" ] || warn_missing CF_API_BASE_URL "云端简历同步不可用"
[ -n "${AUTH_GITHUB_ID:-}" ] || warn_missing AUTH_GITHUB_ID "GitHub 登录不可用"

# ---------------------------------------------------------------------------
# 4. 运行时自检（密钥是否仍是默认值、字体是否齐备、哪些可选能力没开）
#    只打印，不阻断启动
# ---------------------------------------------------------------------------
if [ -f /app/scripts/docker-preflight.mjs ]; then
  node /app/scripts/docker-preflight.mjs || true
fi

echo "[entrypoint] 启动：$*"
exec "$@"
