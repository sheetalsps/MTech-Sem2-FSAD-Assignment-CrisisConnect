const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { createLogger, httpMiddleware, listenServer } = require('./logger');

const logger = createLogger('auth');
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
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'staff', 'admin', 'volunteer'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const tokenStore = new Map();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  tokenStore.set(token, {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    createdAt: Date.now()
  });
  return token;
}

function authenticateToken(req, res) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }

  const token = header.split(' ')[1];
  const session = tokenStore.get(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  return session;
}

function requireAdmin(req, res) {
  const session = authenticateToken(req, res);
  if (!session) return null;
  if (session.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return session;
}

function validateSignupInput(username, password, role) {
  const details = [];
  const u = String(username ?? '').trim();
  if (u.length < 3 || u.length > 48) {
    details.push({ field: 'username', message: 'Username must be 3–48 characters' });
  } else if (!/^[\w.-]+$/.test(u)) {
    details.push({ field: 'username', message: 'Username may only contain letters, numbers, underscore, dot, hyphen' });
  }
  const pw = String(password ?? '');
  if (!pw) {
    details.push({ field: 'password', message: 'Password is required' });
  } else if (pw.length < 8 || pw.length > 128) {
    details.push({ field: 'password', message: 'Password must be 8–128 characters' });
  }
  if (role != null && role !== '' && !['user', 'staff', 'admin', 'volunteer'].includes(role)) {
    details.push({ field: 'role', message: 'Invalid role' });
  }
  return { username: u, details };
}

app.post('/signup', async (req, res) => {
  try {
    const { password, role = 'user' } = req.body;
    const { username, details } = validateSignupInput(req.body.username, password, role);
    if (details.length) {
      return res.status(400).json({ error: 'Validation failed', details });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const user = new User({ username, passwordHash: hashPassword(String(password)), role });
    await user.save();

    const token = createToken(user);
    res.status(201).json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [
          !username && { field: 'username', message: 'Username is required' },
          !password && { field: 'password', message: 'Password is required' }
        ].filter(Boolean)
      });
    }

    const user = await User.findOne({ username });
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/me', (req, res) => {
  const session = authenticateToken(req, res);
  if (!session) return;
  res.json({ id: session.id, username: session.username, role: session.role });
});

app.get('/users', async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session) return;
  try {
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session) return;
  try {
    const { role } = req.body;
    if (role && !['user', 'staff', 'admin', 'volunteer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const update = {};
    if (role) update.role = role;
    if (req.body.username) update.username = req.body.username;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true, projection: { passwordHash: 0 } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  const session = requireAdmin(req, res);
  if (!session) return;
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

listenServer(app, 5005, logger, () => {
  logger.info('Auth Service running on http://localhost:5005');
});