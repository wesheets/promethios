import { agentIdentityRegistry } from './AgentIdentityRegistry';
import { agentEvaluationService, scorecardMetricRegistry } from './ScorecardServices';
import { agentAttestationService } from './AttestationAndRoleServices';
import { AgentWrapper } from '../../agent-wrapping/types';

/**
 * AgentWrapperIntegrationService - Integrates Agent Identity and Scorecard modules 
 * with the Agent Wrapper system for automatic assignment
 */
export class AgentWrapperIntegrationService {
  private static instance: AgentWrapperIntegrationService;

  private constructor() {}

  public static getInstance(): AgentWrapperIntegrationService {
    if (!AgentWrapperIntegrationService.instance) {
      AgentWrapperIntegrationService.instance = new AgentWrapperIntegrationService();
    }
    return AgentWrapperIntegrationService.instance;
  }

  /**
   * Called when an agent is successfully wrapped
   * Creates identity, assigns default scorecard template, and initial attestations
   * @param wrappedAgent - The wrapped agent data
   * @param userId - The user who wrapped the agent
   * @returns Promise<string> - The created agent identity ID
   */
  async onAgentWrapped(wrappedAgent: AgentWrapper, userId: string): Promise<string> {
    try {
      console.log('Processing agent wrapping completion for:', wrappedAgent.name);

      // Step 1: Create Agent Identity
      const agentIdentityId = await this.createAgentIdentity(wrappedAgent, userId);
      
      // Step 2: Assign Default Scorecard Template and Run Initial Evaluation
      await this.assignDefaultScorecardAndEvaluate(agentIdentityId);
      
      // Step 3: Add Initial Attestations
      await this.addInitialAttestations(agentIdentityId, wrappedAgent);
      
      // Step 4: Trigger any additional governance setup
      await this.setupGovernanceProfile(agentIdentityId, wrappedAgent);

      console.log('Agent wrapping integration completed successfully:', agentIdentityId);
      return agentIdentityId;
    } catch (error) {
      console.error('Error in agent wrapping integration:', error);
      throw new Error('Failed to complete agent wrapping integration');
    }
  }

  /**
   * Create an agent identity from wrapped agent data
   */
  private async createAgentIdentity(wrappedAgent: AgentWrapper, userId: string): Promise<string> {
    const agentIdentity = {
      name: wrappedAgent.name,
      version: '1.0.0', // Initial version
      description: wrappedAgent.description || `Wrapped agent: ${wrappedAgent.name}`,
      ownerId: userId,
      tags: this.generateTagsFromWrapper(wrappedAgent),
      status: 'active' as const,
      modelLink: {
        type: 'custom_wrapper_id' as const,
        identifier: wrappedAgent.id,
        credentialsId: wrappedAgent.apiKey ? 'encrypted_key_ref' : undefined
      },
      governanceProfileId: undefined, // Will be set up later
      attestations: [], // Will be populated separately
      assignedRoles: [] // Will be assigned based on agent type
    };

    return await agentIdentityRegistry.registerAgent(agentIdentity);
  }

  /**
   * Generate relevant tags from the wrapped agent configuration
   */
  private generateTagsFromWrapper(wrappedAgent: AgentWrapper): string[] {
    const tags: string[] = [];
    
    // Add provider tag
    if (wrappedAgent.provider) {
      tags.push(`provider:${wrappedAgent.provider.toLowerCase()}`);
    }
    
    // Add model tag if available
    if (wrappedAgent.model) {
      tags.push(`model:${wrappedAgent.model.toLowerCase()}`);
    }
    
    // Add capability tags based on schema
    if (wrappedAgent.inputSchema) {
      tags.push('has-input-schema');
    }
    if (wrappedAgent.outputSchema) {
      tags.push('has-output-schema');
    }
    
    // Add governance tags
    if (wrappedAgent.governanceRules && wrappedAgent.governanceRules.length > 0) {
      tags.push('governance-enabled');
    }
    
    // Add security level tag
    const securityScore = this.calculateSecurityScore(wrappedAgent);
    if (securityScore >= 80) {
      tags.push('high-security');
    } else if (securityScore >= 60) {
      tags.push('medium-security');
    } else {
      tags.push('low-security');
    }
    
    return tags;
  }

