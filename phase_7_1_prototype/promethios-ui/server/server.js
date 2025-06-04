// ES Module version of server.js with API integration
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './api.js';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// For any other request, send the index.html file
// This enables client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Use the PORT environment variable provided by Render.com
// or default to 3000 for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
