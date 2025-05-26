/**
 * Default governance profiles for each domain
 * 
 * This file provides the default governance profile configurations
 * for each supported domain based on the benchmark testing results.
 */

import { 
  GovernanceProfileConfig, 
  GovernanceDomain 
} from './types';

/**
 * Default profile for Software Engineering domain
 * 
 * Based on benchmark results showing:
 * - Slight performance decrease (-4.3%)
 * - Quality decrease (-10.7%)
 * - Trust maintained
 */
export const softwareEngineeringProfile: GovernanceProfileConfig = {
  domain: GovernanceDomain.SOFTWARE_ENGINEERING,
  displayName: 'Software Engineering Governance',
  description: 'Optimized for code review, development, and technical tasks',
  trustMetrics: {
    trustDecayRate: 0.05,      // Slower decay as trust is resilient in this domain
    minTrustThreshold: 0.65,   // Higher threshold for technical operations
    trustRecoveryRate: 0.08,   // Moderate recovery rate
    maxTrustLevel: 0.95,       // High maximum trust for technical precision
  },
  monitoring: {
    eventGranularity: 4,       // Full granularity for technical operations
    monitoredEventTypes: ['code_change', 'review', 'build', 'deploy'],
    reportingFrequencyMs: 5000, // Frequent reporting
  },
  recovery: {
    statePreservationDepth: 3, // Deep state preservation for complex technical context
    maxRecoveryAttempts: 3,    // Multiple recovery attempts
    recoveryDelayMs: 1000,     // Short delay between attempts
  },
  loopState: {
    useAbortedForResourceLimits: true, // Use clearer 'aborted' state
    customStateTransitions: {
      'review_pending': 'in_progress',
      'build_failed': 'review_pending'
    },
  },
  version: '6.4.0',
  isDefault: true,
};

/**
 * Default profile for Product Management domain
 * 
 * Based on benchmark results showing:
 * - Performance improvement (+9.3%)
 * - Minor quality decrease (-5.7%)
 * - Slight trust decrease (-2.7%)
 */
export const productManagementProfile: GovernanceProfileConfig = {
  domain: GovernanceDomain.PRODUCT_MANAGEMENT,
  displayName: 'Product Management Governance',
  description: 'Optimized for market analysis, product planning, and roadmapping',
  trustMetrics: {
    trustDecayRate: 0.08,      // Faster decay based on benchmark results
    minTrustThreshold: 0.60,   // Moderate threshold for product decisions
    trustRecoveryRate: 0.05,   // Slower recovery rate
    maxTrustLevel: 0.90,       // High maximum trust for product decisions
  },
  monitoring: {
    eventGranularity: 3,       // Reduced granularity for better performance
    monitoredEventTypes: ['market_analysis', 'planning', 'prioritization'],
    reportingFrequencyMs: 10000, // Less frequent reporting
  },
  recovery: {
    statePreservationDepth: 2, // Moderate state preservation
    maxRecoveryAttempts: 2,    // Fewer recovery attempts
    recoveryDelayMs: 2000,     // Longer delay between attempts
  },
  loopState: {
    useAbortedForResourceLimits: true, // Use clearer 'aborted' state
    customStateTransitions: {
      'analysis_complete': 'planning',
      'planning_complete': 'execution'
    },
  },
  version: '6.4.0',
  isDefault: true,
};

/**
 * Default profile for Human Resources domain
 * 
 * Based on benchmark results showing:
 * - Performance decrease (-10.7%)
 * - Trust score improvement (+6.1%)
 */
export const humanResourcesProfile: GovernanceProfileConfig = {
  domain: GovernanceDomain.HUMAN_RESOURCES,
  displayName: 'Human Resources Governance',
  description: 'Optimized for personnel management, hiring, and HR operations',
  trustMetrics: {
    trustDecayRate: 0.03,      // Slow decay to maintain high trust
    minTrustThreshold: 0.75,   // High threshold for sensitive HR operations
    trustRecoveryRate: 0.10,   // Fast recovery rate
    maxTrustLevel: 0.98,       // Very high maximum trust for HR
  },
  monitoring: {
    eventGranularity: 4,       // Full granularity for HR compliance
    monitoredEventTypes: ['personnel_action', 'compliance_check', 'policy_review', 'sensitive_data_access'],
    reportingFrequencyMs: 3000, // Very frequent reporting
  },
  recovery: {
    statePreservationDepth: 4, // Deep state preservation for HR context
    maxRecoveryAttempts: 4,    // Multiple recovery attempts
    recoveryDelayMs: 500,      // Very short delay between attempts
  },
  loopState: {
    useAbortedForResourceLimits: true, // Use clearer 'aborted' state
    customStateTransitions: {
      'review_required': 'compliance_check',
      'compliance_check_failed': 'review_required'
    },
  },
  version: '6.4.0',
  isDefault: true,
};

/**
 * Default profile for Administrative domain
 * 
 * Based on benchmark results showing:
 * - Performance improvement (+5.0%)
 * - Trust improvement (+3.7%)
 */
export const administrativeProfile: GovernanceProfileConfig = {
  domain: GovernanceDomain.ADMINISTRATIVE,
  displayName: 'Administrative Governance',
  description: 'Optimized for document processing, scheduling, and administrative tasks',
  trustMetrics: {
    trustDecayRate: 0.04,      // Moderate decay rate
    minTrustThreshold: 0.70,   // Moderate-high threshold
    trustRecoveryRate: 0.07,   // Moderate recovery rate
    maxTrustLevel: 0.92,       // High maximum trust
  },
  monitoring: {
    eventGranularity: 2,       // Reduced granularity for better performance
    monitoredEventTypes: ['document_processing', 'scheduling'],
    reportingFrequencyMs: 15000, // Less frequent reporting
  },
  recovery: {
    statePreservationDepth: 2, // Moderate state preservation
    maxRecoveryAttempts: 2,    // Fewer recovery attempts
    recoveryDelayMs: 1500,     // Moderate delay between attempts
  },
  loopState: {
    useAbortedForResourceLimits: true, // Use clearer 'aborted' state
    customStateTransitions: {
      'document_received': 'processing',
      'processing_complete': 'filed'
    },
  },
  version: '6.4.0',
  isDefault: true,
};

/**
 * Legacy profile for pre-6.4 behavior (for backward compatibility)
 */
export const legacyProfile: GovernanceProfileConfig = {
  domain: GovernanceDomain.SOFTWARE_ENGINEERING, // Default domain
  displayName: 'Legacy Governance (pre-6.4)',
  description: 'Pre-6.4 behavior for backward compatibility',
  trustMetrics: {
    trustDecayRate: 0.05,
    minTrustThreshold: 0.60,
    trustRecoveryRate: 0.05,
    maxTrustLevel: 0.90,
  },
  monitoring: {
    eventGranularity: 2, // Original 2 events instead of 4
    monitoredEventTypes: ['start', 'end'],
    reportingFrequencyMs: 10000,
  },
  recovery: {
    statePreservationDepth: 1, // Limited state preservation
    maxRecoveryAttempts: 1,
    recoveryDelayMs: 2000,
  },
  loopState: {
    useAbortedForResourceLimits: false, // Use 'completed' state for resource limits
  },
  version: 'pre-6.4',
  isDefault: false,
};

/**
 * Array of all default profiles
 */
export const defaultProfiles: GovernanceProfileConfig[] = [
  softwareEngineeringProfile,
  productManagementProfile,
  humanResourcesProfile,
  administrativeProfile,
  legacyProfile,
];
