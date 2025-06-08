import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  MainLayoutProxy, 
  DashboardProxy, 
  AgentWizardProxy,
  AgentsProxy,
  GovernanceProxy,
  OnboardingWelcomeProxy,
  OnboardingGoalSelectionProxy,
  OnboardingGuidedStepsProxy,
  WorkflowSpecificProxy
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
          <Route path="workflow/:workflowType" element={<WorkflowSpecificProxy />} />
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
        
        {/* Agent Wrapping Wizard route - NO onboarding requirement to prevent loops */}
        <Route path="agent-wizard" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentWizardProxy />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Agents management page - protected by onboarding */}
        <Route path="agents">
          <Route index element={
            <ProtectedRoute requireOnboarding={true}>
              <MainLayoutProxy>
                <AgentsProxy />
              </MainLayoutProxy>
            </ProtectedRoute>
          } />
          <Route path=":agentId" element={
            <ProtectedRoute requireOnboarding={true}>
              <MainLayoutProxy>
                <AgentsProxy />
              </MainLayoutProxy>
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Governance tab - primary interaction hub */}
        <Route path="governance" element={
          <ProtectedRoute requireOnboarding={true}>
            <MainLayoutProxy>
              <GovernanceProxy />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Catch-all route - redirect new users to onboarding, completed users to dashboard */}
        <Route path="*" element={
          <ProtectedRoute requireOnboarding={true}>
            <Navigate to="dashboard" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </ObserverProvider>
  );
};

export default UIIntegration;
