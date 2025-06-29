// bun-pm.config.js - Comprehensive Configuration Examples

module.exports = {
  apps: [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🌐 WEB APPLICATION STACK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // Backend API Server
    {
      name: "api-server",
      script: "src/server.ts",
      cwd: "C:\\Users\\Administrator\\Desktop\\MyProject\\backend",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "postgresql://user:pass@localhost:5432/mydb",
        JWT_SECRET: "your-secret-key",
        REDIS_URL: "redis://localhost:6379"
      },
      restartDelay: 3000,    // Wait 3 seconds before restart
      maxRestarts: 10        // Stop after 10 failed restarts
    },

    // Frontend (Next.js/React)
    {
      name: "frontend-web",
      script: "start",       // Runs "bun run start"
      cwd: "C:\\Users\\Administrator\\Desktop\\MyProject\\frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        NEXT_PUBLIC_API_URL: "http://localhost:3000/api"
      },
      restartDelay: 5000,    // Next.js needs more time to start
      maxRestarts: -1        // Unlimited restarts
    },

    // Admin Dashboard
    {
      name: "admin-panel",
      script: "build/index.js",
      cwd: "C:\\Users\\Administrator\\Desktop\\MyProject\\admin",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        ADMIN_SECRET: "admin-secret-key"
      },
      restartDelay: 2000,
      maxRestarts: 5
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔧 BACKGROUND SERVICES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Queue Worker
    {
      name: "queue-worker",
      script: "workers/queue.ts",
      args: ["--queue", "emails", "--concurrency", "5"],
      env: {
        REDIS_URL: "redis://localhost:6379",
        SMTP_HOST: "smtp.gmail.com",
        SMTP_USER: "your-email@gmail.com",
        SMTP_PASS: "your-app-password"
      },
      restartDelay: 1000,
      maxRestarts: -1
    },

    // File Processing Service
    {
      name: "file-processor",
      script: "services/file-processor.ts",
      env: {
        UPLOAD_DIR: "C:\\uploads",
        MAX_FILE_SIZE: "50MB",
        ALLOWED_TYPES: "jpg,png,pdf,docx"
      },
      restartDelay: 2000,
      maxRestarts: 5
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 MICROSERVICES ARCHITECTURE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Authentication Service
    {
      name: "auth-service",
      script: "microservices/auth/index.ts",
      env: {
        SERVICE_PORT: 4001,
        JWT_SECRET: "auth-service-secret",
        DATABASE_URL: "postgresql://localhost:5432/auth_db"
      },
      restartDelay: 2000,
      maxRestarts: 8
    },

    // User Management Service
    {
      name: "user-service",
      script: "microservices/users/index.ts",
      env: {
        SERVICE_PORT: 4002,
        AUTH_SERVICE_URL: "http://localhost:4001",
        DATABASE_URL: "postgresql://localhost:5432/users_db"
      },
      restartDelay: 2000,
      maxRestarts: 8
    },

    // Notification Service
    {
      name: "notification-service",
      script: "microservices/notifications/index.ts",
      env: {
        SERVICE_PORT: 4003,
        REDIS_URL: "redis://localhost:6379",
        FCM_SERVER_KEY: "your-fcm-key"
      },
      restartDelay: 1500,
      maxRestarts: -1
    },

    // API Gateway
    {
      name: "api-gateway",
      script: "gateway/index.ts",
      env: {
        GATEWAY_PORT: 5000,
        AUTH_SERVICE: "http://localhost:4001",
        USER_SERVICE: "http://localhost:4002",
        NOTIFICATION_SERVICE: "http://localhost:4003"
      },
      restartDelay: 3000,
      maxRestarts: 5
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 MONITORING & UTILITIES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Health Check Service
    {
      name: "health-monitor",
      script: "monitoring/health-check.ts",
      env: {
        CHECK_INTERVAL: "30000",  // 30 seconds
        SERVICES: "http://localhost:3000,http://localhost:3001,http://localhost:4001"
      },
      restartDelay: 5000,
      maxRestarts: 3
    },

    // Log Aggregator
    {
      name: "log-aggregator",
      script: "monitoring/log-aggregator.ts",
      env: {
        LOG_DIR: "C:\\logs",
        RETENTION_DAYS: "30"
      },
      restartDelay: 10000,
      maxRestarts: 2
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🕐 SCHEDULED TASKS & CRON JOBS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Daily Backup Job
    {
      name: "daily-backup",
      script: "scripts/backup.ts",
      args: ["--type", "full"],
      env: {
        BACKUP_DIR: "C:\\backups",
        DATABASE_URL: "postgresql://localhost:5432/mydb"
      },
      restartDelay: 60000,   // 1 minute delay
      maxRestarts: 2         // Don't retry too much for scheduled tasks
    },

    // Email Newsletter Sender
    {
      name: "newsletter-sender",
      script: "scripts/newsletter.ts",
      env: {
        SEND_INTERVAL: "86400000", // 24 hours in ms
        SMTP_CONFIG: "smtp://user:pass@smtp.provider.com"
      },
      restartDelay: 30000,
      maxRestarts: 1
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🧪 DEVELOPMENT & TESTING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Development API Server (with hot reload)
    {
      name: "dev-api",
      script: "src/dev-server.ts",
      args: ["--watch"],
      env: {
        NODE_ENV: "development",
        PORT: 3010,
        HOT_RELOAD: "true"
      },
      restartDelay: 1000,
      maxRestarts: -1
    },

    // Test Database Seeder
    {
      name: "db-seeder",
      script: "scripts/seed-db.ts",
      args: ["--env", "development"],
      env: {
        DATABASE_URL: "postgresql://localhost:5432/test_db"
      },
      restartDelay: 5000,
      maxRestarts: 0  // Run once only, don't restart
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 SPECIAL USE CASES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // WebSocket Server
    {
      name: "websocket-server",
      script: "realtime/websocket.ts",
      env: {
        WS_PORT: 8080,
        REDIS_ADAPTER: "redis://localhost:6379"
      },
      restartDelay: 2000,
      maxRestarts: -1
    },

    // Static File Server
    {
      name: "static-server",
      script: "servers/static.ts",
      args: ["--port", "8000", "--dir", "public"],
      env: {
        CACHE_CONTROL: "max-age=3600"
      },
      restartDelay: 1000,
      maxRestarts: 5
    },

    // Image Processing Worker
    {
      name: "image-processor",
      script: "workers/image-processor.ts",
      env: {
        MAX_CONCURRENT: "3",
        TEMP_DIR: "C:\\temp\\images",
        OUTPUT_DIR: "C:\\processed\\images"
      },
      restartDelay: 2000,
      maxRestarts: 8
    }
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 CONFIGURATION NOTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
🔧 CONFIGURATION OPTIONS EXPLAINED:

┌─────────────────┬─────────────────────────────────────────────────────────────────┐
│ Option          │ Description                                                     │
├─────────────────┼─────────────────────────────────────────────────────────────────┤
│ name            │ Unique identifier for the app (required)                       │
│ script          │ Entry point file or npm script name (required)                 │
│ args            │ Command line arguments array                                    │
│ cwd             │ Working directory (defaults to current directory)              │
│ env             │ Environment variables object                                    │
│ restartDelay    │ Milliseconds to wait before restart (default: 2000)           │
│ maxRestarts     │ Maximum restart attempts (-1 = unlimited, default: -1)        │
└─────────────────┴─────────────────────────────────────────────────────────────────┘

⚡ RESTART DELAY RECOMMENDATIONS:
- Web Servers: 2000-5000ms (2-5 seconds)
- APIs: 2000-3000ms (2-3 seconds)  
- Workers: 1000-2000ms (1-2 seconds)
- Scheduled Tasks: 5000-60000ms (5 seconds - 1 minute)
- Heavy Services: 5000-10000ms (5-10 seconds)

🛡️ MAX RESTARTS RECOMMENDATIONS:
- Critical Services: -1 (unlimited)
- Background Workers: 10-20
- Scheduled Tasks: 1-3
- One-time Scripts: 0 (no restart)
- Development: -1 (unlimited)

💡 ENVIRONMENT VARIABLES TIPS:
- Use absolute paths for file directories
- Set different ports for each service
- Use production-ready values
- Include all required API keys and secrets
- Set appropriate NODE_ENV values

🚀 USAGE EXAMPLES:

# Start all configured apps
bun run process-manager.js start

# Start specific app category
bun run process-manager.js start api-server
bun run process-manager.js start queue-worker

# Monitor everything
bun run process-manager.js list

# Check logs
bun run process-manager.js logs api-server 100

# Restart specific service
bun run process-manager.js restart auth-service

# Stop everything
bun run process-manager.js stop
*/
