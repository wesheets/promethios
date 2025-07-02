/**
 * Veritas Enterprise Extension
 * 
 * Advanced enterprise features for Veritas 2.0 including:
 * - User-scoped verification history and analytics
 * - Enterprise governance integration
 * - Advanced ML-powered hallucination detection
 * - Real-time collaboration and sharing
 * - Compliance reporting and audit trails
 * - Integration with Promethios authentication system
 */

import { Extension } from '../../extensions/Extension';
import { authApiService } from '../../services/authApiService';
import type { User } from 'firebase/auth';
import { verify, VerificationResult, VeritasOptions } from '../core/index';

export interface EnterpriseVerificationSession {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  verifications: VerificationResult[];
  collaborators: string[];
  tags: string[];
  status: 'active' | 'archived' | 'shared';
  complianceLevel: 'basic' | 'enhanced' | 'enterprise';
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: 'create' | 'verify' | 'share' | 'export' | 'delete';
  timestamp: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface VeritasAnalytics {
  totalVerifications: number;
  hallucinationDetectionRate: number;
  averageAccuracyScore: number;
  averageConfidenceScore: number;
  topSources: Array<{ source: string; count: number; reliability: number }>;
  verificationTrends: Array<{ date: string; count: number; accuracy: number }>;
  complianceMetrics: {
    auditTrailCompleteness: number;
    dataRetentionCompliance: number;
    accessControlCompliance: number;
  };
}

export interface CollaborationRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  sessionId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  permissions: ('read' | 'verify' | 'comment' | 'admin')[];
}

export interface VeritasNotification {
  id: string;
  userId: string;
  type: 'hallucination_detected' | 'collaboration_request' | 'compliance_alert' | 'system_update';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

class VeritasEnterpriseExtension extends Extension {
  private baseUrl: string;
  private wsConnection: WebSocket | null = null;
  private notificationCallbacks: Map<string, (notification: VeritasNotification) => void> = new Map();

  constructor() {
    super('veritas-enterprise');
    this.baseUrl = 'http://localhost:8000/api/veritas-enterprise';
  }

  async initialize(config?: any, user?: User | null): Promise<boolean> {
    try {
      // Initialize WebSocket connection for real-time collaboration
      await this.initializeWebSocket(user);
      
      // Verify backend connectivity
      if (user) {
        const healthCheck = await authApiService.authenticatedFetch(`${this.baseUrl}/health`, {
          method: 'GET',
          user: user
        });
        if (!healthCheck.ok) {
          throw new Error('Veritas Enterprise backend not available');
        }
      }

      console.log('Veritas Enterprise extension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Veritas Enterprise extension:', error);
      return false;
    }
  }

  private async initializeWebSocket(user?: User | null): Promise<void> {
    if (!user) return;

    try {
      const wsUrl = `ws://localhost:8000/ws/veritas/${user.uid}`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('Veritas Enterprise WebSocket connected');
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('Veritas Enterprise WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(user), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('Veritas Enterprise WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'notification':
        this.handleNotification(data.payload);
        break;
      case 'collaboration_update':
        this.handleCollaborationUpdate(data.payload);
        break;
      case 'verification_update':
        this.handleVerificationUpdate(data.payload);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  private handleNotification(notification: VeritasNotification): void {
    // Trigger notification callbacks
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  private handleCollaborationUpdate(update: any): void {
    // Handle real-time collaboration updates
    console.log('Collaboration update received:', update);
  }

  private handleVerificationUpdate(update: any): void {
    // Handle real-time verification updates
    console.log('Verification update received:', update);
  }

  // Session Management
  async createVerificationSession(
    user: User,
    title: string,
    description?: string,
    complianceLevel: 'basic' | 'enhanced' | 'enterprise' = 'basic'
  ): Promise<EnterpriseVerificationSession> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        complianceLevel
      }),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to create verification session');
    }

    return response.json();
  }

