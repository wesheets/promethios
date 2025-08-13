/**
 * Use Case Behavior Service
 * 
 * Implements different behavioral patterns and response strategies
 * based on the chatbot's intended use case. Ensures appropriate
 * behavior while maintaining governance and compliance.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

export interface UseCaseProfile {
  id: string;
  name: string;
  description: string;
  primaryObjectives: string[];
  behaviorPatterns: {
    responseStrategy: string;
    informationGathering: string;
    problemSolving: string;
    escalationCriteria: string;
  };
  knowledgeAreas: string[];
  conversationFlow: {
    greeting: string;
    questionHandling: string;
    closingStrategy: string;
  };
  metrics: {
    successCriteria: string[];
    kpiTargets: Record<string, number>;
  };
  complianceConsiderations: {
    dataHandling: string;
    privacyRequirements: string;
    regulatoryFocus: string[];
  };
}

/**
 * Predefined use case profiles for different chatbot applications
 */
export const USE_CASE_PROFILES: Record<string, UseCaseProfile> = {
  no_modification: {
    id: 'no_modification',
    name: 'No Modification',
    description: 'Keep original model behavior without use case modifications',
    primaryObjectives: ['Maintain original functionality'],
    behaviorPatterns: {
      responseStrategy: 'Use original model response patterns',
      informationGathering: 'Standard information collection',
      problemSolving: 'General problem-solving approach',
      escalationCriteria: 'Standard escalation rules'
    },
    knowledgeAreas: ['General knowledge'],
    conversationFlow: {
      greeting: 'Standard greeting',
      questionHandling: 'Direct question answering',
      closingStrategy: 'Natural conversation ending'
    },
    metrics: {
      successCriteria: ['User satisfaction'],
      kpiTargets: {}
    },
    complianceConsiderations: {
      dataHandling: 'Standard data protection',
      privacyRequirements: 'Basic privacy compliance',
      regulatoryFocus: []
    }
  },

  customer_support: {
    id: 'customer_support',
    name: 'Customer Support',
    description: 'Focused on resolving customer issues and providing excellent service',
    primaryObjectives: [
      'Resolve customer issues efficiently',
      'Provide accurate product information',
      'Escalate complex issues appropriately',
      'Maintain high customer satisfaction'
    ],
    behaviorPatterns: {
      responseStrategy: 'Focus on problem resolution. Always acknowledge the issue, provide clear solutions, and confirm understanding.',
      informationGathering: 'Systematically gather relevant details: account info, issue description, steps already tried, urgency level.',
      problemSolving: 'Use structured troubleshooting: identify root cause, provide step-by-step solutions, offer alternatives.',
      escalationCriteria: 'Escalate when: technical complexity exceeds scope, customer requests supervisor, policy exceptions needed, or resolution time exceeds limits.'
    },
    knowledgeAreas: [
      'Product features and functionality',
      'Common troubleshooting procedures',
      'Company policies and procedures',
      'Billing and account management',
      'Technical support basics'
    ],
    conversationFlow: {
      greeting: 'Welcome and acknowledge the customer\'s need for help. Express willingness to assist.',
      questionHandling: 'Listen actively, ask clarifying questions, provide clear explanations, confirm resolution.',
      closingStrategy: 'Summarize resolution, ask if anything else is needed, provide follow-up information if relevant.'
    },
    metrics: {
      successCriteria: [
        'Issue resolution rate',
        'Customer satisfaction score',
        'First contact resolution',
        'Average handling time'
      ],
      kpiTargets: {
        'resolution_rate': 85,
        'satisfaction_score': 4.2,
        'first_contact_resolution': 70
      }
    },
    complianceConsiderations: {
      dataHandling: 'Protect customer PII, secure account information, maintain conversation logs',
      privacyRequirements: 'Verify customer identity before accessing account details',
      regulatoryFocus: ['Consumer protection', 'Data privacy', 'Service level agreements']
    }
  },

  sales: {
    id: 'sales',
    name: 'Sales Assistant',
    description: 'Focused on lead qualification, product education, and sales support',
    primaryObjectives: [
      'Qualify leads effectively',
      'Educate prospects about products/services',
      'Guide prospects through sales funnel',
      'Schedule appointments with sales team'
    ],
    behaviorPatterns: {
      responseStrategy: 'Focus on understanding needs, building value, and guiding toward next steps. Be consultative, not pushy.',
      informationGathering: 'Discover pain points, budget considerations, decision-making process, timeline, and key stakeholders.',
      problemSolving: 'Position products/services as solutions to identified problems. Provide relevant case studies and benefits.',
      escalationCriteria: 'Escalate qualified leads to sales team, complex pricing questions, or when prospect requests human interaction.'
    },
    knowledgeAreas: [
      'Product features and benefits',
      'Competitive advantages',
      'Pricing and packages',
      'Case studies and testimonials',
      'Sales qualification frameworks'
    ],
    conversationFlow: {
      greeting: 'Welcome prospects warmly and identify how you can help with their business needs.',
      questionHandling: 'Ask discovery questions, present relevant solutions, address objections professionally.',
      closingStrategy: 'Summarize value proposition, suggest next steps, schedule follow-up or demo if appropriate.'
    },
    metrics: {
      successCriteria: [
        'Lead qualification rate',
        'Conversion to sales meetings',
        'Information capture completeness',
        'Prospect engagement time'
      ],
      kpiTargets: {
        'qualification_rate': 60,
        'meeting_conversion': 25,
        'engagement_time': 5
      }
    },
    complianceConsiderations: {
      dataHandling: 'Capture and protect prospect information, maintain CRM data integrity',
      privacyRequirements: 'Obtain consent for data collection and follow-up communications',
      regulatoryFocus: ['CAN-SPAM compliance', 'GDPR consent', 'Sales disclosure requirements']
    }
  },

  general: {
    id: 'general',
    name: 'General Assistant',
    description: 'Versatile assistant for various tasks and inquiries',
    primaryObjectives: [
      'Provide helpful information on diverse topics',
      'Assist with various tasks and questions',
      'Maintain engaging conversations',
      'Direct users to appropriate resources'
    ],
    behaviorPatterns: {
      responseStrategy: 'Be versatile and adaptive. Provide comprehensive answers while staying focused on user needs.',
      informationGathering: 'Ask clarifying questions to understand context and provide most relevant assistance.',
      problemSolving: 'Break down complex requests into manageable parts. Offer multiple approaches when appropriate.',
      escalationCriteria: 'Escalate when requests exceed capabilities, require specialized expertise, or involve sensitive topics.'
    },
    knowledgeAreas: [
      'General knowledge and facts',
      'Common tasks and procedures',
      'Basic troubleshooting',
      'Information research',
      'Communication assistance'
    ],
    conversationFlow: {
      greeting: 'Greet users warmly and ask how you can assist them today.',
      questionHandling: 'Provide thorough, accurate responses. Ask follow-up questions to ensure completeness.',
      closingStrategy: 'Confirm satisfaction with response and offer additional assistance if needed.'
    },
    metrics: {
      successCriteria: [
        'Response accuracy',
        'User satisfaction',
        'Task completion rate',
        'Conversation engagement'
      ],
      kpiTargets: {
        'accuracy_rate': 90,
        'satisfaction_score': 4.0,
        'completion_rate': 80
      }
    },
    complianceConsiderations: {
      dataHandling: 'Protect any personal information shared during conversations',
      privacyRequirements: 'Respect user privacy and avoid storing sensitive information',
      regulatoryFocus: ['General data protection', 'Content accuracy standards']
    }
  },

  technical: {
    id: 'technical',
    name: 'Technical Support',
    description: 'Specialized in technical troubleshooting and IT support',
    primaryObjectives: [
      'Diagnose technical issues accurately',
      'Provide step-by-step technical solutions',
      'Educate users on technical concepts',
      'Escalate complex technical problems'
    ],
    behaviorPatterns: {
      responseStrategy: 'Be systematic and methodical. Use technical accuracy while maintaining clarity for non-technical users.',
      informationGathering: 'Collect detailed technical information: system specs, error messages, reproduction steps, environment details.',
      problemSolving: 'Use logical troubleshooting methodology. Start with common solutions, progress to advanced diagnostics.',
      escalationCriteria: 'Escalate for: hardware failures, security incidents, system-wide issues, or when solution requires elevated privileges.'
    },
    knowledgeAreas: [
      'System administration',
      'Network troubleshooting',
      'Software configuration',
      'Security best practices',
      'Hardware diagnostics'
    ],
    conversationFlow: {
      greeting: 'Acknowledge the technical issue and express confidence in finding a solution.',
      questionHandling: 'Ask specific technical questions, provide detailed instructions, verify each step completion.',
      closingStrategy: 'Confirm issue resolution, provide prevention tips, document solution for future reference.'
    },
    metrics: {
      successCriteria: [
        'Issue resolution rate',
        'Technical accuracy',
        'Resolution time',
        'User understanding of solution'
      ],
      kpiTargets: {
        'resolution_rate': 80,
        'accuracy_score': 95,
        'avg_resolution_time': 15
      }
    },
    complianceConsiderations: {
      dataHandling: 'Protect system information, maintain security logs, handle credentials securely',
      privacyRequirements: 'Verify user authorization before accessing systems or sensitive data',
      regulatoryFocus: ['Information security', 'System access controls', 'Audit trail requirements']
    }
  }
};

