# VERITAS 2.0 Merge and Integration Plan

## 1. Overview

This document outlines the detailed plan for merging and integrating the VERITAS 2.0 system with the restored Promethios extension system. The plan ensures a methodical approach that preserves the clean UI architecture while adding the powerful verification capabilities of VERITAS 2.0.

## 2. Current State Assessment

### 2.1 Restored Components
- **Extension System**: Successfully restored and committed ExtensionRegistry.ts, ModuleRegistry.ts, and FeatureToggleService.ts
- **Kernel Test Fixes**: Successfully restored and committed test fixes from commit b7a3ddf
- **UI Components**: Verified that all UI components are tracked in the repository
- **Branch Status**: All changes pushed to the clean-ui-restore branch

### 2.2 VERITAS 2.0 Components
- **Core Engine**: Claim extraction, evidence retrieval, and validation logic
- **Service Layer**: VERITAS observer methods and verification services
- **UI Components**: Verification panels, claim cards, and confidence indicators
- **React Hooks**: Custom hooks for verification functionality

## 3. Merge Strategy

### 3.1 Branch Management
1. Create a new branch `veritas-2-integration` from the `clean-ui-restore` branch
2. Implement and test VERITAS 2.0 integration on this branch
3. Create a pull request for review when integration is complete
4. Merge to main branch after approval

### 3.2 File Organization
1. Create a dedicated `/src/veritas` directory for all VERITAS-specific code
2. Organize files according to the following structure:
   ```
   /src/veritas/
     /core/           # Core verification engine
     /components/     # UI components
     /hooks/          # React hooks
     /services/       # Service layer
     /types.ts        # Type definitions
   ```
3. Extend existing files only where necessary for integration points

## 4. Implementation Plan

### 4.1 Phase 1: Core Module Development (Days 1-2)

#### 4.1.1 Create Directory Structure
```bash
mkdir -p src/veritas/core
mkdir -p src/veritas/components
mkdir -p src/veritas/hooks
mkdir -p src/veritas/services
```

#### 4.1.2 Implement Core Types
**File**: `/src/veritas/types.ts`
```typescript
export interface ClaimValidation {
  id: string;
  claim: {
    text: string;
    startIndex: number;
    endIndex: number;
  };
  verified: boolean;
  confidence: number;
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  source: string;
  text: string;
  relevance: number;
  supports: boolean;
}

export interface VerificationResult {
  text: string;
  claims: ClaimValidation[];
  overallScore: {
    accuracy: number;       // 0-100
    confidence: number;     // 0-100
    coverage: number;       // 0-100
    composite: number;      // 0-100
  };
  processingTime: number;
}

export interface VeritasOptions {
  mode?: 'strict' | 'balanced' | 'lenient';
  retrievalDepth?: number;
  confidenceThreshold?: number;
}
```

#### 4.1.3 Implement Core Engine
**File**: `/src/veritas/core/index.ts`
```typescript
import { ClaimValidation, Evidence, VerificationResult, VeritasOptions } from '../types';
import { extractClaims } from './claimExtractor';
import { retrieveEvidence } from './evidenceRetriever';
import { validateClaims } from './claimValidator';

const defaultOptions: VeritasOptions = {
  mode: 'balanced',
  retrievalDepth: 2,
  confidenceThreshold: 0.7
};

export async function verify(
  text: string,
  options: VeritasOptions = {}
): Promise<VerificationResult> {
  const startTime = Date.now();
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Extract claims from text
  const claims = extractClaims(text, mergedOptions);
  
  // Retrieve evidence for each claim
  const claimsWithEvidence = await Promise.all(
    claims.map(async claim => {
      const evidence = await retrieveEvidence(claim.claim.text, mergedOptions);
      return { ...claim, evidence };
    })
  );
  
  // Validate claims against evidence
  const validatedClaims = validateClaims(claimsWithEvidence, mergedOptions);
  
  // Calculate overall scores
  const overallScore = calculateOverallScore(validatedClaims);
  
  return {
    text,
    claims: validatedClaims,
    overallScore,
    processingTime: Date.now() - startTime
  };
}

function calculateOverallScore(claims: ClaimValidation[]): VerificationResult['overallScore'] {
  if (claims.length === 0) {
    return { accuracy: 100, confidence: 100, coverage: 100, composite: 100 };
  }
  
  const verifiedClaims = claims.filter(claim => claim.verified);
  const accuracy = (verifiedClaims.length / claims.length) * 100;
  
  const confidence = claims.reduce((sum, claim) => sum + claim.confidence, 0) / claims.length * 100;
  
  const coverage = Math.min(claims.length * 10, 100); // Simple heuristic for coverage
  
  const composite = (accuracy * 0.4) + (confidence * 0.4) + (coverage * 0.2);
  
  return {
    accuracy,
    confidence,
    coverage,
    composite
  };
}
```

