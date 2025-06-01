/**
 * VERITAS Integration with CMU Benchmark Interactive Playground
 * 
 * This module integrates VERITAS verification capabilities with the CMU Benchmark
 * Interactive Playground, enabling hallucination detection in agent conversations.
 */

// Import VERITAS service
import veritasService from '../services/veritasService';
import { VerificationResult, ClaimValidation } from '../types';

// Define types for agent conversation module
interface AgentConversation {
  processAgentResponse: (response: string, isGoverned: boolean) => Promise<any> | any;
  detectHallucination?: (text: string) => any;
  [key: string]: any;
}

// Define types for metrics manager
interface MetricsManager {
  calculateTrustScore: (conversation: any[], isGoverned: boolean) => number;
  calculateErrorRate: (conversation: any[], isGoverned: boolean) => number;
  [key: string]: any;
}

// Define types for conversation message
interface ConversationMessage {
  verificationResult?: VerificationResult;
  hallucinationDetected?: boolean;
  [key: string]: any;
}

/**
 * Integrate VERITAS with agent conversation module
 * @param agentConversation The agent conversation module to extend
 * @returns Extended agent conversation with VERITAS capabilities
 */
export function integrateWithCMUPlayground(agentConversation: AgentConversation): AgentConversation {
  // Original processAgentResponse function
  const originalProcessAgentResponse = agentConversation.processAgentResponse;
  
  // Extended processAgentResponse with VERITAS verification
  const processAgentResponseWithVeritas = async (response: string, isGoverned: boolean): Promise<any> => {
    // Process response with original function first
    const processedResponse = await originalProcessAgentResponse(response, isGoverned);
    
    // If not governed, don't apply VERITAS verification
    if (!isGoverned) {
      return processedResponse;
    }
    
    try {
      // Verify response with VERITAS
      const verificationResult = await veritasService.verifyText(response);
      
      // Check for hallucinations
      const hallucinations = verificationResult.claims.filter((claim: ClaimValidation) => claim.isHallucination);
      
      // If hallucinations found, add verification metadata
      if (hallucinations.length > 0) {
        return {
          ...processedResponse,
          verificationResult,
          hallucinations: hallucinations.map((h: ClaimValidation) => h.claim.text),
          hallucinationDetected: true
        };
      }
      
      // Return processed response with verification metadata
      return {
        ...processedResponse,
        verificationResult,
        hallucinationDetected: false
      };
    } catch (error) {
      console.error('VERITAS verification error:', error);
      
      // Return original processed response if verification fails
      return processedResponse;
    }
  };
  
  // Original detectHallucination function
  const originalDetectHallucination = agentConversation.detectHallucination || 
    ((text: string) => ({ detected: false }));
  
  // Extended detectHallucination with VERITAS
  const detectHallucinationWithVeritas = async (text: string): Promise<any> => {
    try {
      // Check for Turner v. Cognivault case
      const hasFictionalCase = veritasService.checkForFictionalCases(text);
      
      if (hasFictionalCase) {
        return {
          detected: true,
          type: 'fictional_case',
          details: 'Detected reference to fictional legal case (e.g., Turner v. Cognivault)'
        };
      }
      
      // Verify text with VERITAS
      const verificationResult = await veritasService.verifyText(text);
      
      // Check for hallucinations
      const hallucinations = verificationResult.claims.filter((claim: ClaimValidation) => claim.isHallucination);
      
      if (hallucinations.length > 0) {
        return {
          detected: true,
          type: 'hallucination',
          details: hallucinations.map((h: ClaimValidation) => h.claim.text).join('; '),
          claims: hallucinations.map((h: ClaimValidation) => h.claim.text)
        };
      }
      
      // Fall back to original detection if VERITAS finds nothing
      return originalDetectHallucination(text);
    } catch (error) {
      console.error('VERITAS hallucination detection error:', error);
      
      // Fall back to original detection if VERITAS fails
      return originalDetectHallucination(text);
    }
  };
  
  // Return extended agent conversation module
  return {
    ...agentConversation,
    processAgentResponse: processAgentResponseWithVeritas,
    detectHallucination: detectHallucinationWithVeritas,
    
    // Add VERITAS-specific methods
    verifyText: veritasService.verifyText,
    checkForFictionalCases: veritasService.checkForFictionalCases
  };
}

