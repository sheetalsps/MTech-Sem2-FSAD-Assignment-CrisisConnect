const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crisisconnect')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Please ensure MongoDB is installed and running on localhost:27017');
    console.log('Installation instructions: https://docs.mongodb.com/manual/installation/');
    process.exit(1);
  });

// Incident Schema
const incidentSchema = new mongoose.Schema({
  type: { type: String, required: true, default: 'General' },
  location: { type: String, required: true, default: 'Unknown' },
  latitude: { type: Number },
  longitude: { type: Number },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  requester: { type: String, default: 'Anonymous' },
  media: [{
    name: String,
    type: String,
    data: String
  }],
  chat: [{
    sender: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Incident = mongoose.model('Incident', incidentSchema);

// Routes
app.get('/incidents', async (req, res) => {
  try {
    const filter = {};
    if (req.query.requester) {
      filter.requester = req.query.requester;
    }
    const incidents = await Incident.find(filter);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/incidents', async (req, res) => {
  try {
    const incident = new Incident({
      type: req.body.type || 'General',
      location: req.body.location || 'Unknown',
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      description: req.body.description || '',
      priority: req.body.priority || 'Medium',
      status: 'Open',
      requester: req.body.requester || 'Anonymous',
      media: Array.isArray(req.body.media) ? req.body.media : [],
      chat: []
    });
    const savedIncident = await incident.save();
    res.status(201).json(savedIncident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/incidents/:id/messages', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const message = {
      sender: req.body.sender || 'Citizen',
      message: req.body.message || '',
      createdAt: Date.now()
    };

    incident.chat.push(message);
    incident.updatedAt = Date.now();
    await incident.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5001, () => {
  console.log('Incident Service running on http://localhost:5001');
});
