const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const { attachPrometheus } = require('./prometheus-metrics');
const {
  handleValidation,
  signupBody,
  loginBody,
  incidentCreateBody,
  resourceCreateBody,
  volunteerRegisterBody,
  broadcastCreateBody,
  liveLocationBody,
  chatMessageBody,
  staffAssignmentBody,
  assignmentPatchBody,
  volunteerApprovalBody
} = require('./validation');
const { createLogger, httpMiddleware, listenServer } = require('./logger');

const logger = createLogger('gateway');
const app = express();
app.use(cors());
app.use(express.json({ limit: '32mb' }));
app.use(httpMiddleware(logger));

attachPrometheus(app);

const openapiSpec = yaml.load(
  fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8')
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'CrisisConnect API'
}));

app.get('/openapi.yaml', (req, res) => {
  res.type('text/yaml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

const INCIDENT_URL = 'http://localhost:5001';
const VOLUNTEER_URL = 'http://localhost:5002';
const RESOURCE_URL = 'http://localhost:5003';
const PRIORITY_URL = 'http://localhost:5004';
const AUTH_URL = 'http://localhost:5005';

function authUpstreamMessage(error) {
  const body = error.response?.data?.error;
  if (body) return body;
  const code = error.code;
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
    return 'Cannot reach auth at localhost:5005. Start MongoDB on port 27017, then run the auth service (npm run start:auth in backend/, or npm run start:backend from the repo root).';
  }
  if (code === 'ETIMEDOUT' || code === 'ECONNABORTED') {
    return 'Authentication service request timed out.';
  }
  return 'Authentication service unavailable';
}

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
    if (!error.response) {
      res.status(502).json({ error: authUpstreamMessage(error) });
      return null;
    }
    const status = error.response.status || 401;
    const message = error.response.data?.error || 'Unauthorized';
    res.status(status).json({ error: message });
    return null;
  }
}

async function getOptionalUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const response = await axios.get(`${AUTH_URL}/me`, {
      headers: { authorization: authHeader }
    });
    return response.data;
  } catch {
    return null;
  }
}

function checkRole(user, roles) {
  return roles.includes(user.role);
}

function forwardAxios(res, error, useAuthFallbackMessage = false) {
  if (error.response?.data && typeof error.response.data === 'object') {
    return res.status(error.response.status).json(error.response.data);
  }
  const status = error.response?.status || 502;
  const msg = useAuthFallbackMessage ? authUpstreamMessage(error) : (error.message || 'Bad gateway');
  res.status(status).json({ error: msg });
}

app.post('/api/auth/signup', signupBody, handleValidation, async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/signup`, req.body);
    res.status(response.status || 200).json(response.data);
  } catch (error) {
    forwardAxios(res, error, true);
  }
});

app.post('/api/auth/login', loginBody, handleValidation, async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/login`, req.body);
    res.json(response.data);
  } catch (error) {
    forwardAxios(res, error, true);
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
    res.status(status).json({ error: authUpstreamMessage(error) });
  }
});

app.get('/api/analytics/summary', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const response = await axios.get(`${INCIDENT_URL}/analytics/summary`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({
      error: error.response?.data?.error || error.message
    });
  }
});

app.get('/api/broadcasts', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  try {
    const response = await axios.get(`${INCIDENT_URL}/broadcasts`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({
      error: error.response?.data?.error || error.message
    });
  }
});

app.post('/api/broadcasts', broadcastCreateBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const response = await axios.post(`${INCIDENT_URL}/broadcasts`, {
      ...req.body,
      createdBy: user.username
    });
    res.status(response.status || 201).json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
});

app.get('/api/incidents/nearby', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['volunteer', 'staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const response = await axios.get(`${INCIDENT_URL}/incidents/nearby`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({
      error: error.response?.data?.error || error.message
    });
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

app.post('/api/incidents', incidentCreateBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  try {
    const response = await axios.post(`${INCIDENT_URL}/incidents`, req.body);
    res.json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
});

app.post('/api/incidents/:id/live-location', liveLocationBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  try {
    const incRes = await axios.get(`${INCIDENT_URL}/incidents/${req.params.id}`);
    const incident = incRes.data;
    const isOwner = incident.requester === user.username;
    const isElevated = checkRole(user, ['staff', 'admin']);
    if (!isOwner && !isElevated) {
      return res.status(403).json({ error: 'Only the requester or staff can update live location' });
    }
    const response = await axios.post(
      `${INCIDENT_URL}/incidents/${req.params.id}/live-location`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
});

app.post('/api/incidents/:id/assignments/offer', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['volunteer'])) {
    return res.status(403).json({ error: 'Only volunteers can offer help on incidents' });
  }
  try {
    const profRes = await axios.get(`${VOLUNTEER_URL}/volunteers/me/${user.id}`);
    const profile = profRes.data;
    if (profile.approvalStatus !== 'approved') {
      return res.status(403).json({ error: 'Volunteer profile must be approved before responding to incidents' });
    }
    const volunteerProfileId = profile.id || profile._id;
    const response = await axios.post(
      `${INCIDENT_URL}/incidents/${req.params.id}/assignments/offer`,
      {
        volunteerProfileId,
        volunteerUserId: user.id,
        volunteerName: user.username
      }
    );
    res.status(response.status || 201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      error: error.response?.data?.error || error.message
    });
  }
});

