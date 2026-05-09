const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/crisisconnect')
  .then(() => console.log('Volunteer Service: Connected to MongoDB'))
  .catch((err) => {
    console.error('Volunteer Service: MongoDB connection error:', err.message);
    process.exit(1);
  });

const volunteerSchema = new mongoose.Schema({
  userId: { type: String, index: true, sparse: true },
  username: { type: String, default: '' },
  name: { type: String, required: true },
  skills: [{ type: String }],
  location: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  available: { type: Boolean, default: true },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

function toPublic(doc) {
  const v = doc.toObject ? doc.toObject() : doc;
  const id = v._id?.toString?.() || v._id;
  return {
    id,
    _id: id,
    userId: v.userId,
    username: v.username,
    name: v.name,
    skills: v.skills || [],
    location: v.location,
    latitude: v.latitude,
    longitude: v.longitude,
    available: v.available,
    approvalStatus: v.approvalStatus,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt
  };
}

/** Approved volunteers only — for dashboard / public roster */
app.get('/volunteers/public', async (req, res) => {
  try {
    const list = await Volunteer.find({ approvalStatus: 'approved' }).sort({ name: 1 });
    res.json(list.map(toPublic));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Full list — intended for staff/admin via gateway */
app.get('/volunteers/manage', async (req, res) => {
  try {
    const list = await Volunteer.find().sort({ createdAt: -1 });
    res.json(list.map(toPublic));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/volunteers/me/:userId', async (req, res) => {
  try {
    const v = await Volunteer.findOne({ userId: req.params.userId });
    if (!v) return res.status(404).json({ error: 'Volunteer profile not found' });
    res.json(toPublic(v));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/volunteers/register', async (req, res) => {
  try {
    const {
      userId,
      username,
      name,
      skills,
      location,
      latitude,
      longitude
    } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    const existing = await Volunteer.findOne({ userId });
    if (existing) {
      return res.status(409).json({ error: 'Volunteer registration already exists for this account' });
    }

    const volunteer = new Volunteer({
      userId,
      username: username || '',
      name,
      skills: Array.isArray(skills) ? skills : [],
      location: location || '',
      latitude,
      longitude,
      available: true,
      approvalStatus: 'pending',
      updatedAt: Date.now()
    });
    await volunteer.save();
    res.status(201).json(toPublic(volunteer));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/volunteers/:id/approval', async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Invalid approvalStatus' });
    }
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      { approvalStatus, updatedAt: Date.now() },
      { new: true }
    );
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(toPublic(volunteer));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/volunteers', async (req, res) => {
  try {
    const volunteer = new Volunteer({
      userId: req.body.userId,
      username: req.body.username || '',
      name: req.body.name || 'Unknown',
      skills: Array.isArray(req.body.skills) ? req.body.skills : [],
      location: req.body.location || '',
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      available: req.body.available ?? true,
      approvalStatus: req.body.approvalStatus || 'approved',
      updatedAt: Date.now()
    });
    await volunteer.save();
    res.status(201).json(toPublic(volunteer));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/volunteers/:id', async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(toPublic(volunteer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/volunteers/:id', async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        skills: Array.isArray(req.body.skills) ? req.body.skills : undefined,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(toPublic(volunteer));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/volunteers/:id', async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    res.json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5002, () => {
  console.log('Volunteer Service running on http://localhost:5002');
});
