/**
 * Observer Integration Service
 * 
 * Integrates the observer agent with the attestations system to monitor
 * attestation activities, violations, and status changes.
 */

import { TrustAttestation } from './TrustAttestationsStorageService';

export interface ObserverEvent {
  event_id: string;
  event_type: 'attestation_created' | 'attestation_verified' | 'attestation_expired' | 'attestation_revoked' | 'verification_failed';
  timestamp: string;
  agent_id: string;
  agent_name: string;
  attestation_id: string;
  attestation_type: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata: Record<string, any>;
}

export interface ObserverMetrics {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
  recent_events: ObserverEvent[];
  agent_activity: Record<string, number>;
  attestation_health: {
    active_attestations: number;
    expiring_soon: number;
    expired: number;
    revoked: number;
  };
}

class ObserverIntegrationService {
  private baseUrl: string;
  private events: ObserverEvent[] = [];

  constructor() {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';
    this.baseUrl = `${API_BASE_URL}/api/observer`;
  }

  /**
   * Notify observer about attestation creation
   */
  async notifyAttestationCreated(attestation: TrustAttestation): Promise<void> {
    const event: ObserverEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'attestation_created',
      timestamp: new Date().toISOString(),
      agent_id: attestation.subject_instance_id,
      agent_name: attestation.subject_name,
      attestation_id: attestation.attestation_id,
      attestation_type: attestation.attestation_type,
      details: {
        attester_id: attestation.attester_instance_id,
        attester_name: attestation.attester_name,
        confidence_score: attestation.confidence_score,
        trust_impact: attestation.trust_impact,
        expires_at: attestation.expires_at
      },
      severity: 'info',
      metadata: {
        source: 'attestation_system',
        category: 'trust_management'
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Notify observer about attestation verification
   */
  async notifyAttestationVerified(attestationId: string, verificationStatus: string, verifierInstanceId: string): Promise<void> {
    const severity = verificationStatus === 'valid' ? 'info' : 'warning';
    
    const event: ObserverEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'attestation_verified',
      timestamp: new Date().toISOString(),
      agent_id: verifierInstanceId,
      agent_name: 'Verifier Agent',
      attestation_id: attestationId,
      attestation_type: 'verification',
      details: {
        verification_status: verificationStatus,
        verifier_instance_id: verifierInstanceId
      },
      severity,
      metadata: {
        source: 'verification_system',
        category: 'trust_validation'
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Notify observer about attestation expiration
   */
  async notifyAttestationExpired(attestation: TrustAttestation): Promise<void> {
    const event: ObserverEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'attestation_expired',
      timestamp: new Date().toISOString(),
      agent_id: attestation.subject_instance_id,
      agent_name: attestation.subject_name,
      attestation_id: attestation.attestation_id,
      attestation_type: attestation.attestation_type,
      details: {
        expired_at: attestation.expires_at,
        confidence_score: attestation.confidence_score,
        trust_impact: attestation.trust_impact
      },
      severity: 'warning',
      metadata: {
        source: 'expiration_monitor',
        category: 'trust_maintenance'
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Notify observer about attestation revocation
   */
  async notifyAttestationRevoked(attestation: TrustAttestation, reason: string): Promise<void> {
    const event: ObserverEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'attestation_revoked',
      timestamp: new Date().toISOString(),
      agent_id: attestation.subject_instance_id,
      agent_name: attestation.subject_name,
      attestation_id: attestation.attestation_id,
      attestation_type: attestation.attestation_type,
      details: {
        revocation_reason: reason,
        confidence_score: attestation.confidence_score,
        trust_impact: attestation.trust_impact
      },
      severity: 'error',
      metadata: {
        source: 'revocation_system',
        category: 'trust_violation'
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Notify observer about verification failure
   */
  async notifyVerificationFailed(attestationId: string, agentId: string, agentName: string, error: string): Promise<void> {
    const event: ObserverEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: 'verification_failed',
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      agent_name: agentName,
      attestation_id: attestationId,
      attestation_type: 'verification_failure',
      details: {
        error_message: error,
        failure_type: 'verification_error'
      },
      severity: 'critical',
      metadata: {
        source: 'verification_system',
        category: 'system_error'
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Send event to observer system
   */
  private async sendEvent(event: ObserverEvent): Promise<void> {
    try {
      // Store event locally for fallback
      this.events.push(event);
      
      // Keep only last 1000 events in memory
      if (this.events.length > 1000) {
        this.events = this.events.slice(-1000);
      }

      // Send to observer API
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.warn('Failed to send event to observer:', response.status, response.statusText);
      } else {
        console.log('Observer event sent successfully:', event.event_type, event.attestation_id);
      }
    } catch (error) {
      console.error('Error sending event to observer:', error);
      // Event is still stored locally for fallback
    }
  }

  /**
   * Get observer metrics
   */
  async getObserverMetrics(): Promise<ObserverMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      
      if (!response.ok) {
        // Return fallback metrics from local events
        return this.getFallbackMetrics();
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching observer metrics:', error);
      return this.getFallbackMetrics();
    }
  }

  /**
   * Get fallback metrics from local events
   */
  private getFallbackMetrics(): ObserverMetrics {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const agentActivity: Record<string, number> = {};

    this.events.forEach(event => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      agentActivity[event.agent_id] = (agentActivity[event.agent_id] || 0) + 1;
    });

    const recentEvents = this.events
      .filter(event => {
        const eventTime = new Date(event.timestamp);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return eventTime > hourAgo;
      })
      .slice(-50);

    return {
      total_events: this.events.length,
      events_by_type: eventsByType,
      events_by_severity: eventsBySeverity,
      recent_events: recentEvents,
      agent_activity: agentActivity,
      attestation_health: {
        active_attestations: 0, // Would be calculated from actual attestations
        expiring_soon: 0,
        expired: 0,
        revoked: 0
      }
    };
  }

  /**
   * Get recent observer events
   */
  async getRecentEvents(limit: number = 50): Promise<ObserverEvent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/events?limit=${limit}`);
      
      if (!response.ok) {
        // Return fallback from local events
        return this.events.slice(-limit);
      }
      
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching recent events:', error);
      return this.events.slice(-limit);
    }
  }

  /**
   * Get events for a specific agent
   */
  async getAgentEvents(agentId: string, limit: number = 50): Promise<ObserverEvent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/events/agent/${agentId}?limit=${limit}`);
      
      if (!response.ok) {
        // Return fallback from local events
        return this.events
          .filter(event => event.agent_id === agentId)
          .slice(-limit);
      }
      
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching agent events:', error);
      return this.events
        .filter(event => event.agent_id === agentId)
        .slice(-limit);
    }
  }

  /**
   * Health check for observer integration
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    observer_api: boolean;
    local_events: number;
    last_event_time?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const observerApiHealthy = response.ok;
      
      const lastEvent = this.events[this.events.length - 1];
      
      return {
        status: observerApiHealthy ? 'healthy' : 'degraded',
        observer_api: observerApiHealthy,
        local_events: this.events.length,
        last_event_time: lastEvent?.timestamp
      };
    } catch (error) {
      console.error('Observer health check failed:', error);
      return {
        status: 'unhealthy',
        observer_api: false,
        local_events: this.events.length,
        last_event_time: this.events[this.events.length - 1]?.timestamp
      };
    }
  }
}

export const observerIntegrationService = new ObserverIntegrationService();

