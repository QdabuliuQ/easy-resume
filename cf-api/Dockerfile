# 青松简历数据层：Cloudflare Worker + D1（本地模式）
#
# 直接用 wrangler 在容器内跑起 cf-api/src/index.js，代码零改动：
#   - workerd 提供 Workers 运行时（fetch / crypto / D1 全部可用）
#   - D1 落到 /data 的 SQLite 文件，由 compose 命名卷持久化
#
# 注意：wrangler dev 是本地开发服务器，单进程、无优雅退出，
#       仅适用于本地开发 / 演示，不要直接当生产后端用。
FROM node:20-bookworm-slim

WORKDIR /app

# wrangler 在容器里需要 ca-certificates 访问 Cloudflare 元数据（部分子命令）
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# 先装依赖，利用层缓存
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY wrangler.toml wrangler.container.toml schema.sql ./
COPY migrations ./migrations
COPY src ./src
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# D1 持久化目录（compose 挂命名卷）
RUN mkdir -p /data
VOLUME ["/data"]

ENV NODE_ENV=production
ENV WRANGLER_SEND_METRICS=false

EXPOSE 8787

HEALTHCHECK --interval=5s --timeout=3s --start-period=20s --retries=20 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npx", "wrangler", "dev", "-c", "wrangler.container.toml", "--ip", "0.0.0.0", "--port", "8787", "--persist-to", "/data"]
