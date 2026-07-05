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
      },
      max_restarts: 5,
      min_uptime: '10s',
    },
  ],
};
