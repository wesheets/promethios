/**
 * Chatbot Storage Service
 * 
 * Extends the existing UserAgentStorageService to handle chatbot-specific data
 * while maintaining compatibility with the agent governance system.
 */

import { AgentProfile, GovernancePolicy } from './UserAgentStorageService';
import { unifiedStorage } from './UnifiedStorageService';

export interface ChatbotProfile extends AgentProfile {
  // Chatbot-specific configuration
  chatbotConfig: {
    personality: 'professional' | 'friendly' | 'casual' | 'helpful';
    useCase: 'customer_support' | 'sales' | 'general' | 'technical';
    brandSettings: {
      name: string;
      colors: {
        primary: string;
        secondary: string;
        background: string;
      };
      logo?: string;
    };
    deploymentChannels: DeploymentChannel[];
    knowledgeBases: string[];
    automationRules: AutomationRule[];
    responseTemplates: ResponseTemplate[];
  };
  
  // Chatbot-specific metadata
  chatbotMetadata: {
    parentAgentId: string; // Links to the underlying agent
    chatbotType: 'hosted' | 'byok' | 'enterprise';
    createdVia: 'quick_start' | 'agent_conversion' | 'manual';
    isActive: boolean;
    lastDeployment?: Date;
  };
  
  // Business metrics (mock data for now, will be real later)
  businessMetrics: {
    conversationsToday: number;
    customerSatisfaction: number; // 0-100
    averageResponseTime: number; // in seconds
    resolutionRate: number; // 0-100
    totalConversations: number;
    lastUpdated: Date;
  };
}

export interface DeploymentChannel {
  type: 'web' | 'email' | 'phone' | 'slack' | 'api' | 'social';
  isActive: boolean;
  configuration: Record<string, any>;
  deployedAt?: Date;
}

export interface AutomationRule {
  id: string;
  name: string;
  type: 'escalation' | 'response' | 'workflow';
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface RuleAction {
  type: 'escalate' | 'respond' | 'tag' | 'notify';
  parameters: Record<string, any>;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  trigger: string;
  response: string;
  isActive: boolean;
  useCount: number;
}

/**
 * ChatbotStorageService
 * 
 * Manages chatbot profiles in Firebase/storage, extending the existing
 * agent storage infrastructure.
 */
export class ChatbotStorageService {
  private static instance: ChatbotStorageService;
  private chatbots: Map<string, ChatbotProfile> = new Map();

  public static getInstance(): ChatbotStorageService {
    if (!ChatbotStorageService.instance) {
      ChatbotStorageService.instance = new ChatbotStorageService();
    }
    return ChatbotStorageService.instance;
  }

  /**
   * Create a new chatbot from an existing agent
   */
  public async createChatbotFromAgent(
    agent: AgentProfile,
    chatbotConfig: Partial<ChatbotProfile['chatbotConfig']>,
    chatbotType: 'hosted' | 'byok' | 'enterprise' = 'hosted'
  ): Promise<ChatbotProfile> {
    const chatbotId = `chatbot-${Date.now()}`;
    
    const chatbot: ChatbotProfile = {
      ...agent,
      identity: {
        ...agent.identity,
        id: chatbotId,
        name: chatbotConfig.brandSettings?.name || agent.identity.name,
      },
      chatbotConfig: {
        personality: chatbotConfig.personality || 'professional',
        useCase: chatbotConfig.useCase || 'customer_support',
        brandSettings: {
          name: chatbotConfig.brandSettings?.name || agent.identity.name,
          colors: {
            primary: '#3182ce',
            secondary: '#10b981',
            background: '#1a202c',
            ...chatbotConfig.brandSettings?.colors,
          },
          logo: chatbotConfig.brandSettings?.logo,
        },
        deploymentChannels: chatbotConfig.deploymentChannels || [],
        knowledgeBases: chatbotConfig.knowledgeBases || [],
        automationRules: chatbotConfig.automationRules || [],
        responseTemplates: chatbotConfig.responseTemplates || [],
      },
      chatbotMetadata: {
        parentAgentId: agent.identity.id,
        chatbotType,
        createdVia: 'agent_conversion',
        isActive: true,
        lastDeployment: new Date(),
      },
      businessMetrics: this.generateMockMetrics(),
    };

    // Store the chatbot
    this.chatbots.set(chatbotId, chatbot);
    
    // TODO: Persist to Firebase/database
    await this.persistChatbot(chatbot);
    
    return chatbot;
  }

