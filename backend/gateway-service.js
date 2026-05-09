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

app.get('/api/incidents', async (req, res) => {
  const response = await axios.get(`${INCIDENT_URL}/incidents`);
  res.json(response.data);
});

app.get('/api/incidents/:id', async (req, res) => {
  const response = await axios.get(`${INCIDENT_URL}/incidents/${req.params.id}`);
  res.json(response.data);
});

app.post('/api/incidents', async (req, res) => {
  const response = await axios.post(`${INCIDENT_URL}/incidents`, req.body);
  res.json(response.data);
});

app.put('/api/incidents/:id', async (req, res) => {
  const response = await axios.put(`${INCIDENT_URL}/incidents/${req.params.id}`, req.body);
  res.json(response.data);
});

app.delete('/api/incidents/:id', async (req, res) => {
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
  const response = await axios.get(`${RESOURCE_URL}/resources`);
  res.json(response.data);
});

app.post('/api/resources', async (req, res) => {
  const response = await axios.post(`${RESOURCE_URL}/resources`, req.body);
  res.json(response.data);
});

app.post('/api/priority', async (req, res) => {
  const response = await axios.post(`${PRIORITY_URL}/priority`, req.body);
  res.json(response.data);
});

app.listen(4000, () => {
  console.log('API Gateway running on http://localhost:4000');
});
