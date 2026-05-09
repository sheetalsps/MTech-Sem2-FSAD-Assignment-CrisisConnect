const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crisisconnect')
  .then(() => {
    console.log('Resource Service: Connected to MongoDB');
  })
  .catch(err => {
    console.error('Resource Service: MongoDB connection error:', err.message);
    console.log('Please ensure MongoDB is installed and running on localhost:27017');
    console.log('Installation instructions: https://docs.mongodb.com/manual/installation/');
    process.exit(1);
  });

// Resource Schema
const resourceSchema = new mongoose.Schema({
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  location: { type: String, required: true },
  status: { type: String, enum: ['Available', 'In Use', 'Depleted', 'Reserved'], default: 'Available' },
  description: { type: String, default: '' },
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
    const resource = new Resource({
      category: req.body.category,
      quantity: req.body.quantity,
      location: req.body.location,
      status: req.body.status || 'Available',
      description: req.body.description || ''
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

app.listen(5003, () => {
  console.log('Resource Service running on http://localhost:5003');
});