  /**
   * Create a hosted chatbot directly (for Quick Start hosted path)
   */
  public async createHostedChatbot(
    name: string,
    description: string,
    provider: string,
    model: string,
    personality: string,
    useCase: string,
    ownerId: string
  ): Promise<ChatbotProfile> {
    // First create a hosted agent
    const agentId = `agent-${Date.now()}`;
    const governanceId = `G-${Date.now()}`;
    
    const hostedAgent: AgentProfile = {
      identity: {
        id: agentId,
        name: name,
        version: '1.0.0',
        description: description,
        ownerId: ownerId,
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        status: 'active',
      },
      latestScorecard: null,
      attestationCount: 0,
      lastActivity: new Date(),
      healthStatus: 'healthy',
      trustLevel: 'high',
      isWrapped: true,
      isDeployed: true,
      governancePolicy: this.createDefaultGovernancePolicy(),
      apiDetails: {
        endpoint: `https://api.promethios.ai/hosted/${provider}`,
        key: 'hosted-managed',
        provider: provider,
        selectedModel: model,
      },
    };

    // Convert to chatbot
    const chatbot = await this.createChatbotFromAgent(
      hostedAgent,
      {
        personality: personality as any,
        useCase: useCase as any,
        brandSettings: { name },
        deploymentChannels: [
          {
            type: 'web',
            isActive: true,
            configuration: {},
            deployedAt: new Date(),
          },
        ],
      },
      'hosted'
    );

    chatbot.chatbotMetadata.createdVia = 'quick_start';
    
    return chatbot;
  }

  /**
   * Create a new chatbot directly (for BYOK chatbot wrapping wizard)
   */
  public async createChatbot(ownerId: string, chatbotProfile: Partial<ChatbotProfile>): Promise<ChatbotProfile> {
    const chatbotId = `chatbot-${Date.now()}`;
    
    const chatbot: ChatbotProfile = {
      // Base agent structure
      identity: {
        id: chatbotId,
        name: chatbotProfile.identity?.name || chatbotProfile.agentName || 'Governed Chatbot',
        version: '1.0.0',
        description: chatbotProfile.identity?.description || 'Governed AI Chatbot',
        ownerId: ownerId,
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        status: 'active',
      },
      latestScorecard: null,
      attestationCount: 0,
      lastActivity: new Date(),
      healthStatus: chatbotProfile.healthStatus || 'healthy',
      trustLevel: chatbotProfile.trustLevel || 'medium',
      isWrapped: true,
      isDeployed: false,
      governancePolicy: chatbotProfile.governancePolicy || this.createDefaultGovernancePolicy(),
      apiDetails: chatbotProfile.apiDetails || {
        endpoint: 'https://api.openai.com/v1',
        key: '',
        provider: 'OpenAI',
        selectedModel: 'gpt-4',
      },
      
      // Chatbot-specific configuration
      chatbotConfig: {
        personality: chatbotProfile.chatbotConfig?.personality || 'professional',
        useCase: chatbotProfile.chatbotConfig?.useCase || 'customer_support',
        brandSettings: {
          name: chatbotProfile.identity?.name || chatbotProfile.agentName || 'Governed Chatbot',
          colors: {
            primary: '#3182ce',
            secondary: '#10b981',
            background: '#1a202c',
          },
          ...chatbotProfile.chatbotConfig?.brandSettings,
        },
        deploymentChannels: chatbotProfile.chatbotConfig?.deploymentChannels || [
          {
            type: 'web',
            isActive: true,
            configuration: {},
            deployedAt: new Date(),
          },
        ],
        knowledgeBases: chatbotProfile.chatbotConfig?.knowledgeBases || [],
        automationRules: chatbotProfile.chatbotConfig?.automationRules || [],
        responseTemplates: chatbotProfile.chatbotConfig?.responseTemplates || [],
      },
      
      // Chatbot metadata
      chatbotMetadata: {
        parentAgentId: chatbotProfile.chatbotMetadata?.parentAgentId || null,
        chatbotType: chatbotProfile.chatbotMetadata?.chatbotType || 'byok',
        createdVia: chatbotProfile.chatbotMetadata?.creationMethod === 'chatbot_wrapping_wizard' ? 'manual' : 'quick_start',
        isActive: true,
        lastDeployment: new Date(),
      },
      
      // Business metrics
      businessMetrics: chatbotProfile.businessMetrics || this.generateMockMetrics(),
    };

    // Store the chatbot
    this.chatbots.set(chatbotId, chatbot);
    
    // Persist to storage
    await this.persistChatbot(chatbot);
    
    console.log('✅ Chatbot created successfully:', chatbot.identity.id);
    return chatbot;
  }

