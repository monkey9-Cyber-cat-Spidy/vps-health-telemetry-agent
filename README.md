# VPS Health Telemetry Agent

High-performance, lightweight Node.js telemetry daemon and REST monitoring microservice designed for Ubuntu/Debian Linux VPS instances. Monitors system metrics in real time and enforces threshold alerting state machines with automated resolution tracking.

## Architecture & Features

- **Continuous Hardware Telemetry**: CPU load averages (1m, 5m, 15m), core count, RAM allocation breakdown (used, free, buffers), system uptime, and active network interfaces.
- **Threshold Alerting State Machine**: Configurable thresholds with automatic transition handling (`NORMAL` -> `TRIGGERED` -> `RESOLVED`).
- **Production systemd Daemon Unit**: Includes pre-configured `vps-telemetry.service` with automatic crash recovery restarts.
- **REST Endpoints**:
  - `GET /api/health`: Returns 200 OK when healthy, 503 DEGRADED during active incidents.
  - `GET /api/metrics`: Detailed telemetry snapshot with real-time CPU and memory metrics.
  - `GET /api/alerts`: Active incidents and resolution audit trail.
  - `POST /api/thresholds`: Hot-reload threshold configuration without restarting the service.

## Installation & Running

```bash
npm install
npm test
npm start
```

## Systemd Installation (Ubuntu/Debian VPS)

```bash
sudo cp systemd/vps-telemetry.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vps-telemetry
sudo systemctl status vps-telemetry
```
