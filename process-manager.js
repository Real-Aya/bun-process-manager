// process-manager.js - Enhanced Bun Process Manager with persistent storage
import { spawn } from "bun";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import path from "path";

class BunProcessManager {
  constructor() {
    this.processes = new Map();
    this.config = null;
    this.logsDir = path.join(process.cwd(), "logs");
    this.stateFile = path.join(process.cwd(), ".bun-pm-state.json");
    
    // Create logs directory if it doesn't exist
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }
    
    // Load existing state
    this.loadState();
  }

  loadState() {
    try {
      if (existsSync(this.stateFile)) {
        const stateData = JSON.parse(readFileSync(this.stateFile, 'utf8'));
        
        // Reconstruct the processes map and check if processes are still running
        for (const [name, processInfo] of Object.entries(stateData.processes || {})) {
          // Check if the process is still actually running
          if (processInfo.pid && this.isProcessRunning(processInfo.pid)) {
            // Process is still running, but we need to reconnect to it
            processInfo.status = 'running (detached)';
            processInfo.proc = null; // We can't reconnect to the actual process object
            this.processes.set(name, processInfo);
          } else {
            // Process is no longer running, mark as stopped
            processInfo.status = 'stopped';
            processInfo.pid = null;
            this.processes.set(name, processInfo);
          }
        }
        
        console.log(`📄 Loaded state for ${this.processes.size} processes`);
      }
    } catch (error) {
      console.error(`⚠️  Error loading state: ${error.message}`);
    }
  }

  saveState() {
    try {
      const stateData = {
        processes: Object.fromEntries(
          Array.from(this.processes.entries()).map(([name, info]) => [
            name,
            {
              name: info.name,
              script: info.script,
              args: info.args,
              env: info.env,
              cwd: info.cwd,
              restartDelay: info.restartDelay,
              maxRestarts: info.maxRestarts,
              restartCount: info.restartCount,
              startTime: info.startTime,
              status: info.status,
              pid: info.pid,
              exitCode: info.exitCode
              // Note: we don't save the 'proc' object as it's not serializable
            }
          ])
        ),
        lastUpdated: new Date().toISOString()
      };
      
      writeFileSync(this.stateFile, JSON.stringify(stateData, null, 2));
    } catch (error) {
      console.error(`⚠️  Error saving state: ${error.message}`);
    }
  }

  isProcessRunning(pid) {
    try {
      // On Unix systems, sending signal 0 checks if process exists
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
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
    
    const existingProcess = this.processes.get(name);
    if (existingProcess && existingProcess.status === 'running') {
      console.log(`⚠️  App ${name} is already running (PID: ${existingProcess.pid})`);
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
      restartCount: existingProcess?.restartCount || 0,
      startTime: new Date(),
      status: 'starting',
      proc: null,
      pid: null
    };

    this.processes.set(name, processInfo);
    this.saveState();
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
    
    // Save state immediately after getting PID
    this.saveState();

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
      processInfo.pid = null;
      
      // Save state after crash
      this.saveState();
      
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
        this.saveState();
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
    } else if (processInfo.pid) {
      // Try to kill by PID if we don't have the process object
      try {
        process.kill(processInfo.pid, 'SIGTERM');
      } catch (error) {
        console.log(`⚠️  Could not kill process ${processInfo.pid}: ${error.message}`);
      }
    }
    
    this.processes.delete(name);
    this.saveState();
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
    // Refresh process status before listing
    this.refreshProcessStatus();
    
    console.log("\n📊 Process Status:");
    console.log("─".repeat(90));
    console.log("NAME\t\tSTATUS\t\t\tPID\t\tRESTARTS\tUPTIME");
    console.log("─".repeat(90));
    
    if (this.processes.size === 0) {
      console.log("No processes found.");
    } else {
      for (const [name, info] of this.processes) {
        const uptime = info.startTime ? this.formatUptime(Date.now() - info.startTime.getTime()) : 'N/A';
        const pid = info.pid ? info.pid.toString() : 'N/A';
        const status = info.status || 'unknown';
        console.log(`${name.padEnd(15)}\t${status.padEnd(15)}\t${pid.padEnd(10)}\t${info.restartCount}\t\t${uptime}`);
      }
    }
    console.log("─".repeat(90));
  }

  refreshProcessStatus() {
    // Check if processes marked as running are actually still running
    for (const [name, info] of this.processes) {
      if (info.pid && info.status === 'running' && !this.isProcessRunning(info.pid)) {
        info.status = 'stopped';
        info.pid = null;
      }
    }
    this.saveState();
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

  // Clean up orphaned state
  cleanup() {
    console.log("🧹 Cleaning up orphaned processes...");
    let cleaned = 0;
    
    for (const [name, info] of this.processes) {
      if (info.pid && !this.isProcessRunning(info.pid)) {
        console.log(`🧹 Removing dead process: ${name} (PID: ${info.pid})`);
        this.processes.delete(name);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveState();
      console.log(`✅ Cleaned up ${cleaned} orphaned processes`);
    } else {
      console.log(`✅ No orphaned processes found`);
    }
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

    case 'cleanup':
      pm.cleanup();
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
  bun run process-manager.js cleanup           - Clean up orphaned processes

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
