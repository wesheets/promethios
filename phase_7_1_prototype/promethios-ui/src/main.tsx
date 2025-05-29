import React from 'react';
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

// Step 8: Test with ThemeProvider, AuthProvider, AnalyticsProvider, Router, Header, Footer, Hero, and Features
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <Router>
            <div className="min-h-screen flex flex-col dark:bg-gray-900">
              <Header />
              <div className="pt-16 flex-grow">
                <Hero />
                <Features />
                <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                  <h1>Promethios UI Test - Step 8</h1>
                  <p>Testing with ThemeProvider, AuthProvider, AnalyticsProvider, Router, Header, Footer, Hero, and Features.</p>
                  <p>If you can see this text, all providers, Header, Footer, Hero, and Features are working correctly.</p>
                </div>
              </div>
              <Footer />
            </div>
          </Router>
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
