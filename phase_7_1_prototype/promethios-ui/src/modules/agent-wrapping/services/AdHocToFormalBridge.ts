/**
 * AdHocToFormalBridge.ts
 * 
 * Service for bridging ad hoc multi-agent conversations to formal wrapping
 */

import { MultiAgentConversation, AgentResponse } from '../chat/services/AdHocMultiAgentService';
import { Agent } from '../chat/types';
import { MultiAgentSystem, FlowType, AgentRole } from '../agent-wrapping/types/multiAgent';

export interface ConversationAnalysis {
  recommendedFlowType: FlowType;
  agentPerformance: {
    agentId: string;
    agentName: string;
    responseQuality: number;
    responseTime: number;
    confidence: number;
    suggestedRole: AgentRole;
  }[];
  coordinationEffectiveness: number;
  suggestedGovernanceRules: {
    crossAgentValidation: boolean;
    errorHandling: 'strict' | 'fallback' | 'continue';
    loggingLevel: 'minimal' | 'standard' | 'detailed';
    governancePolicy: 'basic' | 'standard' | 'enhanced';
    maxExecutionTime: number;
    rateLimiting: {
      requestsPerMinute: number;
      burstLimit: number;
    };
  };
  systemName: string;
  systemDescription: string;
  confidence: number;
}

export interface WrappingRecommendation {
  conversation: MultiAgentConversation;
  analysis: ConversationAnalysis;
  isRecommended: boolean;
  reasons: string[];
  estimatedSuccessRate: number;
}

export class AdHocToFormalBridge {
  /**
   * Analyze a multi-agent conversation to determine if it's suitable for formal wrapping
   */
  analyzeConversation(conversation: MultiAgentConversation): ConversationAnalysis {
    const agentPerformance = this.analyzeAgentPerformance(conversation.responses);
    const coordinationEffectiveness = this.calculateCoordinationEffectiveness(conversation);
    const recommendedFlowType = this.recommendFlowType(conversation);
    const suggestedGovernanceRules = this.suggestGovernanceRules(conversation, coordinationEffectiveness);
    
    return {
      recommendedFlowType,
      agentPerformance,
      coordinationEffectiveness,
      suggestedGovernanceRules,
      systemName: this.generateSystemName(conversation),
      systemDescription: this.generateSystemDescription(conversation),
      confidence: this.calculateOverallConfidence(agentPerformance, coordinationEffectiveness)
    };
  }

  /**
   * Generate a wrapping recommendation based on conversation analysis
   */
  generateWrappingRecommendation(conversation: MultiAgentConversation): WrappingRecommendation {
    const analysis = this.analyzeConversation(conversation);
    const isRecommended = this.shouldRecommendWrapping(analysis);
    const reasons = this.generateRecommendationReasons(analysis, isRecommended);
    const estimatedSuccessRate = this.estimateSuccessRate(analysis);

    return {
      conversation,
      analysis,
      isRecommended,
      reasons,
      estimatedSuccessRate
    };
  }

  /**
   * Convert conversation analysis to MultiAgentSystem configuration
   */
  convertToSystemConfig(analysis: ConversationAnalysis, agents: Agent[]): Partial<MultiAgentSystem> {
    const agentIds = analysis.agentPerformance.map(perf => perf.agentId);
    const agentRoles: { [agentId: string]: AgentRole } = {};
    
    analysis.agentPerformance.forEach(perf => {
      agentRoles[perf.agentId] = perf.suggestedRole;
    });

    return {
      name: analysis.systemName,
      description: analysis.systemDescription,
      systemType: analysis.recommendedFlowType,
      agentIds,
      agentRoles,
      governanceRules: analysis.suggestedGovernanceRules,
      status: 'draft',
      metadata: {
        createdFromConversation: true,
        originalConversationId: '',
        analysisConfidence: analysis.confidence,
        estimatedPerformance: analysis.coordinationEffectiveness
      }
    };
  }

