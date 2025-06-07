import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayoutProxy, DashboardProxy } from './proxies';
import { ObserverProvider } from './context/ObserverContext';

/**
 * UIIntegration Component
 * 
 * This component serves as a bridge between the legacy application and the new UI.
 * It renders routes for the new UI components, ensuring proper integration
 * of the new dashboard with collapsible navigation and Observer agent.
 */
const UIIntegration: React.FC = () => {
  // Using proxy components to connect to the actual UI components
  return (
    <ObserverProvider>
      <Routes>
        {/* Render the dashboard with MainLayout */}
        <Route path="dashboard" element={
          <MainLayoutProxy>
            <DashboardProxy />
          </MainLayoutProxy>
        } />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </ObserverProvider>
  );
};

export default UIIntegration;
