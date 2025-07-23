require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://promethios.ai',
    'https://promethios-phase-7-1-ui.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('🌐 Query params:', req.query);
  console.log('🌐 Headers:', {
    'content-type': req.headers['content-type'],
    'origin': req.headers['origin'],
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  next();
});

// Routes
app.use('/api/agent-metrics', require('./routes/agentMetrics'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/benchmark', require('./routes/benchmark'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/deploy', require('./routes/deploy'));
app.use('/api/execution', require('./routes/execution'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/keys', require('./routes/apiKeys'));
app.use('/api/model', require('./routes/model'));
app.use('/api/multi_agent_system', require('./routes/multiAgentSystem'));
app.use('/api/observer', require('./routes/observer'));
app.use('/api/observers', require('./routes/observer')); // Also handle /api/observers for compatibility
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/status', require('./routes/status'));
app.use('/api/trust', require('./routes/trustBoundaries'));
app.use('/api/attestations', require('./routes/attestations'));
app.use('/api/upload', require('./routes/upload'));

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
