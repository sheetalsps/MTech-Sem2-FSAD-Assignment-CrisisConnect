const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const incidents = [
  {
    id: uuid(),
    type: 'Medical',
    location: 'Sector 12, Town Centre',
    description: 'Multiple injured after building collapse.',
    priority: 'High',
    status: 'Open'
  }
];

app.get('/incidents', (req, res) => {
  res.json(incidents);
});

app.post('/incidents', (req, res) => {
  const incident = {
    id: uuid(),
    type: req.body.type || 'General',
    location: req.body.location || 'Unknown',
    description: req.body.description || '',
    priority: req.body.priority || 'Medium',
    status: 'Open'
  };
  incidents.push(incident);
  res.status(201).json(incident);
});

app.listen(5001, () => {
  console.log('Incident Service running on http://localhost:5001');
});
