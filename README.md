# 🚀 Bun Process Manager

A lightweight, native process manager built specifically for Bun applications. Provides PM2-like functionality with auto-restart, logging, and multi-app management - all running on pure Bun without Node.js compatibility issues.

## ✨ Features

- 🔄 **Auto-restart on crash** - Keeps your apps running 24/7
- 📝 **Persistent logging** - Saves all output to separate log files
- 🎯 **Multi-app support** - Manage multiple applications from one config
- 📊 **Real-time monitoring** - View status, uptime, restart counts
- 🛡️ **Crash protection** - Intelligent restart delays and limits
- 🔥 **Pure Bun** - No Node.js dependencies or compatibility issues
- ⚡ **Lightweight** - Minimal resource overhead
- 💻 **Cross-platform** - Works on Windows, macOS, and Linux

## 📦 Installation

1. Download the `process-manager.js` file to your project
2. Create a `bun-pm.config.js` configuration file
3. Start managing your processes!

```bash
# No installation required - just run with Bun
bun run process-manager.js start
```

## 🚀 Quick Start

### 1. Create Configuration File

Create `bun-pm.config.js` in your project root:

```javascript
module.exports = {
  apps: [
    {
      name: "my-api",
      script: "src/server.ts",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

### 2. Start Your Apps

```bash
# Start all apps
bun run process-manager.js start

# Start specific app
bun run process-manager.js start my-api
```

### 3. Monitor and Manage

```bash
# Check status
bun run process-manager.js list

# View logs
bun run process-manager.js logs my-api

# Restart apps
bun run process-manager.js restart my-api
```

## 📋 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start [app-name]` | Start app(s) | `bun run process-manager.js start` |
| `stop [app-name]` | Stop app(s) | `bun run process-manager.js stop my-api` |
| `restart [app-name]` | Restart app(s) | `bun run process-manager.js restart` |
| `list` or `ls` | Show app status | `bun run process-manager.js list` |
| `logs <app-name> [lines]` | Show app logs | `bun run process-manager.js logs my-api 100` |

## ⚙️ Configuration Options

### App Configuration

```javascript
{
  name: "app-name",           // Required: Unique app identifier
  script: "src/index.ts",     // Required: Entry point file
  args: ["--flag", "value"],  // Optional: Command line arguments
  cwd: "/path/to/app",        // Optional: Working directory
  env: {                      // Optional: Environment variables
    NODE_ENV: "production",
    PORT: 3000,
    API_KEY: "secret"
  },
  restartDelay: 2000,         // Optional: Delay before restart (ms)
  maxRestarts: -1             // Optional: Max restarts (-1 = unlimited)
}
```

### Complete Example

```javascript
module.exports = {
  apps: [
    // Backend API
    {
      name: "api-server",
      script: "src/server.ts",
      cwd: "/home/user/my-project/backend",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "postgresql://..."
      },
      restartDelay: 3000,
      maxRestarts: 10
    },
    
    // Frontend (Next.js)
    {
      name: "frontend",
      script: "start",  // Runs "bun run start"
      cwd: "/home/user/my-project/frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      restartDelay: 5000,
      maxRestarts: -1
    },
    
    // Background Worker
    {
      name: "worker",
      script: "worker/index.ts",
      args: ["--queue", "default"],
      env: {
        REDIS_URL: "redis://localhost:6379"
      },
      restartDelay: 1000,
      maxRestarts: 5
    },
    
    // Scheduled Task
    {
      name: "scheduler",
      script: "scripts/cron.ts",
      restartDelay: 10000,
      maxRestarts: 3
    }
  ]
};
```

## 📊 Monitoring

### Status Dashboard
```bash
bun run process-manager.js list
```

Output:
```
📊 Process Status:
────────────────────────────────────────────────
NAME            STATUS    PID       RESTARTS  UPTIME
────────────────────────────────────────────────
api-server      running   1234      0         2h 15m
frontend        running   5678      1         1h 30m
worker          running   9012      0         45m
────────────────────────────────────────────────
```

### Log Management

