const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const volunteers = [
  {
    id: uuid(),
    name: 'Rohan Patel',
    skills: ['First Aid', 'Logistics'],
    location: 'Sector 8',
    available: true
  }
];

app.get('/volunteers', (req, res) => {
  res.json(volunteers);
});

app.post('/volunteers', (req, res) => {
  const volunteer = {
    id: uuid(),
    name: req.body.name || 'Unknown',
    skills: req.body.skills || [],
    location: req.body.location || 'Unknown',
    available: req.body.available ?? true
  };
  volunteers.push(volunteer);
  res.status(201).json(volunteer);
});

app.listen(5002, () => {
  console.log('Volunteer Service running on http://localhost:5002');
});
