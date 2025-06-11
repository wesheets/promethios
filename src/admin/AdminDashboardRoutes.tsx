import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsDashboard from './AnalyticsDashboard';
import AgentManagementRoutes from './AgentManagementRoutes';

/**
 * AdminDashboardRoutes Component
 * 
 * This component defines the routes for the admin dashboard section.
 * It includes routes for the analytics dashboard and agent management.
 */
const AdminDashboardRoutes: React.FC = () => {
  console.log('AdminDashboardRoutes rendering'); // Debug log
  
  return (
    <Routes>
      {/* Default route - Analytics Dashboard */}
      <Route path="/" element={<AnalyticsDashboard />} />
      
      {/* Analytics Dashboard */}
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      
      {/* Agent Management Routes - uses nested routing */}
      <Route path="/agents/*" element={<AgentManagementRoutes />} />
      
      {/* Fallback route - redirects to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AdminDashboardRoutes;
