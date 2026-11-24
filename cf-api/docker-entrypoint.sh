#!/bin/sh
# cf-api 容器入口：准备 .dev.vars → 初始化 D1 → 交给 wrangler dev
set -e

log() { echo "[cf-api] $*"; }

WRANGLER_CONF="wrangler.container.toml"

# ---------------------------------------------------------------------------
# 1. 生成本地密钥文件
#    wrangler --local 只读 .dev.vars，不读容器环境变量，所以这里必须落盘
# ---------------------------------------------------------------------------
if [ -n "$ADMIN_SECRET" ] || [ -n "$CF_API_SECRET" ]; then
  {
    echo "FRONTEND_URL=${FRONTEND_URL:-http://localhost:3010}"
    echo "ADMIN_SECRET=${ADMIN_SECRET}"
    echo "CF_API_SECRET=${CF_API_SECRET:-$ADMIN_SECRET}"
  } > .dev.vars
  chmod 600 .dev.vars
  log ".dev.vars 已生成"
else
  log "警告：未设置 ADMIN_SECRET / CF_API_SECRET，数据接口将全部返回 401"
fi

# ---------------------------------------------------------------------------
# 2. 初始化 D1
#    schema.sql 全部是 IF NOT EXISTS，可重复执行。
#    wrangler v3 需要 --local，v4 起本地为默认；两种写法都试以兼容版本差异。
# ---------------------------------------------------------------------------
run_sql() {
  file="$1"
  npx wrangler d1 execute easy-resume -c "$WRANGLER_CONF" \
    --local --persist-to /data --file="$file" 2>&1 \
    || npx wrangler d1 execute easy-resume -c "$WRANGLER_CONF" \
      --persist-to /data --file="$file" 2>&1
}

log "初始化本地 D1 schema..."
if run_sql ./schema.sql > /tmp/d1-schema.log 2>&1; then
  tail -5 /tmp/d1-schema.log
  log "schema 就绪"
else
  tail -20 /tmp/d1-schema.log
  log "警告：schema 初始化失败，云端保存 / 分享将不可用"
fi

# 分享字段：新库由 schema.sql 建好，旧库才需要；重复执行会报 duplicate column，忽略即可
if [ -f ./migrations/0001_share.sql ]; then
  if run_sql ./migrations/0001_share.sql > /tmp/d1-migrate.log 2>&1; then
    log "0001_share.sql 已应用"
  else
    log "0001_share.sql 无需应用（字段已存在）"
  fi
fi

log "启动 wrangler dev：0.0.0.0:8787，数据目录 /data"
exec "$@"
