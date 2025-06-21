import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsDashboard from './AnalyticsDashboard';
import AgentManagementRoutes from './AgentManagementRoutes';
import DualVeritasAdminPage from './EmotionalVeritasAdminPage';
import AgentsManagementDashboard from './AgentsManagementDashboard';

/**
 * AdminDashboardRoutes Component
 * 
 * This component defines the routes for the admin dashboard section.
 * It includes routes for the analytics dashboard, agent management, and Emotional Veritas controls.
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
      
      {/* Agents Management Dashboard */}
      <Route path="/agents-management" element={<AgentsManagementDashboard />} />
      
      {/* Emotional Veritas Admin Controls */}
      <Route path="/governance/emotional-veritas" element={<DualVeritasAdminPage />} />
      
      {/* Fallback route - redirects to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AdminDashboardRoutes;
