/**
 * Governance Profiles Module
 * 
 * This module exports all components and utilities for the domain-specific
 * governance profiles system introduced in Phase 6.5.
 */

// Export types
export * from './types';

// Export context provider and hook
export { GovernanceProfileProvider, useGovernanceProfile } from './context';

// Export components
export { ProfileSelector } from './ProfileSelector';
export { MetricsVisualization } from './MetricsVisualization';

// Export default profiles
export { 
  defaultProfiles,
  softwareEngineeringProfile,
  productManagementProfile,
  humanResourcesProfile,
  administrativeProfile,
  legacyProfile
} from './defaults';
