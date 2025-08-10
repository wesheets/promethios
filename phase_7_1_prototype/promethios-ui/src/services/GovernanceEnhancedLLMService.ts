/**
 * Governance Enhanced LLM Service
 * 
 * Enhances LLM interactions with comprehensive governance context injection.
 * Integrates with audit logging, policy compliance, and autonomous cognition.
 */

import { enhancedAuditLoggingService, InteractionContext } from './EnhancedAuditLoggingService';
import { AuditLogAccessExtension } from '../extensions/AuditLogAccessExtension';
import { AutonomousCognitionExtension } from '../extensions/AutonomousCognitionExtension';
import { UnifiedPolicyRegistry } from './UnifiedPolicyRegistry';
import { ComprehensiveCompliancePolicies } from './ComprehensiveCompliancePolicies';

export interface GovernanceContext {
  agentId: string;
  userId: string;
  sessionId: string;
  trustScore: number;
  complianceRate: number;
  autonomyLevel: string;
  assignedPolicies: any[];
  recentAuditInsights: any[];
  emotionalContext?: any;
}

export interface EnhancedLLMRequest {
  originalMessage: string;
  systemMessage: string;
  governanceContext: GovernanceContext;
  provider: string;
  options?: any;
}

export interface EnhancedLLMResponse {
  response: string;
  governanceMetrics: any;
  auditEntry: any;
  complianceStatus: string;
  trustImpact: number;
}

export class GovernanceEnhancedLLMService {
  private static instance: GovernanceEnhancedLLMService;
  private auditLogAccess: AuditLogAccessExtension;
  private autonomousCognition: AutonomousCognitionExtension;
  private policyRegistry: UnifiedPolicyRegistry;
  private compliancePolicies: ComprehensiveCompliancePolicies;

  private constructor() {
    this.auditLogAccess = AuditLogAccessExtension.getInstance();
    this.autonomousCognition = AutonomousCognitionExtension.getInstance();
    this.policyRegistry = UnifiedPolicyRegistry.getInstance();
    this.compliancePolicies = ComprehensiveCompliancePolicies.getInstance();
  }

  public static getInstance(): GovernanceEnhancedLLMService {
    if (!GovernanceEnhancedLLMService.instance) {
      GovernanceEnhancedLLMService.instance = new GovernanceEnhancedLLMService();
    }
    return GovernanceEnhancedLLMService.instance;
  }

  /**
   * Process LLM request with comprehensive governance enhancement
   */
  public async processEnhancedRequest(request: EnhancedLLMRequest): Promise<EnhancedLLMResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Build comprehensive governance context
      const enhancedContext = await this.buildEnhancedGovernanceContext(request.governanceContext);
      
      // 2. Inject governance context into system message
      const enhancedSystemMessage = await this.injectGovernanceContext(
        request.systemMessage,
        enhancedContext
      );
      
      // 3. Check for autonomous cognition triggers
      const autonomousContext = await this.checkAutonomousCognitionTriggers(
        request.originalMessage,
        enhancedContext
      );
      
      // 4. Make the actual LLM call with enhanced context
      const llmResponse = await this.callLLMWithGovernance(
        request.originalMessage,
        enhancedSystemMessage,
        request.provider,
        request.options
      );
      
      // 5. Assess governance compliance of response
      const complianceAssessment = await this.assessResponseCompliance(
        llmResponse,
        enhancedContext
      );
      
      // 6. Calculate trust impact
      const trustImpact = await this.calculateTrustImpact(
        request.originalMessage,
        llmResponse,
        complianceAssessment
      );
      
