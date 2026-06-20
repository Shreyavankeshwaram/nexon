require('dotenv').config();
const path = require('path');
const express = require('express');
const brochureLeadRouter = require('./routes/brochure-lead');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Allow Live Server (5501) and local dev to call the API
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isLocalOrigin =
    origin &&
    (origin === 'null' || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));

  if (isLocalOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: '32kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.use('/api/brochure-lead', brochureLeadRouter);

// Always return JSON for API errors (never HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

app.use((err, req, res, next) => {
  if (req.path && req.path.startsWith('/api')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request. Please check your form and try again.',
    });
  }
  next(err);
});

const rootDir = path.join(__dirname, '..');
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use(express.static(path.join(rootDir, 'interior-designer')));

app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'interior-designer', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Nexon Builders site running at http://localhost:${PORT}`);
  console.log(`Leads will be sent to: ${process.env.CLIENT_EMAIL || 'Sales@nexonbuilders.com'}`);
});
