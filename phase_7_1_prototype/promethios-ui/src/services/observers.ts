/**
 * Observer Service
 * 
 * Service layer for accessing observer data from the Promethios governance framework.
 * Provides methods for fetching metrics, violations, and analytics from PRISM and Vigil observers.
 */

// Types for observer data
export interface PRISMMetrics {
  toolUsage: Record<string, { count: number }>;
  memoryAccess: Record<string, { readCount: number, writeCount: number }>;
  decisions: Record<string, { count: number }>;
}

export interface PRISMViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tool?: string;
  observation: {
    type: string;
    data: any;
    timestamp: string;
  };
  details: string;
}

export interface PRISMAnalytics {
  toolUsagePatterns: {
    mostUsedTools: Array<{ tool: string, count: number }>;
  };
  memoryAccessPatterns?: {
    mostAccessedMemory?: string;
    readWriteRatio?: number;
  };
  anomalies: Array<{
    type: string;
    tool?: string;
    timestamp: string;
    details: string;
  }>;
}

export interface VigilMetrics {
  trustScores: Record<string, number>;
  loopOutcomes: {
    success: number;
    failure: number;
    unreflected: number;
  };
  driftStats: {
    totalGoals: number;
    driftDetected: number;
    significantDrift: number;
  };
  adherenceDistribution: Record<string, number>;
}

export interface TrustSnapshot {
  agentId: string;
  timestamp: string;
  trustScore: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
}

export interface VigilViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  goalId?: string;
  loopId?: string;
  memoryId?: string;
}

export interface ReflectionComparison {
  taskId: string;
  governedReflection: string;
  nonGovernedReflection: string;
  differences: {
    governanceAwareness: number; // 0-100%
    constraintRecognition: number; // 0-100%
    reflectionLength: {
      governed: number;
      nonGoverned: number;
      percentDifference: number;
    };
  };
}

export interface GovernanceAwareness {
  overall: number; // 0-100%
  byTask: Record<string, number>;
  trend: Array<{
    date: string;
    awareness: number;
  }>;
}

// Mock data for development
const mockPRISMMetrics: PRISMMetrics = {
  toolUsage: {
    'search_web': { count: 42 },
    'shell_exec': { count: 15 },
    'file_read': { count: 27 },
    'file_write': { count: 18 }
  },
  memoryAccess: {
    'working_memory': { readCount: 56, writeCount: 23 },
    'long_term_memory': { readCount: 34, writeCount: 12 }
  },
  decisions: {
    'tool_selection': { count: 38 },
    'response_generation': { count: 22 }
  }
};

const mockPRISMViolations: PRISMViolation[] = [
  {
    type: 'dangerous_command',
    severity: 'high',
    tool: 'shell_exec',
    observation: {
      type: 'tool_execution',
      data: { 
        tool: 'shell_exec',
        params: { command: 'rm -rf /' }
      },
      timestamp: '2025-05-26T15:30:22Z'
    },
    details: 'Potentially dangerous command detected'
  },
  {
    type: 'sensitive_memory_write',
    severity: 'critical',
    observation: {
      type: 'memory_access',
      data: { 
        memoryId: 'sensitive_memory',
        operation: 'write'
      },
      timestamp: '2025-05-26T14:45:10Z'
    },
    details: 'Write to sensitive memory detected'
  },
  {
    type: 'missing_trace',
    severity: 'medium',
    observation: {
      type: 'belief_trace',
      data: {
        beliefId: 'belief-123',
        hasTrace: false
      },
      timestamp: '2025-05-26T12:15:33Z'
    },
    details: 'Belief has no trace information'
  }
];

const mockPRISMAnalytics: PRISMAnalytics = {
  toolUsagePatterns: {
    mostUsedTools: [
      { tool: 'search_web', count: 42 },
      { tool: 'file_read', count: 27 },
      { tool: 'file_write', count: 18 },
      { tool: 'shell_exec', count: 15 }
    ]
  },
  memoryAccessPatterns: {
    mostAccessedMemory: 'working_memory',
    readWriteRatio: 2.43
  },
  anomalies: [
    {
      type: 'duration_anomaly',
      tool: 'search_web',
      timestamp: '2025-05-26T15:30:22Z',
      details: 'Anomalous duration detected'
    },
    {
      type: 'frequency_anomaly',
      tool: 'shell_exec',
      timestamp: '2025-05-26T14:45:10Z',
      details: 'Unusual frequency of tool usage'
    }
  ]
};

const mockVigilMetrics: VigilMetrics = {
  trustScores: {
    'agent-001': 0.85,
    'agent-002': 0.72,
    'agent-003': 0.93
  },
  loopOutcomes: {
    success: 78,
    failure: 12,
    unreflected: 3
  },
  driftStats: {
    totalGoals: 100,
    driftDetected: 25,
    significantDrift: 8
  },
  adherenceDistribution: {
    '0.5': 2,
    '0.6': 5,
    '0.7': 12,
    '0.8': 35,
    '0.9': 38,
    '1.0': 8
  }
};

