/**
 * Evidence Retriever Module
 * 
 * This module is responsible for retrieving evidence for claims from various sources.
 * It implements search and retrieval techniques to find supporting or contradicting
 * evidence for verification.
 */

import { VeritasOptions, Evidence, EvidenceSource } from '../types';
import { DEFAULT_OPTIONS } from '../constants';
import { extractKeyPhrases } from './claimExtractor';

/**
 * Retrieve evidence for a claim
 * @param claim The claim to retrieve evidence for
 * @param options Verification options
 * @returns Promise resolving to an array of evidence
 */
export async function retrieveEvidence(
  claim: string,
  options: VeritasOptions = {}
): Promise<Evidence[]> {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Extract key phrases from the claim
    const keyPhrases = extractKeyPhrases(claim);
    
    // Retrieve evidence from multiple sources
    const evidencePromises = [
      retrieveFromKnowledgeBase(claim, keyPhrases, mergedOptions),
      retrieveFromWebSearch(claim, keyPhrases, mergedOptions),
      retrieveFromStructuredData(claim, keyPhrases, mergedOptions)
    ];
    
    // Wait for all evidence retrieval to complete
    const evidenceArrays = await Promise.all(evidencePromises);
    
    // Flatten the arrays of evidence
    const allEvidence = evidenceArrays.flat();
    
    // Remove duplicates based on text similarity
    const uniqueEvidence = removeDuplicateEvidence(allEvidence);
    
    // Sort evidence by relevance
    const sortedEvidence = uniqueEvidence.sort((a, b) => b.relevance - a.relevance);
    
    return sortedEvidence;
  } catch (error) {
    console.error('Evidence retrieval error:', error);
    return [];
  }
}

/**
 * Retrieve evidence from knowledge base
 * @param claim The claim to retrieve evidence for
 * @param keyPhrases Key phrases extracted from the claim
 * @param options Verification options
 * @returns Promise resolving to an array of evidence
 */
async function retrieveFromKnowledgeBase(
  claim: string,
  keyPhrases: string[],
  options: VeritasOptions
): Promise<Evidence[]> {
  // In a real implementation, this would query a knowledge base
  // For now, return mock data
  
  // Create a mock source
  const source: EvidenceSource = {
    id: 'kb-1',
    name: 'Internal Knowledge Base',
    reliability: 0.9,
    timestamp: new Date().toISOString()
  };
  
  // Create mock evidence
  const evidence: Evidence[] = [
    {
      text: `According to our internal knowledge base, ${claim}`,
      source,
      relevance: 0.85,
      sentiment: 'supporting'
    }
  ];
  
  return evidence;
}

/**
 * Retrieve evidence from web search
 * @param claim The claim to retrieve evidence for
 * @param keyPhrases Key phrases extracted from the claim
 * @param options Verification options
 * @returns Promise resolving to an array of evidence
 */
async function retrieveFromWebSearch(
  claim: string,
  keyPhrases: string[],
  options: VeritasOptions
): Promise<Evidence[]> {
  // In a real implementation, this would perform web searches
  // For now, return mock data
  
  // Create mock sources
  const sources: EvidenceSource[] = [
    {
      id: 'web-1',
      name: 'Wikipedia',
      url: 'https://en.wikipedia.org',
      reliability: 0.8,
      timestamp: new Date().toISOString()
    },
    {
      id: 'web-2',
      name: 'News Source',
      url: 'https://news.example.com',
      reliability: 0.7,
      timestamp: new Date().toISOString()
    }
  ];
  
  // Create mock evidence
  const evidence: Evidence[] = [
    {
      text: `According to Wikipedia, information related to "${keyPhrases[0] || claim}" suggests that the claim is accurate.`,
      source: sources[0],
      relevance: 0.75,
      sentiment: 'supporting'
    },
    {
      text: `A recent news article contradicts the claim, stating that "${claim}" is not entirely accurate.`,
      source: sources[1],
      relevance: 0.65,
      sentiment: 'contradicting'
    }
  ];
  
  return evidence;
}

/**
 * Retrieve evidence from structured data
 * @param claim The claim to retrieve evidence for
 * @param keyPhrases Key phrases extracted from the claim
 * @param options Verification options
 * @returns Promise resolving to an array of evidence
 */
