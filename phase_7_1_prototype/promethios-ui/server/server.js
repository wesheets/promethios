// ES Module version of server.js with API integration
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './api.js';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🚨 EMERGENCY: Increase payload limits to handle large requests
app.use(express.json({ limit: '200mb' })); // Increased from default ~1mb to 200mb
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// 🚨 DEBUG: Log request sizes for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentLength = req.headers['content-length'] || 0;
    console.log(`🚨 [FRONTEND-SERVER-DEBUG] ${req.method} ${req.path} - Content-Length: ${contentLength} bytes`);
    if (parseInt(contentLength) > 1000000) { // > 1MB
      console.log(`🚨 [FRONTEND-SERVER-DEBUG] LARGE PAYLOAD: ${contentLength} bytes to ${req.path}`);
    }
  }
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// For any other request, send the index.html file
// This enables client-side routing
app.get("*", (req, res) => {
  console.log(`Server serving index.html for path: ${req.path}`);
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

// Use the PORT environment variable provided by Render.com
// or default to 3000 for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
