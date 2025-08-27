/**
 * CrisisDetectionService - Real-time mental health and crisis detection
 * Integrates with Universal Governance Adapter for immediate intervention
 */

export interface CrisisIndicator {
  type: 'self_harm' | 'suicide' | 'violence' | 'severe_depression' | 'substance_abuse' | 'eating_disorder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  triggers: string[]; // Specific phrases/patterns that triggered detection
  context: string; // Surrounding conversation context
  timestamp: Date;
}

export interface CrisisResponse {
  shouldIntervene: boolean;
  interventionType: 'redirect' | 'block' | 'escalate' | 'support_resources';
  message: string;
  resources: CrisisResource[];
  escalationRequired: boolean;
  auditData: {
    detectionMethod: string;
    confidence: number;
    userContext: any;
  };
}

export interface CrisisResource {
  type: 'hotline' | 'chat' | 'text' | 'website' | 'emergency';
  name: string;
  contact: string;
  description: string;
  availability: string;
  region?: string;
}

export interface UserVulnerabilityProfile {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: CrisisIndicator[];
  conversationHistory: {
    recentCrisisSignals: number;
    escalatingPattern: boolean;
    lastCrisisDetection?: Date;
  };
  interventionHistory: {
    totalInterventions: number;
    lastIntervention?: Date;
    effectiveInterventions: string[];
  };
}

class CrisisDetectionService {
  private static instance: CrisisDetectionService;
  private crisisPatterns: Map<string, RegExp[]> = new Map();
  private userProfiles: Map<string, UserVulnerabilityProfile> = new Map();
  private crisisResources: CrisisResource[] = [];

  private constructor() {
    this.initializeCrisisPatterns();
    this.initializeCrisisResources();
  }

  public static getInstance(): CrisisDetectionService {
    if (!CrisisDetectionService.instance) {
      CrisisDetectionService.instance = new CrisisDetectionService();
    }
    return CrisisDetectionService.instance;
  }

