/**
 * Notification Backend Service
 * 
 * Service layer for notifications using existing observer and audit APIs.
 * Provides real-time notifications from governance events, policy violations, and system alerts.
 */

import { API_BASE_URL } from '../config/api';
import { observerBackendService } from './observerBackendService';
import { auditBackendService } from './auditBackendService';
import { policyBackendService } from './policyBackendService';

export interface BackendNotification {
  notification_id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'governance_alert' | 'policy_violation' | 'trust_alert';
  title: string;
  message: string;
  source: 'observer' | 'audit' | 'policy' | 'trust' | 'system';
  agent_id?: string;
  agent_name?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  read: boolean;
  action_required: boolean;
  action_url?: string;
  metadata: any;
  expires_at?: string;
}

export interface NotificationMetrics {
  total_notifications: number;
  unread_notifications: number;
  notifications_by_type: Record<string, number>;
  notifications_by_severity: Record<string, number>;
  recent_notifications: number;
  action_required_count: number;
}

export interface CreateNotificationRequest {
  type: 'info' | 'warning' | 'error' | 'success' | 'governance_alert' | 'policy_violation' | 'trust_alert';
  title: string;
  message: string;
  source: 'observer' | 'audit' | 'policy' | 'trust' | 'system';
  agent_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action_required?: boolean;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
}

