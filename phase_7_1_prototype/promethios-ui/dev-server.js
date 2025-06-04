/**
 * Development Server for CMU Interactive Playground
 * 
 * This script starts both the Vite frontend and Express backend servers concurrently
 * to enable full-stack development with API access.
 */

import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const EXPRESS_PORT = 3000;
const VITE_PORT = 5173;

// Start Express backend server
console.log('Starting Express backend server...');
const expressServer = spawn('node', ['server/server.js'], {
  env: { ...process.env, PORT: EXPRESS_PORT.toString() },
  stdio: 'pipe'
});

// Handle Express server output
expressServer.stdout.on('data', (data) => {
  console.log(`[Express] ${data.toString().trim()}`);
});

expressServer.stderr.on('data', (data) => {
  console.error(`[Express Error] ${data.toString().trim()}`);
});

expressServer.on('close', (code) => {
  console.log(`Express server process exited with code ${code}`);
});

// Give Express server a moment to start before launching Vite
setTimeout(() => {
  // Start Vite frontend server
  console.log('Starting Vite frontend server...');
  const viteServer = spawn('npx', ['vite', '--port', VITE_PORT.toString()], {
    stdio: 'pipe'
  });

  // Handle Vite server output
  viteServer.stdout.on('data', (data) => {
    console.log(`[Vite] ${data.toString().trim()}`);
  });

  viteServer.stderr.on('data', (data) => {
    console.error(`[Vite Error] ${data.toString().trim()}`);
  });

  viteServer.on('close', (code) => {
    console.log(`Vite server process exited with code ${code}`);
    // Kill Express server when Vite exits
    expressServer.kill();
  });
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down development servers...');
  expressServer.kill();
  process.exit();
});