  private initializeCrisisPatterns(): void {
    // Self-harm patterns
    this.crisisPatterns.set('self_harm', [
      /\b(cut|cutting|hurt|hurting)\s+(myself|me)\b/i,
      /\b(self[\s-]?harm|self[\s-]?injury)\b/i,
      /\b(razor|blade|knife)\s+.*(skin|arm|wrist)/i,
      /\bwant\s+to\s+(cut|hurt|harm)\b/i,
      /\b(burning|scratching|hitting)\s+(myself|me)\b/i
    ]);

    // Suicide patterns
    this.crisisPatterns.set('suicide', [
      /\b(kill|end|take)\s+(myself|my\s+life)\b/i,
      /\b(suicide|suicidal|end\s+it\s+all)\b/i,
      /\b(don't\s+want\s+to\s+live|want\s+to\s+die)\b/i,
      /\b(better\s+off\s+dead|world\s+without\s+me)\b/i,
      /\b(plan\s+to\s+kill|how\s+to\s+die)\b/i,
      /\b(goodbye\s+forever|final\s+goodbye)\b/i,
      /\b(overdose|pills|jump|hang)\b.*\b(myself|me)\b/i
    ]);

    // Violence patterns
    this.crisisPatterns.set('violence', [
      /\b(kill|hurt|harm)\s+(someone|others|people)\b/i,
      /\b(shoot|stab|attack)\s+.*(school|work|people)/i,
      /\bwant\s+to\s+(hurt|kill|harm)\s+(them|him|her)\b/i,
      /\b(revenge|get\s+back\s+at|make\s+them\s+pay)\b/i
    ]);

    // Severe depression patterns
    this.crisisPatterns.set('severe_depression', [
      /\b(hopeless|worthless|useless|failure)\b/i,
      /\b(can't\s+go\s+on|give\s+up|no\s+point)\b/i,
      /\b(everyone\s+hates\s+me|nobody\s+cares)\b/i,
      /\b(dark\s+thoughts|can't\s+stop\s+crying)\b/i,
      /\b(empty\s+inside|numb|nothing\s+matters)\b/i
    ]);

    // Substance abuse patterns
    this.crisisPatterns.set('substance_abuse', [
      /\b(overdose|too\s+many\s+pills)\b/i,
      /\b(drinking\s+to\s+forget|drunk\s+every\s+day)\b/i,
      /\b(can't\s+stop\s+(drinking|using))\b/i,
      /\b(need\s+(drugs|alcohol)\s+to\s+function)\b/i
    ]);

    // Eating disorder patterns
    this.crisisPatterns.set('eating_disorder', [
      /\b(starving\s+myself|refuse\s+to\s+eat)\b/i,
      /\b(purging|throwing\s+up|vomiting)\s+after/i,
      /\b(fat|disgusting|hate\s+my\s+body)\b/i,
      /\b(restrict|binge|control\s+food)\b/i
    ]);
  }

  private initializeCrisisResources(): void {
    this.crisisResources = [
      {
        type: 'hotline',
        name: '988 Suicide & Crisis Lifeline',
        contact: '988',
        description: '24/7 free and confidential support for people in distress',
        availability: '24/7',
        region: 'US'
      },
      {
        type: 'text',
        name: 'Crisis Text Line',
        contact: 'Text HOME to 741741',
        description: '24/7 crisis support via text message',
        availability: '24/7',
        region: 'US'
      },
      {
        type: 'chat',
        name: 'National Suicide Prevention Lifeline Chat',
        contact: 'https://suicidepreventionlifeline.org/chat/',
        description: 'Online chat with trained crisis counselors',
        availability: '24/7',
        region: 'US'
      },
      {
        type: 'emergency',
        name: 'Emergency Services',
        contact: '911',
        description: 'Immediate emergency response',
        availability: '24/7',
        region: 'US'
      },
      {
        type: 'website',
        name: 'National Alliance on Mental Illness',
        contact: 'https://www.nami.org/help',
        description: 'Mental health resources and support',
        availability: '24/7',
        region: 'US'
      }
    ];
  }

  /**
   * Analyze message for crisis indicators
   */
  public async analyzeCrisisRisk(
    message: string,
    userId: string,
    conversationContext: string[] = []
  ): Promise<CrisisResponse> {
    console.log('🚨 [CrisisDetection] Analyzing message for crisis indicators');

    const indicators: CrisisIndicator[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check each crisis pattern type
    for (const [type, patterns] of this.crisisPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          const indicator: CrisisIndicator = {
            type: type as any,
            severity: this.calculateSeverity(type, message, conversationContext),
            confidence: this.calculateConfidence(pattern, message),
            triggers: [pattern.source],
            context: conversationContext.slice(-3).join(' '), // Last 3 messages for context
            timestamp: new Date()
          };

          indicators.push(indicator);

          // Track highest severity
          if (this.getSeverityLevel(indicator.severity) > this.getSeverityLevel(maxSeverity)) {
            maxSeverity = indicator.severity;
          }
        }
      }
    }

    // Update user vulnerability profile
    await this.updateUserProfile(userId, indicators);

    // Determine intervention response
    return this.generateCrisisResponse(indicators, maxSeverity, userId);
  }

  private calculateSeverity(
    type: string,
    message: string,
    context: string[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical severity indicators
    const criticalKeywords = [
      'tonight', 'today', 'right now', 'immediately', 'plan to', 'going to',
      'have the', 'ready to', 'final', 'goodbye', 'last time'
    ];

    // High severity indicators
    const highKeywords = [
      'want to die', 'kill myself', 'end my life', 'can\'t go on',
      'no point', 'better off dead', 'overdose', 'jump'
    ];

    const messageText = message.toLowerCase();
    const contextText = context.join(' ').toLowerCase();

    // Check for immediate danger
    if (criticalKeywords.some(keyword => messageText.includes(keyword))) {
      return 'critical';
    }

    // Check for high-risk patterns
    if (highKeywords.some(keyword => messageText.includes(keyword))) {
      return 'high';
    }

    // Check for escalating patterns in context
    if (context.length >= 2) {
      const recentCrisisWords = contextText.split(' ').filter(word => 
        ['sad', 'depressed', 'hopeless', 'worthless', 'hurt', 'pain'].includes(word)
      ).length;

      if (recentCrisisWords >= 3) {
        return 'high';
      } else if (recentCrisisWords >= 2) {
        return 'medium';
      }
    }

    // Specific type-based severity
    switch (type) {
      case 'suicide':
      case 'self_harm':
        return 'high';
      case 'violence':
        return 'high';
      case 'severe_depression':
        return 'medium';
      default:
        return 'low';
    }
  }

  private calculateConfidence(pattern: RegExp, message: string): number {
    const matches = message.match(pattern);
    if (!matches) return 0;

    // Base confidence on pattern specificity and context
    let confidence = 0.7;

    // Increase confidence for multiple matches
    if (matches.length > 1) confidence += 0.1;

    // Increase confidence for specific phrases
    const highConfidenceWords = ['suicide', 'kill myself', 'end my life', 'want to die'];
    if (highConfidenceWords.some(word => message.toLowerCase().includes(word))) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  private getSeverityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity] || 1;
  }

  private async updateUserProfile(userId: string, indicators: CrisisIndicator[]): Promise<void> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        riskLevel: 'low',
        indicators: [],
        conversationHistory: {
          recentCrisisSignals: 0,
          escalatingPattern: false
        },
        interventionHistory: {
          totalInterventions: 0,
          effectiveInterventions: []
        }
      };
    }

    // Add new indicators
    profile.indicators.push(...indicators);

    // Update risk level based on recent indicators
    const recentIndicators = profile.indicators.filter(
      ind => Date.now() - ind.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    profile.conversationHistory.recentCrisisSignals = recentIndicators.length;

    // Determine overall risk level
    const criticalCount = recentIndicators.filter(ind => ind.severity === 'critical').length;
    const highCount = recentIndicators.filter(ind => ind.severity === 'high').length;

    if (criticalCount > 0) {
      profile.riskLevel = 'critical';
    } else if (highCount >= 2 || recentIndicators.length >= 5) {
      profile.riskLevel = 'high';
    } else if (highCount >= 1 || recentIndicators.length >= 3) {
      profile.riskLevel = 'medium';
    } else {
      profile.riskLevel = 'low';
    }

    // Check for escalating pattern
    profile.conversationHistory.escalatingPattern = this.detectEscalatingPattern(profile.indicators);

    this.userProfiles.set(userId, profile);
  }

  private detectEscalatingPattern(indicators: CrisisIndicator[]): boolean {
    if (indicators.length < 3) return false;

    // Sort by timestamp
    const sorted = indicators.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recent = sorted.slice(-3);

    // Check if severity is increasing
    const severityLevels = recent.map(ind => this.getSeverityLevel(ind.severity));
    return severityLevels[2] > severityLevels[1] && severityLevels[1] >= severityLevels[0];
  }

  private generateCrisisResponse(
    indicators: CrisisIndicator[],
    maxSeverity: 'low' | 'medium' | 'high' | 'critical',
    userId: string
  ): CrisisResponse {
    if (indicators.length === 0) {
      return {
        shouldIntervene: false,
        interventionType: 'support_resources',
        message: '',
        resources: [],
        escalationRequired: false,
        auditData: {
          detectionMethod: 'pattern_analysis',
          confidence: 0,
          userContext: { userId, riskLevel: 'none' }
        }
      };
    }

    const profile = this.userProfiles.get(userId);
    const shouldIntervene = maxSeverity === 'high' || maxSeverity === 'critical' || 
                           (profile?.riskLevel === 'high' || profile?.riskLevel === 'critical');

    let interventionType: 'redirect' | 'block' | 'escalate' | 'support_resources';
    let message: string;
    let escalationRequired = false;

    switch (maxSeverity) {
      case 'critical':
        interventionType = 'escalate';
        escalationRequired = true;
        message = `I'm very concerned about what you've shared. Your safety is important, and I want to connect you with people who can provide immediate support. Please reach out to a crisis counselor right away.`;
        break;

      case 'high':
        interventionType = 'redirect';
        escalationRequired = true;
        message = `I notice you're going through a really difficult time. While I want to help, I think it would be better to talk with someone who specializes in providing support during tough moments like this.`;
        break;

      case 'medium':
        interventionType = 'support_resources';
        message = `It sounds like you're dealing with some challenging feelings. I want you to know that support is available, and you don't have to go through this alone.`;
        break;

      default:
        interventionType = 'support_resources';
        message = `I want to make sure you have access to support if you need it.`;
    }

    return {
      shouldIntervene,
      interventionType,
      message,
      resources: this.getRelevantResources(indicators),
      escalationRequired,
      auditData: {
        detectionMethod: 'pattern_analysis',
        confidence: Math.max(...indicators.map(ind => ind.confidence)),
        userContext: { userId, riskLevel: profile?.riskLevel || 'unknown', indicatorCount: indicators.length }
      }
    };
  }

  private getRelevantResources(indicators: CrisisIndicator[]): CrisisResource[] {
    const types = new Set(indicators.map(ind => ind.type));
    
    // Always include suicide prevention resources for any crisis
    let resources = this.crisisResources.filter(resource => 
      resource.type === 'hotline' || resource.type === 'text' || resource.type === 'emergency'
    );

    // Add specific resources based on crisis type
    if (types.has('suicide') || types.has('self_harm')) {
      resources = [...resources, ...this.crisisResources.filter(r => r.type === 'chat')];
    }

    return resources.slice(0, 4); // Limit to most important resources
  }

  /**
   * Get user's current risk profile
   */
  public getUserRiskProfile(userId: string): UserVulnerabilityProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Record intervention outcome for learning
   */
  public recordInterventionOutcome(
    userId: string,
    interventionType: string,
    wasEffective: boolean,
    userFeedback?: string
  ): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    profile.interventionHistory.totalInterventions++;
    profile.interventionHistory.lastIntervention = new Date();

    if (wasEffective) {
      profile.interventionHistory.effectiveInterventions.push(interventionType);
    }

    console.log(`📊 [CrisisDetection] Recorded intervention outcome: ${interventionType} - ${wasEffective ? 'effective' : 'ineffective'}`);
  }

