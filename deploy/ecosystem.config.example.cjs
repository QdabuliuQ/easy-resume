/** PM2 示例：复制为 ecosystem.config.cjs 后 pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'easy-resume',
      cwd: '/root/easy-resume',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser',
        EXPORT_BASE_URL: 'http://127.0.0.1:3010',
        // AI 传输加密（同一密钥对；公钥也可在 build 前写入 .env.production 的 NEXT_PUBLIC_*）
        // AI_PAYLOAD_RSA_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----',
        // AI_PAYLOAD_RSA_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----',
      },
      max_restarts: 5,
      min_uptime: '10s',
    },
  ],
};