  /**
   * Calculate a basic security score for the wrapped agent
   */
  private calculateSecurityScore(wrappedAgent: AgentWrapper): number {
    let score = 50; // Base score
    
    // API key security
    if (wrappedAgent.apiKey) {
      score += 20; // Has authentication
    }
    
    // Schema validation
    if (wrappedAgent.inputSchema && wrappedAgent.outputSchema) {
      score += 15; // Has input/output validation
    }
    
    // Governance rules
    if (wrappedAgent.governanceRules && wrappedAgent.governanceRules.length > 0) {
      score += 15; // Has governance controls
    }
    
    return Math.min(100, score);
  }

  /**
   * Assign default scorecard template and run initial evaluation
   */
  private async assignDefaultScorecardAndEvaluate(agentIdentityId: string): Promise<void> {
    try {
      // Create or get default scorecard template
      const defaultTemplate = await this.getOrCreateDefaultScorecardTemplate();
      
      // Run initial evaluation
      const initialContext = {
        timePeriod: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date()
        }
      };
      
      const evaluationResult = await agentEvaluationService.evaluateAgent(
        agentIdentityId,
        defaultTemplate.id,
        initialContext
      );
      
      console.log('Initial scorecard evaluation completed:', evaluationResult.overallScore);
    } catch (error) {
      console.error('Error in scorecard assignment and evaluation:', error);
      // Don't throw - this is not critical for agent wrapping
    }
  }

  /**
   * Get or create the default scorecard template
   */
  private async getOrCreateDefaultScorecardTemplate() {
    const templates = await agentEvaluationService.listScorecardTemplates();
    
    // Look for existing default template
    let defaultTemplate = templates.find(t => t.name === 'Default Agent Scorecard');
    
    if (!defaultTemplate) {
      // Create default template with core metrics
      const defaultTemplateData = {
        name: 'Default Agent Scorecard',
        description: 'Standard scorecard template for newly wrapped agents',
        metricIds: [
          'accuracy',
          'response-time',
          'governance-compliance',
          'bias-fairness'
        ],
        metricWeights: {
          'accuracy': 0.3,
          'response-time': 0.2,
          'governance-compliance': 0.3,
          'bias-fairness': 0.2
        }
      };
      
      const templateId = await agentEvaluationService.saveScorecardTemplate(defaultTemplateData);
      defaultTemplate = { id: templateId, ...defaultTemplateData };
    }
    
    return defaultTemplate;
  }

  /**
   * Add initial attestations based on agent configuration
   */
  private async addInitialAttestations(agentIdentityId: string, wrappedAgent: AgentWrapper): Promise<void> {
    try {
      const attestations = [];
      
      // Basic security attestation if agent has API key
      if (wrappedAgent.apiKey) {
        attestations.push({
          type: 'basic-security',
          issuer: 'Promethios System',
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          evidenceLink: undefined,
          status: 'active' as const
        });
      }
      
      // Schema validation attestation
      if (wrappedAgent.inputSchema && wrappedAgent.outputSchema) {
        attestations.push({
          type: 'schema-validation',
          issuer: 'Promethios System',
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
          evidenceLink: undefined,
          status: 'active' as const
        });
      }
      
      // Governance compliance attestation
      if (wrappedAgent.governanceRules && wrappedAgent.governanceRules.length > 0) {
        attestations.push({
          type: 'governance-setup',
          issuer: 'Promethios System',
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          evidenceLink: undefined,
          status: 'active' as const
        });
      }
      
      // Add all attestations
      for (const attestation of attestations) {
        await agentAttestationService.addAttestation(agentIdentityId, attestation);
      }
      
      console.log(`Added ${attestations.length} initial attestations for agent:`, agentIdentityId);
    } catch (error) {
      console.error('Error adding initial attestations:', error);
      // Don't throw - this is not critical for agent wrapping
    }
  }

  /**
   * Set up governance profile for the agent
   */
  private async setupGovernanceProfile(agentIdentityId: string, wrappedAgent: AgentWrapper): Promise<void> {
    try {
      // Create a basic governance profile ID based on the agent's configuration
      let governanceProfileId = 'basic-profile';
      
      if (wrappedAgent.governanceRules && wrappedAgent.governanceRules.length > 0) {
        governanceProfileId = 'enhanced-profile';
      }
      
      // Update the agent identity with the governance profile
      await agentIdentityRegistry.updateAgentIdentity(agentIdentityId, {
        governanceProfileId
      });
      
      console.log('Governance profile set up for agent:', agentIdentityId);
    } catch (error) {
      console.error('Error setting up governance profile:', error);
      // Don't throw - this is not critical for agent wrapping
    }
  }

  /**
   * Called when an agent wrapper is updated
   * Updates the corresponding agent identity and triggers re-evaluation
   */
  async onAgentWrapperUpdated(wrappedAgent: AgentWrapper, userId: string): Promise<void> {
    try {
      // Find the agent identity by wrapper ID
      const agents = await agentIdentityRegistry.listAgents({ ownerId: userId });
      const agentIdentity = agents.find(agent => 
        agent.modelLink?.identifier === wrappedAgent.id
      );
      
      if (!agentIdentity) {
        console.warn('No agent identity found for updated wrapper:', wrappedAgent.id);
        return;
      }
      
      // Update agent identity with new information
      await agentIdentityRegistry.updateAgentIdentity(agentIdentity.id, {
        name: wrappedAgent.name,
        description: wrappedAgent.description || agentIdentity.description,
        tags: this.generateTagsFromWrapper(wrappedAgent)
      });
      
      // Trigger re-evaluation with default template
      const defaultTemplate = await this.getOrCreateDefaultScorecardTemplate();
      await agentEvaluationService.evaluateAgent(
        agentIdentity.id,
        defaultTemplate.id,
        { timePeriod: { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() } }
      );
      
      console.log('Agent wrapper update processed for identity:', agentIdentity.id);
    } catch (error) {
      console.error('Error processing agent wrapper update:', error);
      throw new Error('Failed to process agent wrapper update');
    }
  }

  /**
   * Called when an agent wrapper is deleted
   * Deactivates the corresponding agent identity
   */
  async onAgentWrapperDeleted(wrapperId: string, userId: string): Promise<void> {
    try {
      // Find the agent identity by wrapper ID
      const agents = await agentIdentityRegistry.listAgents({ ownerId: userId });
      const agentIdentity = agents.find(agent => 
        agent.modelLink?.identifier === wrapperId
      );
      
      if (!agentIdentity) {
        console.warn('No agent identity found for deleted wrapper:', wrapperId);
        return;
      }
      
      // Deactivate the agent identity
      await agentIdentityRegistry.deactivateAgent(agentIdentity.id);
      
      console.log('Agent identity deactivated for deleted wrapper:', agentIdentity.id);
    } catch (error) {
      console.error('Error processing agent wrapper deletion:', error);
      throw new Error('Failed to process agent wrapper deletion');
    }
  }

  /**
   * Get agent identity by wrapper ID
   */
  async getAgentIdentityByWrapperId(wrapperId: string, userId: string): Promise<string | null> {
    try {
      const agents = await agentIdentityRegistry.listAgents({ ownerId: userId });
      const agentIdentity = agents.find(agent => 
        agent.modelLink?.identifier === wrapperId
      );
      
      return agentIdentity?.id || null;
    } catch (error) {
      console.error('Error getting agent identity by wrapper ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const agentWrapperIntegrationService = AgentWrapperIntegrationService.getInstance();

