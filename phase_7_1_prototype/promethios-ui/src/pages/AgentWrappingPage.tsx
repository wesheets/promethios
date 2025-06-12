import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AgentWrapperManagement from '../modules/agent-wrapping/components/AgentWrapperManagement';

/**
 * Main page component for Agent Wrapping
 */
const AgentWrappingPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Agent Wrapping</h1>
      
      <Routes>
        <Route path="/" element={<AgentWrapperManagement />} />
        <Route path="/new" element={<div>Create New Wrapper (To be implemented)</div>} />
        <Route path="/:wrapperId" element={<div>Wrapper Details (To be implemented)</div>} />
        <Route path="/:wrapperId/edit" element={<div>Edit Wrapper (To be implemented)</div>} />
      </Routes>
    </div>
  );
};

export default AgentWrappingPage;
