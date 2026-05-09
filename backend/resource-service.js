const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const resources = [
  {
    id: uuid(),
    category: 'Water Bottles',
    quantity: 120,
    location: 'Warehouse A',
    status: 'Available'
  }
];

app.get('/resources', (req, res) => {
  res.json(resources);
});

app.post('/resources', (req, res) => {
  const resource = {
    id: uuid(),
    category: req.body.category || 'General Supplies',
    quantity: Number(req.body.quantity) || 0,
    location: req.body.location || 'Unknown',
    status: req.body.status || 'Available'
  };
  resources.push(resource);
  res.status(201).json(resource);
});

app.listen(5003, () => {
  console.log('Resource Service running on http://localhost:5003');
});
