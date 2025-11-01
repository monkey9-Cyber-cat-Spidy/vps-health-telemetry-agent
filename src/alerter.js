export class TelemetryAlerter {
  constructor(options = {}) {
    this.thresholds = {
      cpuPercent: options.cpuThreshold || 85,
      memoryPercent: options.memoryThreshold || 90,
      load15Min: options.loadThreshold || 4.0
    };
    this.activeAlerts = new Map();
    this.alertHistory = [];
  }

  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  evaluate(snapshot) {
    const alertsToTrigger = [];

    // Evaluate CPU
    if (snapshot.cpuUsagePercent >= this.thresholds.cpuPercent) {
      alertsToTrigger.push({
        metric: 'CPU',
        value: snapshot.cpuUsagePercent,
        threshold: this.thresholds.cpuPercent,
        severity: 'CRITICAL',
        message: `CPU utilization critical: ${snapshot.cpuUsagePercent}% >= ${this.thresholds.cpuPercent}%`
      });
    }

    // Evaluate Memory
    if (snapshot.memory.usagePercent >= this.thresholds.memoryPercent) {
      alertsToTrigger.push({
        metric: 'MEMORY',
        value: snapshot.memory.usagePercent,
        threshold: this.thresholds.memoryPercent,
        severity: 'WARNING',
        message: `Memory consumption high: ${snapshot.memory.usagePercent}% >= ${this.thresholds.memoryPercent}%`
      });
    }

    // Update active alerts state machine
    for (const alert of alertsToTrigger) {
      if (!this.activeAlerts.has(alert.metric)) {
        const fullAlert = {
          ...alert,
          id: `alt_${Date.now()}_${alert.metric.toLowerCase()}`,
          triggeredAt: new Date().toISOString()
        };
        this.activeAlerts.set(alert.metric, fullAlert);
        this.alertHistory.unshift(fullAlert);
      }
    }

    // Check resolutions
    const triggeredMetrics = new Set(alertsToTrigger.map(a => a.metric));
    for (const [metric, alert] of this.activeAlerts.entries()) {
      if (!triggeredMetrics.has(metric)) {
        this.activeAlerts.delete(metric);
        this.alertHistory.unshift({
          id: alert.id,
          metric,
          severity: 'RESOLVED',
          resolvedAt: new Date().toISOString(),
          message: `Metric ${metric} normalized below threshold.`
        });
      }
    }

    if (this.alertHistory.length > 50) {
      this.alertHistory = this.alertHistory.slice(0, 50);
    }

    return {
      activeAlerts: Array.from(this.activeAlerts.values()),
      isHealthy: this.activeAlerts.size === 0
    };
  }
}

export const defaultAlerter = new TelemetryAlerter();
