// ES Module version of server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// Use the PORT environment variable provided by Render.com
// or default to 3000 for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