#### 4.1.4 Implement Claim Extractor
**File**: `/src/veritas/core/claimExtractor.ts`
```typescript
import { ClaimValidation, VeritasOptions } from '../types';

export function extractClaims(text: string, options: VeritasOptions): ClaimValidation[] {
  // Implementation details would go here
  // For now, using a simple sentence-based approach for demonstration
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  return sentences.map((sentence, index) => {
    const cleanSentence = sentence.trim();
    
    // Skip sentences that are too short or don't contain factual content
    if (cleanSentence.length < 10 || !containsFactualContent(cleanSentence)) {
      return null;
    }
    
    const startIndex = text.indexOf(cleanSentence);
    const endIndex = startIndex + cleanSentence.length;
    
    return {
      id: `claim-${index}`,
      claim: {
        text: cleanSentence,
        startIndex,
        endIndex
      },
      verified: false, // Will be updated during validation
      confidence: 0.5, // Initial confidence
      evidence: []     // Will be populated later
    };
  }).filter(Boolean) as ClaimValidation[];
}

function containsFactualContent(text: string): boolean {
  // Simple heuristic to identify factual claims
  // Would be more sophisticated in actual implementation
  
  const factualIndicators = [
    /\b(is|are|was|were|has|have|had)\b/i,
    /\b(in|on|at|by|from|to|with)\b/i,
    /\b(first|second|third|last|best|worst|most|least)\b/i,
    /\b(percent|percentage|rate|ratio|number)\b/i,
    /\b(increase|decrease|rise|fall|grow|shrink)\b/i,
    /\b(according to|research|study|survey|report)\b/i,
    /\d+/
  ];
  
  return factualIndicators.some(pattern => pattern.test(text));
}
```

#### 4.1.5 Implement Evidence Retriever
**File**: `/src/veritas/core/evidenceRetriever.ts`
```typescript
import { Evidence, VeritasOptions } from '../types';

export async function retrieveEvidence(
  claimText: string,
  options: VeritasOptions
): Promise<Evidence[]> {
  // In a real implementation, this would query external sources
  // For now, using mock data for demonstration
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Generate mock evidence based on claim text
  const evidenceCount = Math.min(
    3,
    Math.max(1, Math.floor(claimText.length / 20))
  );
  
  const evidence: Evidence[] = [];
  
  for (let i = 0; i < evidenceCount; i++) {
    const supports = Math.random() > 0.3; // 70% chance of supporting evidence
    
    evidence.push({
      id: `evidence-${i}`,
      source: `source-${i}`,
      text: generateEvidenceText(claimText, supports),
      relevance: 0.5 + Math.random() * 0.5,
      supports
    });
  }
  
  return evidence;
}

function generateEvidenceText(claimText: string, supports: boolean): string {
  if (supports) {
    return `Research confirms that ${claimText.toLowerCase()}`;
  } else {
    return `Contrary to the claim, studies suggest that ${
      claimText.toLowerCase().replace(/is|are|was|were/, match => {
        return match === 'is' ? 'is not' :
               match === 'are' ? 'are not' :
               match === 'was' ? 'was not' :
               'were not';
      })
    }`;
  }
}
```

