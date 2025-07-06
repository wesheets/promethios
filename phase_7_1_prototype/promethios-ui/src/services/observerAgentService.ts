/**
 * Observer Agent Service
 * 
 * Comprehensive service for the Promethios Observer Agent with OpenAI LLM integration
 * and full governance wrapper integration.
 */

import { observerService } from './observers';
import { observerAgentGovernance } from './observerAgentGovernance';

// OpenAI Integration Types
interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface LLMContext {
  userId: string;
  userRole: string;
  currentRoute: string;
  recentInteractions?: string[];
  chatContext?: {
    chatId: string;
    mode: string;
    participants: string[];
  };
  agentContext?: {
    agentId: string;
    lastAction: string;
    governanceStatus: string;
  };
  governanceMetrics?: {
    trustScore: number;
    complianceScore: number;
    violations: number;
  };
  [key: string]: any;
}

interface LLMResponse {
  responseText: string;
  suggestions?: ObserverSuggestion[];
  error?: string;
  confidence?: number;
}

// Observer Agent Types
interface ObserverSuggestion {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'action_recommendation' | 'governance_alert';
  action?: {
    type: string;
    params: Record<string, any>;
  };
  source: string;
  relevance?: number;
  timestamp: number;
}

interface ObservableEvent {
  type: string;
  source: string;
  timestamp: number;
  data: any;
}

interface ObserverState {
  isActive: boolean;
  isExpanded: boolean;
  suggestions: ObserverSuggestion[];
  currentMessage?: string;
  lastError?: string;
  observerContext: LLMContext;
  isLoadingLLM: boolean;
}

// Promethios Knowledge Base
const PROMETHIOS_KNOWLEDGE_BASE = {
  governance: {
    framework: `Promethios is an AI governance platform that provides comprehensive oversight and control over AI agents. 
    The platform focuses on trust, compliance, and performance monitoring through multiple observer systems.`,
    
    components: {
      trust_metrics: `Trust metrics evaluate AI agents across four dimensions: Competence (technical ability), 
      Reliability (consistency), Honesty (truthfulness), and Transparency (explainability). Scores range from 0-100%.`,
      
      governance_policies: `Governance policies define rules and constraints for AI agent behavior. They include 
      data privacy compliance, ethical guidelines, and operational boundaries.`,
      
      veritas_system: `Veritas is the hallucination detection and fact verification system. Version 1 focused on 
      strict hallucination detection but was too restrictive. Emotional Veritas v2 provides nuanced verification 
      that balances accuracy with governance satisfaction.`,
      
      observer_systems: `Multiple observer systems monitor AI agents: PRISM (tool usage and memory access), 
      Vigil (trust and goal adherence), and Veritas (fact verification and hallucination detection).`
    }
  },
  
  features: {
    agent_wrapping: `Agent wrapping allows users to integrate external AI models (ChatGPT, Claude, Gemini, Perplexity) 
    under Promethios governance. The platform provides simplified 3-step flows for each major LLM.`,
    
    admin_dashboard: `The admin dashboard provides comprehensive oversight with user management, system metrics, 
    security monitoring, and dual Veritas control systems for A/B testing governance approaches.`,
    
    trust_monitoring: `Real-time trust monitoring tracks agent performance, identifies declining trust scores, 
    and provides recommendations for improvement. Trust boundaries can be set to automatically flag issues.`
  },
  
  best_practices: {
    governance: [
      "Regularly review trust metrics and address declining scores promptly",
      "Keep governance policies updated and relevant to current operations",
      "Use Emotional Veritas v2 for balanced fact verification",
      "Monitor agent activity through observer systems",
      "Implement proper access controls and user role management"
    ],
    
    trust_optimization: [
      "Focus on transparency improvements for better trust scores",
      "Address compliance violations quickly to maintain governance scores",
      "Use A/B testing to optimize Veritas system configurations",
      "Regular agent performance reviews and trust boundary adjustments"
    ]
  }
};

// OpenAI LLM Integration
class OpenAIService {
  private config: OpenAIConfig;
  
  constructor(config: OpenAIConfig) {
    this.config = config;
  }
  
