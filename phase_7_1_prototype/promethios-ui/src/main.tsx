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

try {
  console.log('🔥 About to create React root...');
  const rootElement = document.getElementById("root");
  console.log('🔥 Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('🔥 React root created successfully');
  
  console.log('🔥 About to render full React app with all providers...');
  root.render(
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
  console.log('🔥 Full React app rendered successfully');
} catch (error) {
  console.error('🚨 Error in main.tsx:', error);
}