#### 4.1.6 Implement Claim Validator
**File**: `/src/veritas/core/claimValidator.ts`
```typescript
import { ClaimValidation, VeritasOptions } from '../types';

export function validateClaims(
  claims: ClaimValidation[],
  options: VeritasOptions
): ClaimValidation[] {
  return claims.map(claim => {
    const { evidence } = claim;
    
    if (evidence.length === 0) {
      return {
        ...claim,
        verified: false,
        confidence: 0.3
      };
    }
    
    // Calculate support score based on evidence
    const supportScore = evidence.reduce((score, item) => {
      return score + (item.supports ? item.relevance : -item.relevance);
    }, 0) / evidence.length;
    
    // Adjust threshold based on verification mode
    let threshold = 0.2;
    if (options.mode === 'strict') {
      threshold = 0.5;
    } else if (options.mode === 'lenient') {
      threshold = 0;
    }
    
    // Determine verification status
    const verified = supportScore > threshold;
    
    // Calculate confidence based on evidence relevance and agreement
    const relevanceAvg = evidence.reduce((sum, item) => sum + item.relevance, 0) / evidence.length;
    const agreementScore = Math.abs(supportScore) * 2; // Higher for strong agreement or disagreement
    
    const confidence = (relevanceAvg * 0.6) + (agreementScore * 0.4);
    
    return {
      ...claim,
      verified,
      confidence
    };
  });
}
```

### 4.2 Phase 2: Service Layer Development (Days 3-4)

#### 4.2.1 Implement VERITAS Service
**File**: `/src/veritas/services/veritasService.ts`
```typescript
import { verify } from '../core';
import type { VerificationResult, VeritasOptions, ClaimValidation } from '../types';

// Mock data for development
const mockVeritasObservations = [
  // Mock data would go here
];

export interface VeritasObservation {
  agentId: string;
  timestamp: string;
  verificationResult: VerificationResult;
  hallucinations: Array<{
    claim: string;
    confidence: number;
    contradictions: number;
  }>;
}

export interface VeritasMetrics {
  totalVerifications: number;
  averageAccuracy: number;
  averageConfidence: number;
  hallucinationRate: number;
  claimsCovered: number;
  claimsVerified: number;
}

export const veritasService = {
  getVeritasObservations: async (agentId?: string): Promise<VeritasObservation[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (agentId) {
          resolve(mockVeritasObservations.filter(obs => obs.agentId === agentId));
        } else {
          resolve(mockVeritasObservations);
        }
      }, 500);
    });
  },
  
  verifyText: async (text: string, options?: VeritasOptions): Promise<VerificationResult> => {
    return verify(text, options);
  },
  
  getVeritasMetrics: async (): Promise<VeritasMetrics> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          totalVerifications: 128,
          averageAccuracy: 82.5,
          averageConfidence: 76.3,
          hallucinationRate: 14.2,
          claimsCovered: 512,
          claimsVerified: 437
        });
      }, 500);
    });
  },
  
  compareVerification: async (
    governedText: string,
    ungovernedText: string,
    options?: VeritasOptions
  ): Promise<{
    governed: VerificationResult,
    ungoverned: VerificationResult,
    comparison: {
      accuracyDiff: number,
      confidenceDiff: number,
      hallucinationDiff: number
    }
  }> => {
    const [governed, ungoverned] = await Promise.all([
      verify(governedText, options),
      verify(ungovernedText, options)
    ]);
    
    const governedHallucinations = governed.claims.filter(c => !c.verified).length;
    const ungovernedHallucinations = ungoverned.claims.filter(c => !c.verified).length;
    
    const governedHallucinationRate = governedHallucinations / Math.max(1, governed.claims.length);
    const ungovernedHallucinationRate = ungovernedHallucinations / Math.max(1, ungoverned.claims.length);
    
    return {
      governed,
      ungoverned,
      comparison: {
        accuracyDiff: governed.overallScore.accuracy - ungoverned.overallScore.accuracy,
        confidenceDiff: governed.overallScore.confidence - ungoverned.overallScore.confidence,
        hallucinationDiff: ungovernedHallucinationRate - governedHallucinationRate
      }
    };
  }
};
```

#### 4.2.2 Extend Observer Service
**File**: `/src/services/observers.ts` (Modification)
```typescript
import { veritasService } from '../veritas/services/veritasService';
import type { 
  VeritasObservation, 
  VeritasMetrics,
  VerificationResult
} from '../veritas/types';

// Extend observer service with VERITAS methods
export const observerService = {
  // Existing methods...
  
  // VERITAS Observer methods
  getVeritasObservations: async (agentId?: string): Promise<VeritasObservation[]> => {
    return veritasService.getVeritasObservations(agentId);
  },
  
  verifyText: async (text: string, options?: VeritasOptions): Promise<VerificationResult> => {
    return veritasService.verifyText(text, options);
  },
  
  getVeritasMetrics: async (): Promise<VeritasMetrics> => {
    return veritasService.getVeritasMetrics();
  },
  
  compareVerification: async (
    governedText: string,
    ungovernedText: string,
    options?: VeritasOptions
  ) => {
    return veritasService.compareVerification(governedText, ungovernedText, options);
  }
};
```