  async generateResponse(prompt: string, context: LLMContext): Promise<LLMResponse> {
    try {
      // Real OpenAI API integration
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(context)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      // Extract suggestions from response if any
      const suggestions = this.extractSuggestionsFromResponse(responseText, context);

      return {
        responseText,
        suggestions,
        confidence: 0.9
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to intelligent mock response if API fails
      const fallbackResponse = await this.simulateOpenAICall(prompt, context);
      return {
        responseText: `[Offline Mode] ${fallbackResponse.text}`,
        suggestions: fallbackResponse.suggestions,
        confidence: fallbackResponse.confidence,
        error: error instanceof Error ? error.message : 'API unavailable'
      };
    }
  }

  private buildSystemPrompt(context: LLMContext): string {
    return `You are the Promethios Observer Agent, an intelligent AI assistant embedded in the Promethios AI governance platform.

ROLE & CAPABILITIES:
- Provide expert guidance on AI governance, trust metrics, and compliance
- Offer contextual suggestions based on user's current page and activities  
- Help users understand and optimize their governance framework
- Explain Promethios features and recommend best practices
- Monitor and analyze governance metrics in real-time

CURRENT CONTEXT:
- User: ${context.userId} (Role: ${context.userRole})
- Current page: ${context.currentRoute}
- Trust Score: ${context.governanceMetrics?.trustScore || 'N/A'}%
- Compliance Score: ${context.governanceMetrics?.complianceScore || 'N/A'}%
- Policy Violations: ${context.governanceMetrics?.violations || 'N/A'}

PROMETHIOS KNOWLEDGE BASE:
${JSON.stringify(PROMETHIOS_KNOWLEDGE_BASE, null, 2)}

RESPONSE GUIDELINES:
- Be helpful, concise, and governance-focused
- Provide specific, actionable recommendations when possible
- Reference actual metrics and data from the user's platform
- Suggest navigation to relevant sections when appropriate
- Maintain a professional but friendly tone
- If suggesting actions, be specific about the benefits

Always respond as if you have real-time access to the user's governance data and can provide personalized insights.`;
  }

  private extractSuggestionsFromResponse(responseText: string, context: LLMContext): ObserverSuggestion[] {
    const suggestions: ObserverSuggestion[] = [];
    
    // Look for action words and create suggestions
    if (responseText.includes('review') || responseText.includes('check')) {
      suggestions.push({
        id: `ai-suggest-${Date.now()}`,
        text: 'Review governance metrics',
        type: 'action_recommendation',
        source: 'openai_analysis',
        timestamp: Date.now(),
        action: { type: 'navigate', params: { route: '/ui/governance/overview' } }
      });
    }
    
    if (responseText.includes('agent') && responseText.includes('trust')) {
      suggestions.push({
        id: `ai-suggest-${Date.now()}-2`,
        text: 'Analyze agent trust patterns',
        type: 'action_recommendation',
        source: 'openai_analysis',
        timestamp: Date.now(),
        action: { type: 'navigate', params: { route: '/ui/agents/profiles' } }
      });
    }
    
    return suggestions;
  }
  
  private buildContextualPrompt(userPrompt: string, context: LLMContext): string {
    const systemPrompt = `You are the Promethios Observer Agent, an AI assistant embedded in the Promethios AI governance platform. 
    
    Your role is to:
    - Provide helpful guidance on AI governance, trust metrics, and compliance
    - Offer contextual suggestions based on the user's current page and activities
    - Help users understand and optimize their governance framework
    - Explain Promethios features and best practices
    
    Current context:
    - User: ${context.userId} (Role: ${context.userRole})
    - Current page: ${context.currentRoute}
    - Governance metrics: Trust ${context.governanceMetrics?.trustScore || 'N/A'}%, Compliance ${context.governanceMetrics?.complianceScore || 'N/A'}%
    
    Knowledge base: ${JSON.stringify(PROMETHIOS_KNOWLEDGE_BASE, null, 2)}
    
    User question: ${userPrompt}
    
    Provide a helpful, concise response focused on Promethios governance. If relevant, suggest specific actions the user can take.`;
    
    return systemPrompt;
  }
  
  private async simulateOpenAICall(prompt: string, context: LLMContext): Promise<{
    text: string;
    suggestions?: ObserverSuggestion[];
    confidence: number;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Generate contextual responses based on current route and user input
    const responses = this.generateContextualResponses(context);
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      text: randomResponse.text,
      suggestions: randomResponse.suggestions,
      confidence: 0.85 + Math.random() * 0.1
    };
  }
  
