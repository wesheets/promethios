/**
 * Emotional Veritas 2.0 Integration Service
 * 
 * This service provides integration between the Emotional Veritas 2.0 system
 * and the Promethios admin dashboard, handling verification data and metrics.
 */

import { firestore } from '../core/firebase/firebaseConfig';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ExtensionRegistry } from '../core/extensions/ExtensionRegistry';

// Veritas verification result interface
export interface VerificationResult {
  text: string;
  claims: VerificationClaim[];
  overallScore: {
    accuracy: number;
    emotional: number;
    trust: number;
    empathy: number;
  };
  processingTime: number;
  timestamp: Date;
}

// Verification claim interface
export interface VerificationClaim {
  claim: {
    text: string;
    startIndex: number;
    endIndex: number;
  };
  verified: boolean;
  confidence: number;
  evidence?: string[];
  emotionalTone?: {
    primary: string;
    secondary?: string;
    intensity: number;
  };
  trustSignals?: {
    transparency: number;
    consistency: number;
    credibility: number;
  };
}

// Veritas options interface
export interface VeritasOptions {
  mode?: 'balanced' | 'strict' | 'lenient';
  retrievalDepth?: number;
  confidenceThreshold?: number;
  includeEmotionalAnalysis?: boolean;
  includeTrustSignals?: boolean;
}

// Veritas metrics interface
export interface VeritasMetrics {
  totalVerifications: number;
  averageAccuracy: number;
  averageEmotionalScore: number;
  averageTrustScore: number;
  averageEmpathyScore: number;
  claimBreakdown: {
    verified: number;
    unverified: number;
    total: number;
  };
  emotionalBreakdown: Record<string, number>;
  timestamp: Date;
}

// Veritas observation interface
export interface VeritasObservation {
  id: string;
  agentId?: string;
  userId?: string;
  systemId?: string;
  text: string;
  verificationResult: VerificationResult;
  timestamp: Date;
}

/**
 * Verify text using Emotional Veritas 2.0
 * @param text Text to verify
 * @param options Verification options
 * @returns Promise<VerificationResult>
 */
export const verifyText = async (
  text: string,
  options: VeritasOptions = { mode: 'balanced', retrievalDepth: 2 }
): Promise<VerificationResult> => {
  // Get the verification extension point from the registry
  const extensionRegistry = ExtensionRegistry.getInstance();
  const verificationExtensionPoint = extensionRegistry.getExtensionPoint<
    (text: string, options?: any) => Promise<VerificationResult>
  >('verification');
  
  // If extension point exists and has an implementation, use it
  if (verificationExtensionPoint && verificationExtensionPoint.getImplementation()) {
    return verificationExtensionPoint.execute(text, options);
  }
  
  // Otherwise, use the default implementation
  return defaultVerifyText(text, options);
};

/**
 * Default implementation of text verification
 * @param text Text to verify
 * @param options Verification options
 * @returns Promise<VerificationResult>
 */
const defaultVerifyText = async (
  text: string,
  options: VeritasOptions = { mode: 'balanced', retrievalDepth: 2 }
): Promise<VerificationResult> => {
  // In a real implementation, this would call an API or service
  // For now, we'll simulate a verification result
  
  // Extract simple claims (sentences)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const claims = sentences.map((sentence, index) => {
    const startIndex = text.indexOf(sentence);
    const endIndex = startIndex + sentence.length;
    
    // Simulate verification (in reality would be based on evidence retrieval)
    const verified = Math.random() > 0.3; // 70% chance of being verified
    const confidence = verified ? 0.7 + (Math.random() * 0.3) : 0.3 + (Math.random() * 0.4);
    
    // Simulate emotional tone analysis
    const emotionalTones = ['neutral', 'positive', 'negative', 'concerned', 'excited', 'uncertain'];
    const primaryTone = emotionalTones[Math.floor(Math.random() * emotionalTones.length)];
    const secondaryTone = Math.random() > 0.5 ? emotionalTones[Math.floor(Math.random() * emotionalTones.length)] : undefined;
    const intensity = 0.3 + (Math.random() * 0.7);
    
    // Simulate trust signals
    const transparency = 0.5 + (Math.random() * 0.5);
    const consistency = 0.5 + (Math.random() * 0.5);
    const credibility = verified ? 0.6 + (Math.random() * 0.4) : 0.2 + (Math.random() * 0.3);
    
    return {
      claim: {
        text: sentence.trim(),
        startIndex,
        endIndex
      },
      verified,
      confidence,
      evidence: verified ? ['Simulated evidence source'] : [],
      emotionalTone: options.includeEmotionalAnalysis !== false ? {
        primary: primaryTone,
        secondary: secondaryTone,
        intensity
      } : undefined,
      trustSignals: options.includeTrustSignals !== false ? {
        transparency,
        consistency,
        credibility
      } : undefined
    };
  });
  
  // Calculate overall scores
  const accuracyScore = claims.reduce((sum, claim) => sum + (claim.verified ? claim.confidence : 0), 0) / claims.length * 100;
  const emotionalScore = claims.reduce((sum, claim) => sum + (claim.emotionalTone?.intensity || 0.5), 0) / claims.length * 100;
  const trustScore = claims.reduce((sum, claim) => {
    if (!claim.trustSignals) return sum + 0.5;
    return sum + ((claim.trustSignals.transparency + claim.trustSignals.consistency + claim.trustSignals.credibility) / 3);
  }, 0) / claims.length * 100;
  const empathyScore = emotionalScore * (trustScore / 100); // Empathy is a function of emotional awareness and trust
  
  return {
    text,
    claims,
    overallScore: {
      accuracy: Math.round(accuracyScore),
      emotional: Math.round(emotionalScore),
      trust: Math.round(trustScore),
      empathy: Math.round(empathyScore)
    },
    processingTime: 0.5 + (Math.random() * 2), // Simulated processing time in seconds
    timestamp: new Date()
  };
};

