import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import { HoveringObserverProvider } from './context/HoveringObserverContext';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';
import { NetworkStatusProvider } from './context/NetworkStatusContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NetworkStatusProvider>
          <SessionProvider>
            <UserPreferencesProvider>
              <ThemeProvider>
                <HoveringObserverProvider>
                  <AppRoutes />
                </HoveringObserverProvider>
              </ThemeProvider>
            </UserPreferencesProvider>
          </SessionProvider>
        </NetworkStatusProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