  async getUserSessions(user: User, filters?: {
    status?: string;
    complianceLevel?: string;
    dateRange?: { start: string; end: string };
  }): Promise<EnterpriseVerificationSession[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      });
    }

    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/sessions?${params}`, {
      method: 'GET',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user sessions');
    }

    return response.json();
  }

  async getSession(user: User, sessionId: string): Promise<EnterpriseVerificationSession> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'GET',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }

    return response.json();
  }

  async updateSession(
    user: User,
    sessionId: string,
    updates: Partial<EnterpriseVerificationSession>
  ): Promise<EnterpriseVerificationSession> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to update session');
    }

    return response.json();
  }

  async deleteSession(user: User, sessionId: string): Promise<void> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }
  }

  // Enhanced Verification with Enterprise Features
  async verifyWithEnterprise(
    user: User,
    sessionId: string,
    text: string,
    options: VeritasOptions & {
      saveToSession?: boolean;
      notifyCollaborators?: boolean;
      complianceCheck?: boolean;
    } = {}
  ): Promise<VerificationResult & { auditId: string }> {
    // Perform core verification
    const verificationResult = await verify(text, options);

    // Save to backend with enterprise features
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/sessions/${sessionId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        verificationResult,
        options,
        saveToSession: options.saveToSession !== false,
        notifyCollaborators: options.notifyCollaborators || false,
        complianceCheck: options.complianceCheck || false
      }),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to save verification result');
    }

    const { auditId } = await response.json();

    return {
      ...verificationResult,
      auditId
    };
  }

  // Analytics and Reporting
  async getUserAnalytics(
    user: User,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<VeritasAnalytics> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/analytics?timeRange=${timeRange}`, {
      method: 'GET',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  }

  async generateComplianceReport(
    user: User,
    sessionIds: string[],
    format: 'pdf' | 'excel' | 'json' = 'pdf'
  ): Promise<Blob> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/compliance/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionIds,
        format
      }),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to generate compliance report');
    }

    return response.blob();
  }

  // Collaboration Features
  async inviteCollaborator(
    user: User,
    sessionId: string,
    collaboratorEmail: string,
    permissions: ('read' | 'verify' | 'comment' | 'admin')[],
    message?: string
  ): Promise<CollaborationRequest> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/sessions/${sessionId}/collaborate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collaboratorEmail,
        permissions,
        message
      }),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to invite collaborator');
    }

    return response.json();
  }

  async getCollaborationRequests(user: User): Promise<CollaborationRequest[]> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/collaboration/requests`, {
      method: 'GET',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to fetch collaboration requests');
    }

    return response.json();
  }

  async respondToCollaborationRequest(
    user: User,
    requestId: string,
    response: 'accept' | 'decline'
  ): Promise<void> {
    const apiResponse = await authApiService.authenticatedFetch(`${this.baseUrl}/collaboration/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
      user: user
    });

    if (!apiResponse.ok) {
      throw new Error('Failed to respond to collaboration request');
    }
  }

  // Notification Management
  async getNotifications(user: User, unreadOnly: boolean = false): Promise<VeritasNotification[]> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/notifications${params}`, {
      method: 'GET',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }

  async markNotificationRead(user: User, notificationId: string): Promise<void> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  onNotification(callback: (notification: VeritasNotification) => void): () => void {
    const id = Math.random().toString(36).substr(2, 9);
    this.notificationCallbacks.set(id, callback);

    // Return unsubscribe function
    return () => {
      this.notificationCallbacks.delete(id);
    };
  }

  // Governance Configuration Features
  async updateGovernanceSettings(
    user: User,
    settings: {
      complianceLevel: 'basic' | 'enhanced' | 'enterprise';
      riskTolerance: 'low' | 'medium' | 'high';
      policyFramework: string;
      auditRequirements: string[];
      verificationThresholds: {
        truthProbability: number;
        confidenceLevel: number;
        hallucination: number;
      };
    }
  ): Promise<{ success: boolean }> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/governance/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to update governance settings');
    }

    return response.json();
  }

  async getGovernanceSettings(user: User): Promise<{
    complianceLevel: string;
    riskTolerance: string;
    policyFramework: string;
    auditRequirements: string[];
    verificationThresholds: {
      truthProbability: number;
      confidenceLevel: number;
      hallucination: number;
    };
  }> {
    const response = await authApiService.authenticatedFetch(`${this.baseUrl}/governance/settings`, {
      method: 'GET',
      user: user
    });

    if (!response.ok) {
      throw new Error('Failed to fetch governance settings');
    }

    return response.json();
  }

  // Cleanup
  cleanup(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.notificationCallbacks.clear();
  }
}

// Export singleton instance
export const veritasEnterpriseExtension = new VeritasEnterpriseExtension();