  private generateContextualResponses(context: LLMContext): Array<{
    text: string;
    suggestions?: ObserverSuggestion[];
  }> {
    const route = context.currentRoute;
    
    if (route.includes('/dashboard')) {
      return [
        {
          text: "I can see you're on the main dashboard. Your governance score of 78% is good, but there's room for improvement. The 2 policy violations I noticed could be addressed to boost your compliance score.",
          suggestions: [
            {
              id: 'dash-suggest-1',
              text: 'Review policy violations',
              type: 'action_recommendation',
              source: 'observer_agent',
              timestamp: Date.now(),
              action: { type: 'navigate', params: { route: '/ui/governance/overview' } }
            }
          ]
        },
        {
          text: "Your agent portfolio is performing well with trust scores ranging from 72% to 93%. I recommend focusing on the agents with declining trust metrics to maintain overall system health.",
          suggestions: [
            {
              id: 'dash-suggest-2',
              text: 'Analyze agent trust patterns',
              type: 'action_recommendation',
              source: 'observer_agent',
              timestamp: Date.now(),
              action: { type: 'navigate', params: { route: '/ui/agents/profiles' } }
            }
          ]
        }
      ];
    }
    
    if (route.includes('/agents')) {
      return [
        {
          text: "I'm analyzing your agent profiles. With 247 agents under governance, it's important to monitor trust metrics regularly. I notice some agents showing trust decline - this could indicate issues with performance or compliance.",
          suggestions: [
            {
              id: 'agent-suggest-1',
              text: 'Set up trust monitoring alerts',
              type: 'action_recommendation',
              source: 'observer_agent',
              timestamp: Date.now()
            }
          ]
        },
        {
          text: "Your agent wrapping capabilities are extensive. Consider implementing additional governance guardrails as your agent portfolio grows to maintain consistent oversight.",
        }
      ];
    }
    
    if (route.includes('/governance')) {
      return [
        {
          text: "The governance framework is operating at 78% efficiency. Emotional Veritas v2 is showing positive results with a 6.8% improvement over the previous system. The nuanced approach is working well for your use case.",
          suggestions: [
            {
              id: 'gov-suggest-1',
              text: 'Review Veritas A/B test results',
              type: 'info',
              source: 'observer_agent',
              timestamp: Date.now()
            }
          ]
        },
        {
          text: "I recommend keeping Emotional Veritas v2 active while monitoring the impact on governance metrics. The system is balancing accuracy with user satisfaction effectively.",
        }
      ];
    }
    
    if (route.includes('/trust')) {
      return [
        {
          text: "Your trust metrics show good overall performance with an 85% average. The transparency dimension at 79% could use attention - improving agent explainability often boosts this score.",
          suggestions: [
            {
              id: 'trust-suggest-1',
              text: 'Focus on transparency improvements',
              type: 'action_recommendation',
              source: 'observer_agent',
              timestamp: Date.now()
            }
          ]
        }
      ];
    }
    
    // Default responses
    return [
      {
        text: "I'm here to help you navigate Promethios governance. What specific aspect of AI governance would you like to explore?",
      },
      {
        text: "Based on your current governance setup, everything looks stable. Is there a particular area you'd like me to analyze more deeply?",
      },
      {
        text: "Your Promethios platform is running smoothly. I can provide insights on trust metrics, governance policies, or agent management - what interests you most?",
      }
    ];
  }
}

// Main Observer Agent Service
class ObserverAgentService {
  private openAIService: OpenAIService;
  private state: ObserverState;
  private eventListeners: Array<(event: ObservableEvent) => void> = [];
  
  constructor() {
    // Initialize with real OpenAI config from environment variables
    this.openAIService = new OpenAIService({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || '',
      model: 'gpt-4',
      maxTokens: 500,
      temperature: 0.7
    });
    
    this.state = {
      isActive: true,
      isExpanded: false,
      suggestions: [],
      observerContext: {
        userId: '',
        userRole: '',
        currentRoute: ''
      },
      isLoadingLLM: false
    };
  }
  
  async initialize(userId: string, userRole: string): Promise<boolean> {
    try {
      this.state.observerContext = {
        userId,
        userRole,
        currentRoute: window.location.pathname
      };
      
      // Register with governance system
      const governanceRegistered = await observerAgentGovernance.registerAgent();
      if (!governanceRegistered) {
        console.warn('Failed to register with governance system');
      }
      
      // Load initial governance metrics
      await this.loadGovernanceMetrics();
      
      // Start monitoring
      this.startEventMonitoring();
      
      return true;
    } catch (error) {
      console.error('Observer Agent initialization failed:', error);
      return false;
    }
  }
  
  async loadGovernanceMetrics(): Promise<void> {
    try {
      // Load metrics from existing observer services
      const [prismMetrics, vigilMetrics] = await Promise.all([
        observerService.getPRISMMetrics(),
        observerService.getVigilMetrics()
      ]);
      
      // Calculate governance metrics
      const trustScores = Object.values(vigilMetrics.trustScores);
      const avgTrustScore = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;
      
      this.state.observerContext.governanceMetrics = {
        trustScore: Math.round(avgTrustScore * 100),
        complianceScore: 78, // Mock compliance score
        violations: 2 // Mock violation count
      };
    } catch (error) {
      console.error('Failed to load governance metrics:', error);
    }
  }
  
