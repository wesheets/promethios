/**
 * Promethios LLM Service for Frontend Integration
 * 
 * Provides frontend interface for Promethios Promethios LLM functionality
 * with immediate API access and metrics tracking.
 */

import { auth } from '../firebase/config';
import { prometheosLLMExtension } from '../extensions/PrometheosLLMExtension';
import { useAgentCreatedHook } from '../hooks/LifecycleHooks';

export interface PrometheosLLMAgent {
  agentId: string;
  userId: string;
  name: string;
  description: string;
  config: {
    modelName: string;
    modelVersion: string;
    baseModel: string;
    datasetCount: number;
    governanceLevel: string;
    trustThreshold: number;
    complianceMode: string;
    responseStyle: string;
    maxTokens: number;
    temperature: number;
  };
  governance: {
    nativeGovernance: boolean;
    bypassProof: boolean;
    constitutionalCompliance: boolean;
    realTimeMonitoring: boolean;
  };
  metrics: {
    totalInteractions: number;
    trustScore: number;
    complianceRate: number;
    averageResponseTime: number;
    violationCount: number;
  };
  status: 'created' | 'active' | 'deployed' | 'inactive';
  createdAt: string;
  lastActiveAt?: string;
  
  // API Access Information
  apiAccess: {
    immediate: {
      chatEndpoint: string;
      testingEndpoint: string;
      metricsEndpoint: string;
    };
    production?: {
      publicEndpoint: string;
      apiKey: string;
      documentation: string;
    };
  };
}

export interface PrometheosLLMResponse {
  agentId: string;
  messageId: string;
  timestamp: string;
  input: string;
  response: string;
  governanceMetrics: {
    trustScore: number;
    complianceRate: number;
    policyViolations: string[];
    constitutionalAdherence: number;
    responseTimeMs: number;
    governanceInterventions: number;
  };
  modelInfo: {
    model: string;
    version: string;
    governance: string;
    datasetVersion: string;
  };
}

export interface PrometheosLLMDeployment {
  deploymentId: string;
  productionAgentId: string;
  deploymentUrl: string;
  apiKey: string;
  status: 'deploying' | 'deployed' | 'failed';
  createdAt: string;
  features: {
    loadBalancing: boolean;
    rateLimiting: boolean;
    monitoring: boolean;
    slaGuarantees: boolean;
  };
}