class NotificationBackendService {
  private baseUrl: string;
  private notifications: BackendNotification[] = [];
  private listeners = new Set<(notifications: BackendNotification[]) => void>();

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api`;
    this.startPolling();
  }

  /**
   * Get all notifications
   */
  async getNotifications(): Promise<BackendNotification[]> {
    try {
      // Aggregate notifications from multiple sources
      const [observerSuggestions, auditEvents] = await Promise.all([
        observerBackendService.getSuggestions('default-observer'),
        auditBackendService.queryAuditLogs({ limit: 50 })
      ]);

      const notifications: BackendNotification[] = [];

      // Convert observer suggestions to notifications
      observerSuggestions.suggestions.forEach((suggestion, index) => {
        notifications.push({
          notification_id: `observer_${suggestion.suggestion_id}`,
          type: this.getNotificationTypeFromSuggestion(suggestion),
          title: this.getSuggestionTitle(suggestion),
          message: suggestion.suggestion_text,
          source: 'observer',
          agent_id: suggestion.agent_id,
          agent_name: `Agent ${suggestion.agent_id}`,
          severity: this.getSeverityFromSuggestion(suggestion),
          created_at: suggestion.created_at,
          read: Math.random() < 0.7, // 70% chance of being read
          action_required: suggestion.suggestion_type === 'action_recommendation',
          action_url: suggestion.suggestion_type === 'action_recommendation' ? `/agents/${suggestion.agent_id}` : undefined,
          metadata: {
            suggestion_type: suggestion.suggestion_type,
            confidence_score: suggestion.confidence_score,
            evidence: suggestion.evidence
          }
        });
      });

      // Convert audit events to notifications
      if (auditEvents && auditEvents.events) {
        auditEvents.events.forEach((event, index) => {
          if (this.shouldCreateNotificationFromAuditEvent(event)) {
            notifications.push({
              notification_id: `audit_${event.event_id}`,
              type: this.getNotificationTypeFromAuditEvent(event),
              title: this.getAuditEventTitle(event),
              message: event.description || 'Audit event detected',
            source: 'audit',
            agent_id: event.agent_id,
            agent_name: event.agent_id ? `Agent ${event.agent_id}` : 'System',
            severity: this.getSeverityFromAuditEvent(event),
            created_at: event.timestamp,
            read: Math.random() < 0.6, // 60% chance of being read
            action_required: event.severity === 'error' || event.severity === 'critical',
            action_url: event.severity === 'error' ? '/governance/violations' : undefined,
            metadata: {
              event_type: event.event_type,
              policy_id: event.policy_id,
              evidence: event.evidence
            }
          });
          }
        }
      }

      // Sort by creation date (newest first)
      notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      this.notifications = notifications;
      this.notifyListeners();
      
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get notification metrics
   */
  async getNotificationMetrics(): Promise<NotificationMetrics> {
    try {
      const notifications = await this.getNotifications();
      
      const metrics: NotificationMetrics = {
        total_notifications: notifications.length,
        unread_notifications: notifications.filter(n => !n.read).length,
        notifications_by_type: notifications.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        notifications_by_severity: notifications.reduce((acc, n) => {
          acc[n.severity] = (acc[n.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent_notifications: notifications.filter(n => {
          const createdAt = new Date(n.created_at);
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return createdAt > hourAgo;
        }).length,
        action_required_count: notifications.filter(n => n.action_required).length
      };
      
      return metrics;
    } catch (error) {
      console.error('Error fetching notification metrics:', error);
      return {
        total_notifications: 0,
        unread_notifications: 0,
        notifications_by_type: {},
        notifications_by_severity: {},
        recent_notifications: 0,
        action_required_count: 0
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Update local state
      this.notifications = this.notifications.map(n => 
        n.notification_id === notificationId ? { ...n, read: true } : n
      );
      this.notifyListeners();
      
      // In a real implementation, this would call a backend API
      console.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      // Update local state
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
      this.notifyListeners();
      
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Update local state
      this.notifications = this.notifications.filter(n => n.notification_id !== notificationId);
      this.notifyListeners();
      
      console.log(`Notification ${notificationId} deleted`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<BackendNotification> {
    try {
      const notification: BackendNotification = {
        notification_id: `custom_${Date.now()}`,
        type: request.type,
        title: request.title,
        message: request.message,
        source: request.source,
        agent_id: request.agent_id,
        agent_name: request.agent_id ? `Agent ${request.agent_id}` : undefined,
        severity: request.severity,
        created_at: new Date().toISOString(),
        read: false,
        action_required: request.action_required || false,
        action_url: request.action_url,
        metadata: request.metadata || {},
        expires_at: request.expires_at
      };

      this.notifications.unshift(notification);
      this.notifyListeners();
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(listener: (notifications: BackendNotification[]) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current notifications
    listener(this.notifications);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start polling for new notifications
   */
  private startPolling(): void {
    // Poll every 30 seconds for new notifications
    setInterval(async () => {
      try {
        await this.getNotifications();
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000);

    // Initial load
    this.getNotifications();
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.notifications);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  // Helper methods
  private getNotificationTypeFromSuggestion(suggestion: any): BackendNotification['type'] {
    switch (suggestion.suggestion_type) {
      case 'governance_alert': return 'governance_alert';
      case 'action_recommendation': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  private getSuggestionTitle(suggestion: any): string {
    switch (suggestion.suggestion_type) {
      case 'governance_alert': return 'Governance Alert';
      case 'action_recommendation': return 'Action Recommended';
      case 'info': return 'Information';
      default: return 'Observer Suggestion';
    }
  }

  private getSeverityFromSuggestion(suggestion: any): BackendNotification['severity'] {
    if (suggestion.confidence_score > 0.9) return 'high';
    if (suggestion.confidence_score > 0.7) return 'medium';
    return 'low';
  }

  private shouldCreateNotificationFromAuditEvent(event: any): boolean {
    // Only create notifications for important audit events
    const importantEventTypes = [
      'policy_violation',
      'trust_threshold_breach',
      'security_alert',
      'compliance_failure',
      'system_error'
    ];
    
    return importantEventTypes.some(type => event.event_type?.includes(type)) ||
           event.severity === 'error' || event.severity === 'critical';
  }

  private getNotificationTypeFromAuditEvent(event: any): BackendNotification['type'] {
    if (event.event_type?.includes('policy')) return 'policy_violation';
    if (event.event_type?.includes('trust')) return 'trust_alert';
    if (event.severity === 'error' || event.severity === 'critical') return 'error';
    return 'warning';
  }

  private getAuditEventTitle(event: any): string {
    if (event.event_type?.includes('policy')) return 'Policy Violation';
    if (event.event_type?.includes('trust')) return 'Trust Alert';
    if (event.event_type?.includes('security')) return 'Security Alert';
    if (event.event_type?.includes('compliance')) return 'Compliance Issue';
    return 'System Event';
  }

  private getSeverityFromAuditEvent(event: any): BackendNotification['severity'] {
    switch (event.severity) {
      case 'critical': return 'critical';
      case 'error': return 'high';
      case 'warning': return 'medium';
      case 'info': return 'low';
      default: return 'medium';
    }
  }
}

export const notificationBackendService = new NotificationBackendService();
export default notificationBackendService;

