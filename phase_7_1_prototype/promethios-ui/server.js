// ES Module version of server.js with support for both main app and CMU playground
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

// Serve static files from the dist directory for the main app
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the public directory for CMU playground
app.use('/cmu-playground', express.static(path.join(__dirname, 'public/cmu-playground')));

// Special route for CMU playground
app.get('/cmu-playground/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/cmu-playground/index.html'));
});

// For any other request, send the index.html from dist
// This enables client-side routing for the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Use the PORT environment variable provided by Render.com
// or default to 3000 for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Main app available at: http://localhost:${PORT}/`);
  console.log(`CMU Playground available at: http://localhost:${PORT}/cmu-playground/`);
});
