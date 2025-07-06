# Promethios UI Navigation Structure Analysis

## Navigation Hierarchy (from UIIntegration.tsx)

### 🏠 **Main Routes**
- `/dashboard` → DashboardPage
- `/onboarding/*` → Various onboarding components

### 👤 **Agents Section**
- `/agents/wrapping` → AgentWrappingPage (Single Agent Wrapper)
- `/agents/multi-wrapping` → MultiAgentWrappingPage (Multi-Agent Wrapper)
- `/agents/profiles` → AgentProfilesPage ("My Agents")
- `/agents/templates` → TemplateLibraryPage
- `/agents/manage` → AgentManagePage
- `/agents/deploy` → EnhancedDeployPage
- `/agents/registry` → RegistryPage

### 🤖 **LLM Wrapper Stubs**
- `/ui/agents/wrap-chatgpt` → ChatGPTWrapperStub
- `/ui/agents/wrap-claude` → ClaudeWrapperStub
- `/ui/agents/wrap-gemini` → GeminiWrapperStub
- `/ui/agents/wrap-perplexity` → PerplexityWrapperStub

### 💬 **Chat**
- `/modern-chat` → ModernChatPage (active)
- `/chat` → ChatPage (deprecated)

### 🏛️ **Governance Section**
- `/governance/overview` → EnhancedGovernanceOverviewPage
- `/governance/policies` → GovernancePoliciesPage
- `/governance/violations` → EnhancedGovernanceViolationsPage
- `/governance/reports` → EnhancedGovernanceReportsPage
- `/governance/veritas` → EmotionalVeritasPage
- `/governance/veritas-enterprise` → EnterpriseVeritasDashboard

### 🛡️ **Trust Metrics Section**
- `/trust/overview` → EnhancedTrustMetricsOverviewPage
- `/trust/boundaries` → TrustBoundariesPage
- `/trust/attestations` → TrustAttestationsPage

### ⚙️ **Settings Section**
- `/settings/profile` → UserProfileSettingsPage
- `/settings/preferences` → PreferencesSettingsPage
- `/settings/organization` → OrganizationSettingsPage
- `/settings/integrations` → IntegrationsSettingsPage
- `/settings/data` → DataManagementSettingsPage

### ❓ **Help Section**
- `/help/tours` → GuidedToursPage
- `/help/documentation` → DocumentationPage
- `/help/support` → SupportPage

### 🔧 **Benchmarks & Testing**
- `/agents/benchmark/chat` → BenchmarkChatPage
- `/agents/benchmark/*` → CMUBenchmarkPage

### 👨‍💼 **Admin**
- `/admin/dashboard/*` → SimpleAdminDashboard

## Navigation Implementation Notes

### MainLayout Navigation (Simplified)
The MainLayout.tsx shows a simplified navigation with only:
- Dashboard
- Agents
- Multi-Agent
- Enhanced Veritas (Governance)
- Settings

### Routing Protection
- Most routes use `ProtectedRoute` with `requireOnboarding={false}`
- Dashboard and Admin require `requireOnboarding={true}`
- All routes are wrapped in `MainLayoutProxy`

### Theme Implementation
- All components use dark theme with `background-color: #0D1117`
- Navigation uses `#2BFFC6` accent color
- Text colors are white/light variants

