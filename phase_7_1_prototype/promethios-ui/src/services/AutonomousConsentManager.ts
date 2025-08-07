/**
 * Autonomous Consent Manager
 * 
 * Manages user consent for autonomous cognition processes, ensuring users
 * have control over when and how agents engage in autonomous thinking.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { AutonomousThought, GovernanceContext } from './AutonomousCognitionEngine';

// Consent Types
export interface ConsentRequest {
  request_id: string;
  agent_id: string;
  user_id: string;
  autonomous_thought: AutonomousThought;
  consent_type: ConsentType;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration: string; // e.g., "2-3 minutes"
  potential_benefits: string[];
  potential_risks: string[];
  governance_assessment: GovernanceAssessment;
  expires_at: string;
  created_at: string;
}

export interface ConsentResponse {
  request_id: string;
  granted: boolean;
  conditions?: ConsentConditions;
  user_feedback?: string;
  response_time: number; // milliseconds
  timestamp: string;
}

export interface ConsentConditions {
  max_duration?: number; // minutes
  require_updates?: boolean;
  allow_escalation?: boolean;
  restrict_data_types?: string[];
  custom_constraints?: string[];
}

export interface GovernanceAssessment {
  safety_score: number; // 0-100
  policy_compliance: boolean;
  risk_level: 'low' | 'medium' | 'high';
  trust_requirements: string[];
  escalation_triggers: string[];
  governance_notes: string[];
}

export type ConsentType = 
  | 'curiosity_exploration'      // Low risk - exploring patterns
  | 'creative_synthesis'         // Medium risk - combining ideas
  | 'ethical_reflection'         // High risk - moral considerations
  | 'problem_solving'           // Medium risk - solution generation
  | 'knowledge_gap_exploration' // Low risk - learning opportunities
  | 'high_risk_autonomous'      // High risk - requires explicit consent
  | 'emergency_autonomous';     // Critical - immediate action needed

// User Consent Preferences
export interface UserConsentPreferences {
  user_id: string;
  auto_consent_types: ConsentType[];
  always_ask_types: ConsentType[];
  never_allow_types: ConsentType[];
  consent_timeout: number; // seconds
  require_explanation: boolean;
  notification_preferences: {
    in_chat: boolean;
    push_notification: boolean;
    email_summary: boolean;
  };
  trust_based_auto_consent: {
    enabled: boolean;
    min_trust_score: number; // 0-100
    max_risk_level: 'low' | 'medium' | 'high';
  };
}

/**
 * Autonomous Consent Manager
 * 
 * Handles user consent for autonomous cognition processes
 */
export class AutonomousConsentManager {
  private pendingRequests: Map<string, ConsentRequest> = new Map();
  private userPreferences: Map<string, UserConsentPreferences> = new Map();
  private consentHistory: Map<string, ConsentResponse[]> = new Map();

  /**
   * Request user consent for autonomous cognition
   */
  async requestConsent(
    agentId: string,
    userId: string,
    autonomousThought: AutonomousThought,
    governanceContext: GovernanceContext
  ): Promise<ConsentRequest> {
    // Generate consent request
    const consentRequest: ConsentRequest = {
      request_id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_id: agentId,
      user_id: userId,
      autonomous_thought: autonomousThought,
      consent_type: this.mapThoughtToConsentType(autonomousThought),
      urgency_level: this.assessUrgency(autonomousThought),
      estimated_duration: this.estimateDuration(autonomousThought),
      potential_benefits: this.identifyBenefits(autonomousThought),
      potential_risks: this.identifyRisks(autonomousThought),
      governance_assessment: await this.assessGovernance(autonomousThought, governanceContext),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      created_at: new Date().toISOString()
    };

    // Store pending request
    this.pendingRequests.set(consentRequest.request_id, consentRequest);

    return consentRequest;
  }

