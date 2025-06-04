// ES Module version of server.js with direct serving of CMU playground
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/api.js';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Serve static files from the public directory for CMU playground
app.use('/cmu-playground', express.static(path.join(__dirname, 'public/cmu-playground')));

// Serve static files from the dist directory for the main app (if it exists)
app.use(express.static(path.join(__dirname, 'dist')));

// Special route for CMU playground
app.get('/cmu-playground/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/cmu-playground/index.html'));
});

// For any other request, try to send the index.html from dist if it exists
// This enables client-side routing for the main app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  const cmuIndexPath = path.join(__dirname, 'public/cmu-playground/index.html');
  
  // First try to serve the main app index.html
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If main app index.html doesn't exist, serve the CMU playground index.html
      console.log('Main index.html not found, serving CMU playground');
      res.sendFile(cmuIndexPath, (cmuErr) => {
        if (cmuErr) {
          // If both fail, send a 404
          res.status(404).send('Not found');
        }
      });
    }
  });
});

// Use the PORT environment variable provided by Render.com
// or default to 3000 for local development
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CMU Playground available at: http://localhost:${PORT}/cmu-playground/`);
});
