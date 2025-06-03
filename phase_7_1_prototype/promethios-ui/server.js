const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static('dist'));
app.use('/cmu-playground', express.static('public/cmu-playground'));

// Environment variables endpoint
app.get('/api/env', (req, res) => {
  // Only expose VITE_ prefixed environment variables for security
  const envVars = {
    VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || null,
    VITE_ANTHROPIC_API_KEY: process.env.VITE_ANTHROPIC_API_KEY || null,
    VITE_COHERE_API_KEY: process.env.VITE_COHERE_API_KEY || null,
    VITE_HUGGINGFACE_API_KEY: process.env.VITE_HUGGINGFACE_API_KEY || null
  };
  
  // Remove null values
  const filteredEnvVars = Object.fromEntries(
    Object.entries(envVars).filter(([key, value]) => value !== null)
  );
  
  console.log('Environment variables requested:', Object.keys(filteredEnvVars));
  
  res.json({
    success: true,
    env: filteredEnvVars,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables available:', Object.keys(process.env).filter(key => key.startsWith('VITE_')));
});