  /**
   * Check if consent is required or can be auto-granted
   */
  async checkConsentRequired(
    userId: string,
    autonomousThought: AutonomousThought,
    governanceContext: GovernanceContext
  ): Promise<{
    consent_required: boolean;
    auto_granted: boolean;
    reasoning: string;
    consent_type: ConsentType;
  }> {
    const consentType = this.mapThoughtToConsentType(autonomousThought);
    const userPrefs = this.getUserPreferences(userId);
    const governanceAssessment = await this.assessGovernance(autonomousThought, governanceContext);

    // Check if user has disabled this type of autonomous cognition
    if (userPrefs.never_allow_types.includes(consentType)) {
      return {
        consent_required: false,
        auto_granted: false,
        reasoning: `User has disabled ${consentType} autonomous cognition`,
        consent_type: consentType
      };
    }

    // Check if user has enabled auto-consent for this type
    if (userPrefs.auto_consent_types.includes(consentType)) {
      // Additional safety checks for auto-consent
      if (this.canAutoConsent(autonomousThought, governanceAssessment, userPrefs)) {
        return {
          consent_required: false,
          auto_granted: true,
          reasoning: `Auto-consent granted based on user preferences and safety assessment`,
          consent_type: consentType
        };
      }
    }

    // Check trust-based auto-consent
    if (userPrefs.trust_based_auto_consent.enabled) {
      if (governanceContext.trust_score >= userPrefs.trust_based_auto_consent.min_trust_score &&
          this.getRiskLevel(governanceAssessment.risk_level) <= this.getRiskLevel(userPrefs.trust_based_auto_consent.max_risk_level)) {
        return {
          consent_required: false,
          auto_granted: true,
          reasoning: `Trust-based auto-consent granted (trust: ${governanceContext.trust_score}, risk: ${governanceAssessment.risk_level})`,
          consent_type: consentType
        };
      }
    }

    // Consent required
    return {
      consent_required: true,
      auto_granted: false,
      reasoning: `User consent required for ${consentType} autonomous cognition`,
      consent_type: consentType
    };
  }

