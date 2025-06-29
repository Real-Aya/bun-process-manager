// process-manager.js - Bun Process Manager
import { spawn } from "bun";
import { existsSync, mkdirSync } from "fs";
import path from "path";

class BunProcessManager {
  constructor() {
    this.processes = new Map();
    this.config = null;
    this.logsDir = path.join(process.cwd(), "logs");
    
    // Create logs directory if it doesn't exist
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }
  }

  loadConfig(configPath = "bun-pm.config.js") {
    try {
      const configFile = path.join(process.cwd(), configPath);
      if (existsSync(configFile)) {
        this.config = require(configFile);
        console.log(`✅ Config loaded from ${configPath}`);
      } else {
        console.log(`❌ Config file ${configPath} not found`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error loading config: ${error.message}`);
      process.exit(1);
    }
  }

  async startApp(appConfig) {
    const { name, script, args = [], env = {}, cwd, restartDelay = 2000, maxRestarts = -1 } = appConfig;
    
    if (this.processes.has(name)) {
      console.log(`⚠️  App ${name} is already running`);
      return;
    }

    const processInfo = {
      name,
      script,
      args,
      env,
      cwd: cwd || process.cwd(),
      restartDelay,
      maxRestarts,
      restartCount: 0,
      startTime: new Date(),
      status: 'starting',
      proc: null
    };

    this.processes.set(name, processInfo);
    this.spawnProcess(processInfo);
  }

  async spawnProcess(processInfo) {
    const { name, script, args, env, cwd, restartDelay, maxRestarts } = processInfo;
    
    console.log(`🚀 Starting ${name}...`);
    
    // Create log files
    const outLogPath = path.join(this.logsDir, `${name}-out.log`);
    const errLogPath = path.join(this.logsDir, `${name}-error.log`);
    
    const outLogFile = Bun.file(outLogPath);
    const errLogFile = Bun.file(errLogPath);
    
    // Spawn the process
    const proc = spawn(["bun", "run", script, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"]
    });

    processInfo.proc = proc;
    processInfo.status = 'running';
    processInfo.pid = proc.pid;

    // Handle stdout
    if (proc.stdout) {
      const outWriter = outLogFile.writer();
      proc.stdout.pipeTo(new WritableStream({
        write(chunk) {
          const text = new TextDecoder().decode(chunk);
          console.log(`[${name}] ${text.trim()}`);
          outWriter.write(chunk);
        }
      }));
    }

    // Handle stderr
    if (proc.stderr) {
      const errWriter = errLogFile.writer();
      proc.stderr.pipeTo(new WritableStream({
        write(chunk) {
          const text = new TextDecoder().decode(chunk);
          // Don't show Next.js command as error
          if (!text.includes('$ next start')) {
            console.error(`[${name}] ERROR: ${text.trim()}`);
          } else {
            console.log(`[${name}] ${text.trim()}`);
          }
          errWriter.write(chunk);
        }
      }));
    }

    // Handle process exit
    proc.exited.then((exitCode) => {
      processInfo.status = 'stopped';
      processInfo.exitCode = exitCode;
      processInfo.restartCount++;
      
      const timestamp = new Date().toISOString();
      console.log(`💥 [${timestamp}] ${name} crashed with exit code ${exitCode}`);
      
      // Check if we should restart
      if (maxRestarts === -1 || processInfo.restartCount <= maxRestarts) {
        console.log(`🔄 Restarting ${name} in ${restartDelay}ms... (restart #${processInfo.restartCount})`);
        setTimeout(() => {
          if (this.processes.has(name)) { // Check if not manually stopped
            this.spawnProcess(processInfo);
          }
        }, restartDelay);
      } else {
        console.log(`⛔ ${name} reached max restarts (${maxRestarts}). Stopping.`);
        this.processes.delete(name);
      }
    });
  }

  stopApp(name) {
    const processInfo = this.processes.get(name);
    if (!processInfo) {
      console.log(`❌ App ${name} not found`);
      return;
    }

    console.log(`🛑 Stopping ${name}...`);
    processInfo.status = 'stopping';
    
    if (processInfo.proc) {
      processInfo.proc.kill();
    }
    
    this.processes.delete(name);
    console.log(`✅ ${name} stopped`);
  }

  restartApp(name) {
    const processInfo = this.processes.get(name);
    if (!processInfo) {
      console.log(`❌ App ${name} not found`);
      return;
    }

    console.log(`🔄 Restarting ${name}...`);
    this.stopApp(name);
    
    setTimeout(() => {
      const appConfig = this.config.apps.find(app => app.name === name);
      if (appConfig) {
        this.startApp(appConfig);
      }
    }, 1000);
  }

  listApps() {
    console.log("\n📊 Process Status:");
    console.log("─".repeat(80));
    console.log("NAME\t\tSTATUS\t\tPID\t\tRESTARTS\tUPTIME");
    console.log("─".repeat(80));
    
    for (const [name, info] of this.processes) {
      const uptime = info.startTime ? this.formatUptime(Date.now() - info.startTime.getTime()) : 'N/A';
      console.log(`${name.padEnd(15)}\t${info.status.padEnd(10)}\t${(info.pid || 'N/A').toString().padEnd(10)}\t${info.restartCount}\t\t${uptime}`);
    }
    console.log("─".repeat(80));
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  showLogs(name, lines = 50) {
    const outLogPath = path.join(this.logsDir, `${name}-out.log`);
    const errLogPath = path.join(this.logsDir, `${name}-error.log`);
    
    console.log(`\n📄 Logs for ${name}:`);
    console.log("─".repeat(50));
    
    if (existsSync(outLogPath)) {
      const outContent = Bun.file(outLogPath).text();
      const outLines = outContent.split('\n').slice(-lines);
      console.log("STDOUT:");
      outLines.forEach(line => line && console.log(line));
    }
    
    if (existsSync(errLogPath)) {
      const errContent = Bun.file(errLogPath).text();
      const errLines = errContent.split('\n').slice(-lines);
      if (errLines.some(line => line.trim())) {
        console.log("\nSTDERR:");
        errLines.forEach(line => line && console.error(line));
      }
    }
  }

  async startAll() {
    if (!this.config || !this.config.apps) {
      console.log("❌ No apps configured");
      return;
    }

    console.log(`🚀 Starting all apps (${this.config.apps.length} apps)...`);
    
    for (const appConfig of this.config.apps) {
      await this.startApp(appConfig);
      // Small delay between starts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log("✅ All apps started!");
  }

  stopAll() {
    console.log("🛑 Stopping all apps...");
    const appNames = Array.from(this.processes.keys());
    
    for (const name of appNames) {
      this.stopApp(name);
    }
    
    console.log("✅ All apps stopped!");
  }
}

// CLI Interface
const pm = new BunProcessManager();

async function main() {
  const command = process.argv[2];
  const appName = process.argv[3];

  switch (command) {
    case 'start':
      pm.loadConfig();
      if (appName) {
        const appConfig = pm.config.apps.find(app => app.name === appName);
        if (appConfig) {
          await pm.startApp(appConfig);
        } else {
          console.log(`❌ App ${appName} not found in config`);
        }
      } else {
        await pm.startAll();
      }
      break;

    case 'stop':
      if (appName) {
        pm.stopApp(appName);
      } else {
        pm.stopAll();
      }
      break;

    case 'restart':
      pm.loadConfig();
      if (appName) {
        pm.restartApp(appName);
      } else {
        pm.stopAll();
        setTimeout(() => pm.startAll(), 2000);
      }
      break;

    case 'list':
    case 'ls':
      pm.listApps();
      break;

    case 'logs':
      if (appName) {
        const lines = process.argv[4] ? parseInt(process.argv[4]) : 50;
        pm.showLogs(appName, lines);
      } else {
        console.log("❌ Please specify app name: bun run process-manager.js logs <app-name>");
      }
      break;

    default:
      console.log(`
🚀 Bun Process Manager

Usage:
  bun run process-manager.js start [app-name]  - Start app(s)
  bun run process-manager.js stop [app-name]   - Stop app(s)  
  bun run process-manager.js restart [app-name] - Restart app(s)
  bun run process-manager.js list              - List all apps
  bun run process-manager.js logs <app-name>   - Show logs for app

Examples:
  bun run process-manager.js start            - Start all apps
  bun run process-manager.js start webshop    - Start webshop app only
  bun run process-manager.js logs webshop 100 - Show last 100 log lines
      `);
  }

  // Keep the process running for monitoring
  if (['start'].includes(command)) {
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down all processes...');
      pm.stopAll();
      process.exit(0);
    });

    // Keep alive
    setInterval(() => {}, 1000);
  }
}

main().catch(console.error);
