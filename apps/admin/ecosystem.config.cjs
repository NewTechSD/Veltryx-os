module.exports = {
  apps: [
    {
      name: "veltryx-admin",
      cwd: "/opt/projects/Veltryx-os/apps/admin",
      script: "/usr/bin/pnpm",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_APP_NAME: "Veltryx OS",
        NEXT_PUBLIC_APP_ENV: "preview",
        NEXT_PUBLIC_APP_VERSION: "0.1.0",
      },
      out_file: "/opt/projects/Veltryx-os/apps/admin/logs/pm2-out.log",
      error_file: "/opt/projects/Veltryx-os/apps/admin/logs/pm2-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
