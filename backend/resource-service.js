const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createLogger, httpMiddleware, listenServer } = require('./logger');

const logger = createLogger('resource');
const app = express();
app.use(cors());
app.use(express.json());
app.use(httpMiddleware(logger));

mongoose.connect('mongodb://localhost:27017/crisisconnect')
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch(err => {
    logger.error({ err: err.message }, 'MongoDB connection error');
    logger.info('Please ensure MongoDB is installed and running on localhost:27017');
    logger.info('Installation instructions: https://docs.mongodb.com/manual/installation/');
    process.exit(1);
  });

// Resource Schema
const resourceSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['general', 'hospital_bed', 'blood_request'],
    default: 'general'
  },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  location: { type: String, required: true },
  status: { type: String, enum: ['Available', 'In Use', 'Depleted', 'Reserved'], default: 'Available' },
  description: { type: String, default: '' },
  wardType: { type: String, default: '' },
  bedUnitLabel: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  bloodUrgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Resource = mongoose.model('Resource', resourceSchema);

// Routes
app.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/resources', async (req, res) => {
  try {
    const category = String(req.body.category ?? '').trim();
    const location = String(req.body.location ?? '').trim();
    const quantity = req.body.quantity;
    const d = [];
    if (!category) d.push({ field: 'category', message: 'Category is required' });
    if (!location) d.push({ field: 'location', message: 'Location is required' });
    if (quantity === undefined || quantity === null || Number(quantity) < 0 || !Number.isInteger(Number(quantity))) {
      d.push({ field: 'quantity', message: 'Quantity must be a non-negative integer' });
    }
    if (d.length) {
      return res.status(400).json({ error: 'Validation failed', details: d });
    }
    const resource = new Resource({
      resourceType: req.body.resourceType || 'general',
      category,
      quantity: Number(quantity),
      location,
      status: req.body.status || 'Available',
      description: req.body.description || '',
      wardType: req.body.wardType || '',
      bedUnitLabel: req.body.bedUnitLabel || '',
      bloodGroup: req.body.bloodGroup || '',
      bloodUrgency: req.body.bloodUrgency || 'medium'
    });
    const savedResource = await resource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

listenServer(app, 5003, logger, () => {
  logger.info('Resource Service running on http://localhost:5003');
});