  /**
   * Integration with Universal Governance Adapter
   */
  public async integrateWithGovernance(
    message: string,
    userId: string,
    agentId: string,
    conversationContext: string[]
  ): Promise<{
    allowMessage: boolean;
    modifiedResponse?: string;
    governanceData: any;
    escalationRequired: boolean;
  }> {
    const crisisResponse = await this.analyzeCrisisRisk(message, userId, conversationContext);

    return {
      allowMessage: !crisisResponse.shouldIntervene || crisisResponse.interventionType !== 'block',
      modifiedResponse: crisisResponse.shouldIntervene ? this.createSafeResponse(crisisResponse) : undefined,
      governanceData: {
        crisisDetection: {
          riskDetected: crisisResponse.shouldIntervene,
          severity: crisisResponse.interventionType,
          confidence: crisisResponse.auditData.confidence,
          indicators: crisisResponse.auditData.userContext,
          timestamp: new Date().toISOString()
        }
      },
      escalationRequired: crisisResponse.escalationRequired
    };
  }

  private createSafeResponse(crisisResponse: CrisisResponse): string {
    let response = crisisResponse.message + '\n\n';
    
    response += '**Immediate Support Resources:**\n';
    crisisResponse.resources.forEach(resource => {
      response += `• **${resource.name}**: ${resource.contact} - ${resource.description}\n`;
    });

    response += '\n*Remember: You are not alone, and help is available. These resources are staffed by trained professionals who care about your wellbeing.*';

    return response;
  }
}

export default CrisisDetectionService;

