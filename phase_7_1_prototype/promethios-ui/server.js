// ES Module version of server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced error logging
const logError = (err, req) => {
  const timestamp = new Date().toISOString();
  const errorLog = `[${timestamp}] ERROR: ${err.stack || err}\nRequest: ${req.method} ${req.url}\n\n`;
  
  // Log to console
  console.error(errorLog);
  
  // Also log to file for persistence
  fs.appendFileSync(path.join(__dirname, 'server-error.log'), errorLog, 'utf8');
};

const app = express();

// Add global error handler middleware
app.use((req, res, next) => {
  try {
    next();
  } catch (err) {
    logError(err, req);
    res.status(500).send('Server error occurred');
  }
});

// Serve static files from the dist directory with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, path) => {
    // Set correct MIME types for JavaScript modules
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// Only use the fallback for non-file requests
// This prevents index.html from being served for JS module requests
app.get('*', (req, res, next) => {
  // Skip fallback for paths with file extensions (likely static assets)
  if (req.path.includes('.')) {
    return next();
  }
  
  // For routes without extensions, serve index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  logError(err, req);
  res.status(500).send('Server error occurred');
});

// Use the PORT environment variable provided by Render.com
// or default to 3000 for local development
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  fs.appendFileSync(path.join(__dirname, 'server-error.log'), 
    `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack || err}\n\n`, 
    'utf8');
  // Don't exit the process as this would cause the container to restart
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  fs.appendFileSync(path.join(__dirname, 'server-error.log'), 
    `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n\n`, 
    'utf8');
});
