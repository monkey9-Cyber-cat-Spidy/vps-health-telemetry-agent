import express from 'express';
import { defaultCollector } from './collector.js';
import { defaultAlerter } from './alerter.js';

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  const snapshot = defaultCollector.collectSnapshot();
  const alertStatus = defaultAlerter.evaluate(snapshot);

  res.status(alertStatus.isHealthy ? 200 : 503).json({
    status: alertStatus.isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: snapshot.timestamp,
    activeAlertCount: alertStatus.activeAlerts.length,
    hostname: snapshot.system.hostname,
    uptimeSeconds: snapshot.system.uptimeSeconds
  });
});

app.get('/api/metrics', (req, res) => {
  const snapshot = defaultCollector.collectSnapshot();
  const alertStatus = defaultAlerter.evaluate(snapshot);

  res.json({
    snapshot,
    evaluation: alertStatus
  });
});

app.get('/api/alerts', (req, res) => {
  res.json({
    activeAlerts: Array.from(defaultAlerter.activeAlerts.values()),
    history: defaultAlerter.alertHistory
  });
});

app.post('/api/thresholds', (req, res) => {
  const { cpuPercent, memoryPercent, load15Min } = req.body;
  defaultAlerter.setThresholds({
    ...(cpuPercent && { cpuPercent: parseFloat(cpuPercent) }),
    ...(memoryPercent && { memoryPercent: parseFloat(memoryPercent) }),
    ...(load15Min && { load15Min: parseFloat(load15Min) })
  });

  res.json({
    message: 'Thresholds updated successfully',
    currentThresholds: defaultAlerter.thresholds
  });
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`VPS Telemetry Agent listening on port ${PORT}`);
  });
}

export default app;
