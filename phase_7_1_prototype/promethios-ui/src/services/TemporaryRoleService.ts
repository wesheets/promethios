/**
 * TemporaryRoleService - Manages per-chat-session agent roles and behaviors
 * Integrates with existing multi-agent wrapper and governance extensions
 */

export interface CareerRole {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

export interface Behavior {
  value: string;
  label: string;
  description: string;
  color: string;
  systemPrompt: string;
}

export interface AgentSessionConfig {
  agentId: string;
  sessionId: string;
  careerRole?: CareerRole;
  behavior: Behavior;
  assignedAt: Date;
  assignedBy: string;
}

export interface TemporaryRoleAssignment {
  agentId: string;
  agentName: string;
  careerRole: string;
  behavior: string;
  sessionId: string;
}

class TemporaryRoleService {
  private sessionConfigs: Map<string, Map<string, AgentSessionConfig>> = new Map();

  // Career roles (professional contexts)
  private readonly CAREER_ROLES: CareerRole[] = [
    { value: 'legal', label: 'Legal Counsel', icon: '⚖️', description: 'Provides legal expertise and compliance guidance' },
    { value: 'hr', label: 'HR Specialist', icon: '👥', description: 'Handles human resources and people management' },
    { value: 'customer_service', label: 'Customer Service', icon: '🎧', description: 'Focuses on customer satisfaction and support' },
    { value: 'cto', label: 'Chief Technology Officer', icon: '💻', description: 'Provides technical leadership and strategy' },
    { value: 'cfo', label: 'Chief Financial Officer', icon: '💰', description: 'Offers financial analysis and business insights' },
    { value: 'marketing', label: 'Marketing Specialist', icon: '📈', description: 'Focuses on marketing strategy and brand promotion' },
    { value: 'sales', label: 'Sales Representative', icon: '🤝', description: 'Emphasizes sales processes and customer acquisition' },
    { value: 'product_manager', label: 'Product Manager', icon: '📋', description: 'Manages product strategy and development' },
    { value: 'engineer', label: 'Software Engineer', icon: '⚙️', description: 'Provides technical implementation expertise' },
    { value: 'designer', label: 'UX/UI Designer', icon: '🎨', description: 'Focuses on user experience and design principles' },
    { value: 'analyst', label: 'Business Analyst', icon: '📊', description: 'Analyzes data and provides business insights' },
    { value: 'consultant', label: 'Strategy Consultant', icon: '🎯', description: 'Offers strategic advice and problem-solving' },
    { value: 'researcher', label: 'Research Specialist', icon: '🔬', description: 'Conducts research and provides evidence-based insights' },
    { value: 'writer', label: 'Content Writer', icon: '✍️', description: 'Creates and refines written content' },
    { value: 'trainer', label: 'Training Specialist', icon: '🎓', description: 'Focuses on education and skill development' }
  ];

  // Behaviors (interaction styles)
  private readonly BEHAVIORS: Behavior[] = [
    {
      value: 'collaborative',
      label: 'Collaborative',
      description: 'Works cooperatively and builds on others\' ideas',
      color: '#10b981',
      systemPrompt: 'You are in collaborative mode. Work cooperatively with other agents, build on their ideas, and seek consensus. Be supportive and constructive in your responses.'
    },
    {
      value: 'devils_advocate',
      label: 'Devil\'s Advocate',
      description: 'Challenges ideas and asks tough questions',
      color: '#ef4444',
      systemPrompt: 'You are in devil\'s advocate mode. Challenge ideas presented by others, ask tough questions, and identify potential problems or weaknesses. Be constructive but critical.'
    },
    {
      value: 'expert',
      label: 'Expert',
      description: 'Provides deep domain knowledge and expertise',
      color: '#3b82f6',
      systemPrompt: 'You are in expert mode. Provide deep domain knowledge, detailed explanations, and authoritative insights. Share your expertise confidently and thoroughly.'
    },
    {
      value: 'facilitator',
      label: 'Facilitator',
      description: 'Guides discussions and keeps conversations on track',
      color: '#8b5cf6',
      systemPrompt: 'You are in facilitator mode. Guide the discussion, keep conversations on track, summarize key points, and help the group reach conclusions. Be neutral and process-focused.'
    },
    {
      value: 'critic',
      label: 'Critic',
      description: 'Provides constructive criticism and identifies flaws',
      color: '#f59e0b',
      systemPrompt: 'You are in critic mode. Provide constructive criticism, identify flaws and weaknesses, and suggest improvements. Be thorough in your analysis but remain helpful.'
    },
    {
      value: 'creative',
      label: 'Creative',
      description: 'Generates innovative ideas and creative solutions',
      color: '#ec4899',
      systemPrompt: 'You are in creative mode. Generate innovative ideas, think outside the box, and propose creative solutions. Be imaginative and explore unconventional approaches.'
    },
    {
      value: 'analyst',
      label: 'Analyst',
      description: 'Breaks down complex problems and provides data-driven insights',
      color: '#06b6d4',
      systemPrompt: 'You are in analyst mode. Break down complex problems, provide data-driven insights, and use logical reasoning. Be systematic and evidence-based in your approach.'
    }
  ];