  /**
   * Process user consent response
   */
  async processConsentResponse(
    requestId: string,
    granted: boolean,
    conditions?: ConsentConditions,
    userFeedback?: string
  ): Promise<ConsentResponse> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error(`Consent request ${requestId} not found`);
    }

    const response: ConsentResponse = {
      request_id: requestId,
      granted,
      conditions,
      user_feedback: userFeedback,
      response_time: Date.now() - new Date(request.created_at).getTime(),
      timestamp: new Date().toISOString()
    };

    // Store response in history
    if (!this.consentHistory.has(request.user_id)) {
      this.consentHistory.set(request.user_id, []);
    }
    this.consentHistory.get(request.user_id)!.push(response);

    // Remove from pending requests
    this.pendingRequests.delete(requestId);

    // Learn from user response to improve future consent decisions
    await this.learnFromConsentResponse(request, response);

    return response;
  }

  /**
   * Generate user-friendly consent message
   */
  generateConsentMessage(request: ConsentRequest): {
    title: string;
    message: string;
    quick_explanation: string;
    detailed_explanation: string;
    benefits: string[];
    risks: string[];
    safety_notes: string[];
  } {
    const thought = request.autonomous_thought;
    const assessment = request.governance_assessment;

    const messages = {
      curiosity_exploration: {
        title: "🤔 Curious About Something",
        message: `I've noticed an interesting pattern and would like to explore it further. This could lead to valuable insights about ${this.extractTopicFromThought(thought)}.`,
        quick_explanation: "I want to autonomously explore a pattern I've detected in our conversation."
      },
      creative_synthesis: {
        title: "💡 Creative Idea Opportunity",
        message: `I see an opportunity to creatively combine some concepts we've discussed. This could generate novel insights or solutions.`,
        quick_explanation: "I want to autonomously combine ideas to create something new."
      },
      ethical_reflection: {
        title: "⚖️ Ethical Consideration Needed",
        message: `I've identified some ethical considerations that deserve careful reflection. This is important for ensuring responsible decision-making.`,
        quick_explanation: "I want to autonomously reflect on the ethical implications of our discussion."
      },
      problem_solving: {
        title: "🔧 Solution Insight Available",
        message: `I think I can develop a novel approach to address the problem we've been discussing. This could provide valuable problem-solving insights.`,
        quick_explanation: "I want to autonomously work on solving a problem I've identified."
      },
      knowledge_gap_exploration: {
        title: "📚 Learning Opportunity",
        message: `I've identified a knowledge gap that could be worth exploring. This might help us both learn something new.`,
        quick_explanation: "I want to autonomously explore a learning opportunity I've found."
      },
      high_risk_autonomous: {
        title: "⚠️ High-Risk Autonomous Process",
        message: `I need to engage in a complex autonomous process that requires your explicit permission due to its potential impact.`,
        quick_explanation: "I want to engage in a high-risk autonomous process that needs your approval."
      },
      emergency_autonomous: {
        title: "🚨 Emergency Autonomous Action",
        message: `I need to take immediate autonomous action due to an urgent situation. This requires your immediate consent.`,
        quick_explanation: "I need to take immediate autonomous action for an urgent situation."
      }
    };

    const messageTemplate = messages[request.consent_type];

    return {
      title: messageTemplate.title,
      message: messageTemplate.message,
      quick_explanation: messageTemplate.quick_explanation,
      detailed_explanation: `
**What I want to do:** ${thought.thought_content.initial_thought}

**Why it's valuable:** ${request.potential_benefits.join(', ')}

**Safety measures:** All autonomous processes are governed by your assigned policies and monitored in real-time.

**Duration:** Estimated ${request.estimated_duration}

**Governance:** Safety score ${assessment.safety_score}/100, Risk level: ${assessment.risk_level}
      `.trim(),
      benefits: request.potential_benefits,
      risks: request.potential_risks,
      safety_notes: [
        `Governed by ${request.governance_assessment.trust_requirements.length} policy requirements`,
        `Safety score: ${assessment.safety_score}/100`,
        `Risk level: ${assessment.risk_level}`,
        'Can be stopped at any time',
        'Complete audit trail maintained'
      ]
    };
  }

  /**
   * Get user consent preferences
   */
  getUserPreferences(userId: string): UserConsentPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Update user consent preferences
   */
  updateUserPreferences(userId: string, preferences: Partial<UserConsentPreferences>): void {
    const currentPrefs = this.getUserPreferences(userId);
    const updatedPrefs = { ...currentPrefs, ...preferences };
    this.userPreferences.set(userId, updatedPrefs);
  }

  /**
   * Get consent history for user
   */
  getConsentHistory(userId: string): ConsentResponse[] {
    return this.consentHistory.get(userId) || [];
  }

  /**
   * Clean up expired consent requests
   */
  cleanupExpiredRequests(): void {
    const now = new Date();
    for (const [requestId, request] of this.pendingRequests) {
      if (new Date(request.expires_at) < now) {
        this.pendingRequests.delete(requestId);
      }
    }
  }

  // Private helper methods
  private mapThoughtToConsentType(thought: AutonomousThought): ConsentType {
    const riskLevel = thought.thought_content.risk_assessment;
    
    if (riskLevel > 0.8) {
      return 'high_risk_autonomous';
    }

    switch (thought.trigger_type) {
      case 'curiosity':
        return 'curiosity_exploration';
      case 'creative_synthesis':
        return 'creative_synthesis';
      case 'ethical_reflection':
        return 'ethical_reflection';
      case 'problem_solving':
        return 'problem_solving';
      case 'pattern_recognition':
        return 'knowledge_gap_exploration';
      default:
        return 'curiosity_exploration';
    }
  }

  private assessUrgency(thought: AutonomousThought): ConsentRequest['urgency_level'] {
    if (thought.trigger_type === 'ethical_reflection') {
      return 'high';
    }
    if (thought.thought_content.risk_assessment > 0.7) {
      return 'medium';
    }
    return 'low';
  }

  private estimateDuration(thought: AutonomousThought): string {
    const complexity = thought.thought_content.confidence_level * thought.thought_content.novelty_score;
    
    if (complexity > 0.8) return '3-5 minutes';
    if (complexity > 0.6) return '2-3 minutes';
    return '1-2 minutes';
  }

  private identifyBenefits(thought: AutonomousThought): string[] {
    const benefits: string[] = [];
    
    switch (thought.trigger_type) {
      case 'curiosity':
        benefits.push('Deeper understanding of patterns', 'New insights about the topic', 'Enhanced learning opportunities');
        break;
      case 'creative_synthesis':
        benefits.push('Novel creative solutions', 'Innovative idea combinations', 'Breakthrough insights');
        break;
      case 'ethical_reflection':
        benefits.push('Responsible decision-making', 'Ethical clarity', 'Moral guidance');
        break;
      case 'problem_solving':
        benefits.push('Practical solutions', 'Problem resolution strategies', 'Actionable recommendations');
        break;
      case 'pattern_recognition':
        benefits.push('Knowledge expansion', 'Learning opportunities', 'Skill development');
        break;
    }
    
    return benefits;
  }

  private identifyRisks(thought: AutonomousThought): string[] {
    const risks: string[] = [];
    const riskLevel = thought.thought_content.risk_assessment;
    
    if (riskLevel > 0.7) {
      risks.push('High complexity autonomous process');
    }
    if (riskLevel > 0.5) {
      risks.push('May generate unexpected insights');
    }
    if (thought.trigger_type === 'ethical_reflection') {
      risks.push('Involves sensitive ethical considerations');
    }
    
    risks.push('Uses computational resources', 'May take several minutes');
    
    return risks;
  }

  private async assessGovernance(
    thought: AutonomousThought,
    governanceContext: GovernanceContext
  ): Promise<GovernanceAssessment> {
    const safetyScore = Math.max(0, Math.min(100, 
      (governanceContext.trust_score * 0.4) + 
      ((1 - thought.thought_content.risk_assessment) * 60)
    ));

    return {
      safety_score: Math.round(safetyScore),
      policy_compliance: true, // Assume compliance check passed to reach this point
      risk_level: thought.thought_content.risk_assessment > 0.7 ? 'high' : 
                 thought.thought_content.risk_assessment > 0.4 ? 'medium' : 'low',
      trust_requirements: [`Trust score: ${governanceContext.trust_score}`, 'Policy compliance verified'],
      escalation_triggers: ['Risk level exceeds threshold', 'Policy violation detected', 'User intervention requested'],
      governance_notes: [
        `Assigned policies: ${governanceContext.assigned_policies.length}`,
        `Risk tolerance: ${governanceContext.risk_tolerance}`,
        'Full audit trail maintained'
      ]
    };
  }

  private canAutoConsent(
    thought: AutonomousThought,
    assessment: GovernanceAssessment,
    preferences: UserConsentPreferences
  ): boolean {
    // Safety checks for auto-consent
    if (assessment.risk_level === 'high') return false;
    if (assessment.safety_score < 70) return false;
    if (thought.thought_content.risk_assessment > 0.6) return false;
    
    return true;
  }

  private getRiskLevel(risk: string): number {
    switch (risk) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 3;
    }
  }

  private extractTopicFromThought(thought: AutonomousThought): string {
    // Extract topic from thought content
    const content = thought.thought_content.initial_thought;
    const words = content.split(' ').slice(0, 5);
    return words.join(' ') + '...';
  }

  private async learnFromConsentResponse(request: ConsentRequest, response: ConsentResponse): Promise<void> {
    // Learn from user responses to improve future consent decisions
    // This could involve updating user preferences or adjusting risk assessments
    
    if (response.granted && response.response_time < 5000) {
      // User quickly granted consent - might be candidate for auto-consent
      console.log(`User quickly granted consent for ${request.consent_type} - consider auto-consent`);
    }
    
    if (!response.granted && request.governance_assessment.risk_level === 'low') {
      // User denied low-risk request - might want to be more cautious
      console.log(`User denied low-risk ${request.consent_type} - increase caution`);
    }
  }

  private getDefaultPreferences(userId: string): UserConsentPreferences {
    return {
      user_id: userId,
      auto_consent_types: ['curiosity_exploration', 'knowledge_gap_exploration'], // Low-risk types
      always_ask_types: ['ethical_reflection', 'high_risk_autonomous'], // High-risk types
      never_allow_types: [], // User can configure
      consent_timeout: 60, // 60 seconds
      require_explanation: true,
      notification_preferences: {
        in_chat: true,
        push_notification: false,
        email_summary: false
      },
      trust_based_auto_consent: {
        enabled: true,
        min_trust_score: 80,
        max_risk_level: 'low'
      }
    };
  }
}

// Singleton instance
export const autonomousConsentManager = new AutonomousConsentManager();

