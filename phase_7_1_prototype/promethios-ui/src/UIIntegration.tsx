import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import OnboardingMetrics from './components/onboarding/OnboardingMetrics';
import OnboardingObserver from './components/onboarding/OnboardingObserver';
import DashboardPage from './pages/DashboardPage';
import AgentProfilesPage from './pages/AgentProfilesPage';
import AgentManagePage from './pages/AgentManagePage';
import AgentTemplatesPage from './pages/AgentTemplatesPage';
import TemplateLibraryPage from './pages/TemplateLibraryPage';
import AgentWrappingPage from './pages/AgentWrappingPage';
import MultiAgentWrappingPage from './pages/MultiAgentWrappingPage';
import ChatPage from './pages/ChatPage';
import ModernChatPage from './pages/ModernChatPage';
import DeployPage from './pages/DeployPage';
import RegistryPage from './pages/RegistryPage';
import BenchmarksPage from './pages/BenchmarksPage';
import GovernanceOverviewPage from './pages/GovernanceOverviewPage';
import GovernancePoliciesPage from './pages/GovernancePoliciesPage';
// Import Enhanced versions instead of original pages
import EnhancedGovernanceOverviewPage from './pages/EnhancedGovernanceOverviewPage';
import SimplifiedGovernanceOverviewPage from './pages/SimplifiedGovernanceOverviewPage';
import EnhancedGovernanceViolationsPage from './pages/EnhancedGovernanceViolationsPage';
import EnhancedGovernanceReportsPage from './pages/EnhancedGovernanceReportsPage';
import EnhancedDeployPage from './pages/EnhancedDeployPage';
import EnhancedEmotionalVeritasPage from './pages/EnhancedEmotionalVeritasPage';
import EnterpriseVeritasDashboard from './pages/EnterpriseVeritasDashboard';
import AutonomousGovernanceDashboard from './components/governance/AutonomousGovernanceDashboard';
import AuditReportsPage from './components/audit/AuditReportsPage';
import TestGovernancePage from './pages/TestGovernancePage';
import StepByStepGovernancePage from './pages/StepByStepGovernancePage';
import AutoRefreshTestPage from './pages/AutoRefreshTestPage';
import ModalNotificationTestPage from './pages/ModalNotificationTestPage';
import WorkingGovernancePage from './pages/WorkingGovernancePage';
import MinimalGovernancePage from './pages/MinimalGovernancePage';
import ReverseTestGovernancePage from './pages/ReverseTestGovernancePage';
import IncrementalGovernancePage from './pages/IncrementalGovernancePage';
// Import Enhanced version instead of original
import EnhancedTrustMetricsOverviewPage from './pages/EnhancedTrustMetricsOverviewPage';
import TrustBoundariesPage from './pages/TrustBoundariesPage';
import TrustAttestationsPage from './pages/TrustAttestationsPage';
import UserProfilePage from './pages/UserProfilePage';
import PreferencesSettingsPage from './pages/PreferencesSettingsPage';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage';
import IntegrationsSettingsPage from './pages/IntegrationsSettingsPage';
import DataManagementSettingsPage from './pages/DataManagementSettingsPage';
import ApiKeysSettingsPage from './pages/ApiKeysSettingsPage';
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
import DeployedAgentChatPage from './pages/DeployedAgentChatPage';
import AgentLifecycleDashboard from './components/AgentLifecycleDashboard';
import PrometheosLLMManagePage from './pages/PrometheosLLMManagePage';
import PrometheosLLMCreationPage from './pages/PrometheosLLMCreationPage';
// MAS Pages
import MASThinkTankPage from './pages/MASThinkTankPage';
import MASConversationHistoryPage from './pages/MASConversationHistoryPage';
import MASWorkflowTemplatesPage from './pages/MASWorkflowTemplatesPage';
import MASAnalyticsPage from './pages/MASAnalyticsPage';
import MASDataCollectionAdminPage from './pages/MASDataCollectionAdminPage';
import ProcessBuilderPage from './pages/ProcessBuilderPage';
// Import Chat Components
import ChatDashboard from './components/chat/dashboard/ChatDashboard';
import ChatbotBuilder from './components/chat/builder/ChatbotBuilder';
import ChatDeployment from './components/chat/deployment/ChatDeployment';
import WebDeployment from './components/chat/deployment/WebDeployment';
import VoiceDeployment from './components/chat/deployment/VoiceDeployment';
import EmailDeployment from './components/chat/deployment/EmailDeployment';
import SocialDeployment from './components/chat/deployment/SocialDeployment';
import ApiEndpointsDeployment from './components/chat/deployment/ApiEndpointsDeployment';
import UniversalKnowledgeManagement from './components/governance/knowledge/UniversalKnowledgeManagement';
import UniversalTrainingManagement from './components/governance/training/UniversalTrainingManagement';
import BusinessSystemIntegrations from './components/chat/integrations/BusinessSystemIntegrations';
import AnalyticsDashboard from './components/chat/analytics/AnalyticsDashboard';
import AutomationManagement from './components/chat/automation/AutomationManagement';
import HumanHandoffManagement from './components/chat/handoff/HumanHandoffManagement';

