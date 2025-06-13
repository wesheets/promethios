import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Minimal test app to isolate the line error
function TestApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test App - Checking for Line Error</h1>
      <p>If you see this, React is working correctly.</p>
      <p>Check console for any "line is not defined" errors.</p>
    </div>
  );
}

console.log('Test main.tsx executing...');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
);

