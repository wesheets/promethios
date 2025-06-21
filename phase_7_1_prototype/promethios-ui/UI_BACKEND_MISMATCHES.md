# UI-Backend Data Structure Mismatches & Adapter Plan

## 🔍 **Critical Mismatches Identified**

### **1. Multi-Agent Context Data Structure Mismatch** ⚠️

#### **Backend API Schema (Actual):**
```typescript
// MultiAgentContextResponse from backend
interface BackendMultiAgentContext {
  context_id: string;
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  status: string;
  created_at: string;  // ISO string
}

// ConversationHistoryResponse
interface BackendConversationHistory {
  context_id: string;
  messages: object[];  // Generic objects
  total_messages: number;
  filtered_count: number;
  collaboration_model: string;
}
```

#### **UI Expected Schema (What I Built):**
```typescript
// MultiAgentContext in UI service
interface UIMultiAgentContext {
  context_id: string;
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  status: string;
  created_at: string;
  // ❌ MISSING: These fields don't exist in backend
  lastActivity: number;  // Expected number, not in backend
  persistentData: {      // Expected complex object, not in backend
    sharedMemory: Record<string, any>;
    conversationHistory: AgentMessage[];
    collaborationMetrics: any;
  };
}

// SystemProfile mapping expects these fields
interface UISystemProfile {
  id: string;
  name: string;
  description: string;
  type: 'multi_agent_system';
  agentIds: string[];
  collaborationModel: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  lastActivity: Date;  // ❌ MISSING in backend
  metrics: {           // ❌ DIFFERENT structure than backend
    totalMessages: number;
    activeAgents: number;
    averageResponseTime: number;
  };
}
```

#### **Backend Actual Schema:**
```typescript
// CollaborationMetricsResponse (separate endpoint)
interface BackendCollaborationMetrics {
  context_id: string;
  collaboration_model: string;
  total_messages: number;
  active_agents: number;
  average_participation: number;  // ❌ UI expects averageResponseTime
  agent_metrics: object[];        // ❌ Generic objects, not typed
  governance_metrics: object;     // ❌ Generic object
}
```

### **2. Agent Message Structure Mismatch** ⚠️

#### **Backend Schema:**
```typescript
// AgentMessageRequest
interface BackendMessageRequest {
  context_id: string;
  from_agent_id: string;
  to_agent_ids: string[];  // Array of recipients
  message: any;            // Generic message content
  require_response?: boolean;
  priority?: string;
}
```

#### **UI Expected Schema:**
```typescript
// AgentMessage in UI
interface UIAgentMessage {
  id: string;              // ❌ MISSING in backend request
  from_agent_id: string;
  to_agent_ids?: string[]; // Optional in UI, required in backend
  content: any;            // Different field name (message vs content)
  timestamp: string;       // ❌ MISSING in backend request
  type: string;            // ❌ MISSING in backend request
  governance_data?: any;   // ❌ MISSING in backend request
}
```

### **3. Agent Wrapper Integration Mismatch** ⚠️

#### **UI Agent Wrapper Schema:**
```typescript
interface StoredAgentWrapper {
  id: string;
  userId: string;
  name: string;
  description: string;
  version: string;
  supportedProviders: string[];
  // ... many more fields
  usageMetrics: {
    lastUsed: number;      // ❌ No backend equivalent
    totalRequests: number; // ❌ No backend equivalent
  };
  governanceData: {
    trustScore: number;    // ❌ No backend equivalent
    complianceScore: number; // ❌ No backend equivalent
  };
}
```

#### **Backend Reality:**
- **No agent wrapper API endpoints found**
- **No governance scoring API connected**
- **No usage metrics API available**

## 🔧 **Required Adapter Layers**

### **1. Multi-Agent Context Adapter**
```typescript
class MultiAgentContextAdapter {
  // Convert backend response to UI expected format
  static backendToUI(backendContext: BackendMultiAgentContext): UIMultiAgentContext {
    return {
      ...backendContext,
      lastActivity: Date.now(), // Default to current time
      persistentData: {
        sharedMemory: {},
        conversationHistory: [], // Fetch separately
        collaborationMetrics: {}
      }
    };
  }

  // Convert UI request to backend format
  static uiToBackend(uiRequest: CreateContextRequest): BackendContextRequest {
    return {
      name: uiRequest.name,
      agent_ids: uiRequest.agent_ids,
      collaboration_model: uiRequest.collaboration_model,
      policies: uiRequest.policies || {},
      governance_enabled: uiRequest.governance_enabled ?? true,
      metadata: uiRequest.metadata || {}
    };
  }
}
```

