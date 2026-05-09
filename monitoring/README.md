# CrisisConnect monitoring (Prometheus + Grafana)

The API gateway exposes Prometheus metrics at **`http://localhost:4000/metrics`** (`gateway_*` metric names).

## Quick start (Docker)

1. Start CrisisConnect so the **gateway** is listening on port **4000** (`npm run start:backend` or `npm start` from the repo root).
2. From the repo root:

   ```bash
   docker compose -f docker-compose.monitoring.yml up -d
   ```

3. Open **Grafana:** [http://localhost:3001](http://localhost:3001) — login **`admin` / `admin`** (change password when prompted).
4. Dashboard **CrisisConnect API Gateway** should appear automatically (folder: General).

**Prometheus UI:** [http://localhost:9090](http://localhost:9090) — check **Status → Targets** that `crisisconnect-gateway` is **UP**.

## Scraping the host from Docker

`monitoring/prometheus.yml` uses **`host.docker.internal:4000`**. Docker Compose adds `extra_hosts: host.docker.internal:host-gateway` so Linux hosts resolve it when supported.

If scraping fails:

- Confirm `curl http://localhost:4000/metrics` works on the host.
- On Linux without `host.docker.internal`, replace the target in `prometheus.yml` with your machine’s LAN IP, or run Prometheus on the host instead of Docker.

## Changing Grafana port

Edit `docker-compose.monitoring.yml` (`3001:3000`) if port 3001 is taken.
