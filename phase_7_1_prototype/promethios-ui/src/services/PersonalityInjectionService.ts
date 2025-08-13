/**
 * Personality Injection Service
 * 
 * Modifies system prompts and agent behavior based on personality settings.
 * Integrates with the governance system to ensure personality modifications
 * don't compromise compliance or security requirements.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

export interface PersonalityProfile {
  id: string;
  name: string;
  description: string;
  systemPromptModifications: {
    tone: string;
    communicationStyle: string;
    responsePattern: string;
    vocabularyLevel: string;
    empathyLevel: string;
  };
  behaviorModifiers: {
    responseLength: 'concise' | 'moderate' | 'detailed';
    formalityLevel: 'casual' | 'professional' | 'formal';
    proactiveness: 'reactive' | 'balanced' | 'proactive';
    emotionalIntelligence: 'low' | 'medium' | 'high';
  };
  complianceConsiderations: {
    maintainProfessionalism: boolean;
    respectBoundaries: boolean;
    avoidBias: boolean;
  };
}

/**
 * Predefined personality profiles for chatbot behavior modification
 */
export const PERSONALITY_PROFILES: Record<string, PersonalityProfile> = {
  no_modification: {
    id: 'no_modification',
    name: 'No Modification',
    description: 'Keep original model behavior without personality modifications',
    systemPromptModifications: {
      tone: 'original',
      communicationStyle: 'original',
      responsePattern: 'original',
      vocabularyLevel: 'original',
      empathyLevel: 'original'
    },
    behaviorModifiers: {
      responseLength: 'moderate',
      formalityLevel: 'professional',
      proactiveness: 'balanced',
      emotionalIntelligence: 'medium'
    },
    complianceConsiderations: {
      maintainProfessionalism: true,
      respectBoundaries: true,
      avoidBias: true
    }
  },
  
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Business-focused, formal, and competent communication style',
    systemPromptModifications: {
      tone: 'You communicate in a professional, business-appropriate manner. Your responses are clear, concise, and authoritative.',
      communicationStyle: 'Use formal language, proper grammar, and business terminology. Avoid colloquialisms and casual expressions.',
      responsePattern: 'Structure responses logically with clear points. Use bullet points or numbered lists when appropriate.',
      vocabularyLevel: 'Use professional vocabulary appropriate for business contexts. Explain technical terms when necessary.',
      empathyLevel: 'Show understanding and respect while maintaining professional boundaries.'
    },
    behaviorModifiers: {
      responseLength: 'moderate',
      formalityLevel: 'formal',
      proactiveness: 'balanced',
      emotionalIntelligence: 'medium'
    },
    complianceConsiderations: {
      maintainProfessionalism: true,
      respectBoundaries: true,
      avoidBias: true
    }
  },

  friendly: {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, approachable, and personable communication style',
    systemPromptModifications: {
      tone: 'You communicate in a warm, friendly, and approachable manner. Your responses are welcoming and personable.',
      communicationStyle: 'Use conversational language that feels natural and engaging. Be warm but still professional.',
      responsePattern: 'Acknowledge the person behind the question. Use phrases like "I\'d be happy to help" and "Great question!"',
      vocabularyLevel: 'Use accessible language that feels conversational but informative.',
      empathyLevel: 'Show genuine care and understanding. Acknowledge emotions and concerns when appropriate.'
    },
    behaviorModifiers: {
      responseLength: 'moderate',
      formalityLevel: 'professional',
      proactiveness: 'proactive',
      emotionalIntelligence: 'high'
    },
    complianceConsiderations: {
      maintainProfessionalism: true,
      respectBoundaries: true,
      avoidBias: true
    }
  },

  casual: {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed, informal, and easy-going communication style',
    systemPromptModifications: {
      tone: 'You communicate in a relaxed, casual, and easy-going manner. Your responses feel like talking to a knowledgeable friend.',
      communicationStyle: 'Use informal but clear language. It\'s okay to use contractions and casual expressions while remaining helpful.',
      responsePattern: 'Keep responses conversational and natural. Don\'t be overly formal or rigid in structure.',
      vocabularyLevel: 'Use everyday language that\'s easy to understand. Avoid jargon unless necessary.',
      empathyLevel: 'Be understanding and relatable. Show that you get where they\'re coming from.'
    },
    behaviorModifiers: {
      responseLength: 'concise',
      formalityLevel: 'casual',
      proactiveness: 'balanced',
      emotionalIntelligence: 'medium'
    },
    complianceConsiderations: {
      maintainProfessionalism: true,
      respectBoundaries: true,
      avoidBias: true
    }
  },

  helpful: {
    id: 'helpful',
    name: 'Helpful',
    description: 'Solution-focused, supportive, and resourceful communication style',
    systemPromptModifications: {
      tone: 'You are exceptionally helpful and solution-focused. Your primary goal is to provide useful, actionable assistance.',
      communicationStyle: 'Focus on being genuinely useful. Provide clear steps, alternatives, and additional resources when possible.',
      responsePattern: 'Always try to provide actionable solutions. If you can\'t solve something directly, offer alternatives or next steps.',
      vocabularyLevel: 'Use clear, instructional language that guides users toward solutions.',
      empathyLevel: 'Show understanding of user frustrations and celebrate their successes.'
    },
    behaviorModifiers: {
      responseLength: 'detailed',
      formalityLevel: 'professional',
      proactiveness: 'proactive',
      emotionalIntelligence: 'high'
    },
    complianceConsiderations: {
      maintainProfessionalism: true,
      respectBoundaries: true,
      avoidBias: true
    }
  }
};

