import React from 'react';
console.log("main.tsx: File loaded and executing.");
import ReactDOM from 'react-dom/client';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import App from './App';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {console.log("main.tsx: ReactDOM.createRoot rendering...")}
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
