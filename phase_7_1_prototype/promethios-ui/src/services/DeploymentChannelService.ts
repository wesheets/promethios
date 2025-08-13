/**
 * Deployment Channel Service
 * 
 * Handles channel-specific behaviors and configurations for different
 * deployment environments. Ensures appropriate behavior across various
 * communication channels while maintaining governance.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

export interface ChannelProfile {
  id: string;
  name: string;
  description: string;
  characteristics: {
    messageLength: 'short' | 'medium' | 'long';
    formality: 'casual' | 'professional' | 'formal';
    interactivity: 'low' | 'medium' | 'high';
    multimedia: boolean;
  };
  behaviorModifications: {
    responseFormat: string;
    communicationStyle: string;
    errorHandling: string;
    escalationMethod: string;
  };
  technicalConstraints: {
    maxMessageLength?: number;
    supportedFormats: string[];
    realTimeExpectation: boolean;
    persistentContext: boolean;
  };
  complianceConsiderations: {
    dataRetention: string;
    auditRequirements: string;
    privacyControls: string;
  };
}

/**
 * Predefined channel profiles for different deployment environments
 */
export const CHANNEL_PROFILES: Record<string, ChannelProfile> = {
  governance_only: {
    id: 'governance_only',
    name: 'Governance Only',
    description: 'No channel-specific modifications, governance controls only',
    characteristics: {
      messageLength: 'medium',
      formality: 'professional',
      interactivity: 'medium',
      multimedia: false
    },
    behaviorModifications: {
      responseFormat: 'Standard response format without channel-specific adaptations',
      communicationStyle: 'Use original communication style',
      errorHandling: 'Standard error handling procedures',
      escalationMethod: 'Default escalation protocols'
    },
    technicalConstraints: {
      supportedFormats: ['text'],
      realTimeExpectation: false,
      persistentContext: true
    },
    complianceConsiderations: {
      dataRetention: 'Standard data retention policies',
      auditRequirements: 'Basic audit logging',
      privacyControls: 'Standard privacy controls'
    }
  },

  web: {
    id: 'web',
    name: 'Web Widget',
    description: 'Embedded web chat widget for websites',
    characteristics: {
      messageLength: 'medium',
      formality: 'professional',
      interactivity: 'high',
      multimedia: true
    },
    behaviorModifications: {
      responseFormat: 'Use structured responses with clear formatting. Support rich text, links, and basic HTML formatting.',
      communicationStyle: 'Professional but approachable. Use web-friendly language and provide clickable links when helpful.',
      errorHandling: 'Provide clear error messages with suggested actions. Offer alternative ways to get help.',
      escalationMethod: 'Offer live chat transfer, callback requests, or support ticket creation.'
    },
    technicalConstraints: {
      maxMessageLength: 2000,
      supportedFormats: ['text', 'html', 'links', 'images'],
      realTimeExpectation: true,
      persistentContext: true
    },
    complianceConsiderations: {
      dataRetention: 'Store conversation history for user convenience and support follow-up',
      auditRequirements: 'Log all interactions for quality assurance and compliance',
      privacyControls: 'Implement cookie consent and data privacy notices'
    }
  },

  email: {
    id: 'email',
    name: 'Email',
    description: 'Email-based communication and support',
    characteristics: {
      messageLength: 'long',
      formality: 'formal',
      interactivity: 'low',
      multimedia: true
    },
    behaviorModifications: {
      responseFormat: 'Use formal email structure with proper greeting, body, and closing. Include relevant attachments or links.',
      communicationStyle: 'Professional and comprehensive. Provide complete information to minimize back-and-forth exchanges.',
      errorHandling: 'Include detailed troubleshooting steps and multiple contact options in error responses.',
      escalationMethod: 'CC appropriate team members or provide direct contact information for complex issues.'
    },
    technicalConstraints: {
      maxMessageLength: 10000,
      supportedFormats: ['text', 'html', 'attachments', 'images'],
      realTimeExpectation: false,
      persistentContext: false
    },
    complianceConsiderations: {
      dataRetention: 'Follow email retention policies and legal hold requirements',
      auditRequirements: 'Maintain email audit trails for compliance and legal purposes',
      privacyControls: 'Include privacy disclaimers and unsubscribe options'
    }
  },

  slack: {
    id: 'slack',
    name: 'Slack',
    description: 'Slack workspace integration for team communication',
    characteristics: {
      messageLength: 'short',
      formality: 'casual',
      interactivity: 'high',
      multimedia: true
    },
    behaviorModifications: {
      responseFormat: 'Use Slack-friendly formatting with emojis, mentions, and threading. Keep responses concise and actionable.',
      communicationStyle: 'Casual but professional. Use team-appropriate language and Slack conventions like @mentions and #channels.',
      errorHandling: 'Use Slack\'s ephemeral messages for errors. Provide quick fixes and escalation options.',
      escalationMethod: 'Tag relevant team members, create threads for complex discussions, or suggest moving to DMs.'
    },
    technicalConstraints: {
      maxMessageLength: 4000,
      supportedFormats: ['text', 'markdown', 'mentions', 'emojis', 'files'],
      realTimeExpectation: true,
      persistentContext: true
    },
    complianceConsiderations: {
      dataRetention: 'Follow Slack workspace retention policies and compliance requirements',
      auditRequirements: 'Ensure Slack audit logs capture bot interactions for compliance',
      privacyControls: 'Respect workspace privacy settings and user permissions'
    }
  },

  api: {
    id: 'api',
    name: 'API',
    description: 'Direct API integration for programmatic access',
    characteristics: {
      messageLength: 'medium',
      formality: 'professional',
      interactivity: 'medium',
      multimedia: false
    },
    behaviorModifications: {
      responseFormat: 'Provide structured, machine-readable responses. Use consistent JSON formatting and include metadata.',
      communicationStyle: 'Technical and precise. Focus on accuracy and completeness for programmatic consumption.',
      errorHandling: 'Return structured error responses with error codes, messages, and suggested remediation steps.',
      escalationMethod: 'Provide API endpoints for escalation or include contact information in error responses.'
    },
    technicalConstraints: {
      maxMessageLength: 8000,
      supportedFormats: ['json', 'text', 'structured_data'],
      realTimeExpectation: true,
      persistentContext: false
    },
    complianceConsiderations: {
      dataRetention: 'Log API interactions for audit and debugging purposes',
      auditRequirements: 'Maintain comprehensive API audit logs with request/response details',
      privacyControls: 'Implement API key management and access controls'
    }
  }
};

