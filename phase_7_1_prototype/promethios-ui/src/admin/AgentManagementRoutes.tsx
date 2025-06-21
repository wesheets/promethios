import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AgentGovernanceDashboard from './AgentGovernanceDashboard';
import AgentComparisonChart from './AgentComparisonChart';
import AgentViolationsList from './AgentViolationsList';
import EnforcementConfigPanel from './EnforcementConfigPanel';

/**
 * AgentManagementRoutes Component
 * 
 * This component defines the routes for the agent management section.
 * It includes routes for the agent governance dashboard, comparison chart,
 * violations list, and enforcement configuration.
 */
const AgentManagementRoutes: React.FC = () => {
  console.log('AgentManagementRoutes rendering'); // Debug log
  
  return (
    <Routes>
      {/* Default route - Agent Governance Dashboard */}
      <Route path="/" element={<AgentGovernanceDashboard />} />
      
      {/* Agent Comparison Chart */}
      <Route path="/comparison" element={<AgentComparisonChart />} />
      
      {/* Agent Violations List */}
      <Route path="/violations" element={<AgentViolationsList />} />
      
      {/* Enforcement Configuration Panel */}
      <Route path="/enforcement" element={<EnforcementConfigPanel />} />
      
      {/* Fallback route - redirects to agent governance dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AgentManagementRoutes;
