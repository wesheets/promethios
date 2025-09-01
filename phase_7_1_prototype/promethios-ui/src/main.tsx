import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SharedConversationProvider } from './contexts/SharedConversationContext';
import AnalyticsProvider from './components/common/AnalyticsProvider';
import App from './App';

console.log('🔥 main.tsx is executing!');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <SharedConversationProvider>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </SharedConversationProvider>
    </AuthProvider>
  </React.StrictMode>,
);
