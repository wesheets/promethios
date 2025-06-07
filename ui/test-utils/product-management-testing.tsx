/**
 * Enhanced mock API service for ProductManagementProfile tests
 * 
 * This file provides a specialized mock API service for product management domain tests
 * with proper method signatures and behavior.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import * as React from 'react';
import { GovernanceDomain } from '../governance/types';
import { GovernanceProfileConfig } from './governance-testing';

/**
 * Mock API service specifically for product management domain tests
 */
export class ProductManagementMockApiService {
  private mockProfiles: Record<GovernanceDomain, GovernanceProfileConfig>;
  private mockErrors: Record<GovernanceDomain, Error>;
  private mockDelay: number;
  
  constructor(mockDelay: number = 0) {
    this.mockDelay = mockDelay;
    this.mockProfiles = {} as Record<GovernanceDomain, GovernanceProfileConfig>;
    this.mockErrors = {} as Record<GovernanceDomain, Error>;
  }
  
  setMockProfiles(profiles: Record<GovernanceDomain, GovernanceProfileConfig>) {
    this.mockProfiles = profiles;
  }
  
  setMockError(domain: GovernanceDomain, error: Error) {
    this.mockErrors[domain] = error;
  }
  
  // Method expected by ProductManagementProfile component
  async fetchProfile(domain: GovernanceDomain): Promise<GovernanceProfileConfig> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
    
    if (this.mockErrors[domain]) {
      throw this.mockErrors[domain];
    }
    
    return this.mockProfiles[domain];
  }
  
  // Method expected by ProductManagementProfile component
  async fetchProfiles(): Promise<GovernanceProfileConfig[]> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
    
    return Object.values(this.mockProfiles);
  }
  
  // Alias for getAllProfiles to ensure compatibility
  async getAllProfiles(): Promise<Record<GovernanceDomain, GovernanceProfileConfig>> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
    
    return this.mockProfiles;
  }
  
  // Method expected by some tests
  async getProfile(domain: GovernanceDomain): Promise<GovernanceProfileConfig> {
    return this.fetchProfile(domain);
  }
}
