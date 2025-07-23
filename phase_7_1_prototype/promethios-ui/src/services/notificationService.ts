/**
 * Notification Service
 * 
 * Manages notifications for attestation events, integrating with the existing
 * notification extension to send alerts about attestation activities.
 */

import { TrustAttestation } from './trustAttestationsBackendService';

export interface NotificationEvent {
  id: string;
  type: 'attestation_created' | 'attestation_verified' | 'attestation_expired' | 'attestation_revoked' | 'verification_failed' | 'attestation_expiring';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  agent_id: string;
  agent_name: string;
  attestation_id?: string;
  metadata: Record<string, any>;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'view_attestation' | 'verify_attestation' | 'renew_attestation' | 'dismiss';
  url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  browser_enabled: boolean;
  attestation_created: boolean;
  attestation_verified: boolean;
  attestation_expired: boolean;
  attestation_revoked: boolean;
  attestation_expiring: boolean;
  verification_failed: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'disabled';
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

class NotificationService {
  private baseUrl: string;
  private notifications: NotificationEvent[] = [];
  private preferences: NotificationPreferences;

  constructor() {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';
    this.baseUrl = `${API_BASE_URL}/api/notifications`;
    
    // Default preferences
    this.preferences = {
      email_enabled: true,
      browser_enabled: true,
      attestation_created: true,
      attestation_verified: true,
      attestation_expired: true,
      attestation_revoked: true,
      attestation_expiring: true,
      verification_failed: true,
      digest_frequency: 'daily',
      quiet_hours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  /**
   * Send notification for attestation creation
   */
  async notifyAttestationCreated(attestation: TrustAttestation): Promise<void> {
    if (!this.preferences.attestation_created) return;

    const notification: NotificationEvent = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'attestation_created',
      title: 'New Attestation Created',
      message: `${attestation.attestation_type.charAt(0).toUpperCase() + attestation.attestation_type.slice(1)} attestation created for ${attestation.subject_name}`,
      timestamp: new Date().toISOString(),
      priority: 'medium',
      agent_id: attestation.subject_instance_id,
      agent_name: attestation.subject_name,
      attestation_id: attestation.attestation_id,
      metadata: {
        attestation_type: attestation.attestation_type,
        attester_name: attestation.attester_name,
        confidence_score: attestation.confidence_score,
        trust_impact: attestation.trust_impact
      },
      read: false,
      actions: [
        {
          id: 'view',
          label: 'View Attestation',
          action: 'view_attestation',
          url: `/ui/trust/attestations?attestation=${attestation.attestation_id}`
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss'
        }
      ]
    };

    await this.sendNotification(notification);
  }

  /**
   * Send notification for attestation verification
   */
  async notifyAttestationVerified(attestationId: string, verificationStatus: string, agentName: string): Promise<void> {
    if (!this.preferences.attestation_verified) return;

    const isValid = verificationStatus === 'valid';
    const priority = isValid ? 'low' : 'high';
    
    const notification: NotificationEvent = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'attestation_verified',
      title: `Attestation ${isValid ? 'Verified' : 'Verification Failed'}`,
      message: `Attestation verification ${isValid ? 'completed successfully' : 'failed'} for ${agentName}`,
      timestamp: new Date().toISOString(),
      priority,
      agent_id: attestationId,
      agent_name: agentName,
      attestation_id: attestationId,
      metadata: {
        verification_status: verificationStatus,
        verification_success: isValid
      },
      read: false,
      actions: [
        {
          id: 'view',
          label: 'View Details',
          action: 'view_attestation',
          url: `/ui/trust/attestations?attestation=${attestationId}`
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss'
        }
      ]
    };

    await this.sendNotification(notification);
  }

  /**
   * Send notification for attestation expiration
   */
  async notifyAttestationExpired(attestation: TrustAttestation): Promise<void> {
    if (!this.preferences.attestation_expired) return;

    const notification: NotificationEvent = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'attestation_expired',
      title: 'Attestation Expired',
      message: `${attestation.attestation_type.charAt(0).toUpperCase() + attestation.attestation_type.slice(1)} attestation for ${attestation.subject_name} has expired`,
      timestamp: new Date().toISOString(),
      priority: 'high',
      agent_id: attestation.subject_instance_id,
      agent_name: attestation.subject_name,
      attestation_id: attestation.attestation_id,
      metadata: {
        attestation_type: attestation.attestation_type,
        expired_at: attestation.expires_at,
        trust_impact: attestation.trust_impact
      },
      read: false,
      actions: [
        {
          id: 'renew',
          label: 'Renew Attestation',
          action: 'renew_attestation',
          url: `/ui/trust/attestations/create?renew=${attestation.attestation_id}`
        },
        {
          id: 'view',
          label: 'View Details',
          action: 'view_attestation',
          url: `/ui/trust/attestations?attestation=${attestation.attestation_id}`
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss'
        }
      ]
    };

    await this.sendNotification(notification);
  }

  /**
   * Send notification for attestation expiring soon
   */
  async notifyAttestationExpiring(attestation: TrustAttestation, daysUntilExpiry: number): Promise<void> {
    if (!this.preferences.attestation_expiring) return;

    const notification: NotificationEvent = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'attestation_expiring',
      title: 'Attestation Expiring Soon',
      message: `${attestation.attestation_type.charAt(0).toUpperCase() + attestation.attestation_type.slice(1)} attestation for ${attestation.subject_name} expires in ${daysUntilExpiry} days`,
      timestamp: new Date().toISOString(),
      priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
      agent_id: attestation.subject_instance_id,
      agent_name: attestation.subject_name,
      attestation_id: attestation.attestation_id,
      metadata: {
        attestation_type: attestation.attestation_type,
        expires_at: attestation.expires_at,
        days_until_expiry: daysUntilExpiry,
        trust_impact: attestation.trust_impact
      },
      read: false,
      actions: [
        {
          id: 'renew',
          label: 'Renew Now',
          action: 'renew_attestation',
          url: `/ui/trust/attestations/create?renew=${attestation.attestation_id}`
        },
        {
          id: 'view',
          label: 'View Details',
          action: 'view_attestation',
          url: `/ui/trust/attestations?attestation=${attestation.attestation_id}`
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss'
        }
      ]
    };

