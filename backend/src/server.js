require('dotenv').config();
require('express-async-errors'); // lets async route handlers throw into the error middleware
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const { setupSocketHandlers } = require('./sockets/handlers');

['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'].forEach((k) => {
  if (!process.env[k]) {
    console.error(`Missing required env var ${k}`);
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);
const origins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((s) => s.trim());

const io = new Server(server, { cors: { origin: origins, credentials: true } });
app.set('io', io);

app.use(helmet());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/admin', require('./routes/admin'));

setupSocketHandlers(io);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (err.code === 11000) return res.status(409).json({ error: 'Duplicate value', fields: err.keyValue });
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