app.post('/api/incidents/:id/assignments', staffAssignmentBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const response = await axios.post(
      `${INCIDENT_URL}/incidents/${req.params.id}/assignments`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
});

app.patch('/api/incidents/:id/assignments/:volunteerProfileId', assignmentPatchBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;

  const allowedElevated = checkRole(user, ['staff', 'admin']);
  let allowedVolunteer = false;
  if (checkRole(user, ['volunteer'])) {
    try {
      const profRes = await axios.get(`${VOLUNTEER_URL}/volunteers/me/${user.id}`);
      const vid = profRes.data.id || profRes.data._id;
      allowedVolunteer = vid === req.params.volunteerProfileId;
    } catch {
      allowedVolunteer = false;
    }
  }

  if (!allowedElevated && !allowedVolunteer) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const response = await axios.patch(
      `${INCIDENT_URL}/incidents/${req.params.id}/assignments/${req.params.volunteerProfileId}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
});

app.post('/api/incidents/:id/messages', chatMessageBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  try {
    const response = await axios.post(`${INCIDENT_URL}/incidents/${req.params.id}/messages`, {
      sender: user.username,
      message: req.body.message
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
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
  try {
    const user = await getOptionalUser(req);
    const url =
      user && ['staff', 'admin'].includes(user.role)
        ? `${VOLUNTEER_URL}/volunteers/manage`
        : `${VOLUNTEER_URL}/volunteers/public`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({
      error: error.response?.data?.error || error.message
    });
  }
});

app.get('/api/volunteers/me/profile', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  try {
    const response = await axios.get(`${VOLUNTEER_URL}/volunteers/me/${user.id}`);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      error: error.response?.data?.error || error.message
    });
  }
});

app.post('/api/volunteers/register', volunteerRegisterBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['volunteer'])) {
    return res.status(403).json({ error: 'Volunteer role required to register a responder profile' });
  }
  try {
    const response = await axios.post(`${VOLUNTEER_URL}/volunteers/register`, {
      userId: user.id,
      username: user.username,
      name: req.body.name,
      skills: req.body.skills,
      location: req.body.location,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    });
    res.status(response.status || 201).json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
});

app.patch('/api/volunteers/:id/approval', volunteerApprovalBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const response = await axios.patch(`${VOLUNTEER_URL}/volunteers/${req.params.id}/approval`, req.body);
    res.json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
});

app.get('/api/my-requests', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  const response = await axios.get(`${INCIDENT_URL}/incidents`, {
    params: { requester: user.username }
  });
  res.json(response.data);
});

app.get('/api/my-assignments', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['volunteer', 'staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const response = await axios.get(`${INCIDENT_URL}/incidents/volunteer/${user.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({
      error: error.response?.data?.error || error.message
    });
  }
});

app.get('/api/volunteers/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  const response = await axios.get(`${VOLUNTEER_URL}/volunteers/${req.params.id}`);
  res.json(response.data);
});

app.post('/api/volunteers', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.post(`${VOLUNTEER_URL}/volunteers`, req.body);
  res.json(response.data);
});

app.put('/api/volunteers/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.put(`${VOLUNTEER_URL}/volunteers/${req.params.id}`, req.body);
  res.json(response.data);
});

app.delete('/api/volunteers/:id', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const response = await axios.delete(`${VOLUNTEER_URL}/volunteers/${req.params.id}`);
  res.json(response.data);
});

app.get('/api/resources', async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;
  const response = await axios.get(`${RESOURCE_URL}/resources`);
  res.json(response.data);
});

app.post('/api/resources', resourceCreateBody, handleValidation, async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user || !checkRole(user, ['staff', 'admin'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const response = await axios.post(`${RESOURCE_URL}/resources`, req.body);
    res.json(response.data);
  } catch (error) {
    forwardAxios(res, error, false);
  }
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

listenServer(app, 4000, logger, () => {
  logger.info('API Gateway running on http://localhost:4000');
  logger.info('Swagger UI: http://localhost:4000/api-docs');
  logger.info('OpenAPI YAML: http://localhost:4000/openapi.yaml');
  logger.info('Prometheus metrics: http://localhost:4000/metrics');
});
