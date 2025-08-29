import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import App from './App';

console.log('🔥 main.tsx is executing!');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AnalyticsProvider>
        <App />
      </AnalyticsProvider>
    </AuthProvider>
  </React.StrictMode>,
);
