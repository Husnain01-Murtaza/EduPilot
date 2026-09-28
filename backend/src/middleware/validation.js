const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const allowedDomains = () =>
  (process.env.ALLOWED_EMAIL_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email is required' });

  const domains = allowedDomains();
  const domain = email.split('@')[1].toLowerCase();
  if (domains.length && !domains.includes(domain)) {
    return res.status(400).json({ error: `Use a university email (${domains.map((d) => '@' + d).join(', ')})` });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  next();
};

module.exports = { validateSignup };
