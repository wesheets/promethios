import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  MainLayoutProxy, 
  DashboardProxy, 
  AgentWizardProxy,
  OnboardingWelcomeProxy,
  OnboardingGoalSelectionProxy,
  OnboardingGuidedStepsProxy,
  WorkflowSpecificProxy
} from './proxies';
import { ObserverProvider } from './context/ObserverContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OnboardingWelcome from './components/onboarding/OnboardingWelcome';
import OnboardingDemo from './components/onboarding/OnboardingDemo';
import OnboardingSetup from './components/onboarding/OnboardingSetup';
import DashboardPage from './pages/DashboardPage';
import AgentProfilesPage from './pages/AgentProfilesPage';
import AgentTemplatesPage from './pages/AgentTemplatesPage';
import TemplateLibraryPage from './pages/TemplateLibraryPage';
import AgentWrappingPage from './pages/AgentWrappingPage';
import MultiAgentWrappingPage from './pages/MultiAgentWrappingPage';
import ChatPage from './pages/ChatPage';
import DeployPage from './pages/DeployPage';
import RegistryPage from './pages/RegistryPage';
import BenchmarksPage from './pages/BenchmarksPage';
import GovernanceOverviewPage from './pages/GovernanceOverviewPage';
import GovernancePoliciesPage from './pages/GovernancePoliciesPage';
import GovernanceViolationsPage from './pages/GovernanceViolationsPage';
import GovernanceReportsPage from './pages/GovernanceReportsPage';
import EmotionalVeritasPage from './pages/EmotionalVeritasPage';
import TrustMetricsOverviewPage from './pages/TrustMetricsOverviewPage';
import TrustBoundariesPage from './pages/TrustBoundariesPage';
import TrustAttestationsPage from './pages/TrustAttestationsPage';
import UserProfileSettingsPage from './pages/UserProfileSettingsPage';
import PreferencesSettingsPage from './pages/PreferencesSettingsPage';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage';
import IntegrationsSettingsPage from './pages/IntegrationsSettingsPage';
import DataManagementSettingsPage from './pages/DataManagementSettingsPage';
import GuidedToursPage from './pages/GuidedToursPage';
import DocumentationPage from './pages/DocumentationPage';
import SupportPage from './pages/SupportPage';
import BenchmarkChatPage from './pages/BenchmarkChatPage';
import CMUBenchmarkPage from './pages/CMUBenchmarkPage';
import SimpleAdminDashboard from './admin/SimpleAdminDashboard';
import ChatGPTWrapperStub from './pages/ChatGPTWrapperStub';
import ClaudeWrapperStub from './pages/ClaudeWrapperStub';
import GeminiWrapperStub from './pages/GeminiWrapperStub';
import PerplexityWrapperStub from './pages/PerplexityWrapperStub';

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
          <Route path="demo" element={<OnboardingDemo />} />
          <Route path="setup" element={<OnboardingSetup />} />
          <Route path="metrics" element={<Navigate to="../dashboard" replace />} />
          <Route path="observer" element={<Navigate to="../dashboard" replace />} />
          <Route path="welcome" element={<OnboardingWelcomeProxy />} />
          <Route path="workflow/:workflowType" element={<WorkflowSpecificProxy />} />
          <Route path="goal-selection" element={<OnboardingGoalSelectionProxy />} />
          <Route path="guided-steps" element={<OnboardingGuidedStepsProxy />} />
          <Route index element={<OnboardingWelcome />} />
        </Route>
        
        {/* Render the dashboard with MainLayout - protected by onboarding */}
        <Route path="dashboard" element={
          <ProtectedRoute requireOnboarding={true}>
            <MainLayoutProxy>
              <DashboardPage />
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
        
        {/* Agent Wrapping Page route */}
        <Route path="agents/wrapping" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentWrappingPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Multi-Agent Wrapping Page route */}
        <Route path="agents/multi-wrapping" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <MultiAgentWrappingPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Big 4 LLM Wrapper Stubs */}
        <Route path="ui/agents/wrap-chatgpt" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ChatGPTWrapperStub />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="ui/agents/wrap-claude" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ClaudeWrapperStub />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="ui/agents/wrap-gemini" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <GeminiWrapperStub />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="ui/agents/wrap-perplexity" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <PerplexityWrapperStub />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Agent Profiles Page route (now "My Agents") */}
        <Route path="agents/profiles" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentProfilesPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Template Library Page route */}
        <Route path="agents/templates" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <TemplateLibraryPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Deploy Page route */}
        <Route path="agents/deploy" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <DeployPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Registry Page route */}
        <Route path="agents/registry" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <RegistryPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Chat Page route - for testing incremental build */}
        <Route path="chat" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ChatPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Governance Routes */}
        <Route path="governance/overview" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <GovernanceOverviewPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/policies" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <GovernancePoliciesPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/violations" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <GovernanceViolationsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/reports" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <GovernanceReportsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/veritas" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EmotionalVeritasPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Trust Metrics Routes */}
        <Route path="trust/overview" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <TrustMetricsOverviewPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="trust/boundaries" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <TrustBoundariesPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="trust/attestations" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <TrustAttestationsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Settings Routes */}
        <Route path="settings/profile" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <UserProfileSettingsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="settings/preferences" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <PreferencesSettingsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="settings/organization" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <OrganizationSettingsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="settings/integrations" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <IntegrationsSettingsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="settings/data" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <DataManagementSettingsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Default Settings route - redirect to profile */}
        <Route path="settings" element={
          <ProtectedRoute requireOnboarding={false}>
            <Navigate to="settings/profile" replace />
          </ProtectedRoute>
        } />
        
        {/* Help Routes */}
        <Route path="help/tours" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <GuidedToursPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="help/documentation" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <DocumentationPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="help/support" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <SupportPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Default Help route - redirect to tours */}
        <Route path="help" element={
          <ProtectedRoute requireOnboarding={false}>
            <Navigate to="help/tours" replace />
          </ProtectedRoute>
        } />
        
        {/* Benchmark Chat Page route */}
        <Route path="agents/benchmark/chat" element={
          <ProtectedRoute requireOnboarding={false}>
            <BenchmarkChatPage />
          </ProtectedRoute>
        } />
        
        {/* CMU Benchmark Page route */}
        <Route path="agents/benchmark/*" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <CMUBenchmarkPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Admin Dashboard route - requires admin privileges */}
        <Route path="admin/dashboard/*" element={
          <ProtectedRoute requireOnboarding={true}>
            <SimpleAdminDashboard />
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
