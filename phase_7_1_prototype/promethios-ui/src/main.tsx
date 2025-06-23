import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import App from './App';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
