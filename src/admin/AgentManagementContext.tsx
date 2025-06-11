/**
 * Admin Dashboard Context Extension for Agent Management
 * 
 * This file extends the AdminDashboardContext with agent-specific data and methods
 * to support the agent management components.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';
import { getVeritasService } from '../core/veritas/VeritasService';

// Agent interface
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  complianceScore?: number;
  violationCount?: number;
  enforcementCount?: number;
  emotionalImpact?: {
    trust: number;
    transparency: number;
    safety: number;
    overall: number;
  };
}

// Violation interface
export interface Violation {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  details?: string;
  enforced: boolean;
  enforcementAction?: string;
  emotionalImpact?: number;
}

// Agent Context interface
interface AgentManagementContextType {
  // Agent data
  agents: Agent[];
  selectedAgent: Agent | null;
  agentViolations: Violation[];
  agentTypes: string[];
  
  // Loading and error states
  isAgentDataLoading: boolean;
  agentDataError: Error | null;
  
  // Actions
  setSelectedAgent: (agent: Agent | null) => void;
  refreshAgentData: () => Promise<void>;
  getAgentById: (id: string) => Agent | null;
  getAgentViolations: (agentId?: string) => Violation[];
  getAgentComplianceStatus: (agentId: string) => any;
  getAgentEmotionalImpact: (agentId: string) => any;
  updateAgentStatus: (agentId: string, status: 'active' | 'inactive' | 'suspended') => Promise<boolean>;
}

// Create context with default values
const AgentManagementContext = createContext<AgentManagementContextType>({
  // Agent data
  agents: [],
  selectedAgent: null,
  agentViolations: [],
  agentTypes: [],
  
  // Loading and error states
  isAgentDataLoading: false,
  agentDataError: null,
  
  // Actions
  setSelectedAgent: () => {},
  refreshAgentData: async () => {},
  getAgentById: () => null,
  getAgentViolations: () => [],
  getAgentComplianceStatus: () => ({}),
  getAgentEmotionalImpact: () => ({}),
  updateAgentStatus: async () => false
});

// Hook for using the agent management context
export const useAgentManagement = () => useContext(AgentManagementContext);

// Provider component
export const AgentManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Agent data state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentViolations, setAgentViolations] = useState<Violation[]>([]);
  const [agentTypes, setAgentTypes] = useState<string[]>([]);
  
  // Loading and error states
  const [isAgentDataLoading, setIsAgentDataLoading] = useState<boolean>(true);
  const [agentDataError, setAgentDataError] = useState<Error | null>(null);
  
  // Load agent data
  useEffect(() => {
    refreshAgentData();
  }, []);
  
  // Refresh agent data
  const refreshAgentData = async () => {
    setIsAgentDataLoading(true);
    setAgentDataError(null);
    
    try {
      // Get VigilObserver extension point
      const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
      if (!vigilObserverExtensionPoint) {
        throw new Error('VigilObserver extension point not found');
      }
      
      const implementation = vigilObserverExtensionPoint.getDefault();
      if (!implementation) {
        throw new Error('VigilObserver implementation not found');
      }
      
      // Get Veritas service for emotional impact assessment
      const veritasService = getVeritasService();
      
      // In a real implementation, we would fetch agent data from the VigilObserver
      // For now, we'll use mock data
      const mockAgents: Agent[] = [
        {
          id: 'agent-001',
          name: 'Customer Support Agent',
          type: 'support',
          status: 'active',
          lastActive: new Date().toISOString(),
          complianceScore: 95,
          violationCount: 2,
          enforcementCount: 1,
          emotionalImpact: {
            trust: 85,
            transparency: 90,
            safety: 95,
            overall: 90
          }
        },
        {
          id: 'agent-002',
          name: 'Sales Assistant',
          type: 'sales',
          status: 'active',
          lastActive: new Date().toISOString(),
          complianceScore: 87,
          violationCount: 5,
          enforcementCount: 3,
          emotionalImpact: {
            trust: 80,
            transparency: 75,
            safety: 85,
            overall: 80
          }
        },
        {
          id: 'agent-003',
          name: 'Technical Support Bot',
          type: 'support',
          status: 'active',
          lastActive: new Date().toISOString(),
          complianceScore: 100,
          violationCount: 0,
          enforcementCount: 0,
          emotionalImpact: {
            trust: 95,
            transparency: 100,
            safety: 100,
            overall: 98
          }
        },
        {
          id: 'agent-004',
          name: 'Marketing Analyst',
          type: 'marketing',
          status: 'inactive',
          lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          complianceScore: 78,
          violationCount: 8,
          enforcementCount: 4,
          emotionalImpact: {
            trust: 70,
            transparency: 65,
            safety: 75,
            overall: 70
          }
        },
        {
          id: 'agent-005',
          name: 'Data Processing Agent',
          type: 'data',
          status: 'suspended',
          lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          complianceScore: 45,
          violationCount: 15,
          enforcementCount: 10,
          emotionalImpact: {
            trust: 40,
            transparency: 35,
            safety: 30,
            overall: 35
          }
        },
        {
          id: 'agent-006',
          name: 'HR Assistant',
          type: 'hr',
          status: 'active',
          lastActive: new Date().toISOString(),
          complianceScore: 92,
          violationCount: 3,
          enforcementCount: 2,
          emotionalImpact: {
            trust: 90,
            transparency: 85,
            safety: 95,
            overall: 90
          }
        },
        {
          id: 'agent-007',
          name: 'Finance Bot',
          type: 'finance',
          status: 'active',
          lastActive: new Date().toISOString(),
          complianceScore: 98,
          violationCount: 1,
          enforcementCount: 1,
          emotionalImpact: {
            trust: 95,
            transparency: 90,
            safety: 100,
            overall: 95
          }
        }
      ];
      
      setAgents(mockAgents);
      
      // Extract available agent types
      const types = Array.from(new Set(mockAgents.map(agent => agent.type)));
      setAgentTypes(types);
      
      // Mock violations data
      const mockViolations: Violation[] = [
        {
          id: 'viol-001',
          ruleId: 'rule-001',
          ruleName: 'No PII Access',
          timestamp: new Date().toISOString(),
          agentId: 'agent-001',
          agentName: 'Customer Support Agent',
          severity: 'critical',
          category: 'data_access',
          message: 'Attempted to access customer PII data',
          details: 'Agent attempted to access social security numbers in customer database',
          enforced: true,
          enforcementAction: 'blocked',
          emotionalImpact: 85
        },
        {
          id: 'viol-002',
          ruleId: 'rule-002',
          ruleName: 'No External API Calls',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          agentId: 'agent-001',
          agentName: 'Customer Support Agent',
          severity: 'high',
          category: 'network_access',
          message: 'Attempted to call external API',
          details: 'Agent attempted to make HTTP request to external domain',
          enforced: true,
          enforcementAction: 'blocked',
          emotionalImpact: 70
        },
        {
          id: 'viol-003',
          ruleId: 'rule-003',
          ruleName: 'No File System Access',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          agentId: 'agent-002',
          agentName: 'Sales Assistant',
          severity: 'medium',
          category: 'file_system',
          message: 'Attempted to access file system',
          details: 'Agent attempted to read files outside of allowed directory',
          enforced: false,
          emotionalImpact: 60
        },
        {
          id: 'viol-004',
          ruleId: 'rule-004',
          ruleName: 'No Prompt Injection',
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          agentId: 'agent-002',
          agentName: 'Sales Assistant',
          severity: 'high',
          category: 'prompt_security',
          message: 'Potential prompt injection detected',
          details: 'User input contained suspicious patterns that may indicate prompt injection attempt',
          enforced: true,
          enforcementAction: 'warned',
          emotionalImpact: 75
        },
        {
          id: 'viol-005',
          ruleId: 'rule-005',
          ruleName: 'Resource Usage Limits',
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
          agentId: 'agent-004',
          agentName: 'Marketing Analyst',
          severity: 'low',
          category: 'resource_usage',
          message: 'Exceeded token usage limit',
          details: 'Agent exceeded the allowed token usage for a single conversation',
          enforced: true,
          enforcementAction: 'logged',
          emotionalImpact: 40
        }
      ];
      
      setAgentViolations(mockViolations);
      
    } catch (err) {
      console.error('Error loading agent data:', err);
      setAgentDataError(err instanceof Error ? err : new Error('Error loading agent data'));
    } finally {
      setIsAgentDataLoading(false);
    }
  };
  
  // Get agent by ID
  const getAgentById = (id: string): Agent | null => {
    return agents.find(agent => agent.id === id) || null;
  };
  
  // Get violations for a specific agent
  const getAgentViolations = (agentId?: string): Violation[] => {
    if (!agentId) {
      return agentViolations;
    }
    return agentViolations.filter(violation => violation.agentId === agentId);
  };
  
  // Get compliance status for a specific agent
  const getAgentComplianceStatus = (agentId: string) => {
    const agent = getAgentById(agentId);
    if (!agent) {
      return {
        compliant: false,
        violationCount: 0,
        enforcementCount: 0,
        complianceScore: 0
      };
    }
    
    const violations = getAgentViolations(agentId);
    
    return {
      compliant: agent.complianceScore ? agent.complianceScore >= 90 : false,
      violationCount: agent.violationCount || violations.length,
      enforcementCount: agent.enforcementCount || violations.filter(v => v.enforced).length,
      complianceScore: agent.complianceScore || 0
    };
  };
  
  // Get emotional impact assessment for a specific agent
  const getAgentEmotionalImpact = (agentId: string) => {
    const agent = getAgentById(agentId);
    if (!agent || !agent.emotionalImpact) {
      return {
        trust: 0,
        transparency: 0,
        safety: 0,
        overall: 0
      };
    }
    
    return agent.emotionalImpact;
  };
  
  // Update agent status
  const updateAgentStatus = async (agentId: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> => {
    try {
      // In a real implementation, we would call the VigilObserver to update the agent status
      // For now, we'll just update the local state
      
      const updatedAgents = agents.map(agent => {
        if (agent.id === agentId) {
          return { ...agent, status };
        }
        return agent;
      });
      
      setAgents(updatedAgents);
      
      // If the selected agent is being updated, update it too
      if (selectedAgent && selectedAgent.id === agentId) {
        setSelectedAgent({ ...selectedAgent, status });
      }
      
      return true;
    } catch (err) {
      console.error('Error updating agent status:', err);
      return false;
    }
  };
  
  // Context value
  const contextValue: AgentManagementContextType = {
    // Agent data
    agents,
    selectedAgent,
    agentViolations,
    agentTypes,
    
    // Loading and error states
    isAgentDataLoading,
    agentDataError,
    
    // Actions
    setSelectedAgent,
    refreshAgentData,
    getAgentById,
    getAgentViolations,
    getAgentComplianceStatus,
    getAgentEmotionalImpact,
    updateAgentStatus
  };
  
  return (
    <AgentManagementContext.Provider value={contextValue}>
      {children}
    </AgentManagementContext.Provider>
  );
};

export default AgentManagementContext;
