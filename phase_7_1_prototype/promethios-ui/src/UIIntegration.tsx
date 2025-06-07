import React from 'react';
import AppRoutes from '../../ui/routes/AppRoutes';

/**
 * UIIntegration Component
 * 
 * This component serves as a bridge between the legacy application and the new UI.
 * It renders the new AppRoutes component for all UI routes, ensuring proper integration
 * of the new dashboard with collapsible navigation and Observer agent.
 */
const UIIntegration: React.FC = () => {
  return <AppRoutes />;
};

export default UIIntegration;