/**
 * UIIntegration Component
 * 
 * This component serves as a bridge between the legacy application and the new UI.
 * It renders routes for the new UI components, ensuring proper integration
 * of the new dashboard with collapsible navigation and Observer agent.
 * All routes are protected and require onboarding completion.
 */
const UIIntegration: React.FC = () => {
  const location = useLocation();
  
  // Debug logging
  console.log('📍 UIIntegration - Current location:', location.pathname);
  console.log('🔄 UIIntegration - Routes component re-rendering with key:', location.pathname);
  
  // Extract the relative path for UIIntegration (remove /ui prefix)
  const relativePath = location.pathname.replace('/ui', '') || '/';
  console.log('🎯 UIIntegration - Relative path for routing:', relativePath);
  
  // Using proxy components to connect to the actual UI components
  return (
    <ObserverProvider>
      <Routes>
        {/* Onboarding flow routes */}
        <Route path="onboarding">
          <Route path="demo" element={<OnboardingDemo />} />
          <Route path="setup" element={<OnboardingSetup />} />
          <Route path="metrics" element={<OnboardingMetrics />} />
          <Route path="observer" element={<OnboardingObserver />} />
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
        
        {/* Promethios LLM Routes */}
        <Route path="agents/promethios-llm" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <PrometheosLLMManagePage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="agents/create-promethios-llm" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <PrometheosLLMCreationPage />
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
        
        {/* Agent Management Page route */}
        <Route path="agents/manage" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentManagePage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Deploy Page route */}
        <Route path="agents/deploy" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EnhancedDeployPage />
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
        
        {/* Agent Lifecycle Dashboard route */}
        <Route path="agents/lifecycle" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentLifecycleDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Agent Lifecycle Dashboard for specific agent */}
        <Route path="agents/lifecycle/:agentId" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentLifecycleDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Chat Page route - DEPRECATED - Use modern-chat instead */}
        {/* 
        <Route path="chat" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ChatPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        */}
        
        {/* Modern Chat Page route - redesigned interface */}
        <Route path="modern-chat" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ModernChatPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Promethios Chat Routes */}
        <Route path="chat/dashboard" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ChatDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/chatbots" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ChatbotBuilder />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/setup" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentEnhancementPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/setup/quick-start" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentEnhancementPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/setup/hosted-api" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentEnhancementPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/setup/byok" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentEnhancementPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/setup/enterprise" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AgentEnhancementPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/integrations" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <BusinessSystemIntegrations />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/integrations/business" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <BusinessSystemIntegrations />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/integrations/helpdesk" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <BusinessSystemIntegrations />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/integrations/crm" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <BusinessSystemIntegrations />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/integrations/ecommerce" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <BusinessSystemIntegrations />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/analytics" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AnalyticsDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/analytics/performance" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AnalyticsDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/analytics/governance" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AnalyticsDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/analytics/csat" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AnalyticsDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/analytics/resolution" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AnalyticsDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/automation" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AutomationManagement />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/automation/workflows" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AutomationManagement />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/automation/handoff" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <HumanHandoffManagement />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/automation/escalation" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AutomationManagement />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/automation/responses" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AutomationManagement />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/deployment" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ChatDeployment />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/deployment/web" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <WebDeployment />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/deployment/voice" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <VoiceDeployment />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/deployment/email" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EmailDeployment />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/deployment/social" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <SocialDeployment />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="chat/deployment/api" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ApiEndpointsDeployment />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Knowledge & Training Routes - Updated to use governance paths */}
        <Route path="governance/knowledge" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <UniversalKnowledgeManagement />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/training" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <UniversalTrainingManagement />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Governance Routes - INCREMENTAL TEST STEP 1 */}
            <Route path="governance/overview" element={
              <ProtectedRoute requireOnboarding={false}>
                <MainLayoutProxy>
                  <SimplifiedGovernanceOverviewPage />
                </MainLayoutProxy>
              </ProtectedRoute>
            } />
        
        {/* Governance Dashboard route - FIXED: Now points to different component */}
        <Route path="governance/dashboard" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <SimplifiedGovernanceOverviewPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Enhanced Governance Overview for debugging */}
        <Route path="governance/enhanced" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EnhancedGovernanceOverviewPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Modal/Notification Test Route */}
        <Route path="governance/modal-test" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ModalNotificationTestPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Simplified Governance Overview for testing */}
        <Route path="governance/simple" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <SimplifiedGovernanceOverviewPage />
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
              <EnhancedGovernanceViolationsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/reports" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EnhancedGovernanceReportsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/audit-reports" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AuditReportsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/veritas" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EnhancedEmotionalVeritasPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="governance/veritas-enterprise" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EnterpriseVeritasDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Autonomous Governance Dashboard */}
        <Route path="governance/autonomous" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <AutonomousGovernanceDashboard />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Trust Metrics Routes */}
        <Route path="trust/overview" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <EnhancedTrustMetricsOverviewPage />
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
                {/* Clean Profile Route - New Implementation */}
        <Route path="profile" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <UserProfilePage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Settings Routes - Other pages */}
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
        
        <Route path="settings/api-keys" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ApiKeysSettingsPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Default Settings route - redirect to preferences */}
        <Route path="settings" element={
          <ProtectedRoute requireOnboarding={false}>
            <Navigate to="/ui/settings/preferences" replace />
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
            <Navigate to="/ui/help/tours" replace />
          </ProtectedRoute>
        } />
        
        {/* MAS (Multi-Agent Systems) Routes */}
        <Route path="mas/think-tank" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <MASThinkTankPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="mas/process-builder" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <ProcessBuilderPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="mas/conversations" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <MASConversationHistoryPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="mas/templates" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <MASWorkflowTemplatesPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        <Route path="mas/analytics" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <MASAnalyticsPage />
            </MainLayoutProxy>
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
        
        {/* Admin MAS Data Collection route */}
        <Route path="admin/mas-data-collection" element={
          <ProtectedRoute requireOnboarding={true}>
            <MainLayoutProxy>
              <MASDataCollectionAdminPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Catch-all route - redirect new users to onboarding, completed users to dashboard */}
        {/* Deployed Agent Chat Page route */}
        <Route path="deployed-agents/:deploymentId/chat" element={
          <ProtectedRoute requireOnboarding={false}>
            <MainLayoutProxy>
              <DeployedAgentChatPage />
            </MainLayoutProxy>
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={
          <ProtectedRoute requireOnboarding={true}>
            <Navigate to="/ui/dashboard" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </ObserverProvider>
  );
};

export default UIIntegration;
