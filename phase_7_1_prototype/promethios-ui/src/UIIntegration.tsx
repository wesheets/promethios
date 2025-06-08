import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  MainLayoutProxy, 
  DashboardProxy, 
  AgentWizardProxy,
  OnboardingWelcomeProxy,
  OnboardingGoalSelectionProxy,
  OnboardingGuidedStepsProxy
} from './proxies';
import { ObserverProvider } from './context/ObserverContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

/**
 * UIIntegration Component
 * 
 * This component serves as a bridge between the legacy application and the new UI.
 * It renders routes for the new UI components, ensuring proper integration
 * of the new dashboard with collapsible navigation and Observer agent.
 * All routes are protected and require onboarding completion.
 */
const UIIntegration: React.FC = () => {
  // Using proxy components to connect to the actual UI components
  return (
    <ObserverProvider>
      <Routes>
        {/* Onboarding flow routes */}
        <Route path="onboarding">
          <Route path="welcome" element={<OnboardingWelcomeProxy />} />
          <Route path="goal-selection" element={<OnboardingGoalSelectionProxy />} />
          <Route path="guided-steps" element={<OnboardingGuidedStepsProxy />} />
          <Route index element={<Navigate to="welcome" replace />} />
        </Route>
        
        {/* Render the dashboard with MainLayout - protected by onboarding */}
        <Route path="dashboard" element={
          <ProtectedRoute requireOnboarding={true}>
            <MainLayoutProxy>
              <DashboardProxy />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Agent Wrapping Wizard route */}
        <Route path="agent-wizard" element={
          <ProtectedRoute requireOnboarding={true}>
            <MainLayoutProxy>
              <AgentWizardProxy />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Ensure all redirects use replace to prevent URL duplication */}
        <Route path="*" element={<Navigate to="onboarding/welcome" replace />} />
      </Routes>
    </ObserverProvider>
  );
};

export default UIIntegration;
