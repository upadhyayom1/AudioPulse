/**
 * Express Server entry point for AudioPulse Backend.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const audioRoutes = require('./routes/audio.routes');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend clients
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Mount Audio API routes
app.use('/api/audio', audioRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AudioPulse API is running.' });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'AudioPulse API',
    endpoints: {
      health: 'GET /api/health',
      trim: 'POST /api/audio/trim'
    }
  });
});

// Handle 404 Not Found
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`AudioPulse Backend Server`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Handle server listen errors (e.g. port conflicts)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
    console.error(`You can kill the existing process or change PORT in backend/.env.\n`);
    process.exit(1);
  } else {
    console.error('[Server listen error]', err);
  }
});
