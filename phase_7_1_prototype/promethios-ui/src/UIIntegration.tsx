import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TeamsTab from './components/governance/TeamsTab';

// Error Boundary for UI Integration
class UIErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI Integration Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">UI Loading Error</h1>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || 'Failed to load UI components'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load components to prevent blocking
const LazyDashboard = React.lazy(() => import('./pages/DashboardPage'));
const LazyAgentWizard = React.lazy(() => import('./components/pages/AgentWizardPage'));
const LazyAgents = React.lazy(() => import('./components/pages/EnhancedAgentsPage'));
const LazyGovernance = React.lazy(() => import('./components/pages/GovernancePage'));
const LazyDeploy = React.lazy(() => import('./components/pages/DeployPage'));
const LazyOnboardingWelcome = React.lazy(() => import('./components/onboarding/OnboardingWelcome'));

// Teams component wrapper
const TeamsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <TeamsTab agents={[]} />
    </div>
  );
};

const UIIntegration: React.FC = () => {
  return (
    <UIErrorBoundary>
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading Promethios...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Onboarding Routes */}
          <Route path="/onboarding" element={<LazyOnboardingWelcome />} />
          <Route path="/onboarding/welcome" element={<LazyOnboardingWelcome />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <LazyDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/agent-wizard" element={
            <ProtectedRoute>
              <LazyAgentWizard />
            </ProtectedRoute>
          } />
          
          <Route path="/agents" element={
            <ProtectedRoute>
              <LazyAgents />
            </ProtectedRoute>
          } />
          
          {/* Agents sub-routes */}
          <Route path="/agents/teams" element={
            <ProtectedRoute>
              <LazyAgents />
            </ProtectedRoute>
          } />
          
          <Route path="/governance" element={
            <ProtectedRoute>
              <LazyGovernance />
            </ProtectedRoute>
          } />
          
          {/* Governance sub-routes */}
          <Route path="/governance/teams" element={
            <ProtectedRoute>
              <TeamsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/deploy" element={
            <ProtectedRoute>
              <LazyDeploy />
            </ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </React.Suspense>
    </UIErrorBoundary>
  );
};

export default UIIntegration;

