const pino = require('pino');
const pinoHttp = require('pino-http');

const level = process.env.LOG_LEVEL || 'info';

function createLogger(service) {
  return pino({
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime
  });
}

function httpMiddleware(logger) {
  return pinoHttp({
    logger,
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} ${res.statusCode} ${err ? err.message : ''}`
  });
}

function listenServer(app, port, logger, onListening) {
  const server = app.listen(port, () => {
    if (typeof onListening === 'function') onListening();
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error({ err: err.code, port }, 'listen failed: port already in use');
    } else {
      logger.error({ err }, 'listen failed');
    }
    process.exit(1);
  });
  return server;
}

module.exports = { createLogger, httpMiddleware, listenServer };
