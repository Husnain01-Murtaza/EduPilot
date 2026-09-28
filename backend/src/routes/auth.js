const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { validateSignup } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

const issueTokens = (id) => ({
  token: jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' }),
  refreshToken: jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
});

// Signup: always creates a student. Admin roles are granted by a super_admin.
router.post('/signup', limiter, validateSignup, async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const user = await User.create({ name, email, passwordHash: password });
  res.status(201).json({ user, ...issueTokens(user._id) });
});

router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: String(email).toLowerCase() }));
  if (!user || !password || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!user.isActive) return res.status(403).json({ error: 'Account is inactive' });
  res.json({ user, ...issueTokens(user._id) });
});

router.post('/refresh', async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new Error('inactive');
    res.json({ token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authMiddleware, (req, res) => res.json(req.user));

module.exports = router;