  private analyzeAgentPerformance(responses: AgentResponse[]) {
    return responses.map(response => {
      const responseQuality = this.calculateResponseQuality(response);
      const responseTime = this.calculateResponseTime(response);
      const suggestedRole = this.suggestAgentRole(response);

      return {
        agentId: response.agentId,
        agentName: response.agentName,
        responseQuality,
        responseTime,
        confidence: response.confidence || 0.8,
        suggestedRole
      };
    });
  }

  private calculateResponseQuality(response: AgentResponse): number {
    // Analyze response quality based on length, coherence, and confidence
    const lengthScore = Math.min(response.content.length / 200, 1); // Optimal around 200 chars
    const confidenceScore = response.confidence || 0.8;
    const coherenceScore = this.analyzeCoherence(response.content);
    
    return (lengthScore * 0.3 + confidenceScore * 0.4 + coherenceScore * 0.3) * 100;
  }

  private calculateResponseTime(response: AgentResponse): number {
    // Mock response time calculation (in real implementation, would track actual times)
    return Math.random() * 2000 + 500; // 500-2500ms
  }

  private analyzeCoherence(content: string): number {
    // Simple coherence analysis based on sentence structure and keywords
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const hasKeywords = /\b(recommend|suggest|believe|think|consider|analyze)\b/i.test(content);
    
    const lengthScore = Math.min(avgSentenceLength / 50, 1); // Optimal around 50 chars per sentence
    const keywordScore = hasKeywords ? 1 : 0.7;
    
    return (lengthScore * 0.6 + keywordScore * 0.4);
  }

  private suggestAgentRole(response: AgentResponse): AgentRole {
    const content = response.content.toLowerCase();
    
    if (content.includes('analyze') || content.includes('assessment')) {
      return 'analyzer';
    } else if (content.includes('generate') || content.includes('create')) {
      return 'generator';
    } else if (content.includes('review') || content.includes('check')) {
      return 'validator';
    } else if (content.includes('coordinate') || content.includes('manage')) {
      return 'coordinator';
    } else {
      return 'processor';
    }
  }

  private calculateCoordinationEffectiveness(conversation: MultiAgentConversation): number {
    const responseCount = conversation.responses.length;
    const avgConfidence = conversation.responses.reduce((sum, r) => sum + (r.confidence || 0.8), 0) / responseCount;
    const patternBonus = this.getPatternEffectivenessBonus(conversation.coordinationPattern);
    
    return Math.min((avgConfidence * 0.7 + patternBonus * 0.3) * 100, 100);
  }

  private getPatternEffectivenessBonus(pattern: string): number {
    switch (pattern) {
      case 'sequential': return 0.9; // High effectiveness for sequential
      case 'parallel': return 0.8;   // Good for parallel processing
      case 'hierarchical': return 0.85; // Good for complex decisions
      default: return 0.7;
    }
  }

  private recommendFlowType(conversation: MultiAgentConversation): FlowType {
    const pattern = conversation.coordinationPattern;
    const responseCount = conversation.responses.length;
    
    if (pattern === 'sequential' || responseCount <= 2) {
      return 'sequential';
    } else if (pattern === 'parallel' && responseCount > 2) {
      return 'parallel';
    } else if (pattern === 'hierarchical') {
      return 'conditional'; // Hierarchical maps to conditional flow
    } else {
      return 'custom';
    }
  }

  private suggestGovernanceRules(conversation: MultiAgentConversation, effectiveness: number) {
    const isHighPerformance = effectiveness > 80;
    const isComplexFlow = conversation.responses.length > 3;
    
    return {
      crossAgentValidation: isComplexFlow,
      errorHandling: isHighPerformance ? 'strict' : 'fallback' as 'strict' | 'fallback' | 'continue',
      loggingLevel: isComplexFlow ? 'detailed' : 'standard' as 'minimal' | 'standard' | 'detailed',
      governancePolicy: isHighPerformance ? 'enhanced' : 'standard' as 'basic' | 'standard' | 'enhanced',
      maxExecutionTime: isComplexFlow ? 600 : 300,
      rateLimiting: {
        requestsPerMinute: isHighPerformance ? 100 : 60,
        burstLimit: isComplexFlow ? 20 : 10
      }
    };
  }