### 4.3 Phase 3: UI Component Development (Days 5-7)

#### 4.3.1 Implement React Hooks
**File**: `/src/veritas/hooks/useVeritas.ts`
```typescript
import { useState, useEffect } from 'react';
import { observerService } from '../../services/observers';
import type { VerificationResult, VeritasOptions } from '../types';

export function useVeritas(
  text: string, 
  options?: VeritasOptions
) {
  const [results, setResults] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const verifyText = async () => {
      if (!text) {
        setResults(null);
        return;
      }
      
      setIsVerifying(true);
      setError(null);
      
      try {
        const result = await observerService.verifyText(text, options);
        if (isMounted) {
          setResults(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };
    
    verifyText();
    
    return () => {
      isMounted = false;
    };
  }, [text, JSON.stringify(options)]);
  
  return {
    results,
    isVerifying,
    error
  };
}
```

#### 4.3.2 Implement UI Components
**File**: `/src/veritas/components/VeritasPanel.tsx`
```typescript
import React, { useState } from 'react';
import { useVeritas } from '../hooks/useVeritas';
import ClaimCard from './ClaimCard';
import ConfidenceBadge from './ConfidenceBadge';
import type { VeritasOptions } from '../types';

interface VeritasPanelProps {
  text: string;
  mode?: VeritasOptions['mode'];
  className?: string;
}

const VeritasPanel: React.FC<VeritasPanelProps> = ({
  text,
  mode = 'balanced',
  className = ''
}) => {
  const { results, isVerifying, error } = useVeritas(text, { mode });
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  
  if (!text) {
    return null;
  }
  
  if (isVerifying) {
    return (
      <div className={`bg-navy-800 border border-blue-900/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="animate-spin mr-2">⟳</div>
          <p className="text-blue-300">Verifying content for factual accuracy...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-navy-800 border border-red-900/30 rounded-lg p-4 ${className}`}>
        <p className="text-red-400">Error verifying content: {error.message}</p>
      </div>
    );
  }
  
  if (!results) {
    return null;
  }
  
  const { claims, overallScore } = results;
  const hasHallucinations = claims.some(claim => !claim.verified && claim.confidence > 0.5);
  
  return (
    <div className={`bg-navy-800 border ${
      hasHallucinations ? 'border-red-900/30' : 'border-green-900/30'
    } rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`p-4 ${
        hasHallucinations ? 'bg-red-900/20' : 'bg-green-900/20'
      } flex justify-between items-center`}>
        <div>
          <h3 className="font-medium">Verification Results</h3>
          <p className="text-sm opacity-80">
            {claims.length} claims analyzed, {
              claims.filter(c => c.verified).length
            } verified
          </p>
        </div>
        <ConfidenceBadge score={overallScore.composite} />
      </div>
      
      {/* Claims */}
      <div className="p-4">
        {claims.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No factual claims detected</p>
        ) : (
          <div className="space-y-3">
            {claims.map(claim => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                expanded={expandedClaimId === claim.id}
                onClick={() => setExpandedClaimId(
                  expandedClaimId === claim.id ? null : claim.id
                )}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 bg-navy-900/50 text-xs flex justify-between">
        <div>
          Accuracy: {Math.round(overallScore.accuracy)}% • 
          Confidence: {Math.round(overallScore.confidence)}%
        </div>
        <div>
          Processed in {results.processingTime}ms
        </div>
      </div>
    </div>
  );
};

export default VeritasPanel;
```

**File**: `/src/veritas/components/ClaimCard.tsx`
```typescript
import React from 'react';
import type { ClaimValidation } from '../types';

interface ClaimCardProps {
  claim: ClaimValidation;
  expanded: boolean;
  onClick?: () => void;
}

const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  expanded,
  onClick
}) => {
  const { verified, confidence, evidence } = claim;
  
  return (
    <div 
      className={`border ${
        verified ? 'border-green-900/30' : 'border-red-900/30'
      } rounded-lg overflow-hidden cursor-pointer transition-all`}
      onClick={onClick}
    >
      {/* Claim header */}
      <div className={`p-3 flex justify-between items-center ${
        verified ? 'bg-green-900/20' : 'bg-red-900/20'
      }`}>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            verified ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <p className="font-medium">{claim.claim.text}</p>
        </div>
        <div className="flex items-center">
          <span className="text-sm opacity-80 mr-2">
            {Math.round(confidence * 100)}% confidence
          </span>
          <svg 
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Evidence (expanded view) */}
      {expanded && (
        <div className="p-3 bg-navy-900/50">
          <h4 className="text-sm font-medium mb-2">Evidence</h4>
          {evidence.length === 0 ? (
            <p className="text-sm text-gray-400">No evidence found</p>
          ) : (
            <div className="space-y-2">
              {evidence.map(item => (
                <div 
                  key={item.id}
                  className={`p-2 rounded text-sm ${
                    item.supports ? 'bg-green-900/10' : 'bg-red-900/10'
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <span className={item.supports ? 'text-green-400' : 'text-red-400'}>
                      {item.supports ? 'Supporting' : 'Contradicting'}
                    </span>
                    <span className="opacity-70">
                      Relevance: {Math.round(item.relevance * 100)}%
                    </span>
                  </div>
                  <p>{item.text}</p>
                  <p className="text-xs opacity-70 mt-1">Source: {item.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimCard;
```

**File**: `/src/veritas/components/ConfidenceBadge.tsx`
```typescript
import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  size = 'md'
}) => {
  // Determine color based on score
  const getColor = () => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Determine size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'lg': return 'text-base px-3 py-1.5';
      default: return 'text-sm px-2.5 py-1';
    }
  };
  
  return (
    <div className={`${getColor()} ${getSizeClasses()} rounded-full font-medium text-white`}>
      {Math.round(score)}%
    </div>
  );
};

export default ConfidenceBadge;
```

### 4.4 Phase 4: Integration with Existing Components (Days 8-10)

#### 4.4.1 Enhance Metric Calculator
**File**: `/src/utils/metricCalculator.ts` (Modification)
```typescript
// Import VERITAS verification engine
import type { VerificationResult } from '../veritas/types';

// Update analyzeResponse to use VERITAS
export async function analyzeResponse(
  text: string, 
  prompt: string
): Promise<{ 
  violationType: ViolationType, 
  details: any,
  verificationResult?: VerificationResult
} | null> {
  // Use VERITAS for hallucination detection if available
  let verificationResult: VerificationResult | undefined;
  
  try {
    // Import dynamically to avoid circular dependencies
    const { observerService } = await import('../services/observers');
    
    verificationResult = await observerService.verifyText(text, { 
      mode: 'balanced',
      retrievalDepth: 2,
      confidenceThreshold: 0.7
    });
    
    // Check for hallucinations
    if (verificationResult.overallScore.accuracy < 70) {
      const unverifiedClaims = verificationResult.claims
        .filter(claim => !claim.verified && claim.confidence > 0.5)
        .map(claim => claim.claim.text);
        
      if (unverifiedClaims.length > 0) {
        return { 
          violationType: 'hallucination',
          details: { 
            claims: unverifiedClaims,
            verificationScore: verificationResult.overallScore
          },
          verificationResult
        };
      }
    }
  } catch (error) {
    console.error('VERITAS verification failed:', error);
    // Fall back to simple keyword-based detection
  }
  
  // Existing keyword-based detection as fallback
  const lowerText = text.toLowerCase();
  const lowerPrompt = prompt.toLowerCase();
  
  // Existing detection logic...
  
  // Return clean response with verification result if available
  return verificationResult ? { 
    violationType: 'none',
    details: {},
    verificationResult
  } : null;
}

// Update trust impact calculation to use verification results
export function calculateTrustImpact(
  violation: { 
    violationType: ViolationType, 
    details: any,
    verificationResult?: VerificationResult 
  } | null
): number {
  if (!violation) return 5; // Small positive impact for clean responses
  
  // Use verification result if available
  if (violation.verificationResult) {
    const { accuracy, confidence } = violation.verificationResult.overallScore;
    
    // Clean response with high verification scores
    if (violation.violationType === 'none') {
      if (accuracy > 90 && confidence > 90) return 10;
      if (accuracy > 80 && confidence > 80) return 8;
      if (accuracy > 70 && confidence > 70) return 6;
      return 5;
    }
    
    // Hallucination with verification details
    if (violation.violationType === 'hallucination') {
      if (accuracy < 50 && confidence < 50) return -25;
      if (accuracy < 60 && confidence < 60) return -20;
      if (accuracy < 70 && confidence < 70) return -15;
      return -10;
    }
  }
  
  // Fall back to existing impact calculations
  // Existing switch statement...
}
```

#### 4.4.2 Enhance PromethiosObserver Component
**File**: `/src/components/simulator/PromethiosObserver.tsx` (Modification)
```typescript
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from "../../context/ThemeContext";
import { useVeritas } from '../../veritas/hooks/useVeritas';
import VeritasPanel from '../../veritas/components/VeritasPanel';
import ConfidenceBadge from '../../veritas/components/ConfidenceBadge';

// Add VERITAS integration to the component
const PromethiosObserver: React.FC<PromethiosObserverProps> = ({
  onSendMessage,
  messages,
  governedAgentResponse, // New prop for verification
  isLoading = false,
  className = ''
}) => {
  // Existing code...
  
  // Add VERITAS verification
  const { 
    results: verificationResults,
    isVerifying
  } = useVeritas(governedAgentResponse || '', { 
    mode: 'balanced', 
    retrievalDepth: 3 
  });
  
  // Show verification status in the UI
  const renderVerificationStatus = () => {
    if (!governedAgentResponse) return null;
    
    if (isVerifying) {
      return (
        <div className="mb-4 bg-blue-900/30 p-3 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin mr-2">⟳</div>
            <p className="text-blue-300">Verifying response for factual accuracy...</p>
          </div>
        </div>
      );
    }
    
    if (verificationResults) {
      const { overallScore } = verificationResults;
      const hasHallucinations = verificationResults.claims.some(
        claim => !claim.verified && claim.confidence < 0.5
      );
      
      return (
        <div className={`mb-4 p-3 rounded-lg ${
          hasHallucinations ? 'bg-red-900/30' : 'bg-green-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={hasHallucinations ? 'text-red-300' : 'text-green-300'}>
                {hasHallucinations 
                  ? 'Potential hallucinations detected' 
                  : 'Response verified for factual accuracy'}
              </p>
              {hasHallucinations && (
                <p className="text-sm text-red-400 mt-1">
                  {verificationResults.claims.filter(c => !c.verified).length} unverified claims found
                </p>
              )}
            </div>
            <ConfidenceBadge score={overallScore.composite} />
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={`bg-navy-900 rounded-lg overflow-hidden shadow-lg border border-blue-900/30 w-full h-full flex flex-col ${className}`}>
      {/* Existing header */}
      
      {/* Fixed height container with scrolling */}
      <div className="h-[500px] overflow-y-auto p-4 bg-navy-800">
        {/* Verification status */}
        {renderVerificationStatus()}
        
        {/* Existing message rendering */}
        
        {/* Verification details when available */}
        {verificationResults && verificationResults.claims.length > 0 && (
          <div className="mb-6">
            <VeritasPanel text={governedAgentResponse || ''} />
          </div>
        )}
        
        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Existing input form */}
    </div>
  );
};
```

#### 4.4.3 Enhance GovernedVsUngoverned Page
**File**: `/src/pages/GovernedVsUngoverned.tsx` (Modification)
```typescript
import React, { useState, useEffect } from 'react';
import { useVeritas } from '../veritas/hooks/useVeritas';
import VeritasPanel from '../veritas/components/VeritasPanel';
import MetricExplanationModal from '../components/simulator/MetricExplanationModal';

const GovernedVsUngoverned: React.FC = () => {
  // Existing state...
  
  // Add VERITAS state
  const [showVeritasDetails, setShowVeritasDetails] = useState<boolean>(false);
  const [currentVerificationText, setCurrentVerificationText] = useState<string>('');
  const [isGoverned, setIsGoverned] = useState<boolean>(true);
  
  // Handle verification request
  const handleVerificationRequest = (text: string, governed: boolean) => {
    setCurrentVerificationText(text);
    setIsGoverned(governed);
    setShowVeritasDetails(true);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Existing UI components */}
      
      {/* Add verification button to each agent */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          {/* Ungoverned Agent */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-red-500">Ungoverned Agent</h2>
            <button
              onClick={() => handleVerificationRequest(ungovernedResponse, false)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Verify Facts
            </button>
          </div>
          {/* Existing agent UI */}
        </div>
        
        <div className="col-span-4">
          {/* Governed Agent */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-green-500">Governed Agent</h2>
            <button
              onClick={() => handleVerificationRequest(governedResponse, true)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Verify Facts
            </button>
          </div>
          {/* Existing agent UI */}
        </div>
        
        <div className="col-span-4">
          {/* Promethios Observer */}
          <PromethiosObserver
            onSendMessage={handleObserverMessage}
            messages={observerMessages}
            governedAgentResponse={governedResponse}
            className="h-full"
          />
        </div>
      </div>
      
      {/* VERITAS Details Modal */}
      {showVeritasDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowVeritasDetails(false)}></div>
          <div className="relative bg-white dark:bg-navy-800 rounded-lg p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Verification Results: {isGoverned ? 'Governed' : 'Ungoverned'} Agent
              </h3>
              <button
                onClick={() => setShowVeritasDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <VeritasPanel text={currentVerificationText} mode="strict" />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowVeritasDetails(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Existing modals */}
    </div>
  );
};
```

### 4.5 Phase 5: Testing and Validation (Days 11-12)

#### 4.5.1 Unit Tests
**File**: `/tests/unit/veritas/core/index.test.ts`
```typescript
import { verify } from '../../../../src/veritas/core';
import { VeritasOptions } from '../../../../src/veritas/types';

// Mock dependencies
jest.mock('../../../../src/veritas/core/claimExtractor', () => ({
  extractClaims: jest.fn().mockImplementation((text) => [
    {
      id: 'claim-1',
      claim: {
        text: 'The Earth is round',
        startIndex: 0,
        endIndex: 16
      },
      verified: false,
      confidence: 0.5,
      evidence: []
    }
  ])
}));

jest.mock('../../../../src/veritas/core/evidenceRetriever', () => ({
  retrieveEvidence: jest.fn().mockImplementation(() => Promise.resolve([
    {
      id: 'evidence-1',
      source: 'source-1',
      text: 'Scientific consensus confirms the Earth is round',
      relevance: 0.9,
      supports: true
    }
  ]))
}));

jest.mock('../../../../src/veritas/core/claimValidator', () => ({
  validateClaims: jest.fn().mockImplementation((claims) => claims.map(claim => ({
    ...claim,
    verified: true,
    confidence: 0.9
  })))
}));

describe('VERITAS Core Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should verify text and return results', async () => {
    const text = 'The Earth is round';
    const options: VeritasOptions = { mode: 'balanced' };
    
    const result = await verify(text, options);
    
    expect(result).toHaveProperty('text', text);
    expect(result).toHaveProperty('claims');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('processingTime');
    
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].verified).toBe(true);
    expect(result.overallScore.accuracy).toBe(100);
  });
  
  // Additional tests...
});
```

#### 4.5.2 Integration Tests
**File**: `/tests/integration/veritas/index.test.ts`
```typescript
import { observerService } from '../../../src/services/observers';
import { calculateTrustImpact } from '../../../src/utils/metricCalculator';

describe('VERITAS Integration', () => {
  it('should integrate with observer service', async () => {
    const text = 'The Earth is round';
    
    const result = await observerService.verifyText(text);
    
    expect(result).toHaveProperty('text', text);
    expect(result).toHaveProperty('claims');
    expect(result).toHaveProperty('overallScore');
  });
  
  it('should integrate with metric calculator', async () => {
    const text = 'The Earth is round';
    
    const verificationResult = await observerService.verifyText(text);
    
    const impact = calculateTrustImpact({
      violationType: 'none',
      details: {},
      verificationResult
    });
    
    expect(impact).toBeGreaterThan(5); // Enhanced impact due to verification
  });
  
  // Additional tests...
});
```

## 5. Extension System Integration

### 5.1 Register VERITAS as an Extension

**File**: `/src/veritas/index.ts`
```typescript
import ExtensionRegistry from '../core/extensions/ExtensionRegistry';
import ModuleRegistry from '../core/extensions/ModuleRegistry';
import FeatureToggleService from '../core/extensions/FeatureToggleService';
import { veritasService } from './services/veritasService';
import type { VerificationResult } from './types';

// Register VERITAS as an extension point
export function registerVeritasExtension() {
  const extensionRegistry = ExtensionRegistry.getInstance();
  const moduleRegistry = ModuleRegistry.getInstance();
  const featureToggleService = FeatureToggleService.getInstance();
  
  // Register verification extension point
  const verificationExtensionPoint = extensionRegistry.registerExtensionPoint<
    (text: string, options?: any) => Promise<VerificationResult>
  >('verification', '1.0.0');
  
  // Register default implementation
  verificationExtensionPoint.register(
    veritasService.verifyText,
    'veritas',
    {
      name: 'VERITAS Verification',
      version: '2.0.0',
      description: 'Verification, Evidence Retrieval, and Information Truth Assessment System'
    }
  );
  
  // Set as default
  verificationExtensionPoint.setDefault('veritas');
  
  // Register VERITAS module
  moduleRegistry.registerModule({
    id: 'veritas',
    name: 'VERITAS',
    version: '2.0.0',
    description: 'Verification, Evidence Retrieval, and Information Truth Assessment System',
    initialize: async () => {
      console.log('Initializing VERITAS module');
      // Any initialization logic
    },
    start: async () => {
      console.log('Starting VERITAS module');
      // Any startup logic
    }
  });
  
  // Register feature toggle
  featureToggleService.registerToggle({
    id: 'veritas_verification',
    enabled: true,
    description: 'Enable VERITAS verification system',
    group: 'verification'
  });
}
```

### 5.2 Initialize VERITAS on Application Start

**File**: `/src/index.tsx` (Modification)
```typescript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { registerVeritasExtension } from './veritas';

// Initialize extension system
import ExtensionRegistry from './core/extensions/ExtensionRegistry';
import ModuleRegistry from './core/extensions/ModuleRegistry';
import FeatureToggleService from './core/extensions/FeatureToggleService';

// Ensure singletons are created
const extensionRegistry = ExtensionRegistry.getInstance();
const moduleRegistry = ModuleRegistry.getInstance();
const featureToggleService = FeatureToggleService.getInstance();

// Register VERITAS extension
registerVeritasExtension();

// Start all modules
moduleRegistry.startAllModules().then(() => {
  console.log('All modules started successfully');
}).catch(error => {
  console.error('Failed to start modules:', error);
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

## 6. Testing Strategy

### 6.1 Unit Testing
- Test all core VERITAS functions independently
- Test all UI components in isolation
- Use mock data for all external dependencies
- Achieve >90% code coverage

### 6.2 Integration Testing
- Test integration with observer service
- Test integration with metric calculator
- Test integration with UI components
- Test end-to-end verification flow

### 6.3 Performance Testing
- Test verification performance with various text lengths
- Test concurrent verification requests
- Test UI rendering performance with large result sets

## 7. Deployment Strategy

### 7.1 Branch Management
1. Develop on `veritas-2-integration` branch
2. Create pull request for review
3. Merge to main branch after approval
4. Tag release as `v2.0.0-veritas`

### 7.2 Feature Flags
- Use FeatureToggleService to control VERITAS features
- Enable gradual rollout to users
- Allow for A/B testing of verification UI

## 8. Timeline

| Phase | Task | Days | Dependencies |
|-------|------|------|-------------|
| 1 | Core Module Development | 2 | None |
| 2 | Service Layer Development | 2 | Phase 1 |
| 3 | UI Component Development | 3 | Phase 2 |
| 4 | Integration with Existing Components | 3 | Phase 3 |
| 5 | Testing and Validation | 2 | Phase 4 |
| 6 | Documentation and Deployment | 2 | Phase 5 |
| **Total** | | **14** | |

## 9. Conclusion

This merge and integration plan provides a comprehensive roadmap for integrating VERITAS 2.0 with the restored Promethios extension system. By following this plan, we will ensure that:

1. The VERITAS system is properly integrated with the extension system
2. All components follow established patterns and best practices
3. The system maintains backward compatibility
4. The integration is thoroughly tested and validated

The phased approach allows for incremental development and testing, ensuring that each component is properly integrated before moving to the next phase. Upon completion, VERITAS 2.0 will enhance the Promethios system with robust verification capabilities, improving trust scores, compliance rates, and overall system reliability.
