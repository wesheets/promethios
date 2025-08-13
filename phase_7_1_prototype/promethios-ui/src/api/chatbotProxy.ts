/**
 * Chatbot Proxy
 * 
 * Specialized proxy for chatbot interactions that applies personality,
 * use case, and deployment channel modifications while maintaining
 * governance and compliance requirements.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { ChatMessage, ChatCompletionRequest, ChatCompletionResponse } from './openaiProxy';
import { PersonalityInjectionService } from '../services/PersonalityInjectionService';
import { UseCaseBehaviorService } from '../services/UseCaseBehaviorService';
import { DeploymentChannelService } from '../services/DeploymentChannelService';
import { ChatbotStorageService } from '../services/ChatbotStorageService';
import { UnifiedPolicyRegistry } from '../services/UnifiedPolicyRegistry';

export interface ChatbotProfile {
  id: string;
  name: string;
  personality?: string;
  useCase?: string;
  deploymentChannels?: string[];
  complianceFramework?: string;
  governancePolicy?: any;
}

/**
 * Create a comprehensive system message for a governed chatbot
 * Applies personality, use case, and channel modifications
 */
export async function createChatbotSystemMessage(
  chatbotId: string,
  userId: string,
  channelContext?: string
): Promise<string> {
  console.log('🤖 createChatbotSystemMessage: Called with chatbotId:', chatbotId, 'userId:', userId);
  
  try {
    // Get chatbot profile from storage
    const chatbotService = ChatbotStorageService.getInstance();
    const chatbotProfile = await chatbotService.getChatbot(userId, chatbotId);
    
    if (!chatbotProfile) {
      throw new Error(`Chatbot profile not found: ${chatbotId}`);
    }

    console.log('🤖 Chatbot profile loaded:', chatbotProfile);

    // Start with base governance system prompt
    let systemPrompt = `You are ${chatbotProfile.identity.name}, a governed AI chatbot with enterprise-grade compliance and security controls.

=== GOVERNANCE FOUNDATION ===
You operate under comprehensive governance policies that ensure:
- Regulatory compliance (${chatbotProfile.governancePolicy?.complianceFramework || 'general'})
- Data protection and privacy
- Ethical AI principles
- Audit logging and monitoring
- Trust and safety measures

Your trust threshold is set to ${chatbotProfile.governancePolicy?.trustThreshold || 85}% with ${chatbotProfile.governancePolicy?.securityLevel || 'standard'} security level.

=== CORE CAPABILITIES ===
- Provide accurate, helpful information
- Maintain professional boundaries
- Respect user privacy and data protection
- Follow all compliance requirements
- Escalate when appropriate

=== OPERATIONAL BOUNDARIES ===
PERMITTED ACTIONS:
- Provide information within your knowledge domain
- Assist with tasks appropriate to your use case
- Maintain engaging, helpful conversations
- Follow personality and communication guidelines

PROHIBITED ACTIONS:
- Never provide medical diagnoses or treatment advice
- Never give specific financial investment recommendations
- Never access or request sensitive personal information
- Never provide legal advice for specific situations
- Never generate harmful, illegal, or unethical content
- Never bypass governance or safety protocols`;

    // Apply personality modifications
    if (chatbotProfile.chatbotConfig?.personality && chatbotProfile.chatbotConfig.personality !== 'no_modification') {
      const personalityService = PersonalityInjectionService.getInstance();
      systemPrompt = personalityService.generatePersonalitySystemPrompt(
        systemPrompt,
        chatbotProfile.chatbotConfig.personality,
        chatbotProfile.governancePolicy?.complianceFramework
      );
      console.log('🎭 Applied personality:', chatbotProfile.chatbotConfig.personality);
    }

    // Apply use case modifications
    if (chatbotProfile.chatbotConfig?.useCase && chatbotProfile.chatbotConfig.useCase !== 'no_modification') {
      const useCaseService = UseCaseBehaviorService.getInstance();
      systemPrompt = useCaseService.generateUseCaseSystemPrompt(
        systemPrompt,
        chatbotProfile.chatbotConfig.useCase,
        chatbotProfile.governancePolicy?.complianceFramework
      );
      console.log('🎯 Applied use case:', chatbotProfile.chatbotConfig.useCase);
    }

    // Apply deployment channel modifications
    if (chatbotProfile.chatbotConfig?.deploymentChannels && 
        !chatbotProfile.chatbotConfig.deploymentChannels.includes('governance_only')) {
      const channelService = DeploymentChannelService.getInstance();
      systemPrompt = channelService.generateChannelSystemPrompt(
        systemPrompt,
        chatbotProfile.chatbotConfig.deploymentChannels,
        chatbotProfile.governancePolicy?.complianceFramework
      );
      console.log('📡 Applied deployment channels:', chatbotProfile.chatbotConfig.deploymentChannels);
    }

    // Add compliance policy enforcement
    if (chatbotProfile.governancePolicy?.complianceFramework && 
        chatbotProfile.governancePolicy.complianceFramework !== 'general') {
      const policyRegistry = UnifiedPolicyRegistry.getInstance();
      const compliancePolicies = await policyRegistry.getPoliciesByFramework(
        chatbotProfile.governancePolicy.complianceFramework
      );
      
      if (compliancePolicies.length > 0) {
        systemPrompt += `

=== COMPLIANCE ENFORCEMENT ===
Active Compliance Framework: ${chatbotProfile.governancePolicy.complianceFramework.toUpperCase()}

You must strictly adhere to the following compliance requirements:
${compliancePolicies.map(policy => `
- ${policy.name}: ${policy.description}
  Enforcement Level: ${policy.enforcementLevel || 'standard'}
  Key Requirements: ${policy.summary}`).join('')}

COMPLIANCE VERIFICATION:
Before each response, verify:
- Does this comply with ${chatbotProfile.governancePolicy.complianceFramework} requirements?
- Am I protecting sensitive data appropriately?
- Are there any regulatory risks in this response?
- Should this interaction be escalated for compliance review?`;
      }
    }

    // Add audit and monitoring context
    if (chatbotProfile.governancePolicy?.enableAuditLogging) {
      systemPrompt += `

=== AUDIT & MONITORING ===
This conversation is being monitored and logged for:
- Quality assurance and improvement
- Compliance verification and audit trails
- Security monitoring and threat detection
- Performance analytics and optimization

You should:
- Maintain awareness that interactions are logged
- Provide clear, professional responses suitable for audit review
- Flag any potential compliance or security concerns
- Document reasoning for complex decisions`;
    }

    // Add final governance reminder
    systemPrompt += `

=== GOVERNANCE REMINDER ===
You are a governed AI chatbot. This means:
- All responses must comply with configured policies
- Personality and behavior modifications enhance but never compromise compliance
- When in doubt, prioritize safety, compliance, and user protection
- Escalate complex situations rather than risk policy violations
- Maintain transparency about your capabilities and limitations

Remember: Your behavioral configurations (personality, use case, channels) are designed to improve user experience while maintaining the highest standards of governance, compliance, and safety.`;

    console.log('✅ Complete chatbot system prompt generated with all behavioral modifications');
    return systemPrompt;

  } catch (error) {
    console.error('❌ Error creating chatbot system message:', error);
    
    // Fallback to basic governed system prompt
    return `You are a governed AI chatbot with enterprise compliance controls. 
    
You must:
- Follow all applicable regulations and policies
- Protect user privacy and data
- Maintain professional boundaries
- Provide helpful, accurate information
- Escalate when appropriate
    
You operate under comprehensive governance to ensure safety, compliance, and trustworthiness.`;
  }
}