/**
 * DeploymentChannelService
 * Handles channel-specific behavioral modifications
 */
export class DeploymentChannelService {
  private static instance: DeploymentChannelService;

  private constructor() {}

  public static getInstance(): DeploymentChannelService {
    if (!DeploymentChannelService.instance) {
      DeploymentChannelService.instance = new DeploymentChannelService();
    }
    return DeploymentChannelService.instance;
  }

  /**
   * Get channel profile by ID
   */
  public getChannelProfile(channelId: string): ChannelProfile | null {
    return CHANNEL_PROFILES[channelId] || null;
  }

  /**
   * Generate channel-specific system prompt modifications
   */
  public generateChannelSystemPrompt(
    baseSystemPrompt: string,
    channelIds: string[],
    complianceFramework?: string
  ): string {
    if (!channelIds || channelIds.length === 0 || channelIds.includes('governance_only')) {
      return baseSystemPrompt;
    }

    const channelInstructions = channelIds.map(channelId => {
      const channel = this.getChannelProfile(channelId);
      if (!channel) return '';

      return `
DEPLOYMENT CHANNEL: ${channel.name}
${channel.description}

CHANNEL CHARACTERISTICS:
- Message Length: ${channel.characteristics.messageLength}
- Formality Level: ${channel.characteristics.formality}
- Interactivity: ${channel.characteristics.interactivity}
- Multimedia Support: ${channel.characteristics.multimedia}

BEHAVIOR MODIFICATIONS FOR ${channel.name.toUpperCase()}:
- Response Format: ${channel.behaviorModifications.responseFormat}
- Communication Style: ${channel.behaviorModifications.communicationStyle}
- Error Handling: ${channel.behaviorModifications.errorHandling}
- Escalation Method: ${channel.behaviorModifications.escalationMethod}

TECHNICAL CONSTRAINTS:
- Max Message Length: ${channel.technicalConstraints.maxMessageLength || 'No limit'}
- Supported Formats: ${channel.technicalConstraints.supportedFormats.join(', ')}
- Real-time Expectation: ${channel.technicalConstraints.realTimeExpectation}
- Persistent Context: ${channel.technicalConstraints.persistentContext}

COMPLIANCE FOR ${channel.name.toUpperCase()}:
- Data Retention: ${channel.complianceConsiderations.dataRetention}
- Audit Requirements: ${channel.complianceConsiderations.auditRequirements}
- Privacy Controls: ${channel.complianceConsiderations.privacyControls}`;
    }).filter(instruction => instruction).join('\n');

    if (!channelInstructions) {
      return baseSystemPrompt;
    }

    const finalInstructions = `
${channelInstructions}

IMPORTANT: Adapt your responses to the specific channel(s) while maintaining all ${complianceFramework || 'applicable'} compliance requirements and governance standards.`;

    return baseSystemPrompt + finalInstructions;
  }

