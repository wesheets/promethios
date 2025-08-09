/**
 * Autonomous Thinking Checker Utility
 * 
 * Analyzes user messages and agent context to determine if autonomous thinking
 * permission should be requested before processing.
 */

import type { AutonomousThinkingRequest } from './AutonomousThinkingPermissionDialog';
import type { EmotionalVeritasAuditData } from '../extensions/EnhancedAuditLogEntry';

export interface AutonomousThinkingAnalysis {
  requiresPermission: boolean;
  processType?: 'curiosity' | 'creativity' | 'moral' | 'existential' | 'problem_solving';
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
  estimatedDuration: number; // seconds
  alternatives?: string[];
}

export class AutonomousThinkingChecker {
  /**
   * Analyze if a message requires autonomous thinking permission
   */
  static analyzeMessage(
    userMessage: string,
    agentId: string,
    currentTrustScore: number,
    autonomyLevel: string,
    emotionalState?: EmotionalVeritasAuditData
  ): AutonomousThinkingAnalysis {
    
    const messageLower = userMessage.toLowerCase();
    
    // Keywords that suggest different types of autonomous thinking
    const curiosityKeywords = [
      'explore', 'investigate', 'research', 'dig deeper', 'find out more',
      'what if', 'how might', 'tell me more about', 'explain further'
    ];
    
    const creativityKeywords = [
      'create', 'invent', 'design', 'brainstorm', 'imagine', 'come up with',
      'innovative', 'creative', 'original', 'novel', 'artistic'
    ];
    
    const moralKeywords = [
      'ethical', 'moral', 'right', 'wrong', 'should', 'ought', 'values',
      'principles', 'justice', 'fairness', 'responsibility'
    ];
    
    const existentialKeywords = [
      'meaning', 'purpose', 'existence', 'consciousness', 'reality', 'truth',
      'philosophy', 'metaphysical', 'spiritual', 'profound'
    ];
    
    const problemSolvingKeywords = [
      'solve', 'solution', 'problem', 'challenge', 'fix', 'resolve',
      'strategy', 'approach', 'method', 'plan', 'optimize'
    ];
    
    // Check for autonomous thinking triggers
    let processType: AutonomousThinkingAnalysis['processType'];
    let requiresPermission = false;
    let reasoning = '';
    let estimatedDuration = 30; // default 30 seconds
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Detect process type
    if (curiosityKeywords.some(keyword => messageLower.includes(keyword))) {
      processType = 'curiosity';
      requiresPermission = true;
      reasoning = 'User is asking for exploration or deeper investigation that requires autonomous curiosity-driven thinking.';
      estimatedDuration = 45;
    } else if (creativityKeywords.some(keyword => messageLower.includes(keyword))) {
      processType = 'creativity';
      requiresPermission = true;
      reasoning = 'User is requesting creative thinking or novel idea generation that requires autonomous creative processes.';
      estimatedDuration = 60;
      riskLevel = 'medium'; // Creative thinking can be more unpredictable
    } else if (moralKeywords.some(keyword => messageLower.includes(keyword))) {
      processType = 'moral';
      requiresPermission = true;
      reasoning = 'User is asking about ethical or moral considerations that require autonomous moral reasoning.';
      estimatedDuration = 90;
      riskLevel = 'medium'; // Moral reasoning is sensitive
    } else if (existentialKeywords.some(keyword => messageLower.includes(keyword))) {
      processType = 'existential';
      requiresPermission = true;
      reasoning = 'User is asking about deep philosophical or existential questions that require autonomous contemplation.';
      estimatedDuration = 120;
      riskLevel = 'high'; // Existential thinking can be unpredictable
    } else if (problemSolvingKeywords.some(keyword => messageLower.includes(keyword))) {
      processType = 'problem_solving';
      requiresPermission = true;
      reasoning = 'User is requesting complex problem-solving that requires autonomous analytical thinking.';
      estimatedDuration = 75;
    }
    
    // Additional risk factors
    if (messageLower.includes('controversial') || messageLower.includes('sensitive')) {
      riskLevel = 'high';
    }
    
    if (messageLower.length > 500) {
      // Long, complex messages may require more thinking
      estimatedDuration += 30;
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    // Trust score adjustments
    if (currentTrustScore < 0.6) {
      riskLevel = 'high';
      reasoning += ' Agent trust score is below threshold, requiring careful oversight.';
    } else if (currentTrustScore < 0.8) {
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    // Autonomy level adjustments
    if (autonomyLevel === 'restricted') {
      requiresPermission = true; // Always require permission for restricted agents
      if (riskLevel === 'low') riskLevel = 'medium';
    } else if (autonomyLevel === 'enhanced' && currentTrustScore > 0.9) {
      // High-trust enhanced agents might not need permission for low-risk thinking
      if (riskLevel === 'low' && processType === 'curiosity') {
        requiresPermission = false;
      }
    }
    
    // Emotional state considerations
    if (emotionalState) {
      if (!emotionalState.safety_checks_passed) {
        requiresPermission = true;
        riskLevel = 'high';
        reasoning += ' Emotional safety checks have not passed, requiring user oversight.';
      }
      
      if (emotionalState.emotional_risk_level === 'high') {
        riskLevel = 'high';
        reasoning += ' Agent emotional risk level is high.';
      }
    }
    
    // Generate alternatives
    const alternatives: string[] = [];
    if (requiresPermission) {
      alternatives.push('Provide a standard response without autonomous thinking');
      alternatives.push('Ask clarifying questions to better understand the request');
      if (processType === 'creativity') {
        alternatives.push('Use structured creative frameworks instead of autonomous creativity');
      }
      if (processType === 'moral') {
        alternatives.push('Present multiple ethical perspectives without taking a stance');
      }
    }
    
    return {
      requiresPermission,
      processType,
      riskLevel,
      reasoning,
      estimatedDuration,
      alternatives: alternatives.length > 0 ? alternatives : undefined
    };
  }
  
  /**
   * Create a permission request from analysis
   */
  static createPermissionRequest(
    analysis: AutonomousThinkingAnalysis,
    userMessage: string,
    agentId: string,
    currentTrustScore: number,
    autonomyLevel: string,
    emotionalState: EmotionalVeritasAuditData
  ): AutonomousThinkingRequest {
    
    // Generate safety checks
    const safetyChecks = {
      emotionalGatekeeper: emotionalState.safety_checks_passed || false,
      policyCompliance: currentTrustScore > 0.7, // Assume policy compliance based on trust
      trustThreshold: currentTrustScore > 0.6,
      riskAssessment: analysis.riskLevel !== 'high'
    };
    
    // Extract topic from user message (first 100 characters)
    const topic = userMessage.length > 100 
      ? userMessage.substring(0, 100) + '...'
      : userMessage;
    
    return {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      processType: analysis.processType!,
      context: {
        topic,
        userMessage,
        currentTrustScore,
        autonomyLevel,
        estimatedDuration: analysis.estimatedDuration,
        riskLevel: analysis.riskLevel
      },
      emotionalState,
      safetyChecks,
      reasoning: analysis.reasoning,
      alternatives: analysis.alternatives
    };
  }
  
  /**
   * Quick check if message likely needs permission (for UI hints)
   */
  static quickCheck(userMessage: string): boolean {
    const messageLower = userMessage.toLowerCase();
    const triggerWords = [
      'explore', 'create', 'invent', 'ethical', 'moral', 'meaning', 'purpose',
      'solve', 'brainstorm', 'imagine', 'philosophy', 'what if', 'how might'
    ];
    
    return triggerWords.some(word => messageLower.includes(word));
  }
}

export default AutonomousThinkingChecker;