### **2. System Profile Adapter**
```typescript
class SystemProfileAdapter {
  static async createFromBackend(
    context: BackendMultiAgentContext,
    metrics?: BackendCollaborationMetrics,
    history?: BackendConversationHistory
  ): Promise<UISystemProfile> {
    return {
      id: context.context_id,
      name: context.name,
      description: `Multi-agent system with ${context.agent_ids.length} agents`,
      type: 'multi_agent_system',
      agentIds: context.agent_ids,
      collaborationModel: context.collaboration_model,
      status: context.status as 'active' | 'inactive' | 'error',
      createdAt: new Date(context.created_at),
      lastActivity: new Date(), // Default to now, no backend equivalent
      metrics: {
        totalMessages: metrics?.total_messages || 0,
        activeAgents: metrics?.active_agents || context.agent_ids.length,
        averageResponseTime: 0 // No backend equivalent
      }
    };
  }
}
```

### **3. Agent Message Adapter**
```typescript
class AgentMessageAdapter {
  static uiToBackend(uiMessage: UIAgentMessage, contextId: string): BackendMessageRequest {
    return {
      context_id: contextId,
      from_agent_id: uiMessage.from_agent_id,
      to_agent_ids: uiMessage.to_agent_ids || [],
      message: uiMessage.content,
      require_response: false,
      priority: 'normal'
    };
  }

  static backendToUI(backendMessage: any): UIAgentMessage {
    return {
      id: backendMessage.id || `msg-${Date.now()}`,
      from_agent_id: backendMessage.from_agent_id,
      to_agent_ids: backendMessage.to_agent_ids,
      content: backendMessage.message || backendMessage.content,
      timestamp: backendMessage.timestamp || new Date().toISOString(),
      type: backendMessage.type || 'message',
      governance_data: backendMessage.governance_data
    };
  }
}
```

## 🎯 **Integration Strategy**

### **Phase 1: Create Adapter Services**
1. **MultiAgentServiceAdapter** - Wraps existing multiAgentService with data transformation
2. **SystemProfileService** - Combines multiple backend calls to create UI-expected data
3. **MessageTransformService** - Handles message format conversion

### **Phase 2: Update UI Components**
1. **AgentProfilesPage** - Use adapter services instead of direct backend calls
2. **MultiAgentSystemDashboard** - Handle missing fields gracefully
3. **Agent wrapper components** - Mock missing governance data until backend ready

### **Phase 3: Gradual Backend Enhancement**
1. **Add missing fields** to backend responses
2. **Create governance APIs** for trust scoring
3. **Add usage metrics** endpoints

## 🚨 **Critical Issues to Address**

### **1. Missing Backend Endpoints**
- **Agent wrapper CRUD** - No backend API found
- **Governance scoring** - No trust/compliance APIs connected
- **Usage metrics** - No tracking endpoints available

### **2. Data Type Mismatches**
- **Timestamps** - Backend uses ISO strings, UI expects numbers
- **Message structure** - Different field names and requirements
- **Metrics structure** - Backend has different metric types than UI expects

### **3. UI Assumptions**
- **UI assumes persistent data** that doesn't exist in backend
- **UI expects real-time updates** that backend doesn't provide
- **UI shows governance data** that backend doesn't calculate

## 🔧 **Immediate Action Plan**

### **Step 1: Create Minimal Adapters (30 minutes)**
- Create adapter classes for data transformation
- Handle missing fields with sensible defaults
- Ensure UI doesn't crash on missing data

### **Step 2: Wire with Adapters (45 minutes)**
- Update multiAgentService to use adapters
- Modify AgentProfilesPage to handle transformed data
- Test basic multi-agent context creation

### **Step 3: Test and Iterate (30 minutes)**
- Test multi-agent system creation end-to-end
- Identify remaining issues
- Document what works vs. what needs backend changes

**This approach allows us to get basic functionality working while clearly identifying what needs backend development later.**

