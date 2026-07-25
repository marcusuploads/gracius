require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { init } = require('./db');

const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const sessionRoutes = require('./routes/sessions');
const friendRoutes = require('./routes/friends');
const galleryRoutes = require('./routes/gallery');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' })); // generous limit for base64 gallery photos

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the built React frontend
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Study Tracker server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