  /**
   * Get all chatbots for the current user
   */
  public async getChatbots(ownerId: string): Promise<ChatbotProfile[]> {
    try {
      console.log('🤖 Loading chatbots for user:', ownerId);
      
      // Get all chatbot keys from unified storage
      const allKeys = await unifiedStorage.keys('chatbots');
      console.log('🔍 All chatbot keys from unified storage:', allKeys);
      
      // Filter for this user's chatbots
      const userPrefix = `${ownerId}_`;
      const userKeys = allKeys.filter(key => {
        const keyPart = key.replace('chatbots/', '');
        return keyPart.startsWith(userPrefix);
      });
      
      console.log('🔍 User chatbot keys found:', userKeys);
      
      const chatbots: ChatbotProfile[] = [];
      
      // Load each chatbot from storage
      for (const key of userKeys) {
        try {
          const keyPart = key.replace('chatbots/', '');
          console.log('🔍 Loading chatbot with key:', keyPart);
          
          const chatbotData = await unifiedStorage.get<any>('chatbots', keyPart);
          if (chatbotData) {
            console.log('🔍 Loaded chatbot data:', chatbotData.identity?.name || 'Unknown');
            
            // Safely deserialize dates with fallbacks
            const chatbot: ChatbotProfile = {
              ...chatbotData,
              identity: {
                ...chatbotData.identity,
                creationDate: chatbotData.identity?.creationDate 
                  ? new Date(chatbotData.identity.creationDate) 
                  : new Date(),
                lastModifiedDate: chatbotData.identity?.lastModifiedDate 
                  ? new Date(chatbotData.identity.lastModifiedDate) 
                  : new Date(),
              },
              lastActivity: chatbotData.lastActivity ? new Date(chatbotData.lastActivity) : new Date(),
            };
            
            // Add to in-memory cache
            this.chatbots.set(chatbot.identity.id, chatbot);
            chatbots.push(chatbot);
          }
        } catch (error) {
          console.error(`Error loading chatbot with key ${key}:`, error);
        }
      }
      
      console.log(`🤖 Loaded ${chatbots.length} chatbots for user ${ownerId}`);
      
      // If no real chatbots exist, return empty array (no mock data)
      if (chatbots.length === 0) {
        console.log('🤖 No chatbots found for user, returning empty array');
        return [];
      }
      
      return chatbots;
      
    } catch (error) {
      console.error('Error loading chatbots:', error);
      return [];
    }
  }

  /**
   * Get a specific chatbot by ID
   */
  public async getChatbot(chatbotId: string): Promise<ChatbotProfile | null> {
    return this.chatbots.get(chatbotId) || null;
  }

  /**
   * Update a chatbot
   */
  public async updateChatbot(chatbotId: string, updates: Partial<ChatbotProfile>): Promise<ChatbotProfile | null> {
    const chatbot = this.chatbots.get(chatbotId);
    if (!chatbot) return null;

    const updatedChatbot = { ...chatbot, ...updates };
    this.chatbots.set(chatbotId, updatedChatbot);
    
    await this.persistChatbot(updatedChatbot);
    return updatedChatbot;
  }

  /**
   * Delete a chatbot
   */
  public async deleteChatbot(chatbotId: string): Promise<boolean> {
    const deleted = this.chatbots.delete(chatbotId);
    if (deleted) {
      // TODO: Remove from Firebase/database
    }
    return deleted;
  }

  /**
   * Get model display name from agent data
   */
  public getModelDisplayName(provider?: string, selectedModel?: string): string {
    if (!provider || !selectedModel) return 'Unknown Model';
    
    if (provider === 'OpenAI') {
      return selectedModel.includes('gpt-4') ? 'GPT-4' : 'GPT-3.5';
    }
    if (provider === 'Anthropic') {
      return selectedModel.includes('claude-3') ? 'Claude-3' : 'Claude-2';
    }
    if (provider === 'Google') {
      return selectedModel.includes('gemini-pro') ? 'Gemini Pro' : 'Gemini';
    }
    
    // Fallback for any provider/model combination
    return selectedModel || provider || 'Custom Model';
  }

  /**
   * Private helper methods
   */
  private async persistChatbot(chatbot: ChatbotProfile): Promise<void> {
    // TODO: Implement Firebase/database persistence
    console.log('Persisting chatbot:', chatbot.identity.id);
  }

  private createDefaultGovernancePolicy(): GovernancePolicy {
    return {
      trustThreshold: 0.8,
      securityLevel: 'standard',
      complianceFramework: 'general',
      enforcementLevel: 'governance',
      enableAuditLogging: true,
      enableDataRetention: true,
      enableRateLimiting: true,
      enableContentFiltering: true,
      enableRealTimeMonitoring: true,
      enableEscalationPolicies: true,
      maxRequestsPerMinute: 100,
      policyRules: [],
      complianceControls: [],
      createdAt: new Date(),
    };
  }

