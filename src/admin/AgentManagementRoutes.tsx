/**
 * Agent Management Routes Component
 * 
 * This component defines the routes for the agent management section of the admin dashboard,
 * connecting the agent management components to the navigation system.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AgentGovernanceDashboard from './AgentGovernanceDashboard';
import AgentComparisonChart from './AgentComparisonChart';
import AgentViolationsList from './AgentViolationsList';

const AgentManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AgentGovernanceDashboard />} />
      <Route path="/comparison" element={<AgentComparisonChart />} />
      <Route path="/violations" element={<AgentViolationsList />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AgentManagementRoutes;
