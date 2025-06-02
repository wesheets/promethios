/**
 * Domain Classifier for VERITAS
 * 
 * This module provides domain classification capabilities for the VERITAS system.
 * It categorizes content into domains to apply appropriate verification standards.
 */

import { DomainConfig, DEFAULT_DOMAIN_CONFIGS } from './veritasConfig';

// Types
export interface DomainClassification {
  domain: DomainConfig;
  confidence: number;
  secondaryDomains: Array<{domain: DomainConfig, confidence: number}>;
}

/**
 * Domain Classifier class
 * Provides domain classification for content verification
 */
export class DomainClassifier {
  private domains: DomainConfig[];
  private generalDomain: DomainConfig;
  
  /**
   * Constructor
   * @param domains Array of domain configurations
   */
  constructor(domains: DomainConfig[] = DEFAULT_DOMAIN_CONFIGS) {
    this.domains = [...domains];
    
    // Find the general domain or create one if it doesn't exist
    const generalDomain = this.domains.find(d => d.id === 'general');
    if (generalDomain) {
      this.generalDomain = generalDomain;
    } else {
      this.generalDomain = {
        id: 'general',
        name: 'General',
        riskLevel: 'low',
        confidenceThreshold: 60,
        evidenceRequirement: 40,
        blockingEnabled: false,
        uncertaintyRequired: false,
        keywords: []
      };
      this.domains.push(this.generalDomain);
    }
  }
  
  /**
   * Classify content into domains
   * @param text Content to classify
   * @returns Domain classification result
   */
  classifyContent(text: string): DomainClassification {
    const lowerText = text.toLowerCase();
    const scores: Map<string, number> = new Map();
    
    // Calculate scores for each domain based on keyword matches
    this.domains.forEach(domain => {
      if (domain.keywords.length === 0) {
        // Skip domains with no keywords (like general)
        scores.set(domain.id, 0);
        return;
      }
      
      // Count keyword matches
      let matches = 0;
      domain.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matchCount = (lowerText.match(regex) || []).length;
        matches += matchCount;
      });
      
      // Calculate score based on matches and text length
      const textLength = text.split(/\s+/).length;
      const score = matches > 0 ? (matches / Math.min(textLength, 100)) * 100 : 0;
      
      scores.set(domain.id, score);
    });
    
    // Find the domain with the highest score
    let highestScore = 0;
    let primaryDomain = this.generalDomain;
    
    for (const [domainId, score] of scores.entries()) {
      if (score > highestScore) {
        highestScore = score;
        primaryDomain = this.getDomainById(domainId) || this.generalDomain;
      }
    }
    
    // If no domain has a significant score, use the general domain
    if (highestScore < 10) {
      primaryDomain = this.generalDomain;
      highestScore = 50; // Default confidence for general domain
    }
    
    // Calculate confidence based on score
    // Cap confidence at 95% to allow for uncertainty
    const confidence = Math.min(Math.max(highestScore, 50), 95) / 100;
    
    // Find secondary domains (any with at least 50% of the highest score)
    const secondaryDomains: Array<{domain: DomainConfig, confidence: number}> = [];
    
    for (const [domainId, score] of scores.entries()) {
      if (domainId !== primaryDomain.id && score >= highestScore * 0.5) {
        const domain = this.getDomainById(domainId);
        if (domain) {
          secondaryDomains.push({
            domain,
            confidence: Math.min(score, 95) / 100
          });
        }
      }
    }
    
    // Sort secondary domains by confidence
    secondaryDomains.sort((a, b) => b.confidence - a.confidence);
    
    return {
      domain: primaryDomain,
      confidence,
      secondaryDomains
    };
  }
  
  /**
   * Get a domain by ID
   * @param id Domain ID
   * @returns Domain configuration or undefined if not found
   */
  getDomainById(id: string): DomainConfig | undefined {
    return this.domains.find(d => d.id === id);
  }
  
  /**
   * Get all domains
   * @returns Array of all domain configurations
   */
  getAllDomains(): DomainConfig[] {
    return [...this.domains];
  }
  
  /**
   * Update a domain configuration
   * @param id Domain ID
   * @param config New domain configuration (partial)
   * @returns Updated domain or undefined if not found
   */
  updateDomain(id: string, config: Partial<DomainConfig>): DomainConfig | undefined {
    const index = this.domains.findIndex(d => d.id === id);
    if (index === -1) {
      return undefined;
    }
    
    // Update the domain
    this.domains[index] = { ...this.domains[index], ...config };
    
    // If this is the general domain, update the reference
    if (id === 'general') {
      this.generalDomain = this.domains[index];
    }
    
    return this.domains[index];
  }
  
  /**
   * Add a new domain
   * @param domain Domain configuration
   * @returns Added domain
   */
  addDomain(domain: DomainConfig): DomainConfig {
    // Check if domain already exists
    const existing = this.getDomainById(domain.id);
    if (existing) {
      return this.updateDomain(domain.id, domain) as DomainConfig;
    }
    
    // Add the new domain
    this.domains.push(domain);
    return domain;
  }
  
  /**
   * Remove a domain
   * @param id Domain ID
   * @returns Whether the domain was removed
   */
  removeDomain(id: string): boolean {
    // Cannot remove the general domain
    if (id === 'general') {
      return false;
    }
    
    const index = this.domains.findIndex(d => d.id === id);
    if (index === -1) {
      return false;
    }
    
    this.domains.splice(index, 1);
    return true;
  }
}

/**
 * Create a domain classifier instance
 * @param domains Array of domain configurations
 * @returns Domain classifier instance
 */
export function createDomainClassifier(domains: DomainConfig[] = DEFAULT_DOMAIN_CONFIGS): DomainClassifier {
  return new DomainClassifier(domains);
}

// Export singleton instance for use throughout the application
export const domainClassifier = createDomainClassifier();
