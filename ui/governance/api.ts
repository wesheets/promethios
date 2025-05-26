/**
 * Governance API Service
 * 
 * This service provides methods for interacting with the governance backend API
 * for domain-specific governance profiles.
 */

import { GovernanceProfileConfig, GovernanceDomain } from './types';
import { defaultProfiles } from './defaults';

/**
 * API service for governance profiles
 */
export class GovernanceApiService {
  private baseUrl: string;
  private apiKey: string | null;
  
  constructor(baseUrl = '/api/governance', apiKey: string | null = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  /**
   * Fetch all available governance profiles
   */
  async fetchProfiles(): Promise<GovernanceProfileConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching governance profiles:', error);
      // Fall back to default profiles if API is unavailable
      return defaultProfiles;
    }
  }
  
  /**
   * Fetch a specific profile by domain and version
   */
  async fetchProfile(domain: GovernanceDomain, version?: string): Promise<GovernanceProfileConfig | null> {
    try {
      const versionParam = version ? `&version=${version}` : '';
      const response = await fetch(`${this.baseUrl}/profiles?domain=${domain}${versionParam}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching governance profile for domain ${domain}:`, error);
      // Fall back to default profile if API is unavailable
      return defaultProfiles.find(
        profile => profile.domain === domain && (version ? profile.version === version : profile.isDefault)
      ) || null;
    }
  }
  
  /**
   * Save a modified profile
   */
  async saveProfile(profile: GovernanceProfileConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(profile),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save profile: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving governance profile:', error);
      return false;
    }
  }
  
  /**
   * Fetch governance metrics for a specific domain
   */
  async fetchMetrics(domain: GovernanceDomain): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics?domain=${domain}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching governance metrics for domain ${domain}:`, error);
      // Return empty metrics if API is unavailable
      return {};
    }
  }
  
  /**
   * Get request headers with optional authentication
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }
}
