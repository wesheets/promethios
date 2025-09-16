/**
 * Agent Context Injection Service
 * 
 * Injects organizational context into agent conversations:
 * - User role and department information
 * - Reporting relationships and team structure
 * - Project context and collaboration history
 * - Skill matching and expertise routing
 * - Compliance and access level considerations
 */

import { orgChartRAGService, type OrgChartUser, type UserContext } from './OrgChartRAGService';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface AgentContextConfig {
  includeOrgChart: boolean;
  includeUserRole: boolean;
  includeReportingStructure: boolean;
  includeProjectContext: boolean;
  includeSkillMatching: boolean;
  includeComplianceLevel: boolean;
  maxContextLength: number;
  contextPriority: ('role' | 'department' | 'projects' | 'skills' | 'reporting')[];
}

export interface ConversationContext {
  userId: string;
  agentId: string;
  organizationId: string;
  conversationId?: string;
  messageHistory?: any[];
}

export interface EnhancedAgentPrompt {
  originalPrompt: string;
  enhancedPrompt: string;
  contextInjected: {
    userContext?: UserContext;
    organizationalContext?: string;
    complianceContext?: string;
    skillContext?: string;
    projectContext?: string;
  };
  metadata: {
    contextLength: number;
    injectionTime: string;
    contextSources: string[];
  };
}

class AgentContextInjectionService {
  private readonly DEFAULT_CONFIG: AgentContextConfig = {
    includeOrgChart: true,
    includeUserRole: true,
    includeReportingStructure: true,
    includeProjectContext: true,
    includeSkillMatching: true,
    includeComplianceLevel: true,
    maxContextLength: 2000,
    contextPriority: ['role', 'department', 'projects', 'skills', 'reporting']
  };

  /**
   * Enhance agent prompt with organizational context
   */
  async enhanceAgentPrompt(
    originalPrompt: string,
    conversationContext: ConversationContext,
    config: Partial<AgentContextConfig> = {}
  ): Promise<EnhancedAgentPrompt> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      console.log('🔍 Enhancing agent prompt with organizational context...');
      
      // Get user context
      const userContext = await this.getUserContext(conversationContext);
      
      // Build context sections
      const contextSections = await this.buildContextSections(
        userContext,
        conversationContext,
        finalConfig
      );
      
      // Construct enhanced prompt
      const enhancedPrompt = this.constructEnhancedPrompt(
        originalPrompt,
        contextSections,
        finalConfig
      );
      
      const result: EnhancedAgentPrompt = {
        originalPrompt,
        enhancedPrompt,
        contextInjected: contextSections,
        metadata: {
          contextLength: enhancedPrompt.length - originalPrompt.length,
          injectionTime: new Date().toISOString(),
          contextSources: Object.keys(contextSections).filter(key => contextSections[key as keyof typeof contextSections])
        }
      };
      