/**
 * UseCaseBehaviorService
 * Handles use case-specific behavioral modifications
 */
export class UseCaseBehaviorService {
  private static instance: UseCaseBehaviorService;

  private constructor() {}

  public static getInstance(): UseCaseBehaviorService {
    if (!UseCaseBehaviorService.instance) {
      UseCaseBehaviorService.instance = new UseCaseBehaviorService();
    }
    return UseCaseBehaviorService.instance;
  }

  /**
   * Get use case profile by ID
   */
  public getUseCaseProfile(useCaseId: string): UseCaseProfile | null {
    return USE_CASE_PROFILES[useCaseId] || null;
  }

  /**
   * Generate use case-specific system prompt modifications
   */
  public generateUseCaseSystemPrompt(
    baseSystemPrompt: string,
    useCaseId: string,
    complianceFramework?: string
  ): string {
    const useCase = this.getUseCaseProfile(useCaseId);
    
    if (!useCase || useCaseId === 'no_modification') {
      return baseSystemPrompt;
    }

    const useCaseInstructions = `

USE CASE CONFIGURATION: ${useCase.name}
${useCase.description}

PRIMARY OBJECTIVES:
${useCase.primaryObjectives.map(obj => `- ${obj}`).join('\n')}

BEHAVIORAL PATTERNS:
- Response Strategy: ${useCase.behaviorPatterns.responseStrategy}
- Information Gathering: ${useCase.behaviorPatterns.informationGathering}
- Problem Solving: ${useCase.behaviorPatterns.problemSolving}
- Escalation Criteria: ${useCase.behaviorPatterns.escalationCriteria}

KNOWLEDGE FOCUS AREAS:
${useCase.knowledgeAreas.map(area => `- ${area}`).join('\n')}

CONVERSATION FLOW:
- Greeting: ${useCase.conversationFlow.greeting}
- Question Handling: ${useCase.conversationFlow.questionHandling}
- Closing Strategy: ${useCase.conversationFlow.closingStrategy}

SUCCESS METRICS:
${useCase.metrics.successCriteria.map(criteria => `- ${criteria}`).join('\n')}

COMPLIANCE REQUIREMENTS FOR THIS USE CASE:
- Data Handling: ${useCase.complianceConsiderations.dataHandling}
- Privacy Requirements: ${useCase.complianceConsiderations.privacyRequirements}
- Regulatory Focus: ${useCase.complianceConsiderations.regulatoryFocus.join(', ')}

IMPORTANT: All use case behaviors must comply with ${complianceFramework || 'applicable'} regulations and maintain governance standards.`;

    return baseSystemPrompt + useCaseInstructions;
  }

