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
app.use('/api/chat', require('./routes/chat'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/multi_agent_system', require('./routes/multiAgentSystem'));

// Health check endpoints (both /health and /api/health for compatibility)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Promethios Phase 7.1 API is running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Promethios Phase 7.1 API is running' });
});

// System status endpoint
app.get('/api/system/status', (req, res) => {
  res.status(200).json({ 
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      llm: 'connected',
      governance: 'active'
    }
  });
});

// Sessions endpoint
app.get('/api/sessions', (req, res) => {
  res.status(200).json({ 
    sessions: [],
    total: 0,
    active: 0
  });
});

// Agent metrics endpoint
app.get('/api/agents/:agentId/metrics', (req, res) => {
  const { agentId } = req.params;
  res.status(200).json({
    agent_id: agentId,
    status: 'active',
    response_time: Math.floor(Math.random() * 1000) + 500,
    success_rate: 0.95 + Math.random() * 0.05,
    last_activity: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