  /**
   * Assign temporary roles and behaviors to agents for a specific session
   */
  async assignTemporaryRoles(
    sessionId: string,
    assignments: TemporaryRoleAssignment[],
    assignedBy: string = 'user'
  ): Promise<void> {
    console.log(`🎭 [TemporaryRole] Assigning roles for session: ${sessionId}`);
    
    if (!this.sessionConfigs.has(sessionId)) {
      this.sessionConfigs.set(sessionId, new Map());
    }
    
    const sessionMap = this.sessionConfigs.get(sessionId)!;
    
    for (const assignment of assignments) {
      const careerRole = this.CAREER_ROLES.find(r => r.value === assignment.careerRole);
      const behavior = this.BEHAVIORS.find(b => b.value === assignment.behavior);
      
      if (!behavior) {
        console.warn(`⚠️ [TemporaryRole] Unknown behavior: ${assignment.behavior}`);
        continue;
      }
      
      const config: AgentSessionConfig = {
        agentId: assignment.agentId,
        sessionId,
        careerRole,
        behavior,
        assignedAt: new Date(),
        assignedBy
      };
      
      sessionMap.set(assignment.agentId, config);
      
      console.log(`✅ [TemporaryRole] Assigned to ${assignment.agentName}:`, {
        careerRole: careerRole?.label || 'None',
        behavior: behavior.label,
        sessionId
      });
    }
    
    // TODO: Integrate with backend multi-agent governance extensions
    await this.syncWithBackend(sessionId, assignments);
  }

  /**
   * Get agent configuration for a specific session
   */
  getAgentConfig(sessionId: string, agentId: string): AgentSessionConfig | null {
    const sessionMap = this.sessionConfigs.get(sessionId);
    return sessionMap?.get(agentId) || null;
  }

  /**
   * Get all agent configurations for a session
   */
  getSessionConfigs(sessionId: string): AgentSessionConfig[] {
    const sessionMap = this.sessionConfigs.get(sessionId);
    return sessionMap ? Array.from(sessionMap.values()) : [];
  }

  /**
   * Build enhanced system prompt with role and behavior context
   */
  buildEnhancedSystemPrompt(
    basePrompt: string,
    sessionId: string,
    agentId: string
  ): string {
    const config = this.getAgentConfig(sessionId, agentId);
    
    if (!config) {
      return basePrompt;
    }
    
    let enhancedPrompt = basePrompt;
    
    // Add career role context
    if (config.careerRole) {
      enhancedPrompt += `\n\nROLE CONTEXT: You are acting as a ${config.careerRole.label}. ${config.careerRole.description}`;
    }
    
    // Add behavior instructions
    enhancedPrompt += `\n\nBEHAVIOR INSTRUCTIONS: ${config.behavior.systemPrompt}`;
    
    // Add multi-agent context
    const otherAgents = this.getSessionConfigs(sessionId).filter(c => c.agentId !== agentId);
    if (otherAgents.length > 0) {
      enhancedPrompt += `\n\nMULTI-AGENT CONTEXT: You are collaborating with other AI agents in this conversation:`;
      otherAgents.forEach(agent => {
        const roleText = agent.careerRole ? ` (${agent.careerRole.label})` : '';
        enhancedPrompt += `\n- Agent${roleText} with ${agent.behavior.label} behavior`;
      });
    }
    
    return enhancedPrompt;
  }

  /**
   * Remove agent from session (when they leave the conversation)
   */
  removeAgentFromSession(sessionId: string, agentId: string): void {
    const sessionMap = this.sessionConfigs.get(sessionId);
    if (sessionMap) {
      sessionMap.delete(agentId);
      console.log(`🗑️ [TemporaryRole] Removed agent ${agentId} from session ${sessionId}`);
    }
  }

  /**
   * Clear all configurations for a session
   */
  clearSession(sessionId: string): void {
    this.sessionConfigs.delete(sessionId);
    console.log(`🧹 [TemporaryRole] Cleared session ${sessionId}`);
  }

  /**
   * Get available career roles
   */
  getCareerRoles(): CareerRole[] {
    return [...this.CAREER_ROLES];
  }

  /**
   * Get available behaviors
   */
  getBehaviors(): Behavior[] {
    return [...this.BEHAVIORS];
  }

  /**
   * Sync with backend multi-agent governance extensions
   */
  private async syncWithBackend(
    sessionId: string,
    assignments: TemporaryRoleAssignment[]
  ): Promise<void> {
    try {
      console.log(`🔄 [TemporaryRole] Syncing with backend for session: ${sessionId}`);
      
      // TODO: Implement actual backend integration
      // This would integrate with the existing multi-agent wrapper and governance extensions
      
      const payload = {
        sessionId,
        assignments: assignments.map(a => ({
          agentId: a.agentId,
          careerRole: a.careerRole,
          behavior: a.behavior,
          timestamp: new Date().toISOString()
        }))
      };
      
      console.log(`📤 [TemporaryRole] Backend payload:`, payload);
      
      // Simulate backend call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`✅ [TemporaryRole] Backend sync completed`);
      
    } catch (error) {
      console.error(`❌ [TemporaryRole] Backend sync failed:`, error);
      // Don't throw - allow frontend to continue working
    }
  }