Logs are automatically saved to:
- `./logs/[app-name]-out.log` - Standard output
- `./logs/[app-name]-error.log` - Error output

```bash
# View recent logs
bun run process-manager.js logs api-server

# View more lines
bun run process-manager.js logs api-server 200

# Monitor logs in real-time (use tail)
tail -f ./logs/api-server-out.log
```

## 🛠️ Common Use Cases

### Web Application Stack
```javascript
module.exports = {
  apps: [
    // Database seeder
    {
      name: "db-seed",
      script: "scripts/seed.ts",
      maxRestarts: 0  // Run once only
    },
    
    // API Backend
    {
      name: "api",
      script: "src/api/server.ts",
      env: { PORT: 3000 }
    },
    
    // Web Frontend
    {
      name: "web",
      script: "start",
      cwd: "./frontend",
      env: { PORT: 3001 }
    },
    
    // Admin Dashboard
    {
      name: "admin",
      script: "start",
      cwd: "./admin",
      env: { PORT: 3002 }
    }
  ]
};
```

### Microservices
```javascript
module.exports = {
  apps: [
    {
      name: "auth-service",
      script: "services/auth/index.ts",
      env: { PORT: 4001 }
    },
    {
      name: "user-service", 
      script: "services/users/index.ts",
      env: { PORT: 4002 }
    },
    {
      name: "order-service",
      script: "services/orders/index.ts", 
      env: { PORT: 4003 }
    },
    {
      name: "api-gateway",
      script: "gateway/index.ts",
      env: { PORT: 3000 }
    }
  ]
};
```

## 🚨 Error Handling

### Automatic Recovery
- Apps are automatically restarted when they crash
- Configurable restart delays prevent rapid restart loops
- Maximum restart limits prevent infinite restart cycles
- All crashes are logged with timestamps and exit codes

### Manual Recovery
```bash
# Force restart a problematic app
bun run process-manager.js restart problematic-app

# Stop and manually debug
bun run process-manager.js stop problematic-app
bun run src/server.ts  # Run manually to see errors

# Restart everything fresh
bun run process-manager.js stop
bun run process-manager.js start
```

## 🔧 Troubleshooting

### App Won't Start
1. Check the script path exists
2. Verify working directory (`cwd`) is correct
3. Ensure all dependencies are installed
4. Check environment variables are set properly

### High Restart Count
1. Check error logs: `bun run process-manager.js logs [app-name]`
2. Increase `restartDelay` to give app more time to start
3. Set `maxRestarts` to prevent infinite restart loops
4. Fix underlying application issues

### Permission Issues
```bash
# Ensure log directory is writable
mkdir logs
chmod 755 logs

# Check file permissions
ls -la process-manager.js bun-pm.config.js
```

## 📝 Best Practices

### Configuration
- Use descriptive app names
- Set appropriate restart delays (2-5 seconds)
- Configure environment variables properly
- Use absolute paths for `cwd` when possible

### Logging
- Monitor logs regularly: `bun run process-manager.js logs [app]`
- Archive old logs to prevent disk space issues
- Use log rotation for long-running applications

### Deployment
- Test configuration locally before production
- Use environment-specific config files
- Set up monitoring alerts for high restart counts
- Keep backups of working configurations

## 🆚 Comparison with PM2

| Feature | Bun Process Manager | PM2 |
|---------|-------------------|-----|
| Bun Native | ✅ Full support | ❌ Compatibility issues |
| Setup | ✅ Zero config | ❌ Complex setup |
| Memory Usage | ✅ Lightweight | ❌ Heavy |
| Learning Curve | ✅ Simple | ❌ Steep |
| Features | ✅ Essential features | ✅ Feature-rich |

## 📄 License

MIT License - Feel free to use in your projects!

## 🤝 Contributing

Contributions welcome! Please:
1. Test your changes thoroughly
2. Update documentation
3. Follow existing code style
4. Add examples for new features

## 📞 Support

Having issues? Check:
1. Configuration syntax is correct
2. File paths exist and are accessible  
3. Ports aren't already in use
4. Bun is properly installed

---

**Made with ❤️ for the Bun community**
