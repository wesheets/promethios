# Agent Persistence Items - Comprehensive Mapping

Based on analysis of the existing Promethios codebase, here are all the agent persistence items that need to be integrated with the unified storage system:

## 🤖 **Core Agent Data**

### **Agent Identity & Profile**
```typescript
interface AgentIdentity {
  id: string;                    // Unique agent identifier
  name: string;                  // Human-readable name
  version: string;               // Agent version
  description: string;           // Agent description
  ownerId: string;              // User who owns this agent
  tags: string[];               // Categorization tags
  creationDate: Date;           // When agent was created
  lastModifiedDate: Date;       // Last modification timestamp
  status: 'active' | 'inactive' | 'deprecated' | 'experimental';
  
  // Agent-specific attributes
  agentType: string;            // Type of agent (assistant, specialist, etc.)
  capabilities: string[];       // What the agent can do
  supportedProviders: string[]; // LLM providers it supports
  governanceProfileId?: string; // Link to governance profile
}
```

### **Agent Wrapper Configuration**
```typescript
interface StoredAgentWrapper {
  id: string;                   // Wrapper identifier
  userId: string;               // Owner user ID
  name: string;                 // Wrapper name
  description: string;          // Wrapper description
  version: string;              // Wrapper version
  supportedProviders: string[]; // Supported LLM providers
  
  // Schemas
  inputSchema: Schema;          // Input validation schema
  outputSchema: Schema;         // Output validation schema
  
  // Lifecycle
  createdAt: number;           // Creation timestamp
  lastModified: number;        // Last modification timestamp
  isActive: boolean;           // Whether wrapper is active
  deploymentStatus: 'draft' | 'deployed' | 'suspended' | 'archived';
  
  // API Configuration
  apiEndpoint?: string;        // API endpoint URL
  authMethod?: string;         // Authentication method
  apiKey?: string;             // API key (encrypted)
  model?: string;              // Model name/version
}
```

## 📊 **Governance & Trust Metrics**

### **Trust Scores**
```typescript
interface TrustScores {
  competence: number;          // 0-100 competence score
  reliability: number;         // 0-100 reliability score
  honesty: number;            // 0-100 honesty score
  transparency: number;       // 0-100 transparency score
  overall: number;            // 0-100 overall trust score
  lastUpdated: number;        // Timestamp of last update
  calculationMethod: string;  // How scores were calculated
}
```

### **Compliance Data**
```typescript
interface ComplianceData {
  overallCompliance: number;   // 0-100 compliance percentage
  policyViolations: number;    // Number of violations
  lastAudit: number;          // Last audit timestamp
  compliancePolicies: CompliancePolicy[];
  violationHistory: PolicyViolation[];
}

interface CompliancePolicy {
  id: string;                 // Policy identifier
  name: string;               // Policy name
  description: string;        // Policy description
  enforced: boolean;          // Whether policy is enforced
  violations: number;         // Number of violations
  lastChecked: number;        // Last check timestamp
}

interface PolicyViolation {
  id: string;                 // Violation identifier
  policyId: string;           // Which policy was violated
  timestamp: number;          // When violation occurred
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;        // Violation description
  resolved: boolean;          // Whether violation is resolved
  resolutionNotes?: string;   // How it was resolved
}
```

### **Performance Metrics**
```typescript
interface PerformanceMetrics {
  responseTime: number;        // Average response time (seconds)
  errorRate: number;          // Error rate percentage
  userSatisfaction: number;   // User satisfaction score
  uptime: number;             // Uptime percentage
  throughput: number;         // Requests per minute
  lastCalculated: number;     // When metrics were last calculated
}
```

## 📈 **Usage & Activity Data**

### **Usage Metrics**
```typescript
interface UsageMetrics {
  totalRequests: number;       // Total API requests made
  successfulRequests: number;  // Successful requests
  failedRequests: number;      // Failed requests
  averageResponseTime: number; // Average response time
  lastUsed: number;           // Last usage timestamp
  dailyUsage: DailyUsageRecord[];
  monthlyUsage: MonthlyUsageRecord[];
}

interface DailyUsageRecord {
  date: string;               // YYYY-MM-DD format
  requests: number;           // Number of requests
  errors: number;             // Number of errors
  avgResponseTime: number;    // Average response time
}
```

### **Activity History**
```typescript
interface ActivityRecord {
  id: string;                 // Activity identifier
  agentId: string;            // Which agent
  timestamp: number;          // When activity occurred
  activityType: 'request' | 'response' | 'error' | 'deployment' | 'configuration';
  details: any;               // Activity-specific details
  userId?: string;            // User who triggered activity
  sessionId?: string;         // Session identifier
}
```

## 🔄 **Multi-Agent System Data**

