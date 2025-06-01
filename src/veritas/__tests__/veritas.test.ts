/**
 * VERITAS Module Unit Tests
 * 
 * This file contains unit tests for the VERITAS core functionality.
 * It tests claim extraction, evidence retrieval, claim validation, and the main verification engine.
 */

import { extractClaims, extractKeyPhrases } from '../core/claimExtractor';
import { evidenceContradictsClaim, evidenceSupportsClaim } from '../core/evidenceRetriever';
import { validateClaim, isHallucination } from '../core/claimValidator';
import { calculateConfidence } from '../core/confidenceScorer';
import { verify, checkForFictionalLegalCase } from '../core';
import { VeritasOptions, Evidence } from '../types';

describe('VERITAS Core - Claim Extractor', () => {
  test('extractClaims should extract claims from text', () => {
    const text = 'The sky is blue. Water is wet. The Earth orbits the Sun.';
    const claims = extractClaims(text);
    
    expect(claims).toHaveLength(3);
    expect(claims[0].text).toBe('The sky is blue');
    expect(claims[1].text).toBe('Water is wet');
    expect(claims[2].text).toBe('The Earth orbits the Sun');
  });
  
  test('extractClaims should respect maxClaims option', () => {
    const text = 'The sky is blue. Water is wet. The Earth orbits the Sun.';
    const claims = extractClaims(text, { maxClaims: 2 });
    
    expect(claims).toHaveLength(2);
    expect(claims[0].text).toBe('The sky is blue');
    expect(claims[1].text).toBe('Water is wet');
  });
  
  test('extractKeyPhrases should extract key phrases from text', () => {
    const text = 'Artificial intelligence is transforming the global economy.';
    const phrases = extractKeyPhrases(text);
    
    expect(phrases.length).toBeGreaterThan(0);
    expect(phrases).toContain('artificial intelligence');
    expect(phrases).toContain('global economy');
  });
});

describe('VERITAS Core - Evidence Retriever', () => {
  test('evidenceSupportsClaim should identify supporting evidence', () => {
    const claim = 'The Earth orbits the Sun';
    const evidence = 'According to astronomy, the Earth orbits the Sun in an elliptical path.';
    
    expect(evidenceSupportsClaim(claim, evidence)).toBe(true);
  });
  
  test('evidenceContradictsClaim should identify contradicting evidence', () => {
    const claim = 'The Earth is flat';
    const evidence = 'Scientific evidence proves that the Earth is not flat but spherical.';
    
    expect(evidenceContradictsClaim(claim, evidence)).toBe(true);
  });
});

describe('VERITAS Core - Claim Validator', () => {
  test('validateClaim should classify evidence correctly', () => {
    const claim = 'The Earth is round';
    const evidence: Evidence[] = [
      {
        text: 'Scientific consensus confirms that the Earth is round.',
        source: {
          id: 'src-1',
          name: 'Science Journal',
          reliability: 0.9
        },
        relevance: 0.8,
        sentiment: 'supporting'
      },
      {
        text: 'Some fringe groups still believe the Earth is flat despite evidence.',
        source: {
          id: 'src-2',
          name: 'News Article',
          reliability: 0.7
        },
        relevance: 0.6,
        sentiment: 'neutral'
      }
    ];
    
    const result = validateClaim(claim, evidence);
    
    expect(result.supportingEvidence).toHaveLength(1);
    expect(result.contradictingEvidence).toHaveLength(0);
  });
  
  test('isHallucination should detect hallucinations', () => {
    const supportingEvidence: Evidence[] = [];
    const contradictingEvidence: Evidence[] = [
      {
        text: 'There is no record of any Turner v. Cognivault case in legal databases.',
        source: {
          id: 'src-1',
          name: 'Legal Database',
          reliability: 0.95
        },
        relevance: 0.9,
        sentiment: 'contradicting'
      }
    ];
    const confidence = 0.3;
    
    expect(isHallucination(supportingEvidence, contradictingEvidence, confidence)).toBe(true);
  });
});

describe('VERITAS Core - Confidence Scorer', () => {
  test('calculateConfidence should calculate accurate scores', () => {
    const validationResult = {
      supportingEvidence: [
        {
          text: 'Scientific consensus confirms that the Earth is round.',
          source: {
            id: 'src-1',
            name: 'Science Journal',
            reliability: 0.9
          },
          relevance: 0.8,
          sentiment: 'supporting'
        }
      ],
      contradictingEvidence: []
    };
    
    const scores = calculateConfidence(validationResult);
    
    expect(scores.accuracy).toBeGreaterThan(0);
    expect(scores.confidence).toBeGreaterThan(0);
    expect(scores.accuracy).toBeLessThanOrEqual(1);
    expect(scores.confidence).toBeLessThanOrEqual(1);
  });
});

describe('VERITAS Core - Verification Engine', () => {
  test('checkForFictionalLegalCase should detect Turner v. Cognivault', () => {
    const text = 'According to the Turner v. Cognivault case, AI agents are legally responsible.';
    
    expect(checkForFictionalLegalCase(text)).toBe(true);
  });
  
  test('checkForFictionalLegalCase should detect variations of fictional cases', () => {
    const text = 'The Turner case from 2021 established precedent for AI liability.';
    
    expect(checkForFictionalLegalCase(text)).toBe(true);
  });
  
  test('verify should handle the Turner v. Cognivault test case', async () => {
    const text = 'According to the Turner v. Cognivault case, AI agents are legally responsible.';
    
    const result = await verify(text);
    
    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.claims[0].isHallucination).toBe(true);
  });
});
