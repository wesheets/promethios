import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboardLayout from './admin/AdminDashboardLayout';
import ObserverHoverBubble from './components/ObserverHoverBubble';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Other routes */}
        
        {/* Admin Dashboard Routes - Critical Fix */}
        <Route path="/admin/dashboard/*" element={<AdminDashboardLayout />} />
        
        {/* Other routes */}
      </Routes>
      
      {/* Observer Agent Chat Bubble - Uncomment after navigation is fixed */}
      <ObserverHoverBubble />
    </Router>
  );
}

export default App;
