import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TelemetryCollector } from '../src/collector.js';
import { TelemetryAlerter } from '../src/alerter.js';

describe('VPS Health Telemetry Agent Tests', () => {
  test('should collect complete system snapshot with memory & CPU metrics', () => {
    const collector = new TelemetryCollector();
    const snapshot = collector.collectSnapshot();

    assert.ok(snapshot.timestamp);
    assert.strictEqual(typeof snapshot.cpuUsagePercent, 'number');
    assert.ok(snapshot.memory.totalMB > 0);
    assert.ok(snapshot.memory.usagePercent >= 0 && snapshot.memory.usagePercent <= 100);
    assert.ok(snapshot.system.hostname);
    assert.ok(snapshot.system.cpuCores > 0);
  });

  test('should trigger critical alert when threshold is exceeded', () => {
    const alerter = new TelemetryAlerter({ cpuThreshold: 50 });
    const mockSnapshot = {
      timestamp: new Date().toISOString(),
      cpuUsagePercent: 88.5,
      memory: { usagePercent: 40.0 },
      system: { hostname: 'vps-prod-01', uptimeSeconds: 12000 }
    };

    const result = alerter.evaluate(mockSnapshot);
    assert.strictEqual(result.isHealthy, false);
    assert.strictEqual(result.activeAlerts.length, 1);
    assert.strictEqual(result.activeAlerts[0].metric, 'CPU');
    assert.strictEqual(result.activeAlerts[0].severity, 'CRITICAL');
  });

  test('should resolve alert when metric drops below threshold', () => {
    const alerter = new TelemetryAlerter({ cpuThreshold: 50 });
    const spikeSnapshot = {
      timestamp: new Date().toISOString(),
      cpuUsagePercent: 95.0,
      memory: { usagePercent: 30.0 },
      system: { hostname: 'vps-prod-01', uptimeSeconds: 12000 }
    };
    alerter.evaluate(spikeSnapshot);
    assert.strictEqual(alerter.activeAlerts.size, 1);

    const normalSnapshot = {
      timestamp: new Date().toISOString(),
      cpuUsagePercent: 22.0,
      memory: { usagePercent: 30.0 },
      system: { hostname: 'vps-prod-01', uptimeSeconds: 12010 }
    };
    const resolvedResult = alerter.evaluate(normalSnapshot);
    assert.strictEqual(resolvedResult.isHealthy, true);
    assert.strictEqual(alerter.activeAlerts.size, 0);
    assert.strictEqual(alerter.alertHistory[0].severity, 'RESOLVED');
  });
});
