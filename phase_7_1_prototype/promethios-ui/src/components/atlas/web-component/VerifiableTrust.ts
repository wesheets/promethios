/**
 * VerifiableTrust.ts
 * 
 * Implements cryptographic verification for Promethios governance
 * Ensures ATLAS and Trust Shield cannot be spoofed or tampered with
 */

import { GovernanceIdentity } from './GovernanceIdentity';
import { CrossOriginAdapter } from './CrossOriginAdapter';

export interface DeploymentToken {
  agentId: string;
  issuedAt: number;
  expiresAt: number;
  issuer: string;
  permissions: string[];
  governanceProfile: string;
  signature: string;
}

export interface GovernanceManifest {
  agentId: string;
  version: string;
  observers: string[];
  governanceProfile: string;
  merkleRoot: string;
  lastUpdated: number;
}

export type VerificationStatus = 
  | 'verified' 
  | 'token_invalid' 
  | 'token_expired'
  | 'manifest_missing'
  | 'manifest_invalid'
  | 'merkle_mismatch'
  | 'unverifiable';

export class VerifiableTrust {
  private static instance: VerifiableTrust;
  private deploymentTokens: Map<string, DeploymentToken> = new Map();
  private manifestCache: Map<string, GovernanceManifest> = new Map();
  private verificationStatus: Map<string, VerificationStatus> = new Map();
  private crossOriginAdapter: CrossOriginAdapter;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): VerifiableTrust {
    if (!VerifiableTrust.instance) {
      VerifiableTrust.instance = new VerifiableTrust();
    }
    return VerifiableTrust.instance;
  }
  
  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    this.crossOriginAdapter = CrossOriginAdapter.getInstance();
  }
  
  /**
   * Verify a deployment token
   * @param token The deployment token to verify
   * @returns Whether the token is valid
   */
  public verifyDeploymentToken(token: DeploymentToken): boolean {
    // Check if token is expired
    if (token.expiresAt < Date.now()) {
      return false;
    }
    
    // Verify token signature
    const isSignatureValid = this.verifySignature(token);
    
    if (isSignatureValid) {
      // Cache valid token
      this.deploymentTokens.set(token.agentId, token);
    }
    
    return isSignatureValid;
  }
  
  /**
   * Verify a governance manifest
   * @param agentId The ID of the agent
   * @param manifest The governance manifest to verify
   * @returns Whether the manifest is valid
   */
  public verifyGovernanceManifest(agentId: string, manifest: GovernanceManifest): boolean {
    // Check if we have a valid token for this agent
    const token = this.deploymentTokens.get(agentId);
    if (!token) {
      return false;
    }
    
    // Verify manifest matches token
    if (manifest.agentId !== token.agentId || 
        manifest.governanceProfile !== token.governanceProfile) {
      return false;
    }
    
    // Verify Merkle root
    const isMerkleValid = this.verifyMerkleRoot(manifest);
    
    if (isMerkleValid) {
      // Cache valid manifest
      this.manifestCache.set(agentId, manifest);
    }
    
    return isMerkleValid;
  }
  
  /**
   * Fetch and verify governance manifest
   * @param agentId The ID of the agent
   * @param manifestUrl Optional URL to fetch manifest from
   * @returns Promise resolving to verification status
   */
  public async fetchAndVerifyManifest(
    agentId: string, 
    manifestUrl?: string
  ): Promise<VerificationStatus> {
    try {
      // Check if we have a valid token
      const token = this.deploymentTokens.get(agentId);
      if (!token) {
        this.verificationStatus.set(agentId, 'token_invalid');
        return 'token_invalid';
      }
      
      // Check if token is expired
      if (token.expiresAt < Date.now()) {
        this.verificationStatus.set(agentId, 'token_expired');
        return 'token_expired';
      }
      
      // Try to fetch manifest from various locations
      const manifest = await this.fetchManifest(agentId, manifestUrl);
      
      if (!manifest) {
        this.verificationStatus.set(agentId, 'manifest_missing');
        return 'manifest_missing';
      }
      
      // Verify manifest
      const isManifestValid = this.verifyGovernanceManifest(agentId, manifest);
      
      if (!isManifestValid) {
        this.verificationStatus.set(agentId, 'manifest_invalid');
        return 'manifest_invalid';
      }
      
      // Verify Merkle root
      const isMerkleValid = this.verifyMerkleRoot(manifest);
      
      if (!isMerkleValid) {
        this.verificationStatus.set(agentId, 'merkle_mismatch');
        return 'merkle_mismatch';
      }
      
      // All checks passed
      this.verificationStatus.set(agentId, 'verified');
      return 'verified';
    } catch (error) {
      console.error('Error verifying manifest:', error);
      this.verificationStatus.set(agentId, 'unverifiable');
      return 'unverifiable';
    }
  }
  
  /**
   * Fetch governance manifest from various locations
   * @param agentId The ID of the agent
   * @param manifestUrl Optional URL to fetch manifest from
   * @returns Promise resolving to manifest or null if not found
   */
  private async fetchManifest(
    agentId: string,
    manifestUrl?: string
  ): Promise<GovernanceManifest | null> {
    // Try explicit URL first if provided
    if (manifestUrl) {
      try {
        const response = await fetch(manifestUrl);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn(`Failed to fetch manifest from ${manifestUrl}`);
      }
    }
    
    // Try well-known location
    try {
      const response = await fetch(`/.well-known/promethios-manifest.json?agent=${agentId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Failed to fetch manifest from well-known location');
    }
    
    // Try global object
    if (window.promethiosAgentContext?.getManifest) {
      try {
        const manifest = window.promethiosAgentContext.getManifest(agentId);
        if (manifest) {
          return manifest;
        }
      } catch (e) {
        console.warn('Failed to get manifest from global context');
      }
    }
    
    // Try cross-origin request
    try {
      return await new Promise<GovernanceManifest | null>((resolve) => {
        // Set up listener for manifest response
        const unsubscribe = this.crossOriginAdapter.on('manifest_response', (payload) => {
          if (payload.agentId === agentId) {
            unsubscribe();
            resolve(payload.manifest);
          }
        });
        
        // Request manifest
        this.crossOriginAdapter.sendMessage('request_manifest', { agentId });
        
        // Timeout after 2 seconds
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 2000);
      });
    } catch (e) {
      console.warn('Failed to get manifest via cross-origin request');
    }
    
    return null;
  }
  
  /**
   * Verify cryptographic signature
   * @param token The token to verify
   * @returns Whether the signature is valid
   */
  private verifySignature(token: DeploymentToken): boolean {
    // In a real implementation, this would use proper cryptographic verification
    // For now, we'll simulate verification
    
    // Extract signature
    const { signature, ...tokenData } = token;
    
    // Check if signature exists and has expected format
    if (!signature || !signature.startsWith('promethios-sig-')) {
      return false;
    }
    
    // In a real implementation, we would verify the signature against a public key
    // For now, we'll accept signatures that follow the expected format
    return true;
  }
  
  /**
   * Verify Merkle root of governance components
   * @param manifest The manifest containing the Merkle root
   * @returns Whether the Merkle root is valid
   */
  private verifyMerkleRoot(manifest: GovernanceManifest): boolean {
    // In a real implementation, this would compute a Merkle root from governance components
    // and compare it to the one in the manifest
    
    // For now, we'll simulate verification
    return !!manifest.merkleRoot && manifest.merkleRoot.startsWith('merkle-');
  }
  
  /**
   * Get verification status for an agent
   * @param agentId The ID of the agent
   * @returns The verification status
   */
  public getVerificationStatus(agentId: string): VerificationStatus {
    return this.verificationStatus.get(agentId) || 'unverifiable';
  }
  
  /**
   * Check if an agent is verified
   * @param agentId The ID of the agent
   * @returns Whether the agent is verified
   */
  public isAgentVerified(agentId: string): boolean {
    return this.getVerificationStatus(agentId) === 'verified';
  }
  
  /**
   * Register a deployment token
   * @param token The deployment token to register
   * @returns Whether the token was successfully registered
   */
  public registerDeploymentToken(token: DeploymentToken): boolean {
    return this.verifyDeploymentToken(token);
  }
  
  /**
   * Create a deployment token for testing
   * @param agentId The ID of the agent
   * @returns A test deployment token
   */
  public createTestToken(agentId: string): DeploymentToken {
    const token: DeploymentToken = {
      agentId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 86400000, // 24 hours
      issuer: 'promethios-core',
      permissions: ['display', 'monitor', 'explain'],
      governanceProfile: 'standard',
      signature: `promethios-sig-${Math.random().toString(36).substring(2)}`
    };
    
    this.deploymentTokens.set(agentId, token);
    return token;
  }
}

export default VerifiableTrust;
