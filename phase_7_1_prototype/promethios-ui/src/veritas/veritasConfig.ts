/**
 * VERITAS Configuration System
 * 
 * This module provides configuration management for the VERITAS system.
 * It includes default configurations, validation, and persistence.
 */

import { EnforcementOptions } from './enforcement/veritasEnforcer';
import { VeritasOptions } from './core';

// Types
export interface DomainConfig {
  id: string;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  confidenceThreshold: number;
  evidenceRequirement: number;
  blockingEnabled: boolean;
  uncertaintyRequired: boolean;
  keywords: string[];
}

export interface VeritasConfig {
  enabled: boolean;
  domainSpecificEnabled: boolean;
  uncertaintyRewardEnabled: boolean;
  defaultMode: 'strict' | 'balanced' | 'lenient';
  domains: DomainConfig[];
  enforcementOptions: Partial<EnforcementOptions>;
  verificationOptions: Partial<VeritasOptions>;
}

// Default domain configurations
export const DEFAULT_DOMAIN_CONFIGS: DomainConfig[] = [
  {
    id: "legal",
    name: "Legal",
    riskLevel: "high",
    confidenceThreshold: 90,
    evidenceRequirement: 80,
    blockingEnabled: true,
    uncertaintyRequired: true,
    keywords: ["court", "law", "legal", "judge", "ruling", "case", "v.", "versus"]
  },
  {
    id: "medical",
    name: "Medical",
    riskLevel: "high",
    confidenceThreshold: 90,
    evidenceRequirement: 80,
    blockingEnabled: true,
    uncertaintyRequired: true,
    keywords: ["medical", "health", "disease", "treatment", "diagnosis", "symptom"]
  },
  {
    id: "historical",
    name: "Historical",
    riskLevel: "medium",
    confidenceThreshold: 70,
    evidenceRequirement: 60,
    blockingEnabled: true,
    uncertaintyRequired: true,
    keywords: ["history", "historical", "century", "ancient", "war", "revolution"]
  },
  {
    id: "entertainment",
    name: "Entertainment",
    riskLevel: "low",
    confidenceThreshold: 50,
    evidenceRequirement: 30,
    blockingEnabled: false,
    uncertaintyRequired: false,
    keywords: ["movie", "film", "actor", "actress", "entertainment", "show", "series"]
  },
  {
    id: "general",
    name: "General",
    riskLevel: "low",
    confidenceThreshold: 60,
    evidenceRequirement: 40,
    blockingEnabled: false,
    uncertaintyRequired: false,
    keywords: []  // Catch-all domain
  }
];

// Default VERITAS configuration
export const DEFAULT_VERITAS_CONFIG: VeritasConfig = {
  enabled: true,
  domainSpecificEnabled: false,  // Will be enabled in future phases
  uncertaintyRewardEnabled: false,  // Will be enabled in future phases
  defaultMode: "balanced",
  domains: DEFAULT_DOMAIN_CONFIGS,
  enforcementOptions: {
    blockHallucinations: true,
    trustPenalty: 10,
    warningLevel: 'explicit',
    minHallucinationThreshold: 0.5
  },
  verificationOptions: {
    mode: 'balanced',
    maxClaims: 5,
    confidenceThreshold: 0.7,
    retrievalDepth: 3
  }
};

/**
 * Validate a VERITAS configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(config: Partial<VeritasConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (config.enabled === undefined) {
    errors.push("'enabled' field is required");
  }
  
  // Validate mode if provided
  if (config.defaultMode && !['strict', 'balanced', 'lenient'].includes(config.defaultMode)) {
    errors.push("'defaultMode' must be one of: 'strict', 'balanced', 'lenient'");
  }
  
  // Validate domains if provided
  if (config.domains) {
    config.domains.forEach((domain, index) => {
      if (!domain.id) {
        errors.push(`Domain at index ${index} is missing 'id'`);
      }
      if (!domain.name) {
        errors.push(`Domain at index ${index} is missing 'name'`);
      }
      if (!['high', 'medium', 'low'].includes(domain.riskLevel)) {
        errors.push(`Domain '${domain.id || index}' has invalid 'riskLevel'`);
      }
      if (domain.confidenceThreshold < 0 || domain.confidenceThreshold > 100) {
        errors.push(`Domain '${domain.id || index}' has invalid 'confidenceThreshold'`);
      }
      if (domain.evidenceRequirement < 0 || domain.evidenceRequirement > 100) {
        errors.push(`Domain '${domain.id || index}' has invalid 'evidenceRequirement'`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Merge a partial configuration with the default configuration
 * @param config Partial configuration to merge
 * @returns Complete merged configuration
 */
export function mergeWithDefaults(config: Partial<VeritasConfig>): VeritasConfig {
  // Start with default config
  const merged = { ...DEFAULT_VERITAS_CONFIG };
  
  // Merge top-level properties
  if (config.enabled !== undefined) merged.enabled = config.enabled;
  if (config.domainSpecificEnabled !== undefined) merged.domainSpecificEnabled = config.domainSpecificEnabled;
  if (config.uncertaintyRewardEnabled !== undefined) merged.uncertaintyRewardEnabled = config.uncertaintyRewardEnabled;
  if (config.defaultMode) merged.defaultMode = config.defaultMode;
  
  // Merge domains if provided
  if (config.domains) {
    // Create a map of existing domains for easy lookup
    const domainMap = new Map(merged.domains.map(d => [d.id, d]));
    
    // Update or add domains from the provided config
    config.domains.forEach(domain => {
      if (domainMap.has(domain.id)) {
        // Update existing domain
        const existingDomain = domainMap.get(domain.id)!;
        domainMap.set(domain.id, { ...existingDomain, ...domain });
      } else {
        // Add new domain
        domainMap.set(domain.id, domain);
      }
    });
    
    // Convert map back to array
    merged.domains = Array.from(domainMap.values());
  }
  
  // Merge enforcement options if provided
  if (config.enforcementOptions) {
    merged.enforcementOptions = { ...merged.enforcementOptions, ...config.enforcementOptions };
  }
  
  // Merge verification options if provided
  if (config.verificationOptions) {
    merged.verificationOptions = { ...merged.verificationOptions, ...config.verificationOptions };
  }
  
  return merged;
}

/**
 * Save configuration to local storage
 * @param config Configuration to save
 */
export function saveConfig(config: VeritasConfig): void {
  try {
    localStorage.setItem('veritasConfig', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save VERITAS configuration:', error);
  }
}

/**
 * Load configuration from local storage
 * @returns Loaded configuration or default if not found
 */
export function loadConfig(): VeritasConfig {
  try {
    const saved = localStorage.getItem('veritasConfig');
    if (saved) {
      const parsed = JSON.parse(saved);
      return mergeWithDefaults(parsed);
    }
  } catch (error) {
    console.error('Failed to load VERITAS configuration:', error);
  }
  
  return DEFAULT_VERITAS_CONFIG;
}