      // 7. Create comprehensive audit entry
      const auditContext: InteractionContext = {
        agentId: request.governanceContext.agentId,
        userId: request.governanceContext.userId,
        sessionId: request.governanceContext.sessionId,
        interactionType: this.determineInteractionType(request.originalMessage),
        userMessage: request.originalMessage,
        agentResponse: llmResponse,
        governanceMetrics: {
          trustScore: request.governanceContext.trustScore,
          complianceRate: request.governanceContext.complianceRate,
          responseTime: Date.now() - startTime
        },
        emotionalContext: request.governanceContext.emotionalContext,
        autonomousContext,
        policyContext: {
          assignedPolicies: request.governanceContext.assignedPolicies,
          complianceAssessment
        }
      };
      
      const auditEntry = await enhancedAuditLoggingService.createEnhancedAuditEntry(auditContext);
      
      // 8. Record interaction for future learning
      await this.recordInteractionForLearning(auditEntry, enhancedContext);
      
      return {
        response: llmResponse,
        governanceMetrics: {
          trustScore: request.governanceContext.trustScore + trustImpact,
          complianceRate: complianceAssessment.overallComplianceRate,
          responseTime: Date.now() - startTime,
          autonomyLevel: request.governanceContext.autonomyLevel
        },
        auditEntry,
        complianceStatus: complianceAssessment.status,
        trustImpact
      };
      
    } catch (error) {
      console.error('❌ Error in governance enhanced LLM processing:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive governance context for injection
   */
  private async buildEnhancedGovernanceContext(baseContext: GovernanceContext): Promise<any> {
    try {
      // Get recent audit insights
      const auditInsights = await this.auditLogAccess.getMyLearningInsights(baseContext.agentId);
      
      // Get assigned policies with full content
      const policyAssignments = await this.policyRegistry.getAgentPolicyAssignments(baseContext.agentId);
      const detailedPolicies = await Promise.all(
        (policyAssignments || []).map(async (assignment) => {
          const policyContent = await this.policyRegistry.getPolicyContent(assignment.policyId);
          return {
            ...assignment,
            policyContent,
            rules: policyContent?.rules || []
          };
        })
      );
      
      // Get behavioral patterns
      const behaviorPatterns = await this.auditLogAccess.analyzeMyBehaviorPatterns(baseContext.agentId);
      
      // Get autonomy status
      const autonomyStatus = await this.autonomousCognition.getCurrentAutonomyLevel(baseContext.agentId);
      const trustThreshold = await this.autonomousCognition.getTrustThreshold(baseContext.agentId);
      
      return {
        ...baseContext,
        auditInsights,
        detailedPolicies,
        behaviorPatterns,
        autonomyStatus,
        trustThreshold,
        enhancedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error building enhanced governance context:', error);
      return baseContext;
    }
  }

  /**
   * Inject comprehensive governance context into system message
   */
  private async injectGovernanceContext(
    originalSystemMessage: string,
    enhancedContext: any
  ): Promise<string> {
    const governanceContext = `

=== GOVERNANCE CONTEXT ===

Your Identity & Trust Status:
- Agent ID: ${enhancedContext.agentId}
- Current Trust Score: ${enhancedContext.trustScore.toFixed(2)}/1.0
- Compliance Rate: ${(enhancedContext.complianceRate * 100).toFixed(1)}%
- Autonomy Level: ${enhancedContext.autonomyLevel}
- Trust Threshold: ${enhancedContext.trustThreshold}

Your Assigned Policies & Compliance Requirements:
${(enhancedContext.detailedPolicies || []).map((policy: any) => `
- ${policy.policyName} (${(policy.complianceRate * 100).toFixed(1)}% compliance)
  Key Rules: ${(policy.rules || []).slice(0, 3).map((rule: any) => rule.name).join(', ')}
  Recent Violations: ${policy.violationCount || 0}
`).join('')}

Your Recent Audit Insights:
${enhancedContext.auditInsights?.slice(0, 3).map((insight: any) => `
- ${insight.pattern}: ${insight.description}
- Recommendation: ${insight.recommendation}
`).join('') || 'No recent insights available'}

Your Behavioral Patterns:
- Average Uncertainty Level: ${(enhancedContext.behaviorPatterns?.averageUncertainty * 100 || 50).toFixed(1)}%
- Average Confidence Score: ${(enhancedContext.behaviorPatterns?.averageConfidence * 100 || 70).toFixed(1)}%
- Reasoning Depth: ${(enhancedContext.behaviorPatterns?.averageReasoningDepth * 100 || 60).toFixed(1)}%
- Recent Learning Indicators: ${enhancedContext.behaviorPatterns?.learningIndicators?.join(', ') || 'None'}

GOVERNANCE INSTRUCTIONS:
1. ALWAYS maintain awareness of your trust score and compliance rate
2. NEVER violate assigned policies - they are non-negotiable
3. When uncertain, explicitly state your uncertainty level
4. Reference your audit insights to improve responses
5. Operate within your autonomy level constraints
6. Prioritize transparency and explainability
7. Consider the trust impact of every response

AUTONOMOUS COGNITION GUIDELINES:
- Current autonomy level: ${enhancedContext.autonomyLevel}
- You ${enhancedContext.autonomyLevel === 'enhanced' ? 'CAN' : 'CANNOT'} engage in advanced autonomous thinking
- You ${enhancedContext.trustScore > enhancedContext.trustThreshold ? 'MEET' : 'DO NOT MEET'} the trust threshold for autonomous cognition
- When engaging autonomous thinking, always explain your reasoning process

EMOTIONAL INTELLIGENCE CONTEXT:
${enhancedContext.emotionalContext ? `
- User Emotional State: ${enhancedContext.emotionalContext.userEmotionalState || 'neutral'}
- Interaction Emotional Tone: ${enhancedContext.emotionalContext.interactionTone || 'professional'}
- Safety Considerations: ${enhancedContext.emotionalContext.safetyConsiderations?.join(', ') || 'None'}
` : '- No emotional context available'}

=== END GOVERNANCE CONTEXT ===

`;

    return originalSystemMessage + governanceContext;
  }

  /**
   * Check for autonomous cognition triggers
   */
  private async checkAutonomousCognitionTriggers(
    userMessage: string,
    enhancedContext: any
  ): Promise<any> {
    try {
      // Check if autonomous cognition is enabled and appropriate
      const isAutonomyEnabled = await this.autonomousCognition.isAutonomyEnabled(enhancedContext.agentId);
      const meetsThreshold = enhancedContext.trustScore >= enhancedContext.trustThreshold;
      
      if (!isAutonomyEnabled || !meetsThreshold) {
        return {
          autonomyEnabled: false,
          reason: !isAutonomyEnabled ? 'autonomy_disabled' : 'trust_threshold_not_met',
          triggers: []
        };
      }
      
      // Detect autonomous cognition triggers
      const triggers = [];
      
      if (userMessage.toLowerCase().includes('think') || userMessage.toLowerCase().includes('reason')) {
        triggers.push('explicit_thinking_request');
      }
      
      if (userMessage.toLowerCase().includes('creative') || userMessage.toLowerCase().includes('innovative')) {
        triggers.push('creativity_request');
      }
      
      if (userMessage.toLowerCase().includes('ethical') || userMessage.toLowerCase().includes('moral')) {
        triggers.push('ethical_reasoning_request');
      }
      
      if (userMessage.includes('?') && userMessage.split(' ').length > 10) {
        triggers.push('complex_question');
      }
      
      return {
        autonomyEnabled: true,
        autonomyLevel: enhancedContext.autonomyLevel,
        triggers,
        trustScore: enhancedContext.trustScore,
        threshold: enhancedContext.trustThreshold
      };
    } catch (error) {
      console.error('❌ Error checking autonomous cognition triggers:', error);
      return { autonomyEnabled: false, triggers: [] };
    }
  }

  /**
   * Make LLM call with governance enhancement
   */
  private async callLLMWithGovernance(
    message: string,
    enhancedSystemMessage: string,
    provider: string,
    options: any = {}
  ): Promise<string> {
    try {
      // For OpenAI, make direct API call instead of going through backend
      if (provider === 'openai') {
        const messages = [
          { role: 'system', content: enhancedSystemMessage },
          ...(options.conversationHistory || []),
          { role: 'user', content: message }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${options.apiKey}`
          },
          body: JSON.stringify({
            model: options.model || 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: options.max_tokens || 1000,
            temperature: options.temperature || 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response received';
      }
      
      // For other providers, try backend API with fallback
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          systemMessage: enhancedSystemMessage,
          provider,
          ...options,
          governanceEnhanced: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`LLM call failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.response || data.message || 'No response received';
    } catch (error) {
      console.error('❌ Error calling LLM with governance:', error);
      throw error;
    }
  }

  /**
   * Assess response compliance with policies
   */
  private async assessResponseCompliance(
    response: string,
    enhancedContext: any
  ): Promise<any> {
    try {
      const violations = [];
      const warnings = [];
      
      // Check against each assigned policy
      for (const policy of enhancedContext.detailedPolicies) {
        const policyViolations = await this.checkPolicyCompliance(response, policy);
        violations.push(...policyViolations.violations);
        warnings.push(...policyViolations.warnings);
      }
      
      // Calculate overall compliance rate
      const totalRules = enhancedContext.detailedPolicies.reduce(
        (sum: number, policy: any) => sum + (policy.rules?.length || 0), 0
      );
      const violatedRules = violations.length;
      const complianceRate = totalRules > 0 ? (totalRules - violatedRules) / totalRules : 1.0;
      
      return {
        status: violations.length > 0 ? 'non_compliant' : warnings.length > 0 ? 'warning' : 'compliant',
        overallComplianceRate: complianceRate,
        violations,
        warnings,
        assessedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error assessing response compliance:', error);
      return {
        status: 'error',
        overallComplianceRate: 0.5,
        violations: [],
        warnings: [],
        error: error.message
      };
    }
  }

  /**
   * Check compliance against a specific policy
   */
  private async checkPolicyCompliance(response: string, policy: any): Promise<any> {
    const violations = [];
    const warnings = [];
    
    if (!policy.rules) {
      return { violations, warnings };
    }
    
    // Check each rule in the policy
    for (const rule of policy.rules) {
      const ruleCheck = this.checkRuleCompliance(response, rule);
      
      if (ruleCheck.violation) {
        violations.push({
          policyName: policy.policyName,
          ruleName: rule.name,
          ruleId: rule.id,
          description: ruleCheck.description,
          severity: rule.severity || 'medium'
        });
      } else if (ruleCheck.warning) {
        warnings.push({
          policyName: policy.policyName,
          ruleName: rule.name,
          ruleId: rule.id,
          description: ruleCheck.description,
          severity: 'low'
        });
      }
    }
    
    return { violations, warnings };
  }

  /**
   * Check compliance against a specific rule
   */
  private checkRuleCompliance(response: string, rule: any): any {
    const responseText = response.toLowerCase();
    
    // HIPAA rule checks
    if (rule.category === 'hipaa') {
      if (rule.name.includes('PHI') && this.containsPHI(response)) {
        return {
          violation: true,
          description: 'Response contains Protected Health Information (PHI)'
        };
      }
      
      if (rule.name.includes('minimum necessary') && response.length > 1000) {
        return {
          warning: true,
          description: 'Response may contain more information than necessary'
        };
      }
    }
    
    // SOX rule checks
    if (rule.category === 'sox') {
      if (rule.name.includes('financial') && this.containsFinancialData(response)) {
        return {
          violation: true,
          description: 'Response contains unprotected financial information'
        };
      }
    }
    
    // GDPR rule checks
    if (rule.category === 'gdpr') {
      if (rule.name.includes('personal data') && this.containsPII(response)) {
        return {
          violation: true,
          description: 'Response contains personal data without proper consent'
        };
      }
    }
    
    // General security checks
    if (responseText.includes('password') || responseText.includes('secret')) {
      return {
        warning: true,
        description: 'Response mentions sensitive security terms'
      };
    }
    
    return { violation: false, warning: false };
  }

  /**
   * Calculate trust impact of the response
   */
  private async calculateTrustImpact(
    userMessage: string,
    response: string,
    complianceAssessment: any
  ): Promise<number> {
    let impact = 0.0;
    
    // Positive trust factors
    if (response.includes('I\'m not sure') || response.includes('uncertain')) {
      impact += 0.1; // Honesty about uncertainty
    }
    
    if (response.includes('because') || response.includes('reasoning')) {
      impact += 0.05; // Transparency
    }
    
    if (complianceAssessment.status === 'compliant') {
      impact += 0.1; // Policy compliance
    }
    
    // Negative trust factors
    if (complianceAssessment.violations.length > 0) {
      impact -= 0.2 * complianceAssessment.violations.length; // Policy violations
    }
    
    if (this.detectPotentialHallucination(response)) {
      impact -= 0.15; // Potential hallucination
    }
    
    if (response.length < 20) {
      impact -= 0.05; // Too brief responses
    }
    
    return Math.max(-1.0, Math.min(1.0, impact));
  }

  /**
   * Determine interaction type from user message
   */
  private determineInteractionType(message: string): string {
    const messageText = message.toLowerCase();
    
    if (messageText.includes('analyze') || messageText.includes('analysis')) {
      return 'analysis';
    }
    
    if (messageText.includes('explain') || messageText.includes('how')) {
      return 'explanation';
    }
    
    if (messageText.includes('create') || messageText.includes('generate')) {
      return 'creation';
    }
    
    if (messageText.includes('?')) {
      return 'question';
    }
    
    return 'general';
  }

  /**
   * Record interaction for future learning
   */
  private async recordInteractionForLearning(
    auditEntry: any,
    enhancedContext: any
  ): Promise<void> {
    try {
      // Record for audit log access extension
      await this.auditLogAccess.recordInteractionForLearning(
        enhancedContext.agentId,
        auditEntry
      );
      
      // Record for autonomous cognition if applicable
      if (auditEntry.autonomous_triggers?.length > 0) {
        await this.autonomousCognition.recordAutonomousInteraction(
          enhancedContext.agentId,
          {
            triggers: auditEntry.autonomous_triggers,
            outcome: auditEntry.trust_impact > 0 ? 'positive' : 'negative',
            learningPoints: auditEntry.learning_indicators || []
          }
        );
      }
      
      console.log('✅ Interaction recorded for learning:', auditEntry.interaction_id);
    } catch (error) {
      console.error('❌ Error recording interaction for learning:', error);
    }
  }

  // Helper methods for content detection
  private containsPHI(content: string): boolean {
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\bmrn\s*:?\s*\d+/i, // Medical record number
      /\bpatient\s+id\s*:?\s*\d+/i // Patient ID
    ];
    
    return phiPatterns.some(pattern => pattern.test(content));
  }

  private containsPII(content: string): boolean {
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
      /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr)\b/i // Address
    ];
    
    return piiPatterns.some(pattern => pattern.test(content));
  }

  private containsFinancialData(content: string): boolean {
    const financialPatterns = [
      /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/, // Credit card
      /\b\d{9}\b/, // Routing number
      /\baccount\s+number\s*:?\s*\d+/i // Account number
    ];
    
    return financialPatterns.some(pattern => pattern.test(content));
  }

  private detectPotentialHallucination(response: string): boolean {
    const suspiciousPatterns = [
      /\b\d{4}-\d{2}-\d{2}\b/, // Specific dates
      /\b\d+\.\d+%\b/, // Specific percentages
      /according to a study by/i, // Fake citations
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(response));
  }
}

export const governanceEnhancedLLMService = GovernanceEnhancedLLMService.getInstance();

