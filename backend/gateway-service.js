const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const INCIDENT_URL = 'http://localhost:5001';
const VOLUNTEER_URL = 'http://localhost:5002';
const RESOURCE_URL = 'http://localhost:5003';
const PRIORITY_URL = 'http://localhost:5004';
const AUTH_URL = 'http://localhost:5005';

async function getUserFromToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  try {
    const response = await axios.get(`${AUTH_URL}/me`, {
      headers: { authorization: authHeader }
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status || 401;
    const message = error.response?.data?.error || 'Unauthorized';
    res.status(status).json({ error: message });
    return null;
  }
}

function checkRole(user, roles) {
  return roles.includes(user.role);
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/signup`, req.body);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const message = error.response?.data?.error || 'Authentication service unavailable';
    res.status(status).json({ error: message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/login`, req.body);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const message = error.response?.data?.error || 'Authentication service unavailable';
    res.status(status).json({ error: message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_URL}/me`, {
      headers: { authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const message = error.response?.data?.error || 'Authentication service unavailable';
    res.status(status).json({ error: message });
  }
});

app.get('/api/incidents', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  const response = await axios.get(`${INCIDENT_URL}/incidents`);
  res.json(response.data);
});

app.get('/api/incidents/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  const response = await axios.get(`${INCIDENT_URL}/incidents/${req.params.id}`);
  res.json(response.data);
});

app.post('/api/incidents', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  const response = await axios.post(`${INCIDENT_URL}/incidents`, req.body);
  res.json(response.data);
});

app.put('/api/incidents/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.put(`${INCIDENT_URL}/incidents/${req.params.id}`, req.body);
  res.json(response.data);
});

app.delete('/api/incidents/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.delete(`${INCIDENT_URL}/incidents/${req.params.id}`);
  res.json(response.data);
});

app.get('/api/volunteers', async (req, res) => {
  const response = await axios.get(`${VOLUNTEER_URL}/volunteers`);
  res.json(response.data);
});

app.post('/api/volunteers', async (req, res) => {
  const response = await axios.post(`${VOLUNTEER_URL}/volunteers`, req.body);
  res.json(response.data);
});

app.get('/api/resources', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  const response = await axios.get(`${RESOURCE_URL}/resources`);
  res.json(response.data);
});

app.post('/api/resources', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.post(`${RESOURCE_URL}/resources`, req.body);
  res.json(response.data);
});

app.put('/api/resources/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.put(`${RESOURCE_URL}/resources/${req.params.id}`, req.body);
  res.json(response.data);
});

app.delete('/api/resources/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.delete(`${RESOURCE_URL}/resources/${req.params.id}`);
  res.json(response.data);
});

app.get('/api/users', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.get(`${AUTH_URL}/users`, {
    headers: { authorization: req.headers.authorization }
  });
  res.json(response.data);
});

app.put('/api/users/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.put(`${AUTH_URL}/users/${req.params.id}`, req.body, {
    headers: { authorization: req.headers.authorization }
  });
  res.json(response.data);
});

app.delete('/api/users/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.delete(`${AUTH_URL}/users/${req.params.id}`, {
    headers: { authorization: req.headers.authorization }
  });
  res.json(response.data);
});

app.post('/api/priority', async (req, res) => {
  const response = await axios.post(`${PRIORITY_URL}/priority`, req.body);
  res.json(response.data);
});

app.listen(4000, () => {
  console.log('API Gateway running on http://localhost:4000');
});
