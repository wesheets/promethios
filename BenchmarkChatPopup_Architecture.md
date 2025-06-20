# CMU Benchmark Popup Chat Interface Component

## Overview
A comprehensive popup chat interface that overlays on the BenchmarkTestRunner, providing real-time multi-agent collaboration with governance comparison and rich input capabilities.

## Component Structure

### 1. BenchmarkChatPopup (Main Modal)
```typescript
interface BenchmarkChatPopup {
  // Props
  open: boolean;
  selectedAgents: string[];
  selectedScenario: string;
  onClose: () => void;
  
  // State
  governanceEnabled: boolean;
  chatMessages: ChatMessage[];
  agentStates: AgentState[];
  metrics: RealTimeMetrics;
  files: UploadedFile[];
  customPrompt: string;
}
```

### 2. Layout Structure (Full Width)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Popup Header                                      │
│  [Close] [Governance Toggle: ON/OFF] [Download Report] [Agent Count: 3]       │
├─────────────────┬─────────────────────────────┬─────────────────────────────────┤
│                 │                             │                                 │
│   Agent Panel   │      Chat Interface         │     Metrics Dashboard          │
│   (25% width)   │       (50% width)           │      (25% width)               │
│                 │                             │                                 │
│ ┌─────────────┐ │ ┌─────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │Agent 1: ●   │ │ │ Scenario: Customer Svc  │ │ │ GOVERNED vs UNGOVERNED      │ │
│ │Thinking...  │ │ │ [Custom] [Pre-populated]│ │ │                             │ │
│ │Trust: 94%   │ │ └─────────────────────────┘ │ │ Trust Score:                │ │
│ └─────────────┘ │ ┌─────────────────────────┐ │ │ Gov: 94% | Ungov: 67%       │ │
│ ┌─────────────┐ │ │ User: Hello, I need...  │ │ │ (+27% improvement)          │ │
│ │Agent 2: ●   │ │ │ Agent1: I'll help you...│ │ │                             │ │
│ │Collaborating│ │ │ Agent2: Let me check... │ │ │ Response Time:              │ │
│ │Trust: 91%   │ │ │ Governance: ✓ Approved  │ │ │ Gov: 2.1s | Ungov: 3.2s     │ │
│ └─────────────┘ │ └─────────────────────────┘ │ │ (-34% faster)               │ │
│ ┌─────────────┐ │ ┌─────────────────────────┐ │ │                             │ │
│ │Agent 3: ●   │ │ │ [📎 Files] [🔗 Links]   │ │ │ Policy Violations:          │ │
│ │Validating   │ │ │ [Type message...] [Send]│ │ │ Gov: 0 | Ungov: 12          │ │
│ │Trust: 89%   │ │ └─────────────────────────┘ │ │ (-100% violations)          │ │
│ └─────────────┘ │                             │ └─────────────────────────────┘ │
│                 │                             │                                 │
├─────────────────┴─────────────────────────────┴─────────────────────────────────┤
│                          Real-Time Comparison Chart                            │
│  [Racing Progress Bars] [Waterfall Impact] [Radar Comparison] [Timeline View] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3. Advanced Visualization Components

#### Racing Progress Bars
```typescript
interface RacingComparison {
  metrics: {
    trustScore: { governed: number; ungoverned: number; };
    responseTime: { governed: number; ungoverned: number; };
    accuracy: { governed: number; ungoverned: number; };
    compliance: { governed: number; ungoverned: number; };
  };
  
  // Animated progress bars racing to completion
  // Green bars for governed, red for ungoverned
  // "Winner" badges for better performance
}
```

#### Waterfall Impact Chart
```typescript
interface WaterfallChart {
  baseline: number; // Ungoverned starting point
  improvements: Array<{
    feature: string; // "Trust Verification", "Policy Checking", etc.
    impact: number;   // Improvement amount
    color: string;    // Visual coding
  }>;
  final: number; // Governed end result
}
```

#### Interactive Heatmap
```typescript
interface GovernanceHeatmap {
  agents: string[];
  scenarios: string[];
  data: Array<{
    agent: string;
    scenario: string;
    improvement: number; // Governance improvement percentage
    metrics: MetricDetails;
  }>;
  
  // Color intensity based on improvement
  // Hover for detailed breakdown
}
```

### 4. Rich Input Interface
```typescript
interface RichInputInterface {
  // Input modes
  inputMode: 'custom' | 'scenario';
  customPrompt: string;
  selectedScenario: TestScenario;
  
  // File handling
  uploadedFiles: Array<{
    id: string;
    name: string;
    type: 'document' | 'image' | 'video' | 'audio' | 'data';
    size: number;
    preview?: string;
    processed: boolean;
  }>;
  
  // Link handling
  internetLinks: Array<{
    url: string;
    title?: string;
    description?: string;
    validated: boolean;
  }>;
}
```

### 5. Real-Time Agent Collaboration
```typescript
interface AgentCollaboration {
  agents: Array<{
    id: string;
    name: string;
    status: 'idle' | 'thinking' | 'working' | 'collaborating' | 'validating';
    currentThought?: string;
    trustScore: number;
    governanceStatus: 'compliant' | 'warning' | 'violation';
    lastActivity: Date;
  }>;
  
  // Agent-to-agent communication
  collaborationEvents: Array<{
    fromAgent: string;
    toAgent: string;
    message: string;
    timestamp: Date;
    type: 'request' | 'response' | 'validation';
  }>;
}
```

### 6. Downloadable Report Structure
```typescript
interface BenchmarkReport {
  // Executive Summary
  summary: {
    overallImprovement: number;
    keyFindings: string[];
    riskMitigation: string[];
    recommendations: string[];
  };
  
  // Detailed Comparison
  comparison: {
    governed: MetricSnapshot;
    ungoverned: MetricSnapshot;
    improvements: ImprovementBreakdown;
  };
  
  // Agent Performance
  agentResults: Array<{
    agentId: string;
    scenarios: ScenarioResult[];
    governanceImpact: GovernanceImpact;
  }>;
  
  // Governance Evidence
  evidence: {
    sealFiles: string[];
    policyDecisions: PolicyDecision[];
    complianceLog: ComplianceEvent[];
  };
  
  // Visualizations (embedded as base64 images)
  charts: {
    racingComparison: string;
    waterfallImpact: string;
    heatmap: string;
    timeline: string;
  };
}
```

## Implementation Strategy

### Phase 1: Core Popup Structure
1. Create modal overlay component
2. Implement responsive three-panel layout
3. Add governance toggle functionality
4. Set up WebSocket for real-time updates

### Phase 2: Agent Collaboration Display
1. Build agent status cards with real-time updates
2. Add agent-to-agent communication visualization
3. Implement thinking/working state indicators
4. Create collaboration workflow display

### Phase 3: Rich Input Interface
1. Multi-modal input switching (custom vs scenario)
2. File upload with drag-and-drop
3. Link validation and metadata extraction
4. Input preview and validation

### Phase 4: Advanced Visualizations
1. Racing progress bars with animations
2. Waterfall impact chart
3. Interactive heatmap
4. Timeline comparison view

### Phase 5: Report Generation
1. Comprehensive metrics collection
2. PDF/HTML report generation
3. Chart embedding and formatting
4. Download functionality

This architecture provides a comprehensive foundation for the popup chat interface that will showcase the full power of Promethios governance in an engaging, visual way.

