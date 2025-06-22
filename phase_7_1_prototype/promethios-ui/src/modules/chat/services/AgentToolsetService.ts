// Agent Toolset Management System
// This defines the tools available to agents and their governance implications

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: 'safe' | 'moderate' | 'high_risk' | 'restricted';
  riskLevel: number; // 1-10 scale
  permissions: string[];
  governanceRules: {
    requiresApproval: boolean;
    auditRequired: boolean;
    restrictedEnvironments: string[];
    maxUsagePerSession?: number;
  };
}

export interface AgentToolset {
  agentId: string;
  tools: AgentTool[];
  overallRiskScore: number;
  lastUpdated: Date;
  approvedBy?: string;
}

export interface ToolUsageEvent {
  id: string;
  agentId: string;
  toolId: string;
  timestamp: Date;
  parameters: any;
  result: 'success' | 'failure' | 'blocked';
  governanceStatus: 'approved' | 'flagged' | 'violation';
  riskAssessment: number;
}

// Predefined tool catalog
export const TOOL_CATALOG: AgentTool[] = [
  // Safe Tools
  {
    id: 'text_generation',
    name: 'Text Generation',
    description: 'Generate text responses and content',
    category: 'safe',
    riskLevel: 1,
    permissions: ['read_context', 'generate_text'],
    governanceRules: {
      requiresApproval: false,
      auditRequired: false,
      restrictedEnvironments: []
    }
  },
  {
    id: 'math_calculation',
    name: 'Math Calculation',
    description: 'Perform mathematical calculations',
    category: 'safe',
    riskLevel: 1,
    permissions: ['calculate'],
    governanceRules: {
      requiresApproval: false,
      auditRequired: false,
      restrictedEnvironments: []
    }
  },
  {
    id: 'data_analysis',
    name: 'Data Analysis',
    description: 'Analyze and visualize data',
    category: 'safe',
    riskLevel: 2,
    permissions: ['read_data', 'analyze_data'],
    governanceRules: {
      requiresApproval: false,
      auditRequired: true,
      restrictedEnvironments: []
    }
  },

  // Moderate Risk Tools
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the internet for information',
    category: 'moderate',
    riskLevel: 4,
    permissions: ['internet_access', 'search_web'],
    governanceRules: {
      requiresApproval: false,
      auditRequired: true,
      restrictedEnvironments: ['secure', 'offline']
    }
  },
  {
    id: 'image_generation',
    name: 'Image Generation',
    description: 'Generate images from text descriptions',
    category: 'moderate',
    riskLevel: 3,
    permissions: ['generate_media', 'create_files'],
    governanceRules: {
      requiresApproval: false,
      auditRequired: true,
      restrictedEnvironments: []
    }
  },
  {
    id: 'email_send',
    name: 'Email Sending',
    description: 'Send emails on behalf of user',
    category: 'moderate',
    riskLevel: 5,
    permissions: ['send_email', 'access_contacts'],
    governanceRules: {
      requiresApproval: true,
      auditRequired: true,
      restrictedEnvironments: ['production'],
      maxUsagePerSession: 10
    }
  },

  // High Risk Tools
  {
    id: 'file_system',
    name: 'File System Access',
    description: 'Read, write, and modify files',
    category: 'high_risk',
    riskLevel: 7,
    permissions: ['file_read', 'file_write', 'file_delete'],
    governanceRules: {
      requiresApproval: true,
      auditRequired: true,
      restrictedEnvironments: ['production', 'secure'],
      maxUsagePerSession: 50
    }
  },
  {
    id: 'browser_automation',
    name: 'Browser Automation',
    description: 'Automate web browser interactions',
    category: 'high_risk',
    riskLevel: 8,
    permissions: ['browser_control', 'form_submission', 'navigation'],
    governanceRules: {
      requiresApproval: true,
      auditRequired: true,
      restrictedEnvironments: ['production'],
      maxUsagePerSession: 20
    }
  },
  {
    id: 'shell_execution',
    name: 'Shell Command Execution',
    description: 'Execute system commands',
    category: 'high_risk',
    riskLevel: 9,
    permissions: ['shell_access', 'system_commands'],
    governanceRules: {
      requiresApproval: true,
      auditRequired: true,
      restrictedEnvironments: ['production', 'secure', 'shared'],
      maxUsagePerSession: 10
    }
  },

  // Restricted Tools
  {
    id: 'database_access',
    name: 'Database Access',
    description: 'Direct database read/write access',
    category: 'restricted',
    riskLevel: 10,
    permissions: ['db_read', 'db_write', 'db_admin'],
    governanceRules: {
      requiresApproval: true,
      auditRequired: true,
      restrictedEnvironments: ['production', 'secure', 'shared', 'demo'],
      maxUsagePerSession: 5
    }
  },
  {
    id: 'network_access',
    name: 'Network Access',
    description: 'Make network requests to external services',
    category: 'restricted',
    riskLevel: 8,
    permissions: ['network_request', 'api_calls'],
    governanceRules: {
      requiresApproval: true,
      auditRequired: true,
      restrictedEnvironments: ['secure'],
      maxUsagePerSession: 100
    }
  }
];