    await this.sendNotification(notification);
  }

  /**
   * Send notification for attestation revocation
   */
  async notifyAttestationRevoked(attestation: TrustAttestation, reason: string): Promise<void> {
    if (!this.preferences.attestation_revoked) return;

    const notification: NotificationEvent = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'attestation_revoked',
      title: 'Attestation Revoked',
      message: `${attestation.attestation_type.charAt(0).toUpperCase() + attestation.attestation_type.slice(1)} attestation for ${attestation.subject_name} has been revoked`,
      timestamp: new Date().toISOString(),
      priority: 'urgent',
      agent_id: attestation.subject_instance_id,
      agent_name: attestation.subject_name,
      attestation_id: attestation.attestation_id,
      metadata: {
        attestation_type: attestation.attestation_type,
        revocation_reason: reason,
        trust_impact: attestation.trust_impact
      },
      read: false,
      actions: [
        {
          id: 'view',
          label: 'View Details',
          action: 'view_attestation',
          url: `/ui/trust/attestations?attestation=${attestation.attestation_id}`
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss'
        }
      ]
    };

    await this.sendNotification(notification);
  }

  /**
   * Send notification for verification failure
   */
  async notifyVerificationFailed(attestationId: string, agentId: string, agentName: string, error: string): Promise<void> {
    if (!this.preferences.verification_failed) return;

    const notification: NotificationEvent = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'verification_failed',
      title: 'Verification Failed',
      message: `Failed to verify attestation for ${agentName}: ${error}`,
      timestamp: new Date().toISOString(),
      priority: 'high',
      agent_id: agentId,
      agent_name: agentName,
      attestation_id: attestationId,
      metadata: {
        error_message: error,
        failure_type: 'verification_error'
      },
      read: false,
      actions: [
        {
          id: 'retry',
          label: 'Retry Verification',
          action: 'verify_attestation',
          metadata: { attestation_id: attestationId }
        },
        {
          id: 'view',
          label: 'View Details',
          action: 'view_attestation',
          url: `/ui/trust/attestations?attestation=${attestationId}`
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          action: 'dismiss'
        }
      ]
    };

    await this.sendNotification(notification);
  }

  /**
   * Send notification to backend and local storage
   */
  private async sendNotification(notification: NotificationEvent): Promise<void> {
    try {
      // Store locally
      this.notifications.unshift(notification);
      
      // Keep only last 500 notifications in memory
      if (this.notifications.length > 500) {
        this.notifications = this.notifications.slice(0, 500);
      }

      // Check quiet hours
      if (this.isQuietHours()) {
        console.log('Notification queued due to quiet hours:', notification.title);
        return;
      }

      // Send to backend notification service
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification,
          preferences: this.preferences
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send notification to backend:', response.status, response.statusText);
      } else {
        console.log('Notification sent successfully:', notification.title);
      }

      // Send browser notification if enabled
      if (this.preferences.browser_enabled && 'Notification' in window) {
        await this.sendBrowserNotification(notification);
      }

    } catch (error) {
      console.error('Error sending notification:', error);
      // Notification is still stored locally for fallback
    }
  }

  /**
   * Send browser notification
   */
  private async sendBrowserNotification(notification: NotificationEvent): Promise<void> {
    try {
      if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.attestation_id || notification.id,
          requireInteraction: notification.priority === 'urgent'
        });

        browserNotification.onclick = () => {
          if (notification.actions && notification.actions[0]?.url) {
            window.open(notification.actions[0].url, '_blank');
          }
          browserNotification.close();
        };

        // Auto-close after 5 seconds for non-urgent notifications
        if (notification.priority !== 'urgent') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.sendBrowserNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error sending browser notification:', error);
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.preferences.quiet_hours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quiet_hours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quiet_hours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Get all notifications
   */
  async getNotifications(limit: number = 50): Promise<NotificationEvent[]> {
    try {
      const response = await fetch(`${this.baseUrl}?limit=${limit}`);
      
      if (!response.ok) {
        // Return local notifications as fallback
        return this.notifications.slice(0, limit);
      }
      
      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return this.notifications.slice(0, limit);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/unread-count`);
      
      if (!response.ok) {
        // Return local count as fallback
        return this.notifications.filter(n => !n.read).length;
      }
      
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return this.notifications.filter(n => !n.read).length;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }

      // Update backend
      await fetch(`${this.baseUrl}/${notificationId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      // Update local state
      this.notifications.forEach(n => n.read = true);

      // Update backend
      await fetch(`${this.baseUrl}/mark-all-read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...preferences };

      await fetch(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.preferences),
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Health check for notification service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    backend_api: boolean;
    browser_support: boolean;
    local_notifications: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const backendHealthy = response.ok;
      const browserSupport = 'Notification' in window;
      
      return {
        status: backendHealthy ? 'healthy' : 'degraded',
        backend_api: backendHealthy,
        browser_support: browserSupport,
        local_notifications: this.notifications.length
      };
    } catch (error) {
      console.error('Notification health check failed:', error);
      return {
        status: 'unhealthy',
        backend_api: false,
        browser_support: 'Notification' in window,
        local_notifications: this.notifications.length
      };
    }
  }
}

export const notificationService = new NotificationService();

