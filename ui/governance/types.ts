/**
 * Domain-specific governance profile types
 * 
 * This file defines the core interfaces and types for the domain-specific
 * governance profiles system introduced in Phase 6.5.
 */

/**
 * Supported domain types for governance profiles
 */
export enum GovernanceDomain {
  SOFTWARE_ENGINEERING = 'software_engineering',
  PRODUCT_MANAGEMENT = 'product_management',
  HUMAN_RESOURCES = 'human_resources',
  ADMINISTRATIVE = 'administrative',
}

/**
 * Trust metric configuration for a specific domain
 */
export interface TrustMetricConfig {
  /** Base decay rate for trust in this domain */
  trustDecayRate: number;
  /** Minimum trust threshold for operations */
  minTrustThreshold: number;
  /** Recovery rate for trust after violations */
  trustRecoveryRate: number;
  /** Maximum trust level that can be achieved */
  maxTrustLevel: number;
}

/**
 * Monitoring configuration for a specific domain
 */
export interface MonitoringConfig {
  /** Number of monitoring events to generate */
  eventGranularity: number;
  /** Types of events to monitor */
  monitoredEventTypes: string[];
  /** Reporting frequency for monitoring events */
  reportingFrequencyMs: number;
}

/**
 * Recovery mechanism configuration for a specific domain
 */
export interface RecoveryConfig {
  /** Depth of state preservation during recovery */
  statePreservationDepth: number;
  /** Automatic recovery attempts before failure */
  maxRecoveryAttempts: number;
  /** Delay between recovery attempts */
  recoveryDelayMs: number;
}

/**
 * Loop state configuration for a specific domain
 */
export interface LoopStateConfig {
  /** Whether to use 'aborted' state for resource limits */
  useAbortedForResourceLimits: boolean;
  /** Custom state transitions for this domain */
  customStateTransitions?: Record<string, string>;
}

/**
 * Complete governance profile configuration for a specific domain
 */
export interface GovernanceProfileConfig {
  /** Domain this profile applies to */
  domain: GovernanceDomain;
  /** Display name for this profile */
  displayName: string;
  /** Description of this profile */
  description: string;
  /** Trust metric configuration */
  trustMetrics: TrustMetricConfig;
  /** Monitoring configuration */
  monitoring: MonitoringConfig;
  /** Recovery mechanism configuration */
  recovery: RecoveryConfig;
  /** Loop state configuration */
  loopState: LoopStateConfig;
  /** Version of this profile */
  version: string;
  /** Whether this is the default profile for the domain */
  isDefault: boolean;
}

/**
 * Context for the currently selected governance profile
 */
export interface GovernanceProfileContext {
  /** Currently selected profile */
  currentProfile: GovernanceProfileConfig | null;
  /** Available profiles */
  availableProfiles: GovernanceProfileConfig[];
  /** Select a profile by domain and optional version */
  selectProfile: (domain: GovernanceDomain, version?: string) => void;
  /** Reset to default profile for current domain */
  resetToDefault: () => void;
  /** Current domain */
  currentDomain: GovernanceDomain | null;
}