  private generateMockMetrics() {
    return {
      conversationsToday: Math.floor(Math.random() * 2000) + 500,
      customerSatisfaction: Math.floor(Math.random() * 20) + 80, // 80-100
      averageResponseTime: Math.random() * 3 + 1, // 1-4 seconds
      resolutionRate: Math.floor(Math.random() * 20) + 75, // 75-95
      totalConversations: Math.floor(Math.random() * 50000) + 10000,
      lastUpdated: new Date(),
    };
  }

  private createMockChatbots(ownerId: string): ChatbotProfile[] {
    const mockChatbots: ChatbotProfile[] = [
      {
        identity: {
          id: 'chatbot-customer-support',
          name: 'Customer Support Bot',
          version: '1.0.0',
          description: 'Handles customer inquiries and support tickets',
          ownerId,
          creationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastModifiedDate: new Date(),
          status: 'active',
        },
        latestScorecard: null,
        attestationCount: 15,
        lastActivity: new Date(),
        healthStatus: 'healthy',
        trustLevel: 'high',
        isWrapped: true,
        isDeployed: true,
        governancePolicy: this.createDefaultGovernancePolicy(),
        apiDetails: {
          endpoint: 'https://api.openai.com/v1',
          key: 'hosted-managed',
          provider: 'OpenAI',
          selectedModel: 'gpt-4',
        },
        chatbotConfig: {
          personality: 'professional',
          useCase: 'customer_support',
          brandSettings: {
            name: 'Customer Support Bot',
            colors: {
              primary: '#3182ce',
              secondary: '#10b981',
              background: '#1a202c',
            },
          },
          deploymentChannels: [
            { type: 'web', isActive: true, configuration: {}, deployedAt: new Date() },
            { type: 'email', isActive: true, configuration: {}, deployedAt: new Date() },
            { type: 'slack', isActive: false, configuration: {} },
          ],
          knowledgeBases: ['kb-support-docs', 'kb-faq'],
          automationRules: [],
          responseTemplates: [],
        },
        chatbotMetadata: {
          parentAgentId: 'agent-customer-support',
          chatbotType: 'hosted',
          createdVia: 'quick_start',
          isActive: true,
          lastDeployment: new Date(),
        },
        businessMetrics: {
          conversationsToday: 1247,
          customerSatisfaction: 94,
          averageResponseTime: 2.3,
          resolutionRate: 87,
          totalConversations: 25430,
          lastUpdated: new Date(),
        },
      },
      {
        identity: {
          id: 'chatbot-sales-assistant',
          name: 'Sales Assistant',
          version: '1.0.0',
          description: 'Qualifies leads and provides product information',
          ownerId,
          creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          lastModifiedDate: new Date(),
          status: 'active',
        },
        latestScorecard: null,
        attestationCount: 8,
        lastActivity: new Date(),
        healthStatus: 'healthy',
        trustLevel: 'high',
        isWrapped: true,
        isDeployed: true,
        governancePolicy: this.createDefaultGovernancePolicy(),
        apiDetails: {
          endpoint: 'https://api.anthropic.com/v1',
          key: 'byok-managed',
          provider: 'Anthropic',
          selectedModel: 'claude-3-sonnet',
        },
        chatbotConfig: {
          personality: 'friendly',
          useCase: 'sales',
          brandSettings: {
            name: 'Sales Assistant',
            colors: {
              primary: '#10b981',
              secondary: '#3182ce',
              background: '#1a202c',
            },
          },
          deploymentChannels: [
            { type: 'web', isActive: true, configuration: {}, deployedAt: new Date() },
            { type: 'api', isActive: true, configuration: {}, deployedAt: new Date() },
          ],
          knowledgeBases: ['kb-product-catalog', 'kb-pricing'],
          automationRules: [],
          responseTemplates: [],
        },
        chatbotMetadata: {
          parentAgentId: 'agent-sales-assistant',
          chatbotType: 'byok',
          createdVia: 'agent_conversion',
          isActive: true,
          lastDeployment: new Date(),
        },
        businessMetrics: {
          conversationsToday: 892,
          customerSatisfaction: 91,
          averageResponseTime: 1.8,
          resolutionRate: 78,
          totalConversations: 12340,
          lastUpdated: new Date(),
        },
      },
    ];

    // Store mock chatbots
    mockChatbots.forEach(chatbot => {
      this.chatbots.set(chatbot.identity.id, chatbot);
    });

    return mockChatbots;
  }
}

export default ChatbotStorageService;

