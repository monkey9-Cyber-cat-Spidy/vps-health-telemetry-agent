import os from 'os';

export class TelemetryCollector {
  constructor() {
    this.previousCpu = this.getCpuTimes();
  }

  getCpuTimes() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
  }

  calculateCpuUsage() {
    const current = this.getCpuTimes();
    const idleDiff = current.idle - this.previousCpu.idle;
    const totalDiff = current.total - this.previousCpu.total;
    this.previousCpu = current;

    if (totalDiff === 0) return 0;
    const percentage = 100 - (100 * idleDiff / totalDiff);
    return Math.max(0, Math.min(100, parseFloat(percentage.toFixed(2))));
  }

  getMemoryMetrics() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = parseFloat(((used / total) * 100).toFixed(2));

    return {
      totalBytes: total,
      totalMB: Math.round(total / (1024 * 1024)),
      usedBytes: used,
      usedMB: Math.round(used / (1024 * 1024)),
      freeBytes: free,
      freeMB: Math.round(free / (1024 * 1024)),
      usagePercent
    };
  }

  getSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      uptimeSeconds: Math.floor(os.uptime()),
      loadAverage: os.loadavg().map(v => parseFloat(v.toFixed(2))),
      cpuCores: os.cpus().length,
      networkInterfaces: Object.keys(os.networkInterfaces())
    };
  }

  collectSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      cpuUsagePercent: this.calculateCpuUsage(),
      memory: this.getMemoryMetrics(),
      system: this.getSystemInfo()
    };
  }
}

export const defaultCollector = new TelemetryCollector();