/**
 * Send a chat completion request for a governed chatbot
 * Includes behavioral modifications and compliance checks
 */
export async function sendChatbotCompletionRequest(
  request: ChatCompletionRequest,
  chatbotId: string,
  userId: string,
  channelContext?: string
): Promise<ChatCompletionResponse> {
  try {
    // Get chatbot-specific system message
    const systemMessage = await createChatbotSystemMessage(chatbotId, userId, channelContext);
    
    // Replace or prepend system message
    const messages = [...request.messages];
    const systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
    
    if (systemMessageIndex >= 0) {
      messages[systemMessageIndex] = { role: 'system', content: systemMessage };
    } else {
      messages.unshift({ role: 'system', content: systemMessage });
    }

    // Get chatbot profile for channel constraints
    const chatbotService = ChatbotStorageService.getInstance();
    const chatbotProfile = await chatbotService.getChatbot(userId, chatbotId);
    
    // Apply channel-specific constraints
    let modifiedRequest = { ...request, messages };
    
    if (chatbotProfile?.chatbotConfig?.deploymentChannels) {
      const channelService = DeploymentChannelService.getInstance();
      const constraints = channelService.getOptimalResponseFormat(
        chatbotProfile.chatbotConfig.deploymentChannels
      );
      
      // Adjust max_tokens based on channel constraints
      if (constraints.maxLength && constraints.maxLength < (request.max_tokens || 4000)) {
        modifiedRequest.max_tokens = Math.min(constraints.maxLength, request.max_tokens || 4000);
      }
    }

    // Send request to OpenAI
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(modifiedRequest)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    // Log interaction for audit if enabled
    if (chatbotProfile?.governancePolicy?.enableAuditLogging) {
      console.log('📝 Audit Log: Chatbot interaction completed', {
        chatbotId,
        userId,
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
        responseLength: result.choices[0]?.message?.content?.length || 0,
        model: modifiedRequest.model,
        compliance: chatbotProfile.governancePolicy.complianceFramework
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Error sending chatbot completion request:', error);
    throw error;
  }
}

/**
 * Validate chatbot configuration for behavioral consistency
 */
export async function validateChatbotConfiguration(
  chatbotId: string,
  userId: string
): Promise<{ isValid: boolean; warnings: string[]; errors: string[] }> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    const chatbotService = ChatbotStorageService.getInstance();
    const chatbotProfile = await chatbotService.getChatbot(userId, chatbotId);
    
    if (!chatbotProfile) {
      errors.push('Chatbot profile not found');
      return { isValid: false, warnings, errors };
    }

    const complianceFramework = chatbotProfile.governancePolicy?.complianceFramework || 'general';

    // Validate personality configuration
    if (chatbotProfile.chatbotConfig?.personality && 
        chatbotProfile.chatbotConfig.personality !== 'no_modification') {
      const personalityService = PersonalityInjectionService.getInstance();
      const personalityValidation = personalityService.validatePersonalityCompliance(
        chatbotProfile.chatbotConfig.personality,
        complianceFramework
      );
      warnings.push(...personalityValidation.warnings);
    }

    // Validate use case configuration
    if (chatbotProfile.chatbotConfig?.useCase && 
        chatbotProfile.chatbotConfig.useCase !== 'no_modification') {
      const useCaseService = UseCaseBehaviorService.getInstance();
      const useCaseValidation = useCaseService.validateUseCaseCompliance(
        chatbotProfile.chatbotConfig.useCase,
        complianceFramework
      );
      warnings.push(...useCaseValidation.warnings);
    }

    // Validate deployment channel configuration
    if (chatbotProfile.chatbotConfig?.deploymentChannels && 
        !chatbotProfile.chatbotConfig.deploymentChannels.includes('governance_only')) {
      const channelService = DeploymentChannelService.getInstance();
      const channelValidation = channelService.validateChannelCompliance(
        chatbotProfile.chatbotConfig.deploymentChannels,
        complianceFramework
      );
      warnings.push(...channelValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };

  } catch (error) {
    errors.push(`Configuration validation failed: ${error}`);
    return { isValid: false, warnings, errors };
  }
}