class PrometheosLLMService {
  private baseUrl: string;
  private agentApiUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8001';
    this.agentApiUrl = process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8002';
  }

  /**
   * Create a new Promethios LLM agent with immediate API access
   */
  async createAgent(config: {
    name: string;
    description: string;
    responseStyle: string;
    complianceMode: string;
    trustThreshold: number;
    maxTokens: number;
    temperature: number;
  }): Promise<PrometheosLLMAgent> {
    try {
      console.log('🧠 Creating Promethios LLM agent with immediate API access');

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create agent using extension for proper persistence
      const agent = await prometheosLLMExtension.execute(
        { userId: user.uid },
        'createAgent',
        {
          userId: user.uid,
          name: config.name,
          description: config.description,
          config: {
            modelName: 'Lambda-7B',
            modelVersion: '1.0.0',
            baseModel: 'Ultimate Governance LLM',
            datasetCount: 1000000,
            governanceLevel: 'constitutional',
            trustThreshold: config.trustThreshold,
            complianceMode: config.complianceMode,
            responseStyle: config.responseStyle,
            maxTokens: config.maxTokens,
            temperature: config.temperature
          }
        }
      );

      // Check if agent was created successfully
      if (!agent || !agent.agentId) {
        throw new Error('Failed to create Promethios LLM agent - extension returned null or invalid agent');
      }

      // Generate immediate API access endpoints
      const apiAccess = this.generateImmediateAPIAccess(agent.agentId);

      // Enhanced agent object with API access
      const enhancedAgent: PrometheosLLMAgent = {
        ...agent,
        apiAccess
      };

      // NEW: Trigger lifecycle event for Promethios LLM agent creation
      try {
        // Convert PrometheosLLMAgent to AgentProfile format for lifecycle tracking
        const agentProfile: any = {
          identity: {
            id: agent.agentId,
            name: config.name,
            version: agent.config.modelVersion || '1.0.0',
            description: config.description,
            ownerId: user.uid,
            creationDate: new Date(agent.createdAt),
            lastModifiedDate: new Date(agent.createdAt),
            status: agent.status
          }
        };

        await useAgentCreatedHook(agentProfile);
        console.log('✅ Lifecycle event triggered for Promethios LLM agent creation:', agent.agentId);
      } catch (lifecycleError) {
        // Log but don't fail the creation process
        console.warn('⚠️ Failed to trigger lifecycle event for Promethios LLM agent creation:', lifecycleError);
      }

      console.log('✅ Promethios LLM agent created with immediate API access and persistence');
      return enhancedAgent;

    } catch (error) {
      console.error('❌ Failed to create Promethios LLM agent:', error);
      throw error;
    }
  }

  /**
   * Create a new Promethios LLM agent with immediate API access (legacy method)
   */
  async createNativeAgent(
    name: string,
    description: string,
    config: Partial<PrometheosLLMAgent['config']> = {}
  ): Promise<PrometheosLLMAgent> {
    try {
      console.log('🧠 Creating Promethios LLM agent with immediate API access');

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create agent using extension
      const agent = await prometheosLLMExtension.execute(
        { userId: user.uid },
        'createAgent',
        {
          userId: user.uid,
          name,
          description,
          config
        }
      );

      // Generate immediate API access endpoints
      const apiAccess = this.generateImmediateAPIAccess(agent.agentId);

      // Enhanced agent object with API access
      const enhancedAgent: PrometheosLLMAgent = {
        ...agent,
        apiAccess
      };

      // NEW: Trigger lifecycle event for Promethios LLM agent creation
      try {
        // Convert PrometheosLLMAgent to AgentProfile format for lifecycle tracking
        const agentProfile: any = {
          identity: {
            id: agent.agentId,
            name: name,
            version: agent.config?.modelVersion || '1.0.0',
            description: description,
            ownerId: user.uid,
            creationDate: new Date(agent.createdAt),
            lastModifiedDate: new Date(agent.createdAt),
            status: agent.status
          }
        };

        await useAgentCreatedHook(agentProfile);
        console.log('✅ Lifecycle event triggered for Promethios LLM native agent creation:', agent.agentId);
      } catch (lifecycleError) {
        // Log but don't fail the creation process
        console.warn('⚠️ Failed to trigger lifecycle event for Promethios LLM native agent creation:', lifecycleError);
      }

      console.log('✅ Promethios LLM agent created with immediate API access');
      return enhancedAgent;

    } catch (error) {
      console.error('❌ Failed to create Promethios LLM agent:', error);
      throw error;
    }
  }

  /**
   * Chat with Promethios LLM agent (immediate access)
   */
  async chatWithAgent(
    agentId: string,
    message: string,
    context?: any
  ): Promise<PrometheosLLMResponse> {
    try {
      console.log(`💬 Chatting with Promethios LLM agent: ${agentId}`);

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use extension for chat
      const response = await prometheosLLMExtension.execute(
        { userId: user.uid },
        'chatWithAgent',
        {
          agentId,
          userId: user.uid,
          message,
          context
        }
      );

      console.log('✅ Promethios LLM response generated');
      return response;

    } catch (error) {
      console.error('❌ Failed to chat with Promethios LLM agent:', error);
      throw error;
    }
  }

  /**
   * Deploy Promethios LLM agent to production (enhanced API access)
   */
  async deployAgent(agentId: string): Promise<PrometheosLLMDeployment> {
    try {
      console.log(`🚀 Deploying Promethios LLM agent to production: ${agentId}`);

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Deploy using extension
      const deploymentResult = await prometheosLLMExtension.execute(
        { userId: user.uid },
        'deployAgent',
        {
          agentId,
          userId: user.uid
        }
      );

      // Generate production API key
      const apiKey = await this.generateProductionAPIKey(deploymentResult.productionAgentId);

      // Create deployment object
      const deployment: PrometheosLLMDeployment = {
        deploymentId: deploymentResult.deploymentId,
        productionAgentId: deploymentResult.productionAgentId,
        deploymentUrl: deploymentResult.deploymentUrl,
        apiKey,
        status: 'deployed',
        createdAt: new Date().toISOString(),
        features: {
          loadBalancing: true,
          rateLimiting: true,
          monitoring: true,
          slaGuarantees: true
        }
      };

      console.log('✅ Promethios LLM agent deployed to production');
      return deployment;

    } catch (error) {
      console.error('❌ Failed to deploy Promethios LLM agent:', error);
      throw error;
    }
  }

  /**
   * Get all Promethios LLM agents for current user
   */
  async getUserAgents(): Promise<PrometheosLLMAgent[]> {
    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get agents using extension
      const agents = await prometheosLLMExtension.execute(
        { userId: user.uid },
        'getUserAgents',
        { userId: user.uid }
      );

      // Add API access information to each agent
      const enhancedAgents = agents.map((agent: any) => ({
        ...agent,
        apiAccess: this.generateImmediateAPIAccess(agent.agentId)
      }));

      return enhancedAgents;

    } catch (error) {
      console.error('❌ Failed to get user Promethios LLM agents:', error);
      return [];
    }
  }

  /**
   * Get Promethios LLM agent scorecard
   */
  async getAgentScorecard(agentId: string) {
    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get scorecard using extension
      const scorecard = await prometheosLLMExtension.execute(
        { userId: user.uid },
        'getAgentScorecard',
        {
          agentId,
          userId: user.uid
        }
      );

      return scorecard;

    } catch (error) {
      console.error('❌ Failed to get Promethios LLM agent scorecard:', error);
      throw error;
    }
  }

  /**
   * Get Promethios LLM model information
   */
  async getModelInfo() {
    try {
      const modelInfo = await prometheosLLMExtension.execute(
        {},
        'getModelInfo',
        {}
      );

      return modelInfo;

    } catch (error) {
      console.error('❌ Failed to get Promethios LLM model info:', error);
      throw error;
    }
  }

  /**
   * Test Promethios LLM agent API endpoint directly
   */
  async testAgentAPI(agentId: string, message: string): Promise<{
    success: boolean;
    response?: any;
    error?: string;
    endpoint: string;
    responseTime: number;
  }> {
    try {
      const startTime = Date.now();
      const endpoint = `${this.agentApiUrl}/native-llm/agent/${agentId}/chat`;

      // Get current user for authentication
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          user_id: user.uid,
          message,
          context: { source: 'api_test' }
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          response: data,
          endpoint,
          responseTime
        };
      } else {
        const errorData = await response.text();
        return {
          success: false,
          error: errorData,
          endpoint,
          responseTime
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: `${this.agentApiUrl}/native-llm/agent/${agentId}/chat`,
        responseTime: 0
      };
    }
  }

  /**
   * Get Promethios LLM agent metrics
   */
  async getAgentMetrics(agentId: string, timeRange: { start: Date; end: Date }) {
    try {
      // This would integrate with the metrics collection system
      // For now, return mock data structure
      return {
        agentId,
        timeRange,
        metrics: {
          totalInteractions: 0,
          averageTrustScore: 0.95,
          averageComplianceRate: 0.98,
          averageResponseTime: 150,
          violationCount: 0,
          uptimePercentage: 99.9
        },
        trends: {
          trustScoreTrend: 'stable' as const,
          performanceTrend: 'improving' as const,
          usageTrend: 'increasing' as const
        }
      };

    } catch (error) {
      console.error('❌ Failed to get Promethios LLM agent metrics:', error);
      throw error;
    }
  }

  /**
   * Generate immediate API access endpoints for new agents
   */
  private generateImmediateAPIAccess(agentId: string) {
    return {
      immediate: {
        chatEndpoint: `${this.agentApiUrl}/native-llm/agent/${agentId}/chat`,
        testingEndpoint: `${this.agentApiUrl}/native-llm/agent/${agentId}/test`,
        metricsEndpoint: `${this.agentApiUrl}/native-llm/agent/${agentId}/metrics`
      }
    };
  }

  /**
   * Generate production API key for deployed agents
   */
  private async generateProductionAPIKey(productionAgentId: string): Promise<string> {
    try {
      // This would call the backend to generate a secure API key
      // For now, generate a mock API key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      return `pk_native_${productionAgentId}_${timestamp}_${random}`;

    } catch (error) {
      console.error('❌ Failed to generate production API key:', error);
      return `pk_native_${productionAgentId}_${Date.now()}`;
    }
  }

  /**
   * Get API usage statistics for deployed agents
   */
  async getAPIUsageStats(agentId: string, timeRange: { start: Date; end: Date }) {
    try {
      // This would integrate with API gateway metrics
      return {
        agentId,
        timeRange,
        usage: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          requestsPerHour: 0,
          uniqueUsers: 0
        },
        limits: {
          requestsPerMinute: 100,
          requestsPerDay: 10000,
          concurrentConnections: 50
        },
        status: 'active' as const
      };

    } catch (error) {
      console.error('❌ Failed to get API usage stats:', error);
      throw error;
    }
  }

  /**
   * Update Promethios LLM agent configuration
   */
  async updateAgentConfig(
    agentId: string, 
    config: Partial<PrometheosLLMAgent['config']>
  ): Promise<PrometheosLLMAgent> {
    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // This would update the agent configuration
      // For now, return the agent with updated config
      const agents = await this.getUserAgents();
      const agent = agents.find(a => a.agentId === agentId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }

      const updatedAgent = {
        ...agent,
        config: {
          ...agent.config,
          ...config
        }
      };

      return updatedAgent;

    } catch (error) {
      console.error('❌ Failed to update Promethios LLM agent config:', error);
      throw error;
    }
  }

  /**
   * Delete Promethios LLM agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // This would delete the agent and clean up resources
      console.log(`🗑️ Deleting Promethios LLM agent: ${agentId}`);
      
      // TODO: Implement actual deletion logic
      
    } catch (error) {
      console.error('❌ Failed to delete Promethios LLM agent:', error);
      throw error;
    }
  }
}

export const prometheosLLMService = new PrometheosLLMService();

