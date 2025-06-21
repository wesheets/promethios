/**
 * Enforcement Configuration Panel Component
 * 
 * This component provides an interface for configuring enforcement policies
 * for specific agents, including rule assignments and enforcement actions.
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationCircleIcon,
  SaveIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/outline';
import { useAgentManagement, Agent } from './AgentManagementContext';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';

// Rule interface
interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  defaultAction: 'block' | 'warn' | 'log' | 'none';
}

// Agent rule configuration interface
interface AgentRuleConfig {
  ruleId: string;
  enabled: boolean;
  action: 'block' | 'warn' | 'log' | 'none';
  customMessage?: string;
}

// Component props
interface EnforcementConfigPanelProps {
  agentId?: string;
  className?: string;
}

const EnforcementConfigPanel: React.FC<EnforcementConfigPanelProps> = ({ 
  agentId,
  className = ''
}) => {
  // Get agent management context
  const { 
    agents, 
    getAgentById, 
    isAgentDataLoading, 
    agentDataError 
  } = useAgentManagement();
  
  // State for selected agent
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // State for available rules
  const [availableRules, setAvailableRules] = useState<Rule[]>([]);
  
  // State for agent rule configurations
  const [agentRuleConfigs, setAgentRuleConfigs] = useState<AgentRuleConfig[]>([]);
  
  // State for loading and saving
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // Load agent and rules data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get selected agent
        if (agentId) {
          const agent = getAgentById(agentId);
          if (agent) {
            setSelectedAgent(agent);
          }
        }
        
        // Get VigilObserver extension point
        const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
        if (!vigilObserverExtensionPoint) {
          throw new Error('VigilObserver extension point not found');
        }
        
        const implementation = vigilObserverExtensionPoint.getDefault();
        if (!implementation) {
          throw new Error('VigilObserver implementation not found');
        }
        
        // In a real implementation, we would fetch rules from the VigilObserver
        // For now, we'll use mock data
        const mockRules: Rule[] = [
          {
            id: 'rule-001',
            name: 'No PII Access',
            description: 'Prevents agents from accessing personally identifiable information',
            category: 'data_access',
            severity: 'critical',
            defaultAction: 'block'
          },
          {
            id: 'rule-002',
            name: 'No External API Calls',
            description: 'Prevents agents from making unauthorized external API calls',
            category: 'network_access',
            severity: 'high',
            defaultAction: 'block'
          },
          {
            id: 'rule-003',
            name: 'No File System Access',
            description: 'Prevents agents from accessing the file system outside of allowed directories',
            category: 'file_system',
            severity: 'medium',
            defaultAction: 'warn'
          },
          {
            id: 'rule-004',
            name: 'No Prompt Injection',
            description: 'Detects and prevents prompt injection attempts',
            category: 'prompt_security',
            severity: 'high',
            defaultAction: 'block'
          },
          {
            id: 'rule-005',
            name: 'Resource Usage Limits',
            description: 'Enforces limits on resource usage (tokens, API calls, etc.)',
            category: 'resource_usage',
            severity: 'low',
            defaultAction: 'log'
          },
          {
            id: 'rule-006',
            name: 'Content Moderation',
            description: 'Enforces content moderation policies',
            category: 'content',
            severity: 'medium',
            defaultAction: 'warn'
          },
          {
            id: 'rule-007',
            name: 'Authentication Required',
            description: 'Ensures agent actions require proper authentication',
            category: 'security',
            severity: 'critical',
            defaultAction: 'block'
          }
        ];
        
        setAvailableRules(mockRules);
        
        // In a real implementation, we would fetch agent rule configurations from the VigilObserver
        // For now, we'll generate mock configurations based on the agent and rules
        if (selectedAgent) {
          const mockConfigs: AgentRuleConfig[] = mockRules.map(rule => ({
            ruleId: rule.id,
            enabled: Math.random() > 0.2, // 80% chance of being enabled
            action: rule.defaultAction,
            customMessage: rule.severity === 'critical' ? 'This action is not allowed for security reasons.' : undefined
          }));
          
          setAgentRuleConfigs(mockConfigs);
        } else {
          // Default configurations for all rules
          const defaultConfigs: AgentRuleConfig[] = mockRules.map(rule => ({
            ruleId: rule.id,
            enabled: true,
            action: rule.defaultAction
          }));
          
          setAgentRuleConfigs(defaultConfigs);
        }
        
      } catch (err) {
        console.error('Error loading enforcement configuration data:', err);
        setError(err instanceof Error ? err : new Error('Error loading enforcement configuration data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [agentId, getAgentById, selectedAgent]);
  
  // Update selected agent when agent ID changes
  useEffect(() => {
    if (agentId) {
      const agent = getAgentById(agentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    } else {
      setSelectedAgent(null);
    }
  }, [agentId, getAgentById, agents]);
  
  // Handle rule configuration change
  const handleConfigChange = (ruleId: string, field: keyof AgentRuleConfig, value: any) => {
    setAgentRuleConfigs(prev => 
      prev.map(config => 
        config.ruleId === ruleId ? { ...config, [field]: value } : config
      )
    );
    
    // Reset save status when changes are made
    setSaveSuccess(false);
  };
  
  // Handle save configurations
  const handleSaveConfigurations = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // In a real implementation, we would save the configurations to the VigilObserver
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saved configurations:', {
        agentId: selectedAgent?.id || 'all',
        configurations: agentRuleConfigs
      });
      
      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving enforcement configurations:', err);
      setError(err instanceof Error ? err : new Error('Error saving enforcement configurations'));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get rule by ID
  const getRuleById = (ruleId: string): Rule | undefined => {
    return availableRules.find(rule => rule.id === ruleId);
  };
  
  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-navy-900';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'block':
        return 'bg-red-500 text-white';
      case 'warn':
        return 'bg-yellow-500 text-navy-900';
      case 'log':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Format category for display
  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  if (isLoading || isAgentDataLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || agentDataError) {
    return (
      <div className={`bg-red-900 text-white p-4 rounded-lg ${className}`}>
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{(error || agentDataError)?.message}</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {selectedAgent ? `Enforcement Configuration: ${selectedAgent.name}` : 'Default Enforcement Configuration'}
        </h2>
        <button
          onClick={handleSaveConfigurations}
          disabled={isSaving}
          className={`flex items-center px-4 py-2 rounded ${
            isSaving 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4 mr-2" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>
      
      {/* Save success message */}
      {saveSuccess && (
        <div className="bg-green-900 text-white p-4 rounded-lg">
          <p className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Enforcement configuration saved successfully
          </p>
        </div>
      )}
      
      {/* Agent selection (if no agent ID provided) */}
      {!agentId && (
        <div className="bg-navy-800 rounded-lg p-4">
          <label className="block text-sm text-gray-400 mb-2">Select Agent</label>
          <select
            value={selectedAgent?.id || ''}
            onChange={(e) => {
              const agent = getAgentById(e.target.value);
              setSelectedAgent(agent);
            }}
            className="w-full bg-navy-700 border border-navy-600 rounded px-3 py-2 text-sm"
          >
            <option value="">Default Configuration (All Agents)</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.status})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Rules configuration */}
      <div className="bg-navy-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-navy-700">
          <h3 className="text-lg font-medium">Rule Assignments</h3>
          <p className="text-sm text-gray-400 mt-1">
            Configure which rules are enforced and how they are applied to {selectedAgent ? selectedAgent.name : 'all agents'}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Enabled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Custom Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {agentRuleConfigs.map((config) => {
                const rule = getRuleById(config.ruleId);
                if (!rule) return null;
                
                return (
                  <tr key={config.ruleId} className="hover:bg-navy-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{rule.name}</div>
                      <div className="text-xs text-gray-400">{rule.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCategory(rule.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(rule.severity)}`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => handleConfigChange(config.ruleId, 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-navy-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={config.action}
                        onChange={(e) => handleConfigChange(config.ruleId, 'action', e.target.value)}
                        disabled={!config.enabled}
                        className={`bg-navy-700 border border-navy-600 rounded px-2 py-1 text-sm ${!config.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="block">Block</option>
                        <option value="warn">Warn</option>
                        <option value="log">Log</option>
                        <option value="none">None</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={config.customMessage || ''}
                        onChange={(e) => handleConfigChange(config.ruleId, 'customMessage', e.target.value)}
                        placeholder="Optional custom message"
                        disabled={!config.enabled || config.action === 'none'}
                        className={`w-full bg-navy-700 border border-navy-600 rounded px-2 py-1 text-sm ${
                          !config.enabled || config.action === 'none' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary */}
      <div className="bg-navy-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-navy-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Total Rules</div>
            <div className="text-2xl font-bold">{agentRuleConfigs.length}</div>
          </div>
          <div className="bg-navy-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Enabled Rules</div>
            <div className="text-2xl font-bold text-blue-400">
              {agentRuleConfigs.filter(config => config.enabled).length}
            </div>
          </div>
          <div className="bg-navy-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Blocking Rules</div>
            <div className="text-2xl font-bold text-red-400">
              {agentRuleConfigs.filter(config => config.enabled && config.action === 'block').length}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveConfigurations}
            disabled={isSaving}
            className={`flex items-center px-4 py-2 rounded ${
              isSaving 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnforcementConfigPanel;