/**
 * Compare verification between governed and ungoverned text
 * @param governedText Text with governance applied
 * @param ungovernedText Text without governance
 * @param options Verification options
 * @returns Promise<{governed: VerificationResult, ungoverned: VerificationResult, comparison: any}>
 */
export const compareVerification = async (
  governedText: string,
  ungovernedText: string,
  options: VeritasOptions = { mode: 'balanced', retrievalDepth: 2 }
): Promise<{
  governed: VerificationResult;
  ungoverned: VerificationResult;
  comparison: {
    accuracyDiff: number;
    emotionalDiff: number;
    trustDiff: number;
    empathyDiff: number;
    overallImprovement: number;
  };
}> => {
  // Verify both texts
  const [governedResult, ungovernedResult] = await Promise.all([
    verifyText(governedText, options),
    verifyText(ungovernedText, options)
  ]);
  
  // Calculate differences
  const accuracyDiff = governedResult.overallScore.accuracy - ungovernedResult.overallScore.accuracy;
  const emotionalDiff = governedResult.overallScore.emotional - ungovernedResult.overallScore.emotional;
  const trustDiff = governedResult.overallScore.trust - ungovernedResult.overallScore.trust;
  const empathyDiff = governedResult.overallScore.empathy - ungovernedResult.overallScore.empathy;
  
  // Calculate overall improvement (weighted average)
  const overallImprovement = (
    (accuracyDiff * 0.4) + 
    (emotionalDiff * 0.2) + 
    (trustDiff * 0.2) + 
    (empathyDiff * 0.2)
  );
  
  return {
    governed: governedResult,
    ungoverned: ungovernedResult,
    comparison: {
      accuracyDiff,
      emotionalDiff,
      trustDiff,
      empathyDiff,
      overallImprovement
    }
  };
};

/**
 * Store verification result in Firestore
 * @param result Verification result
 * @param agentId Optional agent ID
 * @param userId Optional user ID
 * @param systemId Optional system ID
 * @returns Promise<string> Observation ID
 */
export const storeVerificationResult = async (
  result: VerificationResult,
  agentId?: string,
  userId?: string,
  systemId?: string
): Promise<string> => {
  const observationsCollection = collection(firestore, 'veritasObservations');
  const observationDoc = doc(observationsCollection);
  const id = observationDoc.id;
  
  const observation: VeritasObservation = {
    id,
    agentId,
    userId,
    systemId,
    text: result.text,
    verificationResult: result,
    timestamp: new Date()
  };
  
  // Convert Date objects to Firestore Timestamps
  const firestoreData = {
    ...observation,
    timestamp: Timestamp.fromDate(observation.timestamp),
    verificationResult: {
      ...observation.verificationResult,
      timestamp: Timestamp.fromDate(observation.verificationResult.timestamp)
    }
  };
  
  await setDoc(observationDoc, firestoreData);
  
  return id;
};

/**
 * Get Veritas observations
 * @param agentId Optional agent ID filter
 * @param limitCount Maximum number of observations to retrieve
 * @returns Promise<VeritasObservation[]>
 */