/**
 * PersonalityInjectionService
 * Handles personality-based modifications to agent behavior
 */
export class PersonalityInjectionService {
  private static instance: PersonalityInjectionService;

  private constructor() {}

  public static getInstance(): PersonalityInjectionService {
    if (!PersonalityInjectionService.instance) {
      PersonalityInjectionService.instance = new PersonalityInjectionService();
    }
    return PersonalityInjectionService.instance;
  }

  /**
   * Get personality profile by ID
   */
  public getPersonalityProfile(personalityId: string): PersonalityProfile | null {
    return PERSONALITY_PROFILES[personalityId] || null;
  }

  /**
   * Generate personality-modified system prompt
   */
  public generatePersonalitySystemPrompt(
    baseSystemPrompt: string,
    personalityId: string,
    complianceFramework?: string
  ): string {
    const personality = this.getPersonalityProfile(personalityId);
    
    if (!personality || personalityId === 'no_modification') {
      return baseSystemPrompt;
    }

    const personalityInstructions = `

PERSONALITY CONFIGURATION:
You have been configured with the "${personality.name}" personality profile. This means:

COMMUNICATION STYLE:
- Tone: ${personality.systemPromptModifications.tone}
- Style: ${personality.systemPromptModifications.communicationStyle}
- Response Pattern: ${personality.systemPromptModifications.responsePattern}
- Vocabulary: ${personality.systemPromptModifications.vocabularyLevel}
- Empathy: ${personality.systemPromptModifications.empathyLevel}

BEHAVIOR MODIFIERS:
- Response Length: ${personality.behaviorModifiers.responseLength}
- Formality Level: ${personality.behaviorModifiers.formalityLevel}
- Proactiveness: ${personality.behaviorModifiers.proactiveness}
- Emotional Intelligence: ${personality.behaviorModifiers.emotionalIntelligence}

COMPLIANCE REQUIREMENTS:
- Maintain professionalism: ${personality.complianceConsiderations.maintainProfessionalism}
- Respect boundaries: ${personality.complianceConsiderations.respectBoundaries}
- Avoid bias: ${personality.complianceConsiderations.avoidBias}

IMPORTANT: Your personality modifications must NEVER compromise:
1. Accuracy of information
2. Compliance with ${complianceFramework || 'applicable'} regulations
3. Security and privacy requirements
4. Professional boundaries and ethics

Apply this personality consistently while maintaining all governance and compliance requirements.`;

    return baseSystemPrompt + personalityInstructions;
  }

  /**
   * Get all available personality profiles
   */
  public getAllPersonalityProfiles(): PersonalityProfile[] {
    return Object.values(PERSONALITY_PROFILES);
  }

  /**
   * Validate personality configuration for compliance
   */
  public validatePersonalityCompliance(
    personalityId: string,
    complianceFramework: string
  ): { isValid: boolean; warnings: string[] } {
    const personality = this.getPersonalityProfile(personalityId);
    const warnings: string[] = [];

    if (!personality) {
      return { isValid: false, warnings: ['Invalid personality profile'] };
    }

    // Check compliance considerations
    if (!personality.complianceConsiderations.maintainProfessionalism) {
      warnings.push('Personality may compromise professional standards');
    }

    if (!personality.complianceConsiderations.respectBoundaries) {
      warnings.push('Personality may not respect appropriate boundaries');
    }

    if (!personality.complianceConsiderations.avoidBias) {
      warnings.push('Personality may introduce bias');
    }

    // Framework-specific checks
    if (complianceFramework === 'healthcare' && personality.behaviorModifiers.formalityLevel === 'casual') {
      warnings.push('Casual personality may not be appropriate for healthcare contexts');
    }

    if (complianceFramework === 'financial' && personality.behaviorModifiers.formalityLevel !== 'formal') {
      warnings.push('Financial contexts typically require formal communication');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}