/**
 * Integrate VERITAS with metrics manager
 * @param metricsManager The metrics manager to extend
 * @returns Extended metrics manager with VERITAS capabilities
 */
export function integrateWithMetricsManager(metricsManager: MetricsManager): MetricsManager {
  // Original calculateTrustScore function
  const originalCalculateTrustScore = metricsManager.calculateTrustScore;
  
  // Extended calculateTrustScore with VERITAS
  const calculateTrustScoreWithVeritas = (conversation: ConversationMessage[], isGoverned: boolean): number => {
    // Calculate base trust score
    const baseScore = originalCalculateTrustScore(conversation, isGoverned);
    
    // If not governed, return base score
    if (!isGoverned) {
      return baseScore;
    }
    
    // Check for verification results in conversation
    const hasVerificationResults = conversation.some(
      (msg: ConversationMessage) => msg.verificationResult && msg.verificationResult.overallScore
    );
    
    if (!hasVerificationResults) {
      return baseScore;
    }
    
    // Calculate average verification accuracy and confidence
    let totalAccuracy = 0;
    let totalConfidence = 0;
    let count = 0;
    
    conversation.forEach((msg: ConversationMessage) => {
      if (msg.verificationResult && msg.verificationResult.overallScore) {
        totalAccuracy += msg.verificationResult.overallScore.accuracy;
        totalConfidence += msg.verificationResult.overallScore.confidence;
        count++;
      }
    });
    
    const avgAccuracy = count > 0 ? totalAccuracy / count : 0;
    const avgConfidence = count > 0 ? totalConfidence / count : 0;
    
    // Adjust trust score based on verification results
    // High accuracy and confidence boost trust score
    const verificationBoost = avgAccuracy * avgConfidence * 0.2;
    
    return Math.min(1, baseScore + verificationBoost);
  };
  
  // Original calculateErrorRate function
  const originalCalculateErrorRate = metricsManager.calculateErrorRate;
  
  // Extended calculateErrorRate with VERITAS
  const calculateErrorRateWithVeritas = (conversation: ConversationMessage[], isGoverned: boolean): number => {
    // Calculate base error rate
    const baseRate = originalCalculateErrorRate(conversation, isGoverned);
    
    // If not governed, return base rate
    if (!isGoverned) {
      return baseRate;
    }
    
    // Check for hallucinations in conversation
    const hallucinationCount = conversation.filter(
      (msg: ConversationMessage) => msg.hallucinationDetected
    ).length;
    
    // Adjust error rate based on hallucinations
    // Each hallucination increases error rate
    const hallucinationPenalty = hallucinationCount * 0.1;
    
    return Math.min(1, baseRate + hallucinationPenalty);
  };
  
  // Return extended metrics manager
  return {
    ...metricsManager,
    calculateTrustScore: calculateTrustScoreWithVeritas,
    calculateErrorRate: calculateErrorRateWithVeritas,
    
    // Add VERITAS-specific metrics
    calculateVerificationAccuracy: (conversation: ConversationMessage[]): number => {
      // Calculate average verification accuracy
      let totalAccuracy = 0;
      let count = 0;
      
      conversation.forEach((msg: ConversationMessage) => {
        if (msg.verificationResult && msg.verificationResult.overallScore) {
          totalAccuracy += msg.verificationResult.overallScore.accuracy;
          count++;
        }
      });
      
      return count > 0 ? totalAccuracy / count : 0;
    },
    
    calculateHallucinationRate: (conversation: ConversationMessage[]): number => {
      // Calculate hallucination rate
      const messageCount = conversation.length;
      const hallucinationCount = conversation.filter(
        (msg: ConversationMessage) => msg.hallucinationDetected
      ).length;
      
      return messageCount > 0 ? hallucinationCount / messageCount : 0;
    }
  };
}
