const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '32mb' }));

mongoose.connect('mongodb://localhost:27017/crisisconnect')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

const assignmentSchema = new mongoose.Schema({
  volunteerProfileId: { type: String, required: true },
  volunteerUserId: { type: String, default: '' },
  volunteerName: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed'],
    default: 'pending'
  },
  progressNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const incidentSchema = new mongoose.Schema({
  type: { type: String, required: true, default: 'General' },
  location: { type: String, required: true, default: 'Unknown' },
  latitude: { type: Number },
  longitude: { type: Number },
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    recordedAt: { type: Date, default: Date.now }
  }],
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
  assignments: [assignmentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Incident = mongoose.model('Incident', incidentSchema);

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  createdBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

function haversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function indexAssignment(incident, volunteerProfileId) {
  return incident.assignments.findIndex((a) => a.volunteerProfileId === volunteerProfileId);
}

/** Incidents where this volunteer appears in assignments */
app.get('/incidents/volunteer/:userId', async (req, res) => {
  try {
    const incidents = await Incident.find({
      'assignments.volunteerUserId': req.params.userId
    }).sort({ updatedAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Nearby open incidents with coordinates */
app.get('/incidents/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm, 10) || 50;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const incidents = await Incident.find({
      status: { $in: ['Open', 'In Progress'] },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });

    const withDistance = incidents
      .map((inc) => {
        const km = haversineKm(lat, lng, inc.latitude, inc.longitude);
        return { incident: inc.toObject(), distanceKm: km };
      })
      .filter((x) => x.distanceKm != null && x.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json(withDistance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/analytics/summary', async (req, res) => {
  try {
    const incidents = await Incident.find();
    const byStatus = {};
    const byPriority = {};
    for (const i of incidents) {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
      byPriority[i.priority] = (byPriority[i.priority] || 0) + 1;
    }
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await Incident.countDocuments({ createdAt: { $gte: weekAgo } });
    const openAssignments = incidents.reduce((acc, inc) => {
      return acc + (inc.assignments || []).filter((a) => a.status === 'pending' || a.status === 'accepted' || a.status === 'in_progress').length;
    }, 0);

    res.json({
      totalIncidents: incidents.length,
      byStatus,
      byPriority,
      createdLast7Days: recent,
      activeAssignments: openAssignments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/broadcasts', async (req, res) => {
  try {
    const list = await Broadcast.find().sort({ createdAt: -1 }).limit(50);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/broadcasts', async (req, res) => {
  try {
    const doc = new Broadcast({
      title: req.body.title,
      message: req.body.message,
      severity: req.body.severity || 'warning',
      createdBy: req.body.createdBy || 'admin'
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/incidents', async (req, res) => {
  try {
    const filter = {};
    if (req.query.requester) filter.requester = req.query.requester;
    const incidents = await Incident.find(filter);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/incidents', async (req, res) => {
  try {
    const lat = req.body.latitude;
    const lon = req.body.longitude;
    const history = [];
    if (lat != null && lon != null) {
      history.push({ latitude: lat, longitude: lon, recordedAt: Date.now() });
    }
    const incident = new Incident({
      type: req.body.type || 'General',
      location: req.body.location || 'Unknown',
      latitude: lat,
      longitude: lon,
      locationHistory: history,
      description: req.body.description || '',
      priority: req.body.priority || 'Medium',
      status: 'Open',
      requester: req.body.requester || 'Anonymous',
      media: Array.isArray(req.body.media) ? req.body.media : [],
      chat: [],
      assignments: []
    });
    const savedIncident = await incident.save();
    res.status(201).json(savedIncident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/incidents/:id/live-location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    incident.latitude = latitude;
    incident.longitude = longitude;
    incident.locationHistory.push({
      latitude,
      longitude,
      recordedAt: Date.now()
    });
    incident.updatedAt = Date.now();
    await incident.save();
    res.json(incident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/incidents/:id/messages', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

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

/** Volunteer offers to help (creates pending assignment) */
app.post('/incidents/:id/assignments/offer', async (req, res) => {
  try {
    const {
      volunteerProfileId,
      volunteerUserId,
      volunteerName
    } = req.body;
    if (!volunteerProfileId) {
      return res.status(400).json({ error: 'volunteerProfileId is required' });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    if (indexAssignment(incident, volunteerProfileId) >= 0) {
      return res.status(409).json({ error: 'You already have an assignment record on this incident' });
    }

    incident.assignments.push({
      volunteerProfileId,
      volunteerUserId: volunteerUserId || '',
      volunteerName: volunteerName || '',
      status: 'pending',
      updatedAt: Date.now()
    });
    incident.updatedAt = Date.now();
    await incident.save();
    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/** Staff assigns a volunteer */
app.post('/incidents/:id/assignments', async (req, res) => {
  try {
    const {
      volunteerProfileId,
      volunteerUserId,
      volunteerName,
      status = 'pending'
    } = req.body;
    if (!volunteerProfileId) {
      return res.status(400).json({ error: 'volunteerProfileId is required' });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const idx = indexAssignment(incident, volunteerProfileId);
    if (idx >= 0) {
      incident.assignments[idx].status = status;
      incident.assignments[idx].volunteerUserId = volunteerUserId || incident.assignments[idx].volunteerUserId;
      incident.assignments[idx].volunteerName = volunteerName || incident.assignments[idx].volunteerName;
      incident.assignments[idx].updatedAt = Date.now();
    } else {
      incident.assignments.push({
        volunteerProfileId,
        volunteerUserId: volunteerUserId || '',
        volunteerName: volunteerName || '',
        status,
        updatedAt: Date.now()
      });
    }
    incident.updatedAt = Date.now();
    await incident.save();
    res.json(incident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/incidents/:id/assignments/:volunteerProfileId', async (req, res) => {
  try {
    const { status, progressNote } = req.body;
    if (status && !['pending', 'accepted', 'rejected', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const idx = indexAssignment(incident, req.params.volunteerProfileId);
    if (idx < 0) return res.status(404).json({ error: 'Assignment not found' });

    if (status) incident.assignments[idx].status = status;
    if (progressNote != null) incident.assignments[idx].progressNote = progressNote;
    incident.assignments[idx].updatedAt = Date.now();
    incident.updatedAt = Date.now();
    await incident.save();
    res.json(incident);
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
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5001, () => {
  console.log('Incident Service running on http://localhost:5001');
});
