const express = require('express');
const cors = require('cors');
const { createLogger, httpMiddleware, listenServer } = require('./logger');

const logger = createLogger('priority');
const app = express();
app.use(cors());
app.use(express.json());
app.use(httpMiddleware(logger));

function classifyPriority(details) {
  const text = `${details.type || ''} ${details.description || ''}`.toLowerCase();
  if (text.includes('critical') || text.includes('injured') || text.includes('collapsed') || text.includes('medical')) {
    return 'High';
  }
  if (text.includes('urgent') || text.includes('fire') || text.includes('police')) {
    return 'Medium';
  }
  return 'Low';
}

app.post('/priority', (req, res) => {
  const priority = classifyPriority(req.body);
  res.json({ priority });
});

listenServer(app, 5004, logger, () => {
  logger.info('Priority Service running on http://localhost:5004');
});