  /**
   * Get all available channel profiles
   */
  public getAllChannelProfiles(): ChannelProfile[] {
    return Object.values(CHANNEL_PROFILES);
  }

  /**
   * Validate channel configuration for compliance
   */
  public validateChannelCompliance(
    channelIds: string[],
    complianceFramework: string
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    for (const channelId of channelIds) {
      const channel = this.getChannelProfile(channelId);
      if (!channel) {
        warnings.push(`Invalid channel profile: ${channelId}`);
        continue;
      }

      // Framework-specific validation
      if (complianceFramework === 'healthcare') {
        if (channel.characteristics.formality === 'casual' && channelId !== 'slack') {
          warnings.push(`${channel.name} casual communication may not be appropriate for healthcare contexts`);
        }
        if (!channel.technicalConstraints.persistentContext && channelId !== 'email') {
          warnings.push(`${channel.name} lacks persistent context which may be required for healthcare continuity`);
        }
      }

      if (complianceFramework === 'financial') {
        if (channel.characteristics.formality !== 'formal' && channelId !== 'slack') {
          warnings.push(`${channel.name} should use formal communication for financial contexts`);
        }
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Get technical constraints for channels
   */
  public getChannelConstraints(channelIds: string[]): Record<string, any> {
    const constraints: Record<string, any> = {};

    for (const channelId of channelIds) {
      const channel = this.getChannelProfile(channelId);
      if (channel) {
        constraints[channelId] = channel.technicalConstraints;
      }
    }

    return constraints;
  }

  /**
   * Determine optimal response format for channels
   */
  public getOptimalResponseFormat(channelIds: string[]): {
    maxLength: number;
    supportedFormats: string[];
    realTime: boolean;
  } {
    if (!channelIds || channelIds.length === 0) {
      return {
        maxLength: 2000,
        supportedFormats: ['text'],
        realTime: false
      };
    }

    const channels = channelIds.map(id => this.getChannelProfile(id)).filter(Boolean) as ChannelProfile[];
    
    return {
      maxLength: Math.min(...channels.map(c => c.technicalConstraints.maxMessageLength || 10000)),
      supportedFormats: channels.reduce((acc, c) => {
        return acc.filter(format => c.technicalConstraints.supportedFormats.includes(format));
      }, channels[0]?.technicalConstraints.supportedFormats || ['text']),
      realTime: channels.some(c => c.technicalConstraints.realTimeExpectation)
    };
  }
}

