/**
 * Environment Variable Injection Script
 * This script injects server-side environment variables into the client-side window object
 * so they can be accessed by the CMU playground modules.
 */

// Create a global ENV object on window
window.ENV = window.ENV || {};

// Inject environment variables from server
// These would typically be injected by the server during HTML rendering
// For now, we'll check if they're available and provide fallbacks

const envVars = [
  'VITE_OPENAI_API_KEY',
  'VITE_ANTHROPIC_API_KEY', 
  'VITE_COHERE_API_KEY',
  'VITE_HUGGINGFACE_API_KEY'
];

// Try to get environment variables from various sources
envVars.forEach(varName => {
  // Check if already set in window.ENV
  if (window.ENV[varName]) {
    console.log(`✅ ${varName} found in window.ENV`);
    return;
  }
  
  // Check if available in import.meta.env (Vite build)
  if (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env[varName]) {
    window.ENV[varName] = import.meta.env[varName];
    console.log(`✅ ${varName} loaded from import.meta.env`);
    return;
  }
  
  // Check if available in process.env (Node.js context)
  if (typeof process !== 'undefined' && process.env && process.env[varName]) {
    window.ENV[varName] = process.env[varName];
    console.log(`✅ ${varName} loaded from process.env`);
    return;
  }
  
  // Not found anywhere
  console.warn(`⚠️ ${varName} not found in any environment source`);
});

console.log('Environment variables injection complete:', window.ENV);

