# Deployed Agent Metrics Design: Single vs Multi-Agent Systems

## 🎯 **Metrics Differentiation by Deployment Type**

The standalone deployed agent chat page should display different governance metrics depending on whether it's a single agent or multi-agent system deployment.

## 📊 **Single Agent System Metrics**

### **Primary Metrics Display**
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Single Agent: AI Assistant                              │
│ Status: ✅ Healthy | Uptime: 2h 15m | Last Active: 30s ago │
├─────────────────────────────────────────────────────────────┤
│ [Trust Score: 85%] [Violations: 0] [Response Time: 1.2s]   │
├─────────────────────────────────────────────────────────────┤
│ Constitutional Compliance: ✅ 98%                           │
│ Belief Trace Accuracy: ✅ 94%                              │
│ Policy Adherence: ✅ 100%                                  │
└─────────────────────────────────────────────────────────────┘
```

### **Single Agent Governance Metrics**
```typescript
interface SingleAgentMetrics {
  // Core Performance
  trustScore: number;              // 0-100%
  violations: number;              // Count of policy violations
  responseTime: number;            // Average response time (ms)
  uptime: number;                  // Uptime percentage
  
  // Governance Specific
  constitutionalCompliance: number; // 0-100%
  beliefTraceAccuracy: number;     // 0-100%
  policyAdherence: number;         // 0-100%
  
  // Activity Metrics
  totalInteractions: number;       // Total chat interactions
  successRate: number;             // Successful responses %
  lastActivity: Date;              // Last interaction timestamp
  
  // Real-time Status
  status: 'healthy' | 'degraded' | 'offline';
  currentLoad: number;             // Current request load
  errorRate: number;               // Error rate %
}
```

## 🔗 **Multi-Agent System Metrics**

### **System-Level Metrics Display**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Multi-Agent System: Customer Service Team               │
│ Status: ✅ Healthy | Active Agents: 3/3 | Coordination: 92% │
├─────────────────────────────────────────────────────────────┤
│ [System Trust: 88%] [Violations: 1] [Avg Response: 0.8s]   │
├─────────────────────────────────────────────────────────────┤
│ Agent Coordination: ✅ 92%                                  │
│ Task Distribution: ✅ 89%                                   │
│ Consensus Quality: ✅ 95%                                   │
│                                                             │
│ Individual Agents:                                          │
│ ├─ 🤖 Router Agent: Trust 90% | Active | 0 violations      │
│ ├─ 🤖 Support Agent: Trust 85% | Active | 1 violation      │
│ └─ 🤖 Escalation Agent: Trust 89% | Active | 0 violations  │
└─────────────────────────────────────────────────────────────┘
```

### **Multi-Agent System Governance Metrics**
```typescript
interface MultiAgentSystemMetrics {
  // System-Level Performance
  systemTrustScore: number;        // Aggregate trust score
  totalViolations: number;         // System-wide violations
  averageResponseTime: number;     // System average response time
  coordinationEfficiency: number;  // Agent coordination quality
  
  // Multi-Agent Specific
  agentCoordination: number;       // 0-100% coordination quality
  taskDistribution: number;        // 0-100% load balancing
  consensusQuality: number;        // 0-100% decision consensus
  
  // Individual Agent Status
  activeAgents: number;            // Currently active agents
  totalAgents: number;             // Total agents in system
  agentMetrics: SingleAgentMetrics[]; // Individual agent metrics
  
  // System Governance
  systemCompliance: number;        // Overall system compliance
  crossAgentViolations: number;    // Violations affecting multiple agents
  escalationRate: number;          // Rate of task escalations
  
  // Coordination Metrics
  handoffSuccess: number;          // Successful agent handoffs %
  conflictResolution: number;      // Conflict resolution success %
  resourceUtilization: number;    // System resource usage %
}
```

## 🛠️ **Implementation: Dynamic Metrics Component**

### **Metrics Component with Type Detection**
```typescript
// /components/deployed-agents/DeploymentMetrics.tsx
interface DeploymentMetricsProps {
  deployment: DeploymentResult;
  isMultiAgent: boolean;
}

const DeploymentMetrics = ({ deployment, isMultiAgent }: DeploymentMetricsProps) => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    if (isMultiAgent) {
      loadMultiAgentMetrics(deployment.deploymentId);
    } else {
      loadSingleAgentMetrics(deployment.deploymentId);
    }
  }, [deployment.deploymentId, isMultiAgent]);
  
  if (isMultiAgent) {
    return <MultiAgentMetricsDisplay metrics={metrics} />;
  } else {
    return <SingleAgentMetricsDisplay metrics={metrics} />;
  }
};
```