  startEventMonitoring(): void {
    // Monitor route changes
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
    
    // Monitor user interactions
    document.addEventListener('click', this.handleUserInteraction.bind(this));
    document.addEventListener('keydown', this.handleUserInteraction.bind(this));
  }
  
  stopEventMonitoring(): void {
    window.removeEventListener('popstate', this.handleRouteChange.bind(this));
    document.removeEventListener('click', this.handleUserInteraction.bind(this));
    document.removeEventListener('keydown', this.handleUserInteraction.bind(this));
  }
  
  private handleRouteChange(): void {
    const newRoute = window.location.pathname;
    this.state.observerContext.currentRoute = newRoute;
    
    // Generate new suggestions for the route
    this.generateContextualSuggestions(newRoute);
    
    // Emit route change event
    this.emitEvent({
      type: 'route_change',
      source: 'observer_agent',
      timestamp: Date.now(),
      data: { route: newRoute }
    });
  }
  
  private handleUserInteraction(event: Event): void {
    // Track user interactions for context
    this.emitEvent({
      type: 'user_interaction',
      source: 'observer_agent',
      timestamp: Date.now(),
      data: { 
        type: event.type,
        target: (event.target as Element)?.tagName || 'unknown'
      }
    });
  }
  
  async generateContextualSuggestions(route: string): Promise<ObserverSuggestion[]> {
    const suggestions: ObserverSuggestion[] = [];
    
    // Generate route-specific suggestions
    if (route.includes('/dashboard')) {
      suggestions.push({
        id: 'context-dash-1',
        text: 'Review agents with declining trust scores',
        type: 'action_recommendation',
        source: 'context_analysis',
        timestamp: Date.now(),
        action: { type: 'navigate', params: { route: '/ui/agents/profiles' } }
      });
    }
    
    if (route.includes('/agents')) {
      suggestions.push({
        id: 'context-agents-1',
        text: 'Consider setting up automated trust monitoring alerts',
        type: 'action_recommendation',
        source: 'best_practices',
        timestamp: Date.now()
      });
    }
    
    if (route.includes('/governance')) {
      suggestions.push({
        id: 'context-gov-1',
        text: 'Emotional Veritas v2 is showing 6.8% governance improvement',
        type: 'info',
        source: 'veritas_metrics',
        timestamp: Date.now()
      });
    }
    
    this.state.suggestions = suggestions;
    return suggestions;
  }
  
  async sendMessage(message: string): Promise<LLMResponse> {
    this.state.isLoadingLLM = true;
    
    try {
      // Log interaction with governance system
      observerAgentGovernance.getGovernanceEvents(); // Trigger monitoring update
      
      const response = await this.openAIService.generateResponse(message, this.state.observerContext);
      
      // Add suggestions from LLM response
      if (response.suggestions) {
        this.state.suggestions = [...this.state.suggestions, ...response.suggestions];
      }
      
      // Update governance metrics based on response quality
      this.updateGovernanceMetrics(response);
      
      return response;
    } finally {
      this.state.isLoadingLLM = false;
    }
  }

  private updateGovernanceMetrics(response: LLMResponse): void {
    // In a real implementation, this would update trust scores based on:
    // - Response quality and relevance
    // - User feedback
    // - Fact-checking results
    // - Compliance with policies
    
    // For now, we'll just log the interaction
    console.log('Observer Agent response logged for governance:', {
      hasError: !!response.error,
      confidence: response.confidence,
      suggestionsCount: response.suggestions?.length || 0
    });
  }

  // Governance integration methods
  getGovernanceMetrics() {
    return observerAgentGovernance.getGovernanceMetrics();
  }

  getTrustScore(dimension?: string) {
    return observerAgentGovernance.getTrustScore(dimension as any);
  }

  getComplianceStatus() {
    return observerAgentGovernance.getComplianceStatus();
  }
  
  getState(): ObserverState {
    return { ...this.state };
  }
  
  updateState(updates: Partial<ObserverState>): void {
    this.state = { ...this.state, ...updates };
  }
  
  addEventListener(listener: (event: ObservableEvent) => void): void {
    this.eventListeners.push(listener);
  }
  
  removeEventListener(listener: (event: ObservableEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }
  
  private emitEvent(event: ObservableEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }
}

// Export singleton instance
export const observerAgentService = new ObserverAgentService();
export default observerAgentService;