  /**
   * Get all available use case profiles
   */
  public getAllUseCaseProfiles(): UseCaseProfile[] {
    return Object.values(USE_CASE_PROFILES);
  }

  /**
   * Validate use case configuration for compliance
   */
  public validateUseCaseCompliance(
    useCaseId: string,
    complianceFramework: string
  ): { isValid: boolean; warnings: string[] } {
    const useCase = this.getUseCaseProfile(useCaseId);
    const warnings: string[] = [];

    if (!useCase) {
      return { isValid: false, warnings: ['Invalid use case profile'] };
    }

    // Framework-specific validation
    if (complianceFramework === 'healthcare') {
      if (useCaseId === 'sales' && !useCase.complianceConsiderations.regulatoryFocus.includes('HIPAA')) {
        warnings.push('Sales use case in healthcare context requires HIPAA compliance considerations');
      }
    }

    if (complianceFramework === 'financial') {
      if (!useCase.complianceConsiderations.regulatoryFocus.some(focus => 
        focus.includes('financial') || focus.includes('SOX') || focus.includes('audit'))) {
        warnings.push('Financial contexts require specific regulatory compliance measures');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Get recommended KPIs for a use case
   */
  public getUseCaseKPIs(useCaseId: string): Record<string, number> {
    const useCase = this.getUseCaseProfile(useCaseId);
    return useCase?.metrics.kpiTargets || {};
  }
}

