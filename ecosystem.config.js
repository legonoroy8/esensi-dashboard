module.exports = {
  apps: [
    {
      name: 'leadsqualifier-backend',
      cwd: './backend',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Project-specific log files
      error_file: '~/taktis/logs/leadsqualifier-dashboard/error.log',
      out_file: '~/taktis/logs/leadsqualifier-dashboard/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
