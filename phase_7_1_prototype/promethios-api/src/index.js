require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://promethios.ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/benchmark', require('./routes/benchmark'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api', require('./routes/llm'));
app.use('/api', require('./routes/governance'));
app.use('/api', require('./routes/observer'));
app.use('/api', require('./routes/teams'));
app.use('/api', require('./routes/deploy'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Promethios Phase 7.1 API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