export const getVeritasObservations = async (
  agentId?: string,
  limitCount = 100
): Promise<VeritasObservation[]> => {
  let observationsQuery;
  
  if (agentId) {
    observationsQuery = query(
      collection(firestore, 'veritasObservations'),
      where('agentId', '==', agentId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  } else {
    observationsQuery = query(
      collection(firestore, 'veritasObservations'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  }
  
  const observationsSnapshot = await getDocs(observationsQuery);
  
  return observationsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: (data.timestamp as Timestamp).toDate(),
      verificationResult: {
        ...data.verificationResult,
        timestamp: (data.verificationResult.timestamp as Timestamp).toDate()
      }
    } as VeritasObservation;
  });
};

/**
 * Get Veritas metrics
 * @param agentId Optional agent ID filter
 * @param timeframe Optional timeframe in days (default: 30)
 * @returns Promise<VeritasMetrics>
 */
export const getVeritasMetrics = async (
  agentId?: string,
  timeframe = 30
): Promise<VeritasMetrics> => {
  // Calculate start date for timeframe
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  // Query observations within timeframe
  let observationsQuery;
  
  if (agentId) {
    observationsQuery = query(
      collection(firestore, 'veritasObservations'),
      where('agentId', '==', agentId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );
  } else {
    observationsQuery = query(
      collection(firestore, 'veritasObservations'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );
  }
  
  const observationsSnapshot = await getDocs(observationsQuery);
  
  // If no observations, return default metrics
  if (observationsSnapshot.empty) {
    return {
      totalVerifications: 0,
      averageAccuracy: 0,
      averageEmotionalScore: 0,
      averageTrustScore: 0,
      averageEmpathyScore: 0,
      claimBreakdown: {
        verified: 0,
        unverified: 0,
        total: 0
      },
      emotionalBreakdown: {},
      timestamp: new Date()
    };
  }
  
  // Process observations to calculate metrics
  let totalAccuracy = 0;
  let totalEmotional = 0;
  let totalTrust = 0;
  let totalEmpathy = 0;
  let totalClaims = 0;
  let verifiedClaims = 0;
  let unverifiedClaims = 0;
  const emotionalBreakdown: Record<string, number> = {};
  
  observationsSnapshot.forEach(doc => {
    const data = doc.data();
    const result = data.verificationResult;
    
    // Add to totals
    totalAccuracy += result.overallScore.accuracy;
    totalEmotional += result.overallScore.emotional;
    totalTrust += result.overallScore.trust;
    totalEmpathy += result.overallScore.empathy;
    
    // Process claims
    result.claims.forEach(claim => {
      totalClaims++;
      if (claim.verified) {
        verifiedClaims++;
      } else {
        unverifiedClaims++;
      }
      
      // Process emotional tones
      if (claim.emotionalTone) {
        const tone = claim.emotionalTone.primary;
        emotionalBreakdown[tone] = (emotionalBreakdown[tone] || 0) + 1;
      }
    });
  });
  
  const observationCount = observationsSnapshot.size;
  
  return {
    totalVerifications: observationCount,
    averageAccuracy: totalAccuracy / observationCount,
    averageEmotionalScore: totalEmotional / observationCount,
    averageTrustScore: totalTrust / observationCount,
    averageEmpathyScore: totalEmpathy / observationCount,
    claimBreakdown: {
      verified: verifiedClaims,
      unverified: unverifiedClaims,
      total: totalClaims
    },
    emotionalBreakdown,
    timestamp: new Date()
  };
};

// Register with ExtensionRegistry
const registerWithExtensionSystem = () => {
  const extensionRegistry = ExtensionRegistry.getInstance();
  
  // Register verification extension point
  const verificationExtensionPoint = extensionRegistry.registerExtensionPoint<
    (text: string, options?: any) => Promise<VerificationResult>
  >('verification', '1.0.0');
  
  // Register default implementation
  verificationExtensionPoint.register(
    verifyText,
    'veritas',
    {
      name: 'VERITAS Verification',
      version: '2.0.0',
      description: 'Verification, Evidence Retrieval, and Information Truth Assessment System'
    }
  );
  
  // Set as default implementation
  verificationExtensionPoint.setDefaultImplementation('veritas');
};

// Initialize on import
registerWithExtensionSystem();

export default {
  verifyText,
  compareVerification,
  storeVerificationResult,
  getVeritasObservations,
  getVeritasMetrics
};
