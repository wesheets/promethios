import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginWaitlistPage from './components/auth/LoginWaitlistPage';
import FirebaseAuthTest from './components/test/FirebaseAuthTest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation for testing */}
          <nav className="bg-white shadow-sm border-b p-4">
            <div className="max-w-7xl mx-auto flex space-x-4">
              <Link to="/" className="text-blue-600 hover:text-blue-800">Dashboard</Link>
              <Link to="/login" className="text-blue-600 hover:text-blue-800">Login</Link>
              <Link to="/test" className="text-red-600 hover:text-red-800 font-semibold">🔥 Auth Test</Link>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<LoginWaitlistPage />} />
            <Route path="/test" element={<FirebaseAuthTest />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