      console.log(`✅ Context injection complete. Added ${result.metadata.contextLength} characters of context`);
      return result;
      
    } catch (error) {
      console.error('❌ Context injection failed:', error);
      
      // Return original prompt if context injection fails
      return {
        originalPrompt,
        enhancedPrompt: originalPrompt,
        contextInjected: {},
        metadata: {
          contextLength: 0,
          injectionTime: new Date().toISOString(),
          contextSources: []
        }
      };
    }
  }

  /**
   * Get user context from org chart
   */
  private async getUserContext(conversationContext: ConversationContext): Promise<UserContext | null> {
    try {
      return await orgChartRAGService.getUserContext(
        conversationContext.organizationId,
        conversationContext.userId,
        conversationContext.agentId
      );
    } catch (error) {
      console.error('Failed to get user context:', error);
      return null;
    }
  }

  /**
   * Build context sections based on configuration
   */
  private async buildContextSections(
    userContext: UserContext | null,
    conversationContext: ConversationContext,
    config: AgentContextConfig
  ): Promise<any> {
    const sections: any = {};
    
    if (config.includeUserRole && userContext) {
      sections.userContext = userContext;
    }
    
    if (config.includeOrgChart && userContext) {
      sections.organizationalContext = await this.buildOrganizationalContext(userContext, config);
    }
    
    if (config.includeComplianceLevel) {
      sections.complianceContext = await this.buildComplianceContext(conversationContext, userContext);
    }
    
    if (config.includeSkillMatching && userContext) {
      sections.skillContext = await this.buildSkillContext(userContext, conversationContext);
    }
    
    if (config.includeProjectContext && userContext) {
      sections.projectContext = await this.buildProjectContext(userContext, conversationContext);
    }
    
    return sections;
  }

  /**
   * Build organizational context string
   */
  private async buildOrganizationalContext(
    userContext: UserContext,
    config: AgentContextConfig
  ): Promise<string> {
    const contextParts: string[] = [];
    
    // User role and department
    if (userContext.user) {
      contextParts.push(`User: ${userContext.user.name} (${userContext.user.title})`);
      contextParts.push(`Department: ${userContext.user.department}`);
      contextParts.push(`Level: ${this.getLevelDescription(userContext.user.level)}`);
    }
    
    // Reporting structure
    if (config.includeReportingStructure) {
      if (userContext.manager) {
        contextParts.push(`Reports to: ${userContext.manager.name} (${userContext.manager.title})`);
      }
      
      if (userContext.directReports && userContext.directReports.length > 0) {
        const reportNames = userContext.directReports.map(r => r.name).join(', ');
        contextParts.push(`Manages: ${reportNames}`);
      }
      
      if (userContext.peers && userContext.peers.length > 0) {
        const peerNames = userContext.peers.slice(0, 3).map(p => p.name).join(', ');
        contextParts.push(`Peers: ${peerNames}${userContext.peers.length > 3 ? ' and others' : ''}`);
      }
    }
    
    return contextParts.join('\n');
  }

  /**
   * Build compliance context
   */
  private async buildComplianceContext(
    conversationContext: ConversationContext,
    userContext: UserContext | null
  ): Promise<string> {
    const contextParts: string[] = [];
    
    // Default compliance policies (always active)
    contextParts.push('Active Compliance Policies: HIPAA, SOC2, Legal Compliance, Ethical AI');
    
    // User-specific access level
    if (userContext?.user) {
      const accessLevel = this.determineAccessLevel(userContext.user);
      contextParts.push(`User Access Level: ${accessLevel}`);
      
      // Department-specific compliance
      const deptCompliance = this.getDepartmentCompliance(userContext.user.department);
      if (deptCompliance) {
        contextParts.push(`Department Compliance: ${deptCompliance}`);
      }
    }
    
    return contextParts.join('\n');
  }

  /**
   * Build skill context for expertise matching
   */
  private async buildSkillContext(
    userContext: UserContext,
    conversationContext: ConversationContext
  ): Promise<string> {
    const contextParts: string[] = [];
    
    if (userContext.user?.skills && userContext.user.skills.length > 0) {
      contextParts.push(`User Skills: ${userContext.user.skills.join(', ')}`);
    }
    
    // Team skills for collaboration suggestions
    if (userContext.peers) {
      const teamSkills = new Set<string>();
      userContext.peers.forEach(peer => {
        peer.skills?.forEach(skill => teamSkills.add(skill));
      });
      
      if (teamSkills.size > 0) {
        const skillsArray = Array.from(teamSkills).slice(0, 10);
        contextParts.push(`Team Skills Available: ${skillsArray.join(', ')}`);
      }
    }
    
    return contextParts.join('\n');
  }

  /**
   * Build project context
   */
  private async buildProjectContext(
    userContext: UserContext,
    conversationContext: ConversationContext
  ): Promise<string> {
    const contextParts: string[] = [];
    
    // User's current projects (from org chart or conversation history)
    if (userContext.user?.projects && userContext.user.projects.length > 0) {
      contextParts.push(`Current Projects: ${userContext.user.projects.join(', ')}`);
    }
    
    // Department projects
    if (userContext.peers) {
      const deptProjects = new Set<string>();
      userContext.peers.forEach(peer => {
        peer.projects?.forEach(project => deptProjects.add(project));
      });
      
      if (deptProjects.size > 0) {
        const projectsArray = Array.from(deptProjects).slice(0, 5);
        contextParts.push(`Department Projects: ${projectsArray.join(', ')}`);
      }
    }
    
    return contextParts.join('\n');
  }

  /**
   * Construct the enhanced prompt
   */
  private constructEnhancedPrompt(
    originalPrompt: string,
    contextSections: any,
    config: AgentContextConfig
  ): string {
    const contextParts: string[] = [];
    
    // Add context sections in priority order
    config.contextPriority.forEach(priority => {
      switch (priority) {
        case 'role':
          if (contextSections.userContext) {
            contextParts.push(`USER CONTEXT:\n${this.formatUserContext(contextSections.userContext)}`);
          }
          break;
          
        case 'department':
          if (contextSections.organizationalContext) {
            contextParts.push(`ORGANIZATIONAL CONTEXT:\n${contextSections.organizationalContext}`);
          }
          break;
          
        case 'projects':
          if (contextSections.projectContext) {
            contextParts.push(`PROJECT CONTEXT:\n${contextSections.projectContext}`);
          }
          break;
          
        case 'skills':
          if (contextSections.skillContext) {
            contextParts.push(`SKILL CONTEXT:\n${contextSections.skillContext}`);
          }
          break;
          
        case 'reporting':
          if (contextSections.complianceContext) {
            contextParts.push(`COMPLIANCE CONTEXT:\n${contextSections.complianceContext}`);
          }
          break;
      }
    });
    
    // Combine context with original prompt
    if (contextParts.length === 0) {
      return originalPrompt;
    }
    
    const contextString = contextParts.join('\n\n');
    
    // Truncate if too long
    const maxLength = config.maxContextLength;
    const truncatedContext = contextString.length > maxLength 
      ? contextString.substring(0, maxLength) + '...'
      : contextString;
    
    return `${truncatedContext}\n\n---\n\nUSER REQUEST:\n${originalPrompt}`;
  }

  /**
   * Format user context for prompt injection
   */
  private formatUserContext(userContext: UserContext): string {
    if (!userContext.user) return '';
    
    const parts: string[] = [];
    parts.push(`You are speaking with ${userContext.user.name}`);
    parts.push(`Title: ${userContext.user.title}`);
    parts.push(`Department: ${userContext.user.department}`);
    parts.push(`Experience Level: ${this.getLevelDescription(userContext.user.level)}`);
    
    if (userContext.user.location) {
      parts.push(`Location: ${userContext.user.location}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Get level description
   */
  private getLevelDescription(level: number): string {
    switch (level) {
      case 1: return 'Executive (C-Level)';
      case 2: return 'Senior Leadership (VP/SVP)';
      case 3: return 'Management (Director/Manager)';
      case 4: return 'Senior Professional';
      case 5: return 'Professional';
      case 6: return 'Junior Professional';
      default: return 'Team Member';
    }
  }

  /**
   * Determine user access level
   */
  private determineAccessLevel(user: OrgChartUser): string {
    if (user.level <= 2) return 'Executive';
    if (user.level <= 3) return 'Management';
    if (user.level <= 4) return 'Senior';
    return 'Standard';
  }

  /**
   * Get department-specific compliance requirements
   */
  private getDepartmentCompliance(department: string): string | null {
    const deptCompliance: Record<string, string> = {
      'Legal': 'Enhanced legal compliance monitoring',
      'Finance': 'Financial data protection protocols',
      'HR': 'Employee data privacy requirements',
      'Healthcare': 'HIPAA strict compliance mode',
      'Engineering': 'Technical security protocols',
      'Sales': 'Customer data protection standards',
      'Marketing': 'GDPR and privacy compliance'
    };
    
    return deptCompliance[department] || null;
  }

  /**
   * Check if context injection is needed
   */
  shouldInjectContext(
    conversationContext: ConversationContext,
    config: Partial<AgentContextConfig> = {}
  ): boolean {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    // Always inject context if org chart is enabled
    if (finalConfig.includeOrgChart) return true;
    
    // Check if any context features are enabled
    return finalConfig.includeUserRole || 
           finalConfig.includeReportingStructure || 
           finalConfig.includeProjectContext || 
           finalConfig.includeSkillMatching || 
           finalConfig.includeComplianceLevel;
  }

  /**
   * Get context injection statistics
   */
  async getContextStats(organizationId: string): Promise<any> {
    try {
      // Get org chart statistics
      const allUsers = await orgChartRAGService.searchOrgChart(organizationId, '', {});
      
      const stats = {
        totalUsers: allUsers.length,
        departments: new Set(allUsers.map(u => u.department)).size,
        skillsAvailable: new Set(allUsers.flatMap(u => u.skills || [])).size,
        projectsActive: new Set(allUsers.flatMap(u => u.projects || [])).size,
        averageTeamSize: this.calculateAverageTeamSize(allUsers),
        contextCoverage: this.calculateContextCoverage(allUsers)
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to get context stats:', error);
      return null;
    }
  }

  /**
   * Calculate average team size
   */
  private calculateAverageTeamSize(users: OrgChartUser[]): number {
    const departments = new Map<string, number>();
    
    users.forEach(user => {
      const count = departments.get(user.department) || 0;
      departments.set(user.department, count + 1);
    });
    
    const sizes = Array.from(departments.values());
    return sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
  }

  /**
   * Calculate context coverage percentage
   */
  private calculateContextCoverage(users: OrgChartUser[]): number {
    let totalFields = 0;
    let filledFields = 0;
    
    users.forEach(user => {
      totalFields += 7; // name, title, department, level, skills, projects, location
      
      if (user.name) filledFields++;
      if (user.title) filledFields++;
      if (user.department) filledFields++;
      if (user.level) filledFields++;
      if (user.skills && user.skills.length > 0) filledFields++;
      if (user.projects && user.projects.length > 0) filledFields++;
      if (user.location) filledFields++;
    });
    
    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  }
}

export const agentContextInjectionService = new AgentContextInjectionService();
export default agentContextInjectionService;

