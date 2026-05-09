const client = require('prom-client');

/**
 * Registers Prometheus metrics and GET /metrics on the gateway (no auth — for scraping).
 */
function attachPrometheus(app) {
  const register = new client.Registry();

  client.collectDefaultMetrics({
    register,
    prefix: 'gateway_',
    labels: { service: 'api-gateway' }
  });

  const httpRequestsTotal = new client.Counter({
    name: 'gateway_http_requests_total',
    help: 'Total HTTP requests handled by the API gateway',
    labelNames: ['method', 'status_code'],
    registers: [register]
  });

  const httpRequestDuration = new client.Histogram({
    name: 'gateway_http_request_duration_seconds',
    help: 'Latency of HTTP requests at the gateway',
    labelNames: ['method', 'status_code'],
    buckets: [0.001, 0.005, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [register]
  });

  app.use((req, res, next) => {
    if (req.path === '/metrics') return next();

    const start = process.hrtime.bigint();
    let recorded = false;

    const recordOnce = () => {
      if (recorded) return;
      recorded = true;
      const labels = {
        method: req.method,
        status_code: String(res.statusCode || 0)
      };
      httpRequestsTotal.inc(labels);
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      httpRequestDuration.observe(labels, seconds);
    };

    res.on('finish', recordOnce);
    res.on('close', recordOnce);

    next();
  });

  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).type('text/plain').send(err.message || 'metrics error');
    }
  });

  return register;
}

module.exports = { attachPrometheus };