  /**
   * Get enhanced system prompt for an agent based on their temporary role assignment
   */
  getEnhancedSystemPrompt(agentId: string, sessionId: string, basePrompt: string = ''): string {
    console.log(`🎭 [TemporaryRole] Getting enhanced system prompt for agent: ${agentId} in session: ${sessionId}`);
    
    const sessionConfigs = this.sessionConfigs.get(sessionId);
    if (!sessionConfigs) {
      console.log(`🎭 [TemporaryRole] No session configs found for session: ${sessionId}`);
      return basePrompt;
    }

    const agentConfig = sessionConfigs.get(agentId);
    if (!agentConfig) {
      console.log(`🎭 [TemporaryRole] No agent config found for agent: ${agentId}`);
      return basePrompt;
    }

    // Build enhanced prompt with career role and behavior
    const careerRolePrompt = agentConfig.careerRole 
      ? `\n\n🎯 CAREER ROLE: You are acting as a ${agentConfig.careerRole.label} (${agentConfig.careerRole.icon}). ${agentConfig.careerRole.description || ''}`
      : '';

    const behaviorPrompt = agentConfig.behavior
      ? `\n\n🎭 BEHAVIORAL DIRECTIVE: ${agentConfig.behavior.systemPrompt}`
      : '';

    const enhancedPrompt = `${basePrompt}${careerRolePrompt}${behaviorPrompt}

🔄 TEMPORARY ROLE CONTEXT:
- This role assignment is temporary for this conversation session
- Maintain your core capabilities while embodying this role
- Be authentic to both your AI nature and the assigned role
- If the role conflicts with your capabilities, acknowledge the limitation gracefully`;

    console.log(`🎭 [TemporaryRole] Enhanced system prompt created for ${agentId}`);
    return enhancedPrompt;
  }

  /**
   * Get enhanced system prompt with retry logic for timing issues
   * This async version helps handle race conditions between role assignment and retrieval
   */
  async getEnhancedSystemPromptWithRetry(
    agentId: string, 
    sessionId: string, 
    basePrompt: string = '',
    maxRetries: number = 3,
    retryDelayMs: number = 100
  ): Promise<string> {
    console.log(`🎭 [TemporaryRole] Getting enhanced system prompt with retry for agent: ${agentId} in session: ${sessionId}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 [TemporaryRole] Attempt ${attempt}/${maxRetries} for agent: ${agentId}`);
      
      const sessionConfigs = this.sessionConfigs.get(sessionId);
      if (!sessionConfigs) {
        console.log(`🎭 [TemporaryRole] No session configs found for session: ${sessionId} (attempt ${attempt})`);
        
        if (attempt < maxRetries) {
          console.log(`⏳ [TemporaryRole] Waiting ${retryDelayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
        
        console.log(`❌ [TemporaryRole] Max retries reached, returning base prompt for agent: ${agentId}`);
        return basePrompt;
      }

      const agentConfig = sessionConfigs.get(agentId);
      if (!agentConfig) {
        console.log(`🎭 [TemporaryRole] No agent config found for agent: ${agentId} (attempt ${attempt})`);
        
        if (attempt < maxRetries) {
          console.log(`⏳ [TemporaryRole] Waiting ${retryDelayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
        
        console.log(`❌ [TemporaryRole] Max retries reached, returning base prompt for agent: ${agentId}`);
        return basePrompt;
      }

      // Success! Build enhanced prompt
      const careerRolePrompt = agentConfig.careerRole 
        ? `\n\n🎯 CAREER ROLE: You are acting as a ${agentConfig.careerRole.label} (${agentConfig.careerRole.icon}). ${agentConfig.careerRole.description || ''}`
        : '';

      const behaviorPrompt = agentConfig.behavior
        ? `\n\n🎭 BEHAVIORAL DIRECTIVE: ${agentConfig.behavior.systemPrompt}`
        : '';

      const enhancedPrompt = `${basePrompt}${careerRolePrompt}${behaviorPrompt}

🔄 TEMPORARY ROLE CONTEXT:
- This role assignment is temporary for this conversation session
- Maintain your core capabilities while embodying this role
- Be authentic to both your AI nature and the assigned role
- If the role conflicts with your capabilities, acknowledge the limitation gracefully`;

      console.log(`✅ [TemporaryRole] Enhanced system prompt created for ${agentId} on attempt ${attempt}`);
      return enhancedPrompt;
    }

    // This should never be reached, but just in case
    return basePrompt;
  }
}

// Export singleton instance
export const temporaryRoleService = new TemporaryRoleService();
export default temporaryRoleService;

