/**
 * Admin Dashboard Routes Component
 * 
 * This component defines the main routes for the admin dashboard,
 * including the agent management section.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsDashboard from './AnalyticsDashboard';
import AgentManagementRoutes from './AgentManagementRoutes';

const AdminDashboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AnalyticsDashboard />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      <Route path="/agents/*" element={<AgentManagementRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AdminDashboardRoutes;