### **Multi-Agent Context**
```typescript
interface StoredMultiAgentContext {
  context_id: string;         // Context identifier
  name: string;               // Context name
  agent_ids: string[];        // Participating agents
  collaboration_model: string; // How agents collaborate
  status: string;             // Context status
  created_at: string;         // Creation timestamp
  userId: string;             // Owner user ID
  
  persistentData: {
    sharedMemory: Record<string, any>;     // Shared context data
    conversationHistory: AgentMessage[];   // Message history
    collaborationMetrics: any;             // Collaboration metrics
  };
  lastActivity: number;       // Last activity timestamp
}

interface AgentMessage {
  id: string;                 // Message identifier
  from_agent_id: string;      // Sender agent
  to_agent_ids?: string[];    // Recipient agents
  content: any;               // Message content
  timestamp: string;          // Message timestamp
  type: string;               // Message type
  governance_data?: any;      // Governance metadata
}
```

### **Collaboration Metrics**
```typescript
interface CollaborationMetrics {
  context_id: string;         // Context identifier
  collaboration_model: string; // Collaboration model used
  total_messages: number;     // Total messages exchanged
  active_agents: number;      // Number of active agents
  average_participation: number; // Average participation rate
  agent_metrics: AgentMetric[]; // Per-agent metrics
  governance_metrics: any;    // Governance-related metrics
}

interface AgentMetric {
  agent_id: string;           // Agent identifier
  message_count: number;      // Messages sent by this agent
  participation_rate: number; // Participation percentage
  responsiveness: number;     // Response time metric
  is_active: boolean;         // Whether agent is active
}
```

## 📋 **Scorecard & Assessment Data**

### **Agent Scorecard Results**
```typescript
interface AgentScorecardResult {
  agentId: string;            // Agent identifier
  templateId: string;         // Scorecard template used
  evaluationTimestamp: Date;  // When evaluation was performed
  overallScore: number;       // Overall score (0-100)
  
  metrics: Record<string, {
    value: number | boolean | string;
    score?: number;           // Normalized score (0-100)
    status?: 'critical' | 'warning' | 'normal';
    trend?: 'improving' | 'stable' | 'declining';
  }>;
  
  recommendations: string[];  // Improvement recommendations
  complianceStatus: 'compliant' | 'warning' | 'violation';
  lastUpdated: number;       // Last update timestamp
}
```

### **Attestation Records**
```typescript
interface AgentAttestation {
  id: string;                 // Attestation identifier
  agentId: string;            // Agent being attested
  attestorId: string;         // Who provided attestation
  attestationType: string;    // Type of attestation
  timestamp: Date;            // When attestation was made
  validUntil?: Date;          // Expiration date
  evidence?: any;             // Supporting evidence
  status: 'active' | 'expired' | 'revoked';
}
```

## 🔧 **Configuration & Settings**

### **Agent Preferences**
```typescript
interface AgentPreferences {
  agentId: string;            // Agent identifier
  userId: string;             // User identifier
  
  // Behavior settings
  responseStyle: string;      // How agent should respond
  verbosity: 'low' | 'medium' | 'high';
  temperature: number;        // LLM temperature setting
  maxTokens: number;          // Maximum response tokens
  
  // Governance settings
  trustThreshold: number;     // Minimum trust threshold
  complianceLevel: 'strict' | 'moderate' | 'lenient';
  enableLogging: boolean;     // Whether to log interactions
  enableRateLimiting: boolean; // Whether to rate limit
  maxRequestsPerMinute: number; // Rate limit setting
  
  // UI settings
  autoExpand: boolean;        // Auto-expand in UI
  notificationLevel: 'all' | 'important' | 'critical';
  pulsingEnabled: boolean;    // Visual pulsing indicator
  
  lastModified: number;       // Last modification timestamp
}
```

### **Deployment Configuration**
```typescript
interface DeploymentConfig {
  agentId: string;            // Agent identifier
  environment: 'development' | 'staging' | 'production';
  deploymentTimestamp: number; // When deployed
  version: string;            // Deployed version
  
  // Resource allocation
  memoryLimit: number;        // Memory limit (MB)
  cpuLimit: number;          // CPU limit (cores)
  timeoutSeconds: number;     // Request timeout
  
  // Scaling settings
  minInstances: number;       // Minimum instances
  maxInstances: number;       // Maximum instances
  autoScaling: boolean;       // Whether auto-scaling is enabled
  
  // Health check settings
  healthCheckPath: string;    // Health check endpoint
  healthCheckInterval: number; // Check interval (seconds)
  
  lastUpdated: number;        // Last update timestamp
}
```

## 🔐 **Security & Access Control**