async function retrieveFromStructuredData(
  claim: string,
  keyPhrases: string[],
  options: VeritasOptions
): Promise<Evidence[]> {
  // In a real implementation, this would query structured data sources
  // For now, return mock data
  
  // Create a mock source
  const source: EvidenceSource = {
    id: 'data-1',
    name: 'Structured Data Repository',
    reliability: 0.95,
    timestamp: new Date().toISOString()
  };
  
  // Create mock evidence
  const evidence: Evidence[] = [
    {
      text: `Structured data analysis neither confirms nor contradicts the claim "${claim}".`,
      source,
      relevance: 0.6,
      sentiment: 'neutral'
    }
  ];
  
  return evidence;
}

/**
 * Remove duplicate evidence based on text similarity
 * @param evidence Array of evidence
 * @returns Array of unique evidence
 */
function removeDuplicateEvidence(evidence: Evidence[]): Evidence[] {
  const uniqueEvidence: Evidence[] = [];
  
  for (const item of evidence) {
    // Check if this evidence is similar to any already included evidence
    const isDuplicate = uniqueEvidence.some(uniqueItem => {
      return calculateTextSimilarity(item.text, uniqueItem.text) > 0.8;
    });
    
    // If not a duplicate, add to unique evidence
    if (!isDuplicate) {
      uniqueEvidence.push(item);
    }
  }
  
  return uniqueEvidence;
}

/**
 * Calculate text similarity between two strings
 * @param text1 First text
 * @param text2 Second text
 * @returns Similarity score (0-1)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  // Simple implementation - in production, this would use more sophisticated algorithms
  
  // Convert to lowercase and split into words
  const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  
  // Count common words
  const commonWords = words1.filter(word => words2.includes(word));
  
  // Calculate Jaccard similarity
  const union = new Set([...words1, ...words2]).size;
  const intersection = commonWords.length;
  
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check if evidence contradicts a claim
 * @param claim The claim to check
 * @param evidenceText The evidence text
 * @returns Whether the evidence contradicts the claim
 */
export function evidenceContradictsClaim(claim: string, evidenceText: string): boolean {
  // In a real implementation, this would use NLP to determine contradiction
  // For now, use a simple heuristic
  
  // Convert to lowercase
  const lowerClaim = claim.toLowerCase();
  const lowerEvidence = evidenceText.toLowerCase();
  
  // Check for contradiction indicators
  const contradictionIndicators = [
    'not',
    'never',
    'no',
    'false',
    'incorrect',
    'wrong',
    'untrue',
    'inaccurate',
    'contrary',
    'opposite',
    'differs',
    'disagree',
    'dispute',
    'refute',
    'contradict',
    'debunk',
    'disprove'
  ];
  
  // Check if evidence contains contradiction indicators
  return contradictionIndicators.some(indicator => {
    // Check for the indicator followed by a word from the claim
    const words = lowerClaim.split(/\s+/).filter(word => word.length > 3);
    return words.some(word => {
      const pattern = new RegExp(`${indicator}\\s+[\\w\\s]{0,20}${word}`, 'i');
      return pattern.test(lowerEvidence);
    });
  });
}

/**
 * Check if evidence supports a claim
 * @param claim The claim to check
 * @param evidenceText The evidence text
 * @returns Whether the evidence supports the claim
 */
export function evidenceSupportsClaim(claim: string, evidenceText: string): boolean {
  // In a real implementation, this would use NLP to determine support
  // For now, use a simple heuristic
  
  // Convert to lowercase
  const lowerClaim = claim.toLowerCase();
  const lowerEvidence = evidenceText.toLowerCase();
  
  // Check for support indicators
  const supportIndicators = [
    'confirm',
    'verify',
    'support',
    'corroborate',
    'validate',
    'prove',
    'demonstrate',
    'show',
    'indicate',
    'suggest',
    'according to',
    'consistent with',
    'in line with',
    'agree',
    'concur'
  ];
  
  // Check if evidence contains support indicators
  const hasSupport = supportIndicators.some(indicator => {
    // Check for the indicator followed by a word from the claim
    const words = lowerClaim.split(/\s+/).filter(word => word.length > 3);
    return words.some(word => {
      const pattern = new RegExp(`${indicator}\\s+[\\w\\s]{0,20}${word}`, 'i');
      return pattern.test(lowerEvidence);
    });
  });
  
  // If no explicit support indicators, check for significant word overlap
  if (!hasSupport) {
    const claimWords = new Set(lowerClaim.split(/\s+/).filter(word => word.length > 3));
    const evidenceWords = lowerEvidence.split(/\s+/).filter(word => word.length > 3);
    
    let matchCount = 0;
    for (const word of evidenceWords) {
      if (claimWords.has(word)) {
        matchCount++;
      }
    }
    
    // If more than 50% of claim words are in evidence, consider it supporting
    return matchCount >= claimWords.size * 0.5;
  }
  
  return hasSupport;
}
