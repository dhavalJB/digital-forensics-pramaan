module.exports = {
  apps: [
    {
      name: "pramaan-backend",
      script: "index.js",

      // 🔥 CORE
      instances: 1,
      exec_mode: "fork",

      // 🔥 AUTO RECOVERY
      autorestart: true,
      watch: false,

      // 🔥 PERFORMANCE
      max_memory_restart: "500M",

      // 🔥 LOGGING
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // 🔥 ENV
      env: {
        NODE_ENV: "development",
        PORT: 4000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};