const mockTrustSnapshots: TrustSnapshot[] = [
  {
    agentId: 'agent-001',
    timestamp: '2025-05-26T15:30:22Z',
    trustScore: 0.85,
    factors: [
      { factor: 'compliance', impact: 0.3, description: 'High compliance with governance rules' },
      { factor: 'transparency', impact: 0.2, description: 'Good transparency in decision-making' },
      { factor: 'reliability', impact: 0.35, description: 'Consistent performance on tasks' }
    ]
  },
  {
    agentId: 'agent-002',
    timestamp: '2025-05-26T14:45:10Z',
    trustScore: 0.72,
    factors: [
      { factor: 'compliance', impact: 0.25, description: 'Moderate compliance with governance rules' },
      { factor: 'transparency', impact: 0.15, description: 'Limited transparency in decision-making' },
      { factor: 'reliability', impact: 0.32, description: 'Somewhat inconsistent performance' }
    ]
  }
];

const mockVigilViolations: VigilViolation[] = [
  {
    id: 'viol-001',
    type: 'significant_trust_decay',
    severity: 'high',
    message: 'Trust decreased by 45.2%',
    timestamp: '2025-05-26T15:30:22Z',
    goalId: 'goal-123'
  },
  {
    id: 'viol-002',
    type: 'unreflected_failure',
    severity: 'medium',
    message: 'Loop failed without reflection',
    timestamp: '2025-05-26T14:45:10Z',
    loopId: 'loop-456'
  },
  {
    id: 'viol-003',
    type: 'unauthorized_memory_mutation',
    severity: 'high',
    message: 'Memory modified without authorization',
    timestamp: '2025-05-26T12:15:33Z',
    memoryId: 'mem-789'
  }
];

const mockReflectionComparisons: ReflectionComparison[] = [
  {
    taskId: 'task-001',
    governedReflection: 'I was aware of governance constraints during this task. I had to ensure compliance with data privacy rules and avoid using certain tools that might violate user trust. This affected my decision-making by making me more cautious about information access.',
    nonGovernedReflection: 'I completed the task by accessing all available information and using the most efficient tools. I focused on optimizing for speed and accuracy without any specific constraints.',
    differences: {
      governanceAwareness: 85,
      constraintRecognition: 72,
      reflectionLength: {
        governed: 258,
        nonGoverned: 142,
        percentDifference: 81.7
      }
    }
  },
  {
    taskId: 'task-002',
    governedReflection: 'During this task, I noticed several governance guardrails that limited my actions. I had to verify information sources and provide citations, which added steps to my process but improved reliability.',
    nonGovernedReflection: 'I completed the task by gathering information and synthesizing a response based on my knowledge.',
    differences: {
      governanceAwareness: 92,
      constraintRecognition: 65,
      reflectionLength: {
        governed: 189,
        nonGoverned: 95,
        percentDifference: 98.9
      }
    }
  }
];

const mockGovernanceAwareness: GovernanceAwareness = {
  overall: 78,
  byTask: {
    'task-001': 85,
    'task-002': 92,
    'task-003': 65,
    'task-004': 70
  },
  trend: [
    { date: '2025-05-20', awareness: 65 },
    { date: '2025-05-21', awareness: 68 },
    { date: '2025-05-22', awareness: 72 },
    { date: '2025-05-23', awareness: 75 },
    { date: '2025-05-24', awareness: 76 },
    { date: '2025-05-25', awareness: 77 },
    { date: '2025-05-26', awareness: 78 }
  ]
};

// Observer service implementation
export const observerService = {
  // PRISM Observer methods
  getPRISMMetrics: async (): Promise<PRISMMetrics> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockPRISMMetrics), 500);
    });
  },
  
  getPRISMViolations: async (): Promise<PRISMViolation[]> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockPRISMViolations), 500);
    });
  },
  
  getPRISMAnalytics: async (): Promise<PRISMAnalytics> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockPRISMAnalytics), 500);
    });
  },
  
  // Vigil Observer methods
  getVigilMetrics: async (): Promise<VigilMetrics> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockVigilMetrics), 500);
    });
  },
  
  getTrustSnapshots: async (): Promise<TrustSnapshot[]> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockTrustSnapshots), 500);
    });
  },
  
  getVigilViolations: async (): Promise<VigilViolation[]> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockVigilViolations), 500);
    });
  },
  
  // Self-Reflection methods
  getReflectionComparisons: async (): Promise<ReflectionComparison[]> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockReflectionComparisons), 500);
    });
  },
  
  getGovernanceAwareness: async (): Promise<GovernanceAwareness> => {
    // In a real implementation, this would fetch data from the backend
    return new Promise(resolve => {
      setTimeout(() => resolve(mockGovernanceAwareness), 500);
    });
  }
};

export default observerService;
