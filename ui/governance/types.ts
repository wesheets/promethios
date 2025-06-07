/**
 * Governance domain enums and types
 * 
 * Defines the governance domains and related types used throughout the application.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */

// Governance domains
export enum GovernanceDomain {
  SOFTWARE_ENGINEERING = 'software_engineering',
  PRODUCT_MANAGEMENT = 'product_management',
  DATA_SCIENCE = 'data_science',
  OPERATIONS = 'operations',
  SECURITY = 'security'
}

// Profile interface
export interface GovernanceProfile {
  id: string;
  name: string;
  metrics: Record<string, number>;
  lastUpdated: string;
}

// Context interface
export interface GovernanceContextType {
  currentDomain: GovernanceDomain | null;
  setCurrentDomain: (domain: GovernanceDomain) => void;
  profiles: Record<GovernanceDomain, GovernanceProfile>;
  loading: boolean;
  error: string | null;
  apiService: any;
}
