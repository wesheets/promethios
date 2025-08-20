/**
 * Universal Governance Adapter - MINIMAL IMPORTS VERSION
 * 
 * Testing version with minimal imports to isolate initialization issues
 */

// Backend API configuration
const BACKEND_API_BASE = 'https://promethios-phase-7-1-api.onrender.com';
const CHAT_ENDPOINT = '/api/chat';

// Import only essential types - NO SERVICE IMPORTS
import {
  GovernanceContext,
  MessageContext,
  EnhancedResponse
} from '../shared/governance/types/SharedGovernanceTypes';

// Backend API interfaces
interface BackendChatRequest {
  agent_id: string;
  message: string;
  governance_enabled: boolean;
  session_id?: string;
  system_message?: string;
  provider?: string;
  model?: string;
  conversationHistory?: Array<{role: string, content: string}>;
}

interface BackendChatResponse {
  response: string;
  metadata?: {
    model?: string;
    provider?: string;
    tokens_used?: number;
    governance_applied?: boolean;
    trust_score?: number;
  };
}

export class UniversalGovernanceAdapterMinimal {
  private static instance: UniversalGovernanceAdapterMinimal | null = null;
  
  private activeSessions: Map<string, any>;
  private context: string = 'universal';
  private initialized: boolean = false;
  private governanceContext: GovernanceContext | null = null;

  private constructor() {
    console.log('🌐 [Universal-Minimal] Initializing governance adapter with minimal imports');
    
    // Initialize Maps in constructor to avoid initialization order issues
    this.activeSessions = new Map();
    
    this.initialized = true;
    console.log('✅ [Universal-Minimal] Governance adapter initialized successfully');
  }

  /**
   * Get singleton instance of UniversalGovernanceAdapterMinimal
   */
  public static getInstance(): UniversalGovernanceAdapterMinimal {
    if (!UniversalGovernanceAdapterMinimal.instance) {
      UniversalGovernanceAdapterMinimal.instance = new UniversalGovernanceAdapterMinimal();
    }
    return UniversalGovernanceAdapterMinimal.instance;
  }

  /**
   * Test method to verify the adapter works
   */
  async testBasicFunctionality(): Promise<string> {
    try {
      console.log('🧪 [Universal-Minimal] Testing basic functionality...');
      
      if (!this.initialized) {
        throw new Error('Adapter not initialized');
      }

      // Test basic operations
      this.activeSessions.set('test-session', { created: new Date() });
      const sessionCount = this.activeSessions.size;
      
      console.log(`✅ [Universal-Minimal] Basic test passed - ${sessionCount} active sessions`);
      return `Minimal UGA working! ${sessionCount} sessions active.`;
      
    } catch (error) {
      console.error('❌ [Universal-Minimal] Basic test failed:', error);
      throw error;
    }
  }

  /**
   * Simple chat method without complex dependencies
   */
  async simpleChat(message: string, agentId: string = 'test-agent'): Promise<EnhancedResponse> {
    try {
      console.log(`💬 [Universal-Minimal] Simple chat for agent: ${agentId}`);
      
      const response: EnhancedResponse = {
        content: `Echo from minimal UGA: ${message}`,
        metadata: {
          agent_id: agentId,
          timestamp: new Date().toISOString(),
          governance_applied: false,
          trust_score: 1.0
        },
        governance: {
          approved: true,
          policies_applied: [],
          trust_score: 1.0,
          audit_trail: [{
            action: 'simple_chat',
            timestamp: new Date().toISOString(),
            details: { message_length: message.length }
          }]
        }
      };

      console.log('✅ [Universal-Minimal] Simple chat completed successfully');
      return response;
      
    } catch (error) {
      console.error('❌ [Universal-Minimal] Simple chat failed:', error);
      throw error;
    }
  }

  /**
   * Get basic status information
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      context: this.context,
      active_sessions: this.activeSessions.size,
      version: 'minimal-imports',
      timestamp: new Date().toISOString()
    };
  }
}

