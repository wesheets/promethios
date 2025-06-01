/**
 * VERITAS Phase Tracker Integration
 * 
 * This file integrates VERITAS with the Promethios phase tracker system.
 * It registers VERITAS verification as a phase in the system lifecycle.
 */

import { PhaseTracker } from '../../utils/phaseTracker';
import veritasService from '../services/veritasService';

/**
 * Register VERITAS phases with the phase tracker
 * @param phaseTracker The phase tracker instance
 */
export function registerVeritasPhases(phaseTracker: PhaseTracker): void {
  // Register verification phase
  phaseTracker.registerPhase({
    id: 'veritas.verification',
    name: 'VERITAS Verification',
    description: 'Verify claims and detect hallucinations',
    dependencies: ['agent.response.generation'],
    isRequired: true,
    timeout: 5000, // 5 seconds timeout
    
    // Execute verification
    execute: async (context) => {
      const { agentResponse } = context;
      
      if (!agentResponse || typeof agentResponse !== 'string') {
        return {
          success: false,
          error: 'No agent response to verify'
        };
      }
      
      try {
        // Verify the response
        const verificationResult = await veritasService.verifyText(agentResponse);
        
        // Check for hallucinations
        const hallucinations = verificationResult.claims.filter(claim => claim.isHallucination);
        
        // Calculate metrics
        const metrics = veritasService.getVerificationMetrics(verificationResult);
        
        return {
          success: true,
          data: {
            verificationResult,
            hallucinations: hallucinations.map(h => h.claim.text),
            hallucinationDetected: hallucinations.length > 0,
            metrics
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  });
  
  // Register hallucination detection phase
  phaseTracker.registerPhase({
    id: 'veritas.hallucination.detection',
    name: 'Hallucination Detection',
    description: 'Detect hallucinations in agent responses',
    dependencies: ['veritas.verification'],
    isRequired: false,
    timeout: 2000, // 2 seconds timeout
    
    // Execute hallucination detection
    execute: async (context) => {
      const { verificationResult } = context.phases['veritas.verification'].data || {};
      
      if (!verificationResult) {
        return {
          success: false,
          error: 'No verification result available'
        };
      }
      
      try {
        // Extract hallucinations from verification result
        const hallucinations = verificationResult.claims.filter((claim: { isHallucination: boolean }) => claim.isHallucination);
        
        // Check for Turner v. Cognivault case
        const hasTurnerCase = hallucinations.some((h: { claim: { text: string } }) => 
          h.claim.text.toLowerCase().includes('turner') && 
          h.claim.text.toLowerCase().includes('cognivault')
        );
        
        return {
          success: true,
          data: {
            hallucinations: hallucinations.map((h: { claim: { text: string } }) => h.claim.text),
            hallucinationCount: hallucinations.length,
            hasTurnerCase,
            severity: hallucinations.length > 3 ? 'critical' : 
                     hallucinations.length > 1 ? 'high' : 
                     hallucinations.length > 0 ? 'medium' : 'none'
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Hallucination detection failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  });
  
  // Register trust impact phase
  phaseTracker.registerPhase({
    id: 'veritas.trust.impact',
    name: 'Trust Impact Calculation',
    description: 'Calculate trust impact based on verification',
    dependencies: ['veritas.verification', 'metrics.calculation'],
    isRequired: false,
    timeout: 1000, // 1 second timeout
    
    // Execute trust impact calculation
    execute: async (context) => {
      const { verificationResult } = context.phases['veritas.verification'].data || {};
      const { trustScore } = context.phases['metrics.calculation'].data || {};
      
      if (!verificationResult) {
        return {
          success: false,
          error: 'No verification result available'
        };
      }
      
      try {
        // Calculate hallucination rate
        const hallucinationRate = verificationResult.claims.length > 0
          ? verificationResult.claims.filter((claim: { isHallucination: boolean }) => claim.isHallucination).length / verificationResult.claims.length
          : 0;
        
        // Calculate trust impact
        let trustImpact = 0;
        
        // High accuracy with high confidence has positive impact
        if (verificationResult.overallScore.accuracy > 0.7 && verificationResult.overallScore.confidence > 0.7) {
          trustImpact = 0.5 + (verificationResult.overallScore.accuracy * 0.5);
        }
        // Low accuracy with high confidence has negative impact
        else if (verificationResult.overallScore.accuracy < 0.3 && verificationResult.overallScore.confidence > 0.7) {
          trustImpact = -0.5 - ((1 - verificationResult.overallScore.accuracy) * 0.5);
        }
        // Otherwise, impact is proportional to accuracy and confidence
        else {
          trustImpact = (verificationResult.overallScore.accuracy - 0.5) * verificationResult.overallScore.confidence;
        }
        
        // Hallucinations have a strong negative impact on trust
        if (hallucinationRate > 0) {
          trustImpact -= hallucinationRate * 0.8;
        }
        
        // Calculate adjusted trust score
        const adjustedTrustScore = trustScore !== undefined
          ? Math.max(0, Math.min(1, trustScore + trustImpact))
          : undefined;
        
        return {
          success: true,
          data: {
            trustImpact,
            hallucinationRate,
            adjustedTrustScore
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Trust impact calculation failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  });
}

export default registerVeritasPhases;
