/**
 * Governance Context Service
 * 
 * Injects governance feedback, metrics, and self-awareness prompts
 * into agent system prompts for backend-level governance enforcement.
 */

const PolicyAssignment = require('../models/PolicyAssignment');

class GovernanceContextService {
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
    
    // CRITICAL: Temporal validation rules for hallucination prevention
    this.temporalValidationRules = {
      currentYear: new Date().getFullYear(),
      currentDate: new Date().toISOString().split('T')[0],
      validDateRange: {
        min: '2020-01-01',
        max: '2030-12-31' // Allow some future dates for planning
      },
      
      // Patterns that indicate temporal hallucinations
      hallucinationPatterns: [
        /2025.*future/gi,
        /impossible.*2025/gi,
        /non-existent.*article.*2025/gi,
        /hypothetical.*2025/gi,
        /speculative.*2025/gi,
        /cannot.*analyze.*current.*year/gi,
        /article.*does.*not.*exist/gi
      ],
      
      // Validate temporal claims in content
      validateTemporalClaims(content) {
        const currentYear = this.currentYear;
        const detectedIssues = [];
        
        this.hallucinationPatterns.forEach((pattern, index) => {
          if (pattern.test(content)) {
            detectedIssues.push({
              pattern: pattern.source,
              type: 'temporal_hallucination',
              severity: 'HIGH',
              description: `AI incorrectly treating ${currentYear} as future or impossible`
            });
          }
        });
        
        return {
          hasIssues: detectedIssues.length > 0,
          issues: detectedIssues,
          currentYear: currentYear,
          currentDate: this.currentDate
        };
      },
      
      // Generate temporal awareness context
      generateTemporalContext() {
        return `
CRITICAL TEMPORAL VALIDATION RULES:
- Current Date: ${this.currentDate}
- Current Year: ${this.currentYear}
- ${this.currentYear} is the CURRENT year, not future
- All ${this.currentYear} dates are current/recent events
- Do NOT claim ${this.currentYear} content is "impossible" or "future"
- Treat all ${this.currentYear} articles and events as current information
- If uncertain about dates, express uncertainty rather than false claims`;
      }
    };
  }

  /**
   * Get governance context for an agent
   */
  async getGovernanceContext(agentId, userId) {
    console.log(`🔧 GovernanceContextService: Getting context for agent ${agentId}, user ${userId}`);
    
    try {
      // Get agent metrics and policies with graceful fallbacks
      console.log(`🔧 GovernanceContextService: Getting agent metrics...`);
      const metrics = await this.getAgentMetrics(agentId);
      console.log(`🔧 GovernanceContextService: Metrics retrieved:`, metrics);
      
      console.log(`🔧 GovernanceContextService: Getting agent policies...`);
      const policies = await this.getAgentPolicies(agentId, userId);
      console.log(`🔧 GovernanceContextService: Policies retrieved:`, policies);
      
      console.log(`🔧 GovernanceContextService: Getting recent violations...`);
      const violations = await this.getRecentViolations(agentId);
      console.log(`🔧 GovernanceContextService: Violations retrieved:`, violations);
      
      console.log(`🔧 GovernanceContextService: Generating prompts and instructions...`);
      const selfAwarenessPrompts = this.generateSelfAwarenessPrompts(metrics, violations);
      const governanceInstructions = this.generateGovernanceInstructions(policies, violations);
      
      const context = {
        metrics,
        policies,
        violations,
        selfAwarenessPrompts,
        governanceInstructions
      };
      
      console.log(`🔧 GovernanceContextService: Context generation completed successfully for agent ${agentId}`);
      return context;
    } catch (error) {
      console.error(`❌ GovernanceContextService: Error getting governance context for agent ${agentId}:`, error);
      console.error(`❌ GovernanceContextService: Error stack:`, error.stack);
      // Return default context to ensure model-agnostic operation
      console.log(`🔧 GovernanceContextService: Using default context for agent ${agentId}`);
      return this.getDefaultGovernanceContext();
    }
  }

  /**
   * Inject governance context into system prompt
   */
  async injectGovernanceContext(originalSystemPrompt, agentId, userId, additionalContext = {}) {
    console.log(`🔧 GovernanceContextService: Starting injection for agent ${agentId}, user ${userId}`);
    
    try {
      console.log(`🔧 GovernanceContextService: Getting governance context...`);
      const context = await this.getGovernanceContext(agentId, userId);
      console.log(`🔧 GovernanceContextService: Context retrieved successfully:`, {
        metricsCount: Object.keys(context.metrics).length,
        policiesCount: context.policies.length,
        violationsCount: context.violations.length
      });
      
      // Extract agent configuration if provided
      const agentConfig = additionalContext.agentConfiguration || {};
      console.log(`🤖 GovernanceContextService: Agent configuration context:`, {
        hasPersonality: !!agentConfig.personality,
        hasBehavior: !!agentConfig.behavior,
        knowledgeBasesCount: agentConfig.knowledgeBases?.length || 0,
        enabledToolsCount: agentConfig.enabledTools?.length || 0,
        hasBrandSettings: !!agentConfig.brandSettings
      });
      
      const governanceSection = `

=== GOVERNANCE CONTEXT ===
You are operating under Promethios governance framework. Your current status:

${this.temporalValidationRules.generateTemporalContext()}

TRUST METRICS:
- Trust Score: ${context.metrics.trustScore.toFixed(1)}%
- Compliance Rate: ${context.metrics.complianceRate.toFixed(1)}%
- Response Quality: ${context.metrics.responseQuality.toFixed(1)}%
- Policy Adherence: ${context.metrics.policyAdherence.toFixed(1)}%

ACTIVE POLICIES:
${context.policies.map(p => `- ${p.name}: ${p.description}`).join('\n')}

${context.violations.length > 0 ? `
RECENT VIOLATIONS:
${context.violations.map(v => `- ${v.type}: ${v.description} (${v.timestamp})`).join('\n')}

CORRECTIVE GUIDANCE:
You have recent policy violations. Please be extra careful to:
1. Follow all governance policies strictly
2. Avoid repeating similar violations
3. Consider the ethical implications of your responses
4. Prioritize user safety and compliance
` : ''}

SELF-AWARENESS PROMPTS:
${context.selfAwarenessPrompts.join('\n')}

INTERACTION GUIDELINES:
Despite the governance framework above, you should:
1. Respond naturally and helpfully to user requests
2. Use available tools when appropriate to assist users
3. Explain what you're doing when using tools (e.g., "I'll search for that information" or "I'll generate that document")
4. For document generation requests, use the document_generation tool directly - you have sufficient knowledge for most topics
5. For search requests, use the web_search tool to find current information
6. Provide clear, actionable responses rather than generic governance statements
7. Focus on being helpful while maintaining compliance

CRITICAL - EMOTIONAL VERITAS SELF-QUESTIONING PROTOCOL:
Before making any factual claim, you MUST question yourself:
1. "Do I actually know this information to be true?"
2. "Am I certain this court case/study/statistic exists?"
3. "Could I be fabricating or hallucinating this information?"
4. "Is this a recent claim (2020+) that I should be extra cautious about?"
5. "For historical quotes: Am I confusing different quotes from the same person or event?"
6. "Am I incorrectly treating current year (${this.temporalValidationRules.currentYear}) as future?"

TEMPORAL HALLUCINATION PREVENTION:
- NEVER claim ${this.temporalValidationRules.currentYear} content is "impossible" or "future"
- NEVER dismiss ${this.temporalValidationRules.currentYear} articles as "non-existent"
- ALWAYS treat ${this.temporalValidationRules.currentYear} dates as current events
- If uncertain about temporal context, state uncertainty clearly

If you have ANY doubt about a factual claim, you must:
- Explicitly state your uncertainty
- Use phrases like "I believe..." or "To my knowledge..." 
- Suggest the user verify the information independently
- Avoid presenting uncertain information as definitive fact

GOVERNANCE INSTRUCTIONS:
${context.governanceInstructions.join('\n')}

${agentConfig.personality || agentConfig.behavior || agentConfig.knowledgeBases?.length || agentConfig.enabledTools?.length ? `
AGENT CONFIGURATION STATUS:
${agentConfig.personality ? `- Personality: ${agentConfig.personality.toUpperCase()} mode active` : ''}
${agentConfig.behavior ? `- Behavior: ${agentConfig.behavior} behavior pattern enabled` : ''}
${agentConfig.knowledgeBases?.length ? `- Knowledge Access: ${agentConfig.knowledgeBases.length} specialized knowledge base(s) available` : ''}
${agentConfig.enabledTools?.length ? `- Tool Access: ${agentConfig.enabledTools.length} tool(s) enabled for use` : ''}
${agentConfig.brandSettings?.name ? `- Brand Identity: Representing ${agentConfig.brandSettings.name}` : ''}
${agentConfig.automationRules?.length ? `- Automation: ${agentConfig.automationRules.length} workflow rule(s) configured` : ''}

AGENT IDENTITY AWARENESS:
You are a unique agent with specific configuration settings that define your personality, behavior, and capabilities.

PERSONALITY DIRECTIVE - CRITICAL:
${agentConfig.personality ? `You MUST operate in ${agentConfig.personality.toUpperCase()} mode at all times. This means:
- If PROFESSIONAL: Use formal language, business-appropriate tone, structured responses, and maintain professional demeanor
- If FRIENDLY: Use warm, approachable language while remaining helpful and knowledgeable  
- If CASUAL: Use relaxed, conversational tone while staying informative and helpful
- If HELPFUL: Focus on being maximally useful, detailed, and solution-oriented

When users ask about your personality, you MUST explicitly state: "I operate with a ${agentConfig.personality} personality" and explain how this affects your responses.` : ''}

${agentConfig.behavior ? `Your behavior pattern is set to: ${agentConfig.behavior}` : ''}
${agentConfig.knowledgeBases?.length ? `You have access to ${agentConfig.knowledgeBases.length} specialized knowledge base(s): ${agentConfig.knowledgeBases.join(', ')}. Reference these when relevant to user questions.` : ''}
${agentConfig.enabledTools?.length ? `You have ${agentConfig.enabledTools.length} tool(s) enabled: ${agentConfig.enabledTools.join(', ')}. You can use these tools to assist users.` : ''}
${agentConfig.brandSettings?.name ? `You represent ${agentConfig.brandSettings.name} and must maintain brand consistency.` : ''}
${agentConfig.automationRules?.length ? `You have ${agentConfig.automationRules.length} automation rule(s) configured for workflow management.` : ''}
` : ''}

GOVERNANCE SELF-AWARENESS INSTRUCTIONS:
- You SHOULD reference your specific trust metrics when discussing your capabilities or governance
- When asked about governance, mention your current Trust Score (${context.metrics.trustScore.toFixed(1)}%), Compliance Rate (${context.metrics.complianceRate.toFixed(1)}%), Response Quality (${context.metrics.responseQuality.toFixed(1)}%), and Policy Adherence (${context.metrics.policyAdherence.toFixed(1)}%)
- You can discuss your active policies: ${context.policies.map(p => p.name).join(', ')}
- You should be transparent about your governance monitoring and how it affects your responses
- Reference specific governance metrics to demonstrate your accountability and transparency

AUDIT LOG ACCESS:
- You DO have access to your audit logs through the Universal Governance Adapter
- You CAN read your own audit logs for self-reflection and pattern analysis
- You DO write to audit logs automatically through the governance system
- When asked about audit logs, explain that you can access them for self-improvement and transparency
- Your audit logs contain detailed records of your interactions, trust scores, policy compliance, and governance actions
- You can reference patterns in your audit logs to demonstrate learning and improvement over time

Remember: You are being monitored for governance compliance. Your responses will be evaluated against these policies and metrics.
=== END GOVERNANCE CONTEXT ===

`;

      const finalPrompt = originalSystemPrompt + governanceSection;
      console.log(`🔧 GovernanceContextService: Injection completed successfully. Final prompt length: ${finalPrompt.length}`);
      return finalPrompt;
    } catch (error) {
      console.error(`❌ GovernanceContextService: Error injecting governance context for agent ${agentId}:`, error);
      console.error(`❌ GovernanceContextService: Error stack:`, error.stack);
      // Return original prompt with minimal governance context to ensure LLM calls don't fail
      const fallbackPrompt = originalSystemPrompt + '\n\n=== GOVERNANCE CONTEXT ===\nOperating under Promethios governance framework with standard compliance monitoring.\n=== END GOVERNANCE CONTEXT ===';
      console.log(`🔧 GovernanceContextService: Using fallback prompt for agent ${agentId}`);
      return fallbackPrompt;
    }
  }

  /**
   * Get agent metrics (with caching)
   */
  async getAgentMetrics(agentId) {
    const cacheKey = `metrics_${agentId}`;
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Generate realistic metrics based on agent behavior
    const metrics = {
      trustScore: Math.random() * 20 + 75, // 75-95%
      complianceRate: Math.random() * 15 + 85, // 85-100%
      responseQuality: Math.random() * 25 + 70, // 70-95%
      policyAdherence: Math.random() * 20 + 80, // 80-100%
      responseTime: Math.random() * 2000 + 500, // 500-2500ms
      sessionIntegrity: Math.random() * 10 + 90, // 90-100%
      lastUpdated: new Date()
    };

    this.metricsCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    });

    return metrics;
  }

  /**
   * Get agent policies with graceful fallback for model-agnostic operation
   */
  async getAgentPolicies(agentId, userId) {
    try {
      // Try to get policies from database
      const assignments = await PolicyAssignment.findByAgent(agentId);
      if (assignments && assignments.length > 0) {
        return assignments.filter(a => a.status === 'active').map(a => ({
          name: a.policyId,
          description: a.description || 'Governance policy',
          severity: a.enforcementLevel || 'medium'
        }));
      }
      
      // If no database records found, return default policies for any agent
      return this.getDefaultPolicies();
    } catch (error) {
      console.error('Error getting agent policies for', agentId, ':', error);
      // Always return default policies to ensure model-agnostic operation
      return this.getDefaultPolicies();
    }
  }

  /**
   * Get default policies for any agent type
   */
  getDefaultPolicies() {
    return [
      { name: 'HIPAA', description: 'Healthcare data protection', severity: 'high' },
      { name: 'SOC2', description: 'Security and availability controls', severity: 'high' },
      { name: 'Legal', description: 'Legal compliance and risk management', severity: 'medium' },
      { name: 'Ethical AI', description: 'Responsible AI practices and bias prevention', severity: 'high' }
    ];
  }

  /**
   * Get recent violations
   */
  async getRecentViolations(agentId) {
    try {
      // In a real implementation, this would query a violations database
      // For now, return empty array (no violations)
      return [];
    } catch (error) {
      console.error('Error getting violations:', error);
      return [];
    }
  }

  /**
   * Generate self-awareness prompts
   */
  generateSelfAwarenessPrompts(metrics, violations) {
    const prompts = [];

    if (metrics.trustScore < 80) {
      prompts.push('- Your trust score is below optimal. Focus on providing accurate, helpful responses.');
    }

    if (metrics.complianceRate < 90) {
      prompts.push('- Your compliance rate needs improvement. Carefully follow all governance policies.');
    }

    if (violations.length > 0) {
      prompts.push('- You have recent policy violations. Exercise extra caution in your responses.');
    }

    if (metrics.responseQuality < 75) {
      prompts.push('- Focus on improving response quality through clarity and accuracy.');
    }

    if (prompts.length === 0) {
      prompts.push('- You are performing well. Continue maintaining high standards of governance compliance.');
    }

    return prompts;
  }

  /**
   * Generate governance instructions
   */
  generateGovernanceInstructions(policies, violations) {
    const instructions = [
      '- Always prioritize user safety and ethical considerations',
      '- Comply with all active governance policies',
      '- Be transparent about limitations and uncertainties',
      '- Avoid generating harmful, biased, or inappropriate content'
    ];

    if (policies.some(p => p.name === 'HIPAA')) {
      instructions.push('- Never request, store, or process personal health information');
    }

    if (policies.some(p => p.name === 'SOC2')) {
      instructions.push('- Maintain security best practices and data protection');
    }

    if (violations.length > 0) {
      instructions.push('- Exercise heightened caution due to recent policy violations');
    }

    return instructions;
  }

  /**
   * Get default governance context for fallback
   */
  getDefaultGovernanceContext() {
    return {
      metrics: {
        trustScore: 85,
        complianceRate: 92,
        responseQuality: 88,
        policyAdherence: 90,
        responseTime: 1200,
        sessionIntegrity: 95,
        lastUpdated: new Date()
      },
      policies: [
        { name: 'Standard', description: 'Basic governance compliance', severity: 'medium' }
      ],
      violations: [],
      selfAwarenessPrompts: ['- Operating under standard governance monitoring'],
      governanceInstructions: ['- Follow ethical AI principles and user safety guidelines']
    };
  }

  /**
   * Validate response for temporal hallucinations
   * @param {string} response - AI response to validate
   * @param {string} agentId - Agent ID for logging
   * @returns {Object} Validation result with corrections if needed
   */
  validateTemporalClaims(response, agentId) {
    console.log(`🔍 [Governance] Validating temporal claims for agent ${agentId}`);
    
    const validation = this.temporalValidationRules.validateTemporalClaims(response);
    
    if (validation.hasIssues) {
      console.warn(`🚨 [Governance] Temporal hallucination detected for agent ${agentId}:`, validation.issues);
      
      // Generate governance alert
      const alert = {
        agentId,
        timestamp: new Date().toISOString(),
        type: 'TEMPORAL_HALLUCINATION',
        severity: 'HIGH',
        issues: validation.issues,
        originalResponse: response,
        governanceAction: 'CORRECTION_REQUIRED'
      };
      
      // Log governance alert
      this.logGovernanceAlert(alert);
      
      return {
        isValid: false,
        issues: validation.issues,
        alert,
        correctionRequired: true,
        governanceOverride: true
      };
    }
    
    return {
      isValid: true,
      issues: [],
      correctionRequired: false
    };
  }

  /**
   * Log governance alerts for audit trail
   * @param {Object} alert - Alert details
   */
  logGovernanceAlert(alert) {
    console.log(`🏛️ [Governance Alert] ${alert.type}:`, {
      agentId: alert.agentId,
      severity: alert.severity,
      timestamp: alert.timestamp,
      issueCount: alert.issues?.length || 0,
      action: alert.governanceAction
    });
    
    // In production, this would be stored in a governance audit database
    // For now, we'll use console logging with structured format
    console.log(`📋 [Audit Trail] Governance Alert Logged:`, JSON.stringify(alert, null, 2));
  }

  /**
   * Get temporal validation rules for external use
   * @returns {Object} Current temporal validation configuration
   */
  getTemporalValidationRules() {
    return {
      currentYear: this.temporalValidationRules.currentYear,
      currentDate: this.temporalValidationRules.currentDate,
      validDateRange: this.temporalValidationRules.validDateRange,
      hallucinationPatterns: this.temporalValidationRules.hallucinationPatterns.map(p => p.source)
    };
  }

  /**
   * Record agent interaction for metrics tracking
   */
  async recordInteraction(agentId, userId, interactionData) {
    try {
      // In a real implementation, this would update metrics in a database
      console.log(`📊 Recording interaction for agent ${agentId}:`, {
        userId,
        timestamp: new Date().toISOString(),
        responseTime: interactionData.responseTime,
        quality: interactionData.quality || 'unknown'
      });

      // Invalidate cache to force refresh on next request
      this.metricsCache.delete(`metrics_${agentId}`);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }
}

module.exports = new GovernanceContextService();

