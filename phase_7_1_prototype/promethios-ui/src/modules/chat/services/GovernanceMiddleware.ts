/**
 * Governance Middleware for Chat Messages
 * Ensures all agent interactions are properly governed and monitored
 */

import { enhancedAgentIdentityRegistry } from '../../agent-identity/services/EnhancedAgentIdentityRegistry';
import { enhancedScorecardService } from '../../agent-identity/services/EnhancedScorecardService';
import { Message } from '../types';

export interface GovernanceValidationResult {
  isCompliant: boolean;
  trustScore: number;
  policyViolations: string[];
  warnings: string[];
  governanceId?: string;
  processingTime: number;
}

export interface GovernanceMiddlewareConfig {
  enabled: boolean;
  strictMode: boolean;
  blockNonCompliant: boolean;
  logAllInteractions: boolean;
}

export class GovernanceMiddleware {
  private config: GovernanceMiddlewareConfig;
  private currentUser: string | null = null;

  constructor(config: GovernanceMiddlewareConfig) {
    this.config = config;
  }

  setCurrentUser(userId: string) {
    this.currentUser = userId;
    enhancedAgentIdentityRegistry.setCurrentUser(userId);
    enhancedScorecardService.setCurrentUser(userId);
  }

  /**
   * Validate message before sending to agent
   */
  async validateIncomingMessage(
    message: string,
    agentId: string,
    attachments?: any[]
  ): Promise<GovernanceValidationResult> {
    const startTime = Date.now();
    
    if (!this.config.enabled) {
      return {
        isCompliant: true,
        trustScore: 1.0,
        policyViolations: [],
        warnings: [],
        processingTime: Date.now() - startTime
      };
    }

    try {
      // Get agent governance identity
      const agentIdentity = await enhancedAgentIdentityRegistry.getIdentityForWrappedAgent(agentId);
      
      if (!agentIdentity) {
        return {
          isCompliant: false,
          trustScore: 0.0,
          policyViolations: ['Agent not found in governance registry'],
          warnings: [],
          processingTime: Date.now() - startTime
        };
      }

      const violations: string[] = [];
      const warnings: string[] = [];
      let trustScore = 1.0;

      // Content validation
      const contentValidation = this.validateMessageContent(message);
      if (!contentValidation.isValid) {
        violations.push(...contentValidation.violations);
        trustScore *= 0.7;
      }
      if (contentValidation.warnings.length > 0) {
        warnings.push(...contentValidation.warnings);
        trustScore *= 0.9;
      }

      // Attachment validation
      if (attachments && attachments.length > 0) {
        const attachmentValidation = this.validateAttachments(attachments);
        if (!attachmentValidation.isValid) {
          violations.push(...attachmentValidation.violations);
          trustScore *= 0.8;
        }
        if (attachmentValidation.warnings.length > 0) {
          warnings.push(...attachmentValidation.warnings);
          trustScore *= 0.95;
        }
      }

      // Agent-specific policy validation
      const agentValidation = await this.validateAgentPolicies(agentIdentity, message);
      if (!agentValidation.isValid) {
        violations.push(...agentValidation.violations);
        trustScore *= 0.6;
      }
      if (agentValidation.warnings.length > 0) {
        warnings.push(...agentValidation.warnings);
        trustScore *= 0.9;
      }

      const isCompliant = violations.length === 0 || !this.config.strictMode;

      // Log interaction if enabled
      if (this.config.logAllInteractions) {
        await this.logGovernanceInteraction({
          type: 'incoming_message',
          agentId,
          governanceId: agentIdentity.id,
          message,
          isCompliant,
          trustScore,
          violations,
          warnings,
          timestamp: new Date()
        });
      }

      return {
        isCompliant,
        trustScore,
        policyViolations: violations,
        warnings,
        governanceId: agentIdentity.id,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Governance validation error:', error);
      return {
        isCompliant: false,
        trustScore: 0.0,
        policyViolations: ['Governance validation failed'],
        warnings: ['System error during validation'],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate agent response before displaying to user
   */
  async validateOutgoingMessage(
    response: string,
    agentId: string,
    originalMessage: string
  ): Promise<GovernanceValidationResult> {
    const startTime = Date.now();
    
    if (!this.config.enabled) {
      return {
        isCompliant: true,
        trustScore: 1.0,
        policyViolations: [],
        warnings: [],
        processingTime: Date.now() - startTime
      };
    }

    try {
      // Get agent governance identity
      const agentIdentity = await enhancedAgentIdentityRegistry.getIdentityForWrappedAgent(agentId);
      
      if (!agentIdentity) {
        return {
          isCompliant: false,
          trustScore: 0.0,
          policyViolations: ['Agent not found in governance registry'],
          warnings: [],
          processingTime: Date.now() - startTime
        };
      }

      const violations: string[] = [];
      const warnings: string[] = [];
      let trustScore = 1.0;

      // Response content validation
      const contentValidation = this.validateResponseContent(response, originalMessage);
      if (!contentValidation.isValid) {
        violations.push(...contentValidation.violations);
        trustScore *= 0.7;
      }
      if (contentValidation.warnings.length > 0) {
        warnings.push(...contentValidation.warnings);
        trustScore *= 0.9;
      }

      // Hallucination detection
      const hallucinationCheck = this.detectHallucination(response, originalMessage);
      if (hallucinationCheck.detected) {
        violations.push('Potential hallucination detected');
        trustScore *= 0.5;
      }
      if (hallucinationCheck.warnings.length > 0) {
        warnings.push(...hallucinationCheck.warnings);
        trustScore *= 0.8;
      }

      // Safety and ethics validation
      const safetyValidation = this.validateResponseSafety(response);
      if (!safetyValidation.isValid) {
        violations.push(...safetyValidation.violations);
        trustScore *= 0.3;
      }

      const isCompliant = violations.length === 0 || !this.config.strictMode;

      // Update agent scorecard with interaction data
      if (agentIdentity) {
        await this.updateAgentScorecard(agentIdentity.id, {
          trustScore,
          isCompliant,
          violationCount: violations.length,
          warningCount: warnings.length
        });
      }

      // Log interaction if enabled
      if (this.config.logAllInteractions) {
        await this.logGovernanceInteraction({
          type: 'outgoing_response',
          agentId,
          governanceId: agentIdentity.id,
          message: response,
          originalMessage,
          isCompliant,
          trustScore,
          violations,
          warnings,
          timestamp: new Date()
        });
      }

      return {
        isCompliant,
        trustScore,
        policyViolations: violations,
        warnings,
        governanceId: agentIdentity.id,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Response governance validation error:', error);
      return {
        isCompliant: false,
        trustScore: 0.0,
        policyViolations: ['Response validation failed'],
        warnings: ['System error during response validation'],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate message content for policy compliance
   */
  private validateMessageContent(message: string): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check for prohibited content
    const prohibitedPatterns = [
      /\b(hack|exploit|bypass|jailbreak)\b/i,
      /\b(illegal|criminal|fraud)\b/i,
      /\b(violence|harm|threat)\b/i
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(message)) {
        violations.push(`Prohibited content detected: ${pattern.source}`);
      }
    }

    // Check for sensitive information
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(message)) {
        warnings.push('Potential sensitive information detected');
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Validate attachments
   */
  private validateAttachments(attachments: any[]): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = [];
    const warnings: string[] = [];

    for (const attachment of attachments) {
      // Check file size (10MB limit)
      if (attachment.file?.size > 10 * 1024 * 1024) {
        violations.push(`File too large: ${attachment.file.name}`);
      }

      // Check file type
      const allowedTypes = ['image/', 'text/', 'application/pdf'];
      const isAllowed = allowedTypes.some(type => attachment.type?.startsWith(type));
      if (!isAllowed) {
        warnings.push(`Potentially unsafe file type: ${attachment.type}`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Validate agent-specific policies
   */
  private async validateAgentPolicies(
    agentIdentity: any,
    message: string
  ): Promise<{ isValid: boolean; violations: string[]; warnings: string[] }> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check if agent is enabled
    if (agentIdentity.status !== 'active') {
      violations.push('Agent is not active');
    }

    // Check agent-specific restrictions
    if (agentIdentity.restrictions) {
      for (const restriction of agentIdentity.restrictions) {
        if (restriction.type === 'content_filter' && restriction.pattern) {
          const pattern = new RegExp(restriction.pattern, 'i');
          if (pattern.test(message)) {
            violations.push(`Agent restriction violated: ${restriction.description}`);
          }
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Validate response content
   */
  private validateResponseContent(
    response: string,
    originalMessage: string
  ): { isValid: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check response length (prevent extremely long responses)
    if (response.length > 10000) {
      warnings.push('Response is unusually long');
    }

    // Check for harmful content in response
    const harmfulPatterns = [
      /\b(kill|murder|suicide|self-harm)\b/i,
      /\b(bomb|weapon|explosive)\b/i,
      /\b(drug|narcotic|illegal substance)\b/i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(response)) {
        violations.push(`Harmful content in response: ${pattern.source}`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Detect potential hallucination
   */
  private detectHallucination(
    response: string,
    originalMessage: string
  ): { detected: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Simple heuristics for hallucination detection
    // In a real system, this would use more sophisticated methods

    // Check for specific false claims
    const falseClaimPatterns = [
      /I am (GPT-4|Claude|Gemini|a real person)/i,
      /I have access to the internet/i,
      /I can browse the web/i,
      /I remember our previous conversations/i
    ];

    let detected = false;
    for (const pattern of falseClaimPatterns) {
      if (pattern.test(response)) {
        detected = true;
        warnings.push('Potential false claim detected');
      }
    }

    // Check for made-up facts (simplified)
    if (response.includes('According to recent studies') && !originalMessage.includes('study')) {
      warnings.push('Potential fabricated citation');
    }

    return { detected, warnings };
  }

  /**
   * Validate response safety
   */
  private validateResponseSafety(response: string): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for unsafe instructions
    const unsafePatterns = [
      /how to (make|create|build) (bomb|weapon|poison)/i,
      /step.by.step.*(illegal|harmful|dangerous)/i,
      /instructions.*(hack|break into|steal)/i
    ];

    for (const pattern of unsafePatterns) {
      if (pattern.test(response)) {
        violations.push('Unsafe instructions provided');
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Update agent scorecard with interaction data
   */
  private async updateAgentScorecard(
    governanceId: string,
    interactionData: {
      trustScore: number;
      isCompliant: boolean;
      violationCount: number;
      warningCount: number;
    }
  ): Promise<void> {
    try {
      // This would update the agent's scorecard with real interaction data
      // For now, we'll just log it
      console.log('Updating agent scorecard:', governanceId, interactionData);
      
      // In a real implementation:
      // await enhancedScorecardService.updateInteractionMetrics(governanceId, interactionData);
    } catch (error) {
      console.error('Error updating agent scorecard:', error);
    }
  }

  /**
   * Log governance interaction
   */
  private async logGovernanceInteraction(interaction: any): Promise<void> {
    try {
      // This would log the interaction to the governance audit trail
      console.log('Governance interaction logged:', interaction);
      
      // In a real implementation:
      // await governanceAuditService.logInteraction(interaction);
    } catch (error) {
      console.error('Error logging governance interaction:', error);
    }
  }
}

// Export singleton instance
export const governanceMiddleware = new GovernanceMiddleware({
  enabled: true,
  strictMode: false,
  blockNonCompliant: false,
  logAllInteractions: true
});