  private generateSystemName(conversation: MultiAgentConversation): string {
    const agentNames = conversation.responses.map(r => r.agentName);
    const uniqueAgents = [...new Set(agentNames)];
    
    if (uniqueAgents.length <= 2) {
      return `${uniqueAgents.join(' & ')} System`;
    } else {
      return `Multi-Agent ${conversation.coordinationPattern.charAt(0).toUpperCase() + conversation.coordinationPattern.slice(1)} System`;
    }
  }

  private generateSystemDescription(conversation: MultiAgentConversation): string {
    const agentCount = new Set(conversation.responses.map(r => r.agentId)).size;
    const pattern = conversation.coordinationPattern;
    const userMessagePreview = conversation.userMessage.substring(0, 100);
    
    return `A ${pattern} multi-agent system with ${agentCount} agents, designed to handle requests like "${userMessagePreview}${conversation.userMessage.length > 100 ? '...' : ''}". This system was created from a successful ad hoc conversation and optimized for production use.`;
  }

  private calculateOverallConfidence(agentPerformance: any[], coordinationEffectiveness: number): number {
    const avgAgentQuality = agentPerformance.reduce((sum, perf) => sum + perf.responseQuality, 0) / agentPerformance.length;
    const avgAgentConfidence = agentPerformance.reduce((sum, perf) => sum + perf.confidence * 100, 0) / agentPerformance.length;
    
    return (avgAgentQuality * 0.4 + avgAgentConfidence * 0.3 + coordinationEffectiveness * 0.3);
  }

  private shouldRecommendWrapping(analysis: ConversationAnalysis): boolean {
    return analysis.confidence > 70 && 
           analysis.coordinationEffectiveness > 75 && 
           analysis.agentPerformance.length >= 2 &&
           analysis.agentPerformance.every(perf => perf.responseQuality > 60);
  }

  private generateRecommendationReasons(analysis: ConversationAnalysis, isRecommended: boolean): string[] {
    const reasons: string[] = [];
    
    if (isRecommended) {
      reasons.push(`High coordination effectiveness (${analysis.coordinationEffectiveness.toFixed(1)}%)`);
      reasons.push(`Strong agent performance across ${analysis.agentPerformance.length} agents`);
      reasons.push(`Optimal flow pattern (${analysis.recommendedFlowType}) identified`);
      
      if (analysis.confidence > 85) {
        reasons.push('Excellent overall confidence in system design');
      }
      
      const highPerformers = analysis.agentPerformance.filter(perf => perf.responseQuality > 80);
      if (highPerformers.length > 0) {
        reasons.push(`${highPerformers.length} high-performing agents identified`);
      }
    } else {
      if (analysis.confidence <= 70) {
        reasons.push('Low confidence in system design - needs more testing');
      }
      if (analysis.coordinationEffectiveness <= 75) {
        reasons.push('Coordination effectiveness below threshold');
      }
      if (analysis.agentPerformance.some(perf => perf.responseQuality <= 60)) {
        reasons.push('Some agents showing poor performance');
      }
      if (analysis.agentPerformance.length < 2) {
        reasons.push('Insufficient agents for multi-agent system');
      }
    }
    
    return reasons;
  }

  private estimateSuccessRate(analysis: ConversationAnalysis): number {
    const baseRate = analysis.confidence;
    const effectivenessBonus = (analysis.coordinationEffectiveness - 50) * 0.3;
    const agentQualityBonus = (analysis.agentPerformance.reduce((sum, perf) => sum + perf.responseQuality, 0) / analysis.agentPerformance.length - 50) * 0.2;
    
    return Math.min(Math.max(baseRate + effectivenessBonus + agentQualityBonus, 0), 100);
  }
}

export const adHocToFormalBridge = new AdHocToFormalBridge();

