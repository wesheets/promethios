/**
 * Agent Trust Boundary API Service
 * 
 * Provides agent-facing APIs for trust boundary queries, collaboration discovery,
 * and real-time trust relationship management. Integrates with existing backend
 * services while providing agent-specific functionality.
 */

import { API_BASE_URL } from '../config/api';
import { agentTrustBoundaryExtension, AgentTrustQuery, AgentTrustQueryResponse, AgentTrustBoundary, CollaborationDiscoveryRequest, TrustBoundaryAlert } from '../extensions/AgentTrustBoundaryExtension';
import { trustBackendService } from './trustBackendService';
import { agentBackendService } from './agentBackendService';

export interface AgentAuthenticationRequest {
  agent_id: string;
  governance_identity_token: string;
  request_timestamp: string;
  signature?: string;
}

export interface AgentAuthenticationResponse {
  authenticated: boolean;
  session_token: string;
  expires_at: string;
  permissions: {
    can_query_trust: boolean;
    can_discover_collaborators: boolean;
    can_receive_updates: boolean;
    query_rate_limit: number;
  };
}

export interface TrustBoundaryQueryRequest extends AgentTrustQuery {
  session_token: string;
}

export interface CollaborationRecommendation {
  agent_id: string;
  agent_name: string;
  trust_score: number;
  confidence_level: number;
  collaboration_potential: number;
  recommended_interaction_types: string[];
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high';
    risk_factors: string[];
    mitigation_suggestions: string[];
  };
  policy_requirements: Array<{
    policy_type: string;
    compliance_required: boolean;
    description: string;
  }>;
  estimated_response_time: number;
  availability_status: 'available' | 'busy' | 'offline';
}

export interface TrustBoundarySubscription {
  subscription_id: string;
  agent_id: string;
  subscription_type: 'trust_changes' | 'collaboration_opportunities' | 'risk_alerts' | 'all';
  filters?: {
    min_trust_change?: number;
    agent_ids?: string[];
    alert_types?: string[];
  };
  delivery_method: 'webhook' | 'polling' | 'websocket';
  webhook_url?: string;
  created_at: string;
  status: 'active' | 'paused' | 'expired';
}

export interface TrustVerificationRequest {
  requesting_agent_id: string;
  target_agent_id: string;
  verification_type: 'identity' | 'trust_score' | 'compliance' | 'full';
  session_token: string;
}

export interface TrustVerificationResponse {
  verification_id: string;
  target_agent_id: string;
  verification_type: string;
  verified: boolean;
  verification_details: {
    identity_verified?: boolean;
    governance_compliance?: boolean;
    trust_score_current?: number;
    trust_score_verified_at?: string;
    policy_compliance?: Array<{
      policy_type: string;
      compliant: boolean;
      last_checked: string;
    }>;
  };
  verification_timestamp: string;
  expires_at: string;
}

/**
 * Agent Trust Boundary API Service Class
 */
