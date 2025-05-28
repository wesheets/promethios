import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Create a simple error logger for production
const logError = (error: Error, info: { componentStack: string }) => {
  console.error('React Error Boundary caught an error:', error);
  console.error('Component stack:', info.componentStack);
  
  // In a real app, you might want to send this to a logging service
  if (typeof window !== 'undefined') {
    // Add a visible error message in production for debugging
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '0';
    errorDiv.style.left = '0';
    errorDiv.style.right = '0';
    errorDiv.style.padding = '10px';
    errorDiv.style.background = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = `Error: ${error.message}`;
    document.body.appendChild(errorDiv);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary onError={logError} fallback={<div>Something went wrong. Please try again later.</div>}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