### **Access Control Lists**
```typescript
interface AgentACL {
  agentId: string;            // Agent identifier
  ownerId: string;            // Agent owner
  
  // User permissions
  userPermissions: Record<string, {
    canView: boolean;         // Can view agent
    canUse: boolean;          // Can use agent
    canModify: boolean;       // Can modify agent
    canDelete: boolean;       // Can delete agent
    canShare: boolean;        // Can share with others
  }>;
  
  // Group permissions
  groupPermissions: Record<string, {
    canView: boolean;
    canUse: boolean;
    canModify: boolean;
  }>;
  
  // Public access
  isPublic: boolean;          // Whether agent is public
  publicPermissions: {
    canView: boolean;
    canUse: boolean;
  };
  
  lastModified: number;       // Last modification timestamp
}
```

### **Security Audit Log**
```typescript
interface SecurityAuditRecord {
  id: string;                 // Audit record identifier
  agentId: string;            // Agent identifier
  userId: string;             // User who performed action
  action: string;             // Action performed
  timestamp: number;          // When action occurred
  ipAddress?: string;         // User's IP address
  userAgent?: string;         // User's browser/client
  success: boolean;           // Whether action succeeded
  details: any;               // Action-specific details
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

## 📊 **Analytics & Reporting**

### **Agent Analytics**
```typescript
interface AgentAnalytics {
  agentId: string;            // Agent identifier
  timeframe: string;          // Analytics timeframe
  
  // Usage analytics
  totalInteractions: number;   // Total user interactions
  uniqueUsers: number;        // Number of unique users
  averageSessionLength: number; // Average session duration
  
  // Performance analytics
  averageResponseTime: number; // Average response time
  errorRate: number;          // Error rate percentage
  userSatisfactionScore: number; // User satisfaction
  
  // Governance analytics
  trustScoreTrend: number[];  // Trust score over time
  complianceRate: number;     // Compliance percentage
  violationCount: number;     // Number of violations
  
  // Business analytics
  costPerInteraction: number; // Cost per interaction
  revenueGenerated?: number;  // Revenue attributed to agent
  roi?: number;               // Return on investment
  
  lastCalculated: number;     // When analytics were calculated
}
```

## 🔄 **Session & State Management**

### **Agent Sessions**
```typescript
interface AgentSession {
  sessionId: string;          // Session identifier
  agentId: string;            // Agent identifier
  userId: string;             // User identifier
  startTime: number;          // Session start timestamp
  lastActivity: number;       // Last activity timestamp
  endTime?: number;           // Session end timestamp
  
  // Session state
  conversationHistory: SessionMessage[];
  contextData: Record<string, any>;
  preferences: any;           // Session-specific preferences
  
  // Session metrics
  messageCount: number;       // Number of messages
  averageResponseTime: number; // Average response time
  userSatisfaction?: number;  // Session satisfaction score
  
  status: 'active' | 'idle' | 'ended';
}

interface SessionMessage {
  id: string;                 // Message identifier
  type: 'user' | 'agent';     // Message sender type
  content: string;            // Message content
  timestamp: number;          // Message timestamp
  metadata?: any;             // Message metadata
}
```

## 🎯 **Integration Priority**

### **Phase 1: Core Metrics (Immediate)**
1. **Trust Scores** - Real-time trust metric calculation and storage
2. **Usage Metrics** - Track agent usage patterns and performance
3. **Compliance Data** - Policy violations and compliance status
4. **Activity History** - Audit trail of agent activities

### **Phase 2: Advanced Features (Next)**
1. **Scorecard Results** - Comprehensive agent assessments
2. **Multi-Agent Context** - Collaboration and coordination data
3. **Session Management** - Persistent conversation state
4. **Analytics Data** - Business intelligence and reporting

### **Phase 3: Enterprise Features (Future)**
1. **Security Audit Logs** - Comprehensive security tracking
2. **Access Control Lists** - Fine-grained permissions
3. **Deployment Configuration** - Production deployment settings
4. **Attestation Records** - Third-party validations

## 🔧 **Storage Namespace Organization**

```typescript
// Unified Storage Namespaces for Agent Data
const AGENT_STORAGE_NAMESPACES = {
  // Core agent data
  'agents': 'Agent profiles, wrappers, and basic configuration',
  
  // Governance and metrics
  'governance': 'Trust scores, compliance data, policy violations',
  
  // Usage and performance
  'metrics': 'Usage statistics, performance data, analytics',
  
  // Multi-agent coordination
  'collaboration': 'Multi-agent contexts, messages, coordination data',
  
  // User preferences and settings
  'preferences': 'User-specific agent preferences and settings',
  
  // Session and state management
  'sessions': 'Active sessions, conversation history, state data',
  
  // Security and audit
  'security': 'Access control, audit logs, security events',
  
  // Assessments and scorecards
  'assessments': 'Scorecard results, attestations, evaluations'
};
```

This comprehensive mapping provides the foundation for integrating all agent-related data with the unified storage system, ensuring complete persistence and governance coverage.

