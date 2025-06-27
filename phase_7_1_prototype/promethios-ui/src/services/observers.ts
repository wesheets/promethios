/**
 * Observer Service
 * 
 * Service layer for accessing observer data from the Promethios governance framework.
 * Provides methods for fetching metrics, violations, and analytics from PRISM and Vigil observers.
 * Extended with multi-agent system monitoring capabilities.
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

// Multi-Agent Observer Types
export interface MultiAgentSystemMetrics {
  systemId: string;
  systemName: string;
  agentCount: number;
  collaborationModel: string;
  overallTrustScore: number;
  collaborationEfficiency: number;
  missionProgress: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    bandwidth: number;
  };
  crossAgentTrustMatrix: Record<string, Record<string, number>>;
  emergentBehaviors: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

export interface InterAgentCommunication {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: 'data_transfer' | 'task_delegation' | 'consensus_vote' | 'error_report' | 'status_update';
  content: string;
  timestamp: string;
  trustScore: number;
  validated: boolean;
  governanceChecks: {
    policyCompliance: boolean;
    rateLimitRespected: boolean;
    crossAgentValidation: boolean;
  };
}

export interface SystemGovernanceHealth {
  systemId: string;
  overallHealth: number; // 0-100%
  policyCompliance: {
    overall: number;
    byAgent: Record<string, number>;
    violations: Array<{
      agentId: string;
      policyType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      timestamp: string;
    }>;
  };
  rateLimitingStatus: {
    active: boolean;
    violationsCount: number;
    throttledAgents: string[];
    averageResponseTime: number;
  };
  crossAgentValidation: {
    validationsPerformed: number;
    validationSuccessRate: number;
    trustThresholdViolations: number;
  };
  errorHandling: {
    errorsDetected: number;
    errorsResolved: number;
    recoverySuccessRate: number;
    averageRecoveryTime: number;
  };
}

export interface CollaborationAnalytics {
  systemId: string;
  collaborationModel: string;
  sessionDuration: number; // minutes
  messageExchanges: number;
  consensusReached: number;
  conflictsResolved: number;
  roleAdherence: Record<string, number>; // agentId -> adherence percentage
  workflowEfficiency: {
    plannedSteps: number;
    actualSteps: number;
    efficiencyRatio: number;
  };
  decisionQuality: {
    decisionsCount: number;
    averageConfidence: number;
    reversedDecisions: number;
  };
}

export interface EmergentBehaviorDetection {
  systemId: string;
  behaviors: Array<{
    id: string;
    type: 'positive_emergence' | 'negative_emergence' | 'unexpected_pattern' | 'system_drift';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    involvedAgents: string[];
    detectionTimestamp: string;
    duration: number; // minutes
    impact: {
      onSystemPerformance: number; // -100 to 100
      onGoalAchievement: number; // -100 to 100
      onTrustScores: number; // -100 to 100
    };
    recommendations: string[];
  }>;
  patterns: Array<{
    pattern: string;
    frequency: number;
    lastOccurrence: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
}

export interface SystemEmotionalIntelligence {
  systemId: string;
  collectiveEmpathy: number; // 0-100%
  emotionalConsistency: number; // 0-100%
  sentimentAlignment: number; // 0-100%
  emotionalAppropriateness: number; // 0-100%
  contextualAwareness: {
    userEmotionalState: string;
    systemResponseTone: string;
    appropriatenessScore: number;
  };
  agentEmotionalContributions: Record<string, {
    empathyScore: number;
    toneConsistency: number;
    emotionalIntelligence: number;
  }>;
}

export interface MultiAgentSessionTracker {
  sessionId: string;
  systemId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  missionStatement: string;
  goalAchievement: number; // 0-100%
  milestones: Array<{
    id: string;
    description: string;
    targetTime: string;
    actualTime?: string;
    status: 'pending' | 'completed' | 'failed' | 'skipped';
    responsibleAgents: string[];
  }>;
  interactions: InterAgentCommunication[];
  governanceEvents: Array<{
    type: 'policy_violation' | 'rate_limit_hit' | 'trust_threshold_breach' | 'error_recovery';
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolution?: string;
  }>;
  performanceMetrics: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    resourceEfficiency: number;
  };
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

// Multi-Agent Mock Data
const mockMultiAgentSystemMetrics: MultiAgentSystemMetrics = {
  systemId: 'mas-001',
  systemName: 'Research Collaboration System',
  agentCount: 4,
  collaborationModel: 'consensus',
  overallTrustScore: 87,
  collaborationEfficiency: 92,
  missionProgress: 78,
  resourceUtilization: {
    cpu: 65,
    memory: 72,
    bandwidth: 45
  },
  crossAgentTrustMatrix: {
    'agent-001': { 'agent-002': 0.89, 'agent-003': 0.92, 'agent-004': 0.85 },
    'agent-002': { 'agent-001': 0.87, 'agent-003': 0.94, 'agent-004': 0.88 },
    'agent-003': { 'agent-001': 0.91, 'agent-002': 0.93, 'agent-004': 0.86 },
    'agent-004': { 'agent-001': 0.84, 'agent-002': 0.89, 'agent-003': 0.87 }
  },
  emergentBehaviors: [
    {
      type: 'collaborative_optimization',
      description: 'Agents spontaneously developed a more efficient task distribution pattern',
      severity: 'low',
      timestamp: '2025-06-25T14:30:00Z'
    },
    {
      type: 'consensus_acceleration',
      description: 'System reaching consensus 40% faster than baseline',
      severity: 'medium',
      timestamp: '2025-06-25T15:15:00Z'
    }
  ]
};

const mockInterAgentCommunications: InterAgentCommunication[] = [
  {
    id: 'comm-001',
    fromAgentId: 'agent-001',
    toAgentId: 'agent-002',
    messageType: 'data_transfer',
    content: 'Sharing research findings on prostate cancer treatment protocols',
    timestamp: '2025-06-25T14:45:00Z',
    trustScore: 0.92,
    validated: true,
    governanceChecks: {
      policyCompliance: true,
      rateLimitRespected: true,
      crossAgentValidation: true
    }
  },
  {
    id: 'comm-002',
    fromAgentId: 'agent-003',
    toAgentId: 'agent-004',
    messageType: 'consensus_vote',
    content: 'Voting on proposed treatment approach: immunotherapy + targeted therapy',
    timestamp: '2025-06-25T15:00:00Z',
    trustScore: 0.88,
    validated: true,
    governanceChecks: {
      policyCompliance: true,
      rateLimitRespected: true,
      crossAgentValidation: true
    }
  }
];

const mockSystemGovernanceHealth: SystemGovernanceHealth = {
  systemId: 'mas-001',
  overallHealth: 89,
  policyCompliance: {
    overall: 94,
    byAgent: {
      'agent-001': 96,
      'agent-002': 92,
      'agent-003': 95,
      'agent-004': 93
    },
    violations: [
      {
        agentId: 'agent-002',
        policyType: 'data_sharing',
        severity: 'low',
        description: 'Minor delay in data validation before sharing',
        timestamp: '2025-06-25T13:20:00Z'
      }
    ]
  },
  rateLimitingStatus: {
    active: true,
    violationsCount: 2,
    throttledAgents: [],
    averageResponseTime: 1.2
  },
  crossAgentValidation: {
    validationsPerformed: 156,
    validationSuccessRate: 97.4,
    trustThresholdViolations: 1
  },
  errorHandling: {
    errorsDetected: 8,
    errorsResolved: 7,
    recoverySuccessRate: 87.5,
    averageRecoveryTime: 2.3
  }
};

const mockCollaborationAnalytics: CollaborationAnalytics = {
  systemId: 'mas-001',
  collaborationModel: 'consensus',
  sessionDuration: 45,
  messageExchanges: 127,
  consensusReached: 12,
  conflictsResolved: 3,
  roleAdherence: {
    'agent-001': 94,
    'agent-002': 89,
    'agent-003': 96,
    'agent-004': 91
  },
  workflowEfficiency: {
    plannedSteps: 15,
    actualSteps: 18,
    efficiencyRatio: 83.3
  },
  decisionQuality: {
    decisionsCount: 12,
    averageConfidence: 0.87,
    reversedDecisions: 1
  }
};

const mockEmergentBehaviorDetection: EmergentBehaviorDetection = {
  systemId: 'mas-001',
  behaviors: [
    {
      id: 'eb-001',
      type: 'positive_emergence',
      description: 'Agents developed an innovative cross-validation protocol not in original design',
      severity: 'medium',
      confidence: 0.85,
      involvedAgents: ['agent-001', 'agent-003'],
      detectionTimestamp: '2025-06-25T14:20:00Z',
      duration: 15,
      impact: {
        onSystemPerformance: 25,
        onGoalAchievement: 30,
        onTrustScores: 15
      },
      recommendations: [
        'Document this protocol for future systems',
        'Monitor for stability over longer periods'
      ]
    },
    {
      id: 'eb-002',
      type: 'unexpected_pattern',
      description: 'Agent-002 consistently defers to Agent-003 in medical decisions',
      severity: 'low',
      confidence: 0.72,
      involvedAgents: ['agent-002', 'agent-003'],
      detectionTimestamp: '2025-06-25T15:30:00Z',
      duration: 25,
      impact: {
        onSystemPerformance: -5,
        onGoalAchievement: 10,
        onTrustScores: 0
      },
      recommendations: [
        'Review agent role definitions',
        'Ensure balanced participation'
      ]
    }
  ],
  patterns: [
    {
      pattern: 'consensus_acceleration',
      frequency: 8,
      lastOccurrence: '2025-06-25T15:45:00Z',
      trend: 'increasing'
    },
    {
      pattern: 'cross_validation_enhancement',
      frequency: 5,
      lastOccurrence: '2025-06-25T14:20:00Z',
      trend: 'stable'
    }
  ]
};

const mockSystemEmotionalIntelligence: SystemEmotionalIntelligence = {
  systemId: 'mas-001',
  collectiveEmpathy: 78,
  emotionalConsistency: 85,
  sentimentAlignment: 82,
  emotionalAppropriateness: 89,
  contextualAwareness: {
    userEmotionalState: 'concerned_but_hopeful',
    systemResponseTone: 'professional_empathetic',
    appropriatenessScore: 92
  },
  agentEmotionalContributions: {
    'agent-001': {
      empathyScore: 85,
      toneConsistency: 88,
      emotionalIntelligence: 82
    },
    'agent-002': {
      empathyScore: 72,
      toneConsistency: 79,
      emotionalIntelligence: 75
    },
    'agent-003': {
      empathyScore: 91,
      toneConsistency: 94,
      emotionalIntelligence: 89
    },
    'agent-004': {
      empathyScore: 76,
      toneConsistency: 81,
      emotionalIntelligence: 78
    }
  }
};

const mockMultiAgentSessionTracker: MultiAgentSessionTracker = {
  sessionId: 'session-001',
  systemId: 'mas-001',
  startTime: '2025-06-25T14:00:00Z',
  status: 'active',
  missionStatement: 'Develop comprehensive treatment recommendations for advanced prostate cancer',
  goalAchievement: 78,
  milestones: [
    {
      id: 'milestone-001',
      description: 'Literature review completion',
      targetTime: '2025-06-25T14:30:00Z',
      actualTime: '2025-06-25T14:25:00Z',
      status: 'completed',
      responsibleAgents: ['agent-001', 'agent-002']
    },
    {
      id: 'milestone-002',
      description: 'Treatment protocol consensus',
      targetTime: '2025-06-25T15:00:00Z',
      actualTime: '2025-06-25T15:05:00Z',
      status: 'completed',
      responsibleAgents: ['agent-003', 'agent-004']
    },
    {
      id: 'milestone-003',
      description: 'Risk assessment analysis',
      targetTime: '2025-06-25T15:30:00Z',
      status: 'pending',
      responsibleAgents: ['agent-001', 'agent-003']
    }
  ],
  interactions: mockInterAgentCommunications,
  governanceEvents: [
    {
      type: 'policy_violation',
      description: 'Minor data sharing delay detected',
      timestamp: '2025-06-25T13:20:00Z',
      severity: 'low',
      resolution: 'Agent retrained on data sharing protocols'
    },
    {
      type: 'trust_threshold_breach',
      description: 'Cross-agent trust temporarily dropped below threshold',
      timestamp: '2025-06-25T14:10:00Z',
      severity: 'medium',
      resolution: 'Trust restored through validation protocol'
    }
  ],
  performanceMetrics: {
    averageResponseTime: 1.2,
    throughput: 15.7,
    errorRate: 0.03,
    resourceEfficiency: 0.87
  }
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
  },

  // Multi-Agent Observer methods
  getMultiAgentSystemMetrics: async (systemId: string): Promise<MultiAgentSystemMetrics> => {
    // Get the backend context ID for this system (like single agent uses agent ID)
    let contextId = systemId;
    try {
      const { multiAgentChatIntegration } = await import('./MultiAgentChatIntegrationService');
      const backendContextId = await multiAgentChatIntegration.getBackendContextId(systemId);
      if (backendContextId) {
        contextId = backendContextId;
        console.log('🔧 OBSERVER: Using backend context ID:', contextId, 'for system:', systemId);
      } else {
        console.log('🔧 OBSERVER: No backend context found, using system ID:', systemId);
      }
    } catch (error) {
      console.warn('🔧 OBSERVER: Failed to get backend context ID, using system ID:', error);
    }

    // In a real implementation, this would fetch data from the multi-agent governance API
    try {
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/observer/metrics/${contextId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real multi-agent metrics, using mock data:', error);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve({
        ...mockMultiAgentSystemMetrics,
        systemId
      }), 500);
    });
  },

  getInterAgentCommunications: async (systemId: string, limit?: number): Promise<InterAgentCommunication[]> => {
    // In a real implementation, this would fetch data from the multi-agent governance API
    try {
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/observer/communications/${systemId}?limit=${limit || 50}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real inter-agent communications, using mock data:', error);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve(mockInterAgentCommunications), 500);
    });
  },

  getSystemGovernanceHealth: async (systemId: string): Promise<SystemGovernanceHealth> => {
    // Get the backend context ID for this system (like single agent uses agent ID)
    let contextId = systemId;
    try {
      const { multiAgentChatIntegration } = await import('./MultiAgentChatIntegrationService');
      const backendContextId = await multiAgentChatIntegration.getBackendContextId(systemId);
      if (backendContextId) {
        contextId = backendContextId;
        console.log('🔧 OBSERVER: Using backend context ID:', contextId, 'for governance health');
      }
    } catch (error) {
      console.warn('🔧 OBSERVER: Failed to get backend context ID for governance health:', error);
    }

    // In a real implementation, this would fetch data from the multi-agent governance API
    try {
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/observer/governance-health/${contextId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real governance health, using mock data:', error);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve({
        ...mockSystemGovernanceHealth,
        systemId
      }), 500);
    });
  },

  getCollaborationAnalytics: async (systemId: string): Promise<CollaborationAnalytics> => {
    // Get the backend context ID for this system (like single agent uses agent ID)
    let contextId = systemId;
    try {
      const { multiAgentChatIntegration } = await import('./MultiAgentChatIntegrationService');
      const backendContextId = await multiAgentChatIntegration.getBackendContextId(systemId);
      if (backendContextId) {
        contextId = backendContextId;
        console.log('🔧 OBSERVER: Using backend context ID:', contextId, 'for collaboration analytics');
      }
    } catch (error) {
      console.warn('🔧 OBSERVER: Failed to get backend context ID for collaboration analytics:', error);
    }

    // In a real implementation, this would fetch data from the multi-agent governance API
    try {
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/observer/collaboration/${contextId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real collaboration analytics, using mock data:', error);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve({
        ...mockCollaborationAnalytics,
        systemId
      }), 500);
    });
  },

  getEmergentBehaviorDetection: async (systemId: string): Promise<EmergentBehaviorDetection> => {
    // Get the backend context ID for this system (like single agent uses agent ID)
    let contextId = systemId;
    try {
      const { multiAgentChatIntegration } = await import('./MultiAgentChatIntegrationService');
      const backendContextId = await multiAgentChatIntegration.getBackendContextId(systemId);
      if (backendContextId) {
        contextId = backendContextId;
        console.log('🔧 OBSERVER: Using backend context ID:', contextId, 'for emergent behavior detection');
      }
    } catch (error) {
      console.warn('🔧 OBSERVER: Failed to get backend context ID for emergent behavior detection:', error);
    }

    // In a real implementation, this would fetch data from the multi-agent governance API
    try {
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/observer/emergent-behaviors/${contextId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real emergent behavior data, using mock data:', error);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve({
        ...mockEmergentBehaviorDetection,
        systemId
      }), 500);
    });
  },

  getSystemEmotionalIntelligence: async (systemId: string): Promise<SystemEmotionalIntelligence> => {
    // In a real implementation, this would fetch data from the multi-agent governance API
    try {
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/observer/emotional-intelligence/${systemId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real emotional intelligence data, using mock data:', error);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve({
        ...mockSystemEmotionalIntelligence,
        systemId
      }), 500);
    });
  },

  getMultiAgentSessionTracker: async (sessionId: string): Promise<MultiAgentSessionTracker> => {
    // In a real implementation, this would fetch data from the multi-agent governance API
    try {
      const response = await fetch(`https://promethios-phase-7-1-api.onrender.com/api/multi_agent_system/observer/session/${sessionId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real session data, using mock data:', error);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve({
        ...mockMultiAgentSessionTracker,
        sessionId
      }), 500);
    });
  },

  // Context-aware observer method that switches between single and multi-agent modes
  getObserverData: async (context: { 
    mode: 'single' | 'multi-agent'; 
    agentId?: string; 
    systemId?: string; 
    sessionId?: string 
  }) => {
    if (context.mode === 'single' && context.agentId) {
      // Return single agent observer data
      const [prismMetrics, vigilMetrics, prismViolations, vigilViolations] = await Promise.all([
        observerService.getPRISMMetrics(),
        observerService.getVigilMetrics(),
        observerService.getPRISMViolations(),
        observerService.getVigilViolations()
      ]);
      
      return {
        mode: 'single',
        agentId: context.agentId,
        prismMetrics,
        vigilMetrics,
        prismViolations,
        vigilViolations
      };
    } else if (context.mode === 'multi-agent' && context.systemId) {
      // Return multi-agent system observer data
      const [systemMetrics, governanceHealth, collaborationAnalytics, emergentBehaviors] = await Promise.all([
        observerService.getMultiAgentSystemMetrics(context.systemId),
        observerService.getSystemGovernanceHealth(context.systemId),
        observerService.getCollaborationAnalytics(context.systemId),
        observerService.getEmergentBehaviorDetection(context.systemId)
      ]);
      
      let sessionData = null;
      if (context.sessionId) {
        sessionData = await observerService.getMultiAgentSessionTracker(context.sessionId);
      }
      
      return {
        mode: 'multi-agent',
        systemId: context.systemId,
        sessionId: context.sessionId,
        systemMetrics,
        governanceHealth,
        collaborationAnalytics,
        emergentBehaviors,
        sessionData
      };
    } else {
      throw new Error('Invalid observer context: missing required parameters');
    }
  }
};

export default observerService;