export class AgentTrustBoundaryApiService {
  private baseUrl: string;
  private sessionTokens = new Map<string, any>();
  private subscriptions = new Map<string, TrustBoundarySubscription>();

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/agent-trust`;
  }

  /**
   * Authenticate an agent for trust boundary API access
   */
  async authenticateAgent(request: AgentAuthenticationRequest): Promise<AgentAuthenticationResponse> {
    try {
      console.log(`Authenticating agent ${request.agent_id} for trust boundary access`);

      // Validate governance identity
      const agentProfile = await agentBackendService.getAgentProfile(request.agent_id);
      if (!agentProfile || !agentProfile.governance_identity) {
        throw new Error('Invalid or missing governance identity');
      }

      // Verify agent compliance status
      const isCompliant = agentProfile.governance_identity.compliance_level !== 'non_compliant';
      if (!isCompliant) {
        throw new Error('Agent must be governance compliant to access trust boundaries');
      }

      // Generate session token
      const sessionToken = this.generateSessionToken(request.agent_id);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Store session
      this.sessionTokens.set(sessionToken, {
        agent_id: request.agent_id,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        permissions: {
          can_query_trust: true,
          can_discover_collaborators: true,
          can_receive_updates: true,
          query_rate_limit: 60 // requests per minute
        }
      });

      return {
        authenticated: true,
        session_token: sessionToken,
        expires_at: expiresAt,
        permissions: {
          can_query_trust: true,
          can_discover_collaborators: true,
          can_receive_updates: true,
          query_rate_limit: 60
        }
      };
    } catch (error) {
      console.error('Agent authentication failed:', error);
      return {
        authenticated: false,
        session_token: '',
        expires_at: '',
        permissions: {
          can_query_trust: false,
          can_discover_collaborators: false,
          can_receive_updates: false,
          query_rate_limit: 0
        }
      };
    }
  }

  /**
   * Query trust boundaries for an authenticated agent
   */
  async queryTrustBoundaries(request: TrustBoundaryQueryRequest): Promise<AgentTrustQueryResponse> {
    try {
      // Validate session token
      const session = await this.validateSessionToken(request.session_token);
      if (!session) {
        throw new Error('Invalid or expired session token');
      }

      // Ensure requesting agent matches session
      if (session.agent_id !== request.requesting_agent_id) {
        throw new Error('Agent ID mismatch with session token');
      }

      // Use extension to process query
      const response = await agentTrustBoundaryExtension.queryAgentTrustBoundaries(request);

      console.log(`Trust boundary query completed for agent ${request.requesting_agent_id}: ${response.total_results} results`);
      return response;
    } catch (error) {
      console.error('Trust boundary query failed:', error);
      throw error;
    }
  }

  /**
   * Discover collaboration partners for an agent
   */
  async discoverCollaborationPartners(request: CollaborationDiscoveryRequest & { session_token: string }): Promise<CollaborationRecommendation[]> {
    try {
      // Validate session token
      const session = await this.validateSessionToken(request.session_token);
      if (!session) {
        throw new Error('Invalid or expired session token');
      }

      console.log(`Discovering collaboration partners for agent ${request.requesting_agent_id}`);

      // Convert to trust boundary query
      const trustQuery: AgentTrustQuery = {
        requesting_agent_id: request.requesting_agent_id,
        query_type: 'collaboration_discovery',
        filters: {
          min_trust_level: request.requirements.min_trust_level,
          collaboration_types: [request.collaboration_type]
        },
        limit: 20,
        include_history: true,
        include_predictions: true
      };

      // Get trust boundaries
      const queryResponse = await agentTrustBoundaryExtension.queryAgentTrustBoundaries(trustQuery);

      // Convert to collaboration recommendations
      const recommendations: CollaborationRecommendation[] = [];
      
      for (const boundary of queryResponse.boundaries) {
        const recommendation = await this.createCollaborationRecommendation(boundary, request);
        recommendations.push(recommendation);
      }

      // Sort by collaboration potential
      recommendations.sort((a, b) => b.collaboration_potential - a.collaboration_potential);

      console.log(`Found ${recommendations.length} collaboration recommendations`);
      return recommendations;
    } catch (error) {
      console.error('Collaboration discovery failed:', error);
      throw error;
    }
  }

  private async createCollaborationRecommendation(
    boundary: AgentTrustBoundary,
    request: CollaborationDiscoveryRequest
  ): Promise<CollaborationRecommendation> {
    // Calculate collaboration potential based on trust score and requirements
    const trustScore = boundary.trust_level / 100;
    const meetsMinimum = trustScore >= request.requirements.min_trust_level;
    const collaborationPotential = meetsMinimum ? 
      (trustScore * 0.7 + boundary.confidence_level * 0.3) : 0;

    // Determine recommended interaction types
    const recommendedTypes: string[] = [];
    if (boundary.collaboration_permissions.data_sharing) {
      recommendedTypes.push('data_sharing');
    }
    if (boundary.collaboration_permissions.task_delegation) {
      recommendedTypes.push('task_delegation');
    }
    if (boundary.collaboration_permissions.decision_making) {
      recommendedTypes.push('decision_making');
    }

    return {
      agent_id: boundary.target_agent_id,
      agent_name: boundary.target_name,
      trust_score: trustScore,
      confidence_level: boundary.confidence_level,
      collaboration_potential: collaborationPotential,
      recommended_interaction_types: recommendedTypes,
      risk_assessment: boundary.risk_assessment,
      policy_requirements: boundary.policy_requirements.map(policy => ({
        policy_type: policy.policy_type,
        compliance_required: policy.compliance_required,
        description: `${policy.policy_type} policy compliance required`
      })),
      estimated_response_time: 1000, // Default 1 second
      availability_status: boundary.status === 'active' ? 'available' : 'offline'
    };
  }

  /**
   * Verify trust relationship with another agent
   */
  async verifyTrustRelationship(request: TrustVerificationRequest): Promise<TrustVerificationResponse> {
    try {
      // Validate session token
      const session = await this.validateSessionToken(request.session_token);
      if (!session) {
        throw new Error('Invalid or expired session token');
      }

      console.log(`Verifying trust relationship: ${request.requesting_agent_id} -> ${request.target_agent_id}`);

      // Get current trust score
      const trustScore = await trustBackendService.getAgentPairTrustScore(
        request.requesting_agent_id,
        request.target_agent_id
      );

      // Get target agent profile for identity verification
      const targetProfile = await agentBackendService.getAgentProfile(request.target_agent_id);

      const verificationDetails: any = {};

      if (request.verification_type === 'identity' || request.verification_type === 'full') {
        verificationDetails.identity_verified = !!targetProfile;
        verificationDetails.governance_compliance = targetProfile?.governance_identity?.compliance_level === 'compliant';
      }

      if (request.verification_type === 'trust_score' || request.verification_type === 'full') {
        verificationDetails.trust_score_current = trustScore;
        verificationDetails.trust_score_verified_at = new Date().toISOString();
      }

      if (request.verification_type === 'compliance' || request.verification_type === 'full') {
        verificationDetails.policy_compliance = [
          {
            policy_type: 'governance',
            compliant: targetProfile?.governance_identity?.compliance_level === 'compliant',
            last_checked: new Date().toISOString()
          }
        ];
      }

      const verified = trustScore !== null && trustScore > 0.5 && !!targetProfile;

      return {
        verification_id: this.generateVerificationId(),
        target_agent_id: request.target_agent_id,
        verification_type: request.verification_type,
        verified,
        verification_details: verificationDetails,
        verification_timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      };
    } catch (error) {
      console.error('Trust verification failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to trust boundary updates
   */
  async subscribeToTrustUpdates(
    agentId: string,
    subscriptionType: 'trust_changes' | 'collaboration_opportunities' | 'risk_alerts' | 'all',
    sessionToken: string,
    deliveryMethod: 'webhook' | 'polling' | 'websocket' = 'polling',
    webhookUrl?: string
  ): Promise<TrustBoundarySubscription> {
    try {
      // Validate session token
      const session = await this.validateSessionToken(sessionToken);
      if (!session || session.agent_id !== agentId) {
        throw new Error('Invalid session token or agent ID mismatch');
      }

      const subscriptionId = this.generateSubscriptionId(agentId);
      
      const subscription: TrustBoundarySubscription = {
        subscription_id: subscriptionId,
        agent_id: agentId,
        subscription_type: subscriptionType,
        delivery_method: deliveryMethod,
        webhook_url: webhookUrl,
        created_at: new Date().toISOString(),
        status: 'active'
      };

      this.subscriptions.set(subscriptionId, subscription);

      // Register with extension for real-time updates
      await agentTrustBoundaryExtension.subscribeToTrustUpdates(agentId, (alert: TrustBoundaryAlert) => {
        this.handleTrustAlert(subscriptionId, alert);
      });

      console.log(`Agent ${agentId} subscribed to trust updates: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      console.error('Trust subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from trust boundary updates
   */
  async unsubscribeFromTrustUpdates(subscriptionId: string, sessionToken: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Validate session token
      const session = await this.validateSessionToken(sessionToken);
      if (!session || session.agent_id !== subscription.agent_id) {
        throw new Error('Invalid session token or unauthorized access');
      }

      // Remove subscription
      this.subscriptions.delete(subscriptionId);
      await agentTrustBoundaryExtension.unsubscribeFromTrustUpdates(subscriptionId);

      console.log(`Unsubscribed from trust updates: ${subscriptionId}`);
    } catch (error) {
      console.error('Trust unsubscription failed:', error);
      throw error;
    }
  }

