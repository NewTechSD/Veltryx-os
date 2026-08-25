const path = require("node:path");

const adminRoot = __dirname;
const rootNodeModules = path.resolve(adminRoot, "..", "..", "node_modules");

module.exports = {
  apps: [
    {
      name: "veltryx-admin",
      cwd: adminRoot,
      script: path.join(rootNodeModules, "next", "dist", "bin", "next"),
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_NAME: "Veltryx OS",
        NEXT_PUBLIC_APP_ENV: "preview",
        NEXT_PUBLIC_APP_VERSION: "0.1.0"
      },
      out_file: path.join(adminRoot, "logs", "pm2-out.log"),
      error_file: path.join(adminRoot, "logs", "pm2-error.log"),
      merge_logs: true,
      time: true
    }
  ]
};