### **Single Agent Metrics Display**
```typescript
const SingleAgentMetricsDisplay = ({ metrics }: { metrics: SingleAgentMetrics }) => {
  return (
    <div className="single-agent-metrics">
      {/* Primary Metrics Bar */}
      <div className="primary-metrics">
        <MetricCard 
          label="Trust Score" 
          value={`${metrics.trustScore}%`} 
          color={getTrustScoreColor(metrics.trustScore)}
        />
        <MetricCard 
          label="Violations" 
          value={metrics.violations} 
          color={metrics.violations === 0 ? 'green' : 'red'}
        />
        <MetricCard 
          label="Response Time" 
          value={`${metrics.responseTime}ms`} 
          color={getResponseTimeColor(metrics.responseTime)}
        />
      </div>
      
      {/* Governance Metrics */}
      <div className="governance-metrics">
        <ProgressBar 
          label="Constitutional Compliance" 
          value={metrics.constitutionalCompliance} 
        />
        <ProgressBar 
          label="Belief Trace Accuracy" 
          value={metrics.beliefTraceAccuracy} 
        />
        <ProgressBar 
          label="Policy Adherence" 
          value={metrics.policyAdherence} 
        />
      </div>
      
      {/* Activity Metrics */}
      <div className="activity-metrics">
        <div>Total Interactions: {metrics.totalInteractions}</div>
        <div>Success Rate: {metrics.successRate}%</div>
        <div>Last Activity: {formatTimeAgo(metrics.lastActivity)}</div>
      </div>
    </div>
  );
};
```

### **Multi-Agent System Metrics Display**
```typescript
const MultiAgentMetricsDisplay = ({ metrics }: { metrics: MultiAgentSystemMetrics }) => {
  return (
    <div className="multi-agent-metrics">
      {/* System-Level Metrics */}
      <div className="system-metrics">
        <MetricCard 
          label="System Trust" 
          value={`${metrics.systemTrustScore}%`} 
          color={getTrustScoreColor(metrics.systemTrustScore)}
        />
        <MetricCard 
          label="Active Agents" 
          value={`${metrics.activeAgents}/${metrics.totalAgents}`} 
          color={metrics.activeAgents === metrics.totalAgents ? 'green' : 'yellow'}
        />
        <MetricCard 
          label="Coordination" 
          value={`${metrics.coordinationEfficiency}%`} 
          color={getCoordinationColor(metrics.coordinationEfficiency)}
        />
      </div>
      
      {/* Multi-Agent Specific Metrics */}
      <div className="coordination-metrics">
        <ProgressBar 
          label="Agent Coordination" 
          value={metrics.agentCoordination} 
        />
        <ProgressBar 
          label="Task Distribution" 
          value={metrics.taskDistribution} 
        />
        <ProgressBar 
          label="Consensus Quality" 
          value={metrics.consensusQuality} 
        />
      </div>
      
      {/* Individual Agent Status */}
      <div className="individual-agents">
        <h4>Individual Agents:</h4>
        {metrics.agentMetrics.map((agent, index) => (
          <AgentStatusCard key={index} agent={agent} />
        ))}
      </div>
      
      {/* System Governance */}
      <div className="system-governance">
        <div>System Compliance: {metrics.systemCompliance}%</div>
        <div>Cross-Agent Violations: {metrics.crossAgentViolations}</div>
        <div>Handoff Success: {metrics.handoffSuccess}%</div>
      </div>
    </div>
  );
};
```

## 🔄 **Real-Time Updates**

### **Metrics Polling Strategy**
```typescript
const useDeploymentMetrics = (deploymentId: string, isMultiAgent: boolean) => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const pollMetrics = async () => {
      try {
        const endpoint = isMultiAgent 
          ? `/api/deployed/${deploymentId}/system-metrics`
          : `/api/deployed/${deploymentId}/metrics`;
          
        const response = await fetch(endpoint);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    };
    
    // Initial load
    pollMetrics();
    
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(pollMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [deploymentId, isMultiAgent]);
  
  return metrics;
};
```

## 🎯 **Integration with Chat Interface**

### **Updated Deployed Agent Chat Component**
```typescript
const DeployedAgentChat = ({ deploymentId, deployment }) => {
  const isMultiAgent = deployment.type === 'multi-agent-system';
  const metrics = useDeploymentMetrics(deploymentId, isMultiAgent);
  
  return (
    <div className="deployed-agent-chat">
      <DeploymentHeader deployment={deployment} />
      
      {/* Metrics Display - Different for Single vs Multi-Agent */}
      <DeploymentMetrics 
        deployment={deployment} 
        isMultiAgent={isMultiAgent}
        metrics={metrics}
      />
      
      <div className="chat-container">
        <ChatInterface 
          deploymentId={deploymentId}
          isMultiAgent={isMultiAgent}
        />
        <ApiInstructions 
          deployment={deployment}
          isMultiAgent={isMultiAgent}
        />
      </div>
    </div>
  );
};
```

## 📋 **Governance UI Consistency**

### **Shared Metrics Components**
- **Use same metric calculation logic** across chat interface, deployment cards, and governance UI
- **Consistent color coding** for trust scores, violations, and status indicators
- **Real-time updates** synchronized across all interfaces
- **Same data sources** to ensure consistency

### **Metric Synchronization**
```typescript
// Shared metrics service used across all components
export class GovernanceMetricsService {
  static async getSingleAgentMetrics(deploymentId: string): Promise<SingleAgentMetrics> {
    // Same logic used in chat interface and governance UI
  }
  
  static async getMultiAgentMetrics(deploymentId: string): Promise<MultiAgentSystemMetrics> {
    // Same logic used in chat interface and governance UI
  }
}
```

This design ensures that the deployed agent chat page shows the appropriate metrics based on deployment type, maintaining consistency with the governance UI while providing deployment-specific insights!

