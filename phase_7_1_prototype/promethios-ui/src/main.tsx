import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Add early logging to catch initialization errors
console.log('Starting application initialization...');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found in the DOM');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('Root created successfully, about to render...');
  
  // Render App component which contains all routing and provider logic
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('Render completed successfully');
} catch (error) {
  console.error('Error during rendering:', error);
  
  // Try to render a fallback directly to the DOM if React rendering fails
  try {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">
          <h2>React Rendering Error</h2>
          <p>An error occurred during application initialization:</p>
          <pre style="background-color: #f1f1f1; padding: 10px; border-radius: 4px; overflow: auto;">${error?.message || 'Unknown error'}</pre>
          <p>Check the console for more details.</p>
        </div>
      `;
    }
  } catch (fallbackError) {
    console.error('Error rendering fallback UI:', fallbackError);
  }
}
