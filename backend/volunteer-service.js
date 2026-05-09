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

app.get('/volunteers/:id', (req, res) => {
  const volunteer = volunteers.find((item) => item.id === req.params.id);
  if (!volunteer) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }
  res.json(volunteer);
});

app.put('/volunteers/:id', (req, res) => {
  const index = volunteers.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }

  const updatedVolunteer = {
    ...volunteers[index],
    name: req.body.name ?? volunteers[index].name,
    skills: Array.isArray(req.body.skills) ? req.body.skills : volunteers[index].skills,
    location: req.body.location ?? volunteers[index].location,
    available: req.body.available ?? volunteers[index].available
  };

  volunteers[index] = updatedVolunteer;
  res.json(updatedVolunteer);
});

app.delete('/volunteers/:id', (req, res) => {
  const index = volunteers.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }
  volunteers.splice(index, 1);
  res.json({ message: 'Volunteer deleted successfully' });
});

app.listen(5002, () => {
  console.log('Volunteer Service running on http://localhost:5002');
});