  /**
   * Get agent's trust boundary configuration
   */
  async getAgentTrustConfiguration(agentId: string, sessionToken: string): Promise<any> {
    try {
      // Validate session token
      const session = await this.validateSessionToken(sessionToken);
      if (!session || session.agent_id !== agentId) {
        throw new Error('Invalid session token or agent ID mismatch');
      }

      const configuration = await agentTrustBoundaryExtension.getAgentTrustConfiguration(agentId);
      console.log(`Retrieved trust configuration for agent ${agentId}`);
      return configuration;
    } catch (error) {
      console.error('Failed to get trust configuration:', error);
      throw error;
    }
  }

  /**
   * Update agent's trust boundary configuration
   */
  async updateAgentTrustConfiguration(agentId: string, updates: any, sessionToken: string): Promise<void> {
    try {
      // Validate session token
      const session = await this.validateSessionToken(sessionToken);
      if (!session || session.agent_id !== agentId) {
        throw new Error('Invalid session token or agent ID mismatch');
      }

      await agentTrustBoundaryExtension.updateTrustConfiguration(agentId, updates);
      console.log(`Updated trust configuration for agent ${agentId}`);
    } catch (error) {
      console.error('Failed to update trust configuration:', error);
      throw error;
    }
  }

  private async validateSessionToken(sessionToken: string): Promise<any> {
    const session = this.sessionTokens.get(sessionToken);
    if (!session) {
      return null;
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (now > expiresAt) {
      this.sessionTokens.delete(sessionToken);
      return null;
    }

    return session;
  }

  private generateSessionToken(agentId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `agent_session_${agentId}_${timestamp}_${random}`;
  }

  private generateVerificationId(): string {
    return `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(agentId: string): string {
    return `sub_${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleTrustAlert(subscriptionId: string, alert: TrustBoundaryAlert): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || subscription.status !== 'active') {
      return;
    }

    console.log(`Handling trust alert for subscription ${subscriptionId}:`, alert.alert_type);

    // Handle different delivery methods
    switch (subscription.delivery_method) {
      case 'webhook':
        if (subscription.webhook_url) {
          await this.deliverWebhookAlert(subscription.webhook_url, alert);
        }
        break;
      case 'websocket':
        // WebSocket delivery would be implemented here
        console.log('WebSocket delivery not yet implemented');
        break;
      case 'polling':
        // Store alert for polling retrieval
        this.storeAlertForPolling(subscriptionId, alert);
        break;
    }
  }

  private async deliverWebhookAlert(webhookUrl: string, alert: TrustBoundaryAlert): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Promethios-Alert-Type': alert.alert_type,
          'X-Promethios-Alert-Severity': alert.severity
        },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        console.error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook delivery error:', error);
    }
  }

  private storeAlertForPolling(subscriptionId: string, alert: TrustBoundaryAlert): void {
    // In a real implementation, this would store alerts in a database or cache
    console.log(`Stored alert for polling: ${subscriptionId}`, alert.alert_type);
  }

  /**
   * Get pending alerts for polling-based subscriptions
   */
  async getPendingAlerts(subscriptionId: string, sessionToken: string): Promise<TrustBoundaryAlert[]> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Validate session token
      const session = await this.validateSessionToken(sessionToken);
      if (!session || session.agent_id !== subscription.agent_id) {
        throw new Error('Invalid session token or unauthorized access');
      }

      // In a real implementation, this would retrieve stored alerts
      console.log(`Retrieved pending alerts for subscription ${subscriptionId}`);
      return [];
    } catch (error) {
      console.error('Failed to get pending alerts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const agentTrustBoundaryApiService = new AgentTrustBoundaryApiService();

