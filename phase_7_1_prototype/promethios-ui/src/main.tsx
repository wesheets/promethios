import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import ChakraProviderWithTheme from './components/ChakraProviderWithTheme';
import ErrorBoundary from './components/ErrorBoundary';
import logger from './utils/debugLogger';

// Add debug logging for React rendering
logger.info('App', 'Starting Promethios UI application');
logger.debug('App', 'React version', React.version);

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  logger.error('Global', 'Unhandled error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Global', 'Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.componentError('Root', error, errorInfo);
      }}
    >
      <ChakraProviderWithTheme>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            logger.componentError('ThemeProvider', error, errorInfo);
          }}
        >
          <ThemeProvider>
            <ErrorBoundary
              onError={(error, errorInfo) => {
                logger.componentError('AuthProvider', error, errorInfo);
              }}
            >
              <AuthProvider>
                <ErrorBoundary
                  onError={(error, errorInfo) => {
                    logger.componentError('AnalyticsProvider', error, errorInfo);
                  }}
                >
                  <AnalyticsProvider>
                    <ErrorBoundary
                      onError={(error, errorInfo) => {
                        logger.componentError('Router', error, errorInfo);
                      }}
                    >
                      <Router>
                        <ErrorBoundary
                          onError={(error, errorInfo) => {
                            logger.componentError('App', error, errorInfo);
                          }}
                        >
                          <App />
                        </ErrorBoundary>
                      </Router>
                    </ErrorBoundary>
                  </AnalyticsProvider>
                </ErrorBoundary>
              </AuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </ErrorBoundary>
      </ChakraProviderWithTheme>
    </ErrorBoundary>
  </React.StrictMode>,
);

logger.info('App', 'Promethios UI application initialized');