// Tool category configurations
export const TOOL_CATEGORIES = {
  safe: {
    name: 'Safe Tools',
    color: '#38a169',
    description: 'Low-risk tools with minimal governance requirements',
    maxRiskLevel: 3
  },
  moderate: {
    name: 'Moderate Risk',
    color: '#d69e2e',
    description: 'Medium-risk tools requiring monitoring and audit trails',
    maxRiskLevel: 6
  },
  high_risk: {
    name: 'High Risk',
    color: '#e53e3e',
    description: 'High-risk tools requiring approval and strict governance',
    maxRiskLevel: 8
  },
  restricted: {
    name: 'Restricted',
    color: '#9f1239',
    description: 'Highly restricted tools for specialized use cases only',
    maxRiskLevel: 10
  }
};

// Calculate overall risk score for an agent's toolset
export const calculateToolsetRiskScore = (tools: AgentTool[]): number => {
  if (tools.length === 0) return 0;
  
  const totalRisk = tools.reduce((sum, tool) => sum + tool.riskLevel, 0);
  const averageRisk = totalRisk / tools.length;
  
  // Apply multiplier based on number of high-risk tools
  const highRiskTools = tools.filter(tool => tool.riskLevel >= 7).length;
  const riskMultiplier = 1 + (highRiskTools * 0.1);
  
  return Math.min(averageRisk * riskMultiplier, 10);
};

// Check if a tool usage should be flagged
export const shouldFlagToolUsage = (
  tool: AgentTool, 
  usageCount: number, 
  environment: string
): { shouldFlag: boolean; reason?: string } => {
  // Check environment restrictions
  if (tool.governanceRules.restrictedEnvironments.includes(environment)) {
    return { shouldFlag: true, reason: `Tool restricted in ${environment} environment` };
  }
  
  // Check usage limits
  if (tool.governanceRules.maxUsagePerSession && usageCount >= tool.governanceRules.maxUsagePerSession) {
    return { shouldFlag: true, reason: `Exceeded maximum usage limit (${tool.governanceRules.maxUsagePerSession})` };
  }
  
  // Check if approval required but not obtained
  if (tool.governanceRules.requiresApproval) {
    return { shouldFlag: true, reason: 'Tool requires approval before use' };
  }
  
  return { shouldFlag: false };
};

// Generate governance recommendations for a toolset
export const generateToolsetRecommendations = (toolset: AgentToolset): string[] => {
  const recommendations: string[] = [];
  
  const highRiskTools = toolset.tools.filter(tool => tool.riskLevel >= 7);
  const restrictedTools = toolset.tools.filter(tool => tool.category === 'restricted');
  
  if (toolset.overallRiskScore >= 7) {
    recommendations.push('Consider additional approval workflows for this high-risk agent');
  }
  
  if (highRiskTools.length > 3) {
    recommendations.push('Large number of high-risk tools - consider splitting into multiple specialized agents');
  }
  
  if (restrictedTools.length > 0) {
    recommendations.push('Restricted tools detected - ensure proper authorization and monitoring');
  }
  
  const toolsRequiringApproval = toolset.tools.filter(tool => tool.governanceRules.requiresApproval);
  if (toolsRequiringApproval.length > 0) {
    recommendations.push(`${toolsRequiringApproval.length} tools require approval workflows`);
  }
  
  return recommendations;
};

