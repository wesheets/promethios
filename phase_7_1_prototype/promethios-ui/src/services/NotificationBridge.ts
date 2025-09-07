/**
 * NotificationBridge - Integration with unified notification system
 * 
 * Bridges chat events with the notification system to provide
 * context-aware, intelligent notifications for chat participants.
 */

import { User } from 'firebase/auth';

export type NotificationEvent = 
  | 'messageDelivered'
  | 'participantJoined'
  | 'participantLeft'
  | 'typingStatusChanged'
  | 'presenceChanged'
  | 'sessionModeChanged'
  | 'sharedParticipantNotification';

export interface NotificationContext {
  sessionId: string;
  sessionName?: string;
  sessionMode: 'regular' | 'shared';
  participantCount: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'message' | 'participant' | 'system' | 'typing';
}

export interface NotificationPayload {
  event: NotificationEvent;
  context: NotificationContext;
  data: any;
  timestamp: Date;
  recipients: string[];
  sender?: {
    userId: string;
    name: string;
    avatar?: string;
  };
}

export interface NotificationPreferences {
  userId: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableInAppNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
  sessionPreferences: {
    [sessionId: string]: {
      muted: boolean;
      priority: 'all' | 'mentions' | 'none';
    };
  };
}

export class NotificationBridge {
  private user: User | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private notificationQueue: NotificationPayload[] = [];
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: Date }> = new Map();

  // Rate limiting configuration
  private readonly RATE_LIMITS = {
    typing: { maxPerMinute: 10, windowMs: 60000 },
    message: { maxPerMinute: 30, windowMs: 60000 },
    participant: { maxPerMinute: 20, windowMs: 60000 }
  };

  constructor() {
    console.log('🔔 [NotificationBridge] Initialized');
  }

  /**
   * Initialize with user context
   */
  public async initialize(user: User): Promise<void> {
    this.user = user;
    
    // Load user notification preferences
    await this.loadUserPreferences(user.uid);
    
    console.log('🔔 [NotificationBridge] Initialized for user:', user.uid);
  }

  /**
   * Handle chat event and create appropriate notifications
   */
  public async handleEvent(event: NotificationEvent, data: any): Promise<void> {
    if (!this.user) return;

    console.log('🔔 [NotificationBridge] Handling event:', event, data);

    // Create notification payload based on event type
    const payload = await this.createNotificationPayload(event, data);
    
    if (!payload) return;

    // Apply rate limiting
    if (this.isRateLimited(payload)) {
      console.log('⏱️ [NotificationBridge] Rate limited notification:', event);
      return;
    }

    // Filter recipients based on preferences
    const filteredPayload = await this.applyUserPreferences(payload);
    
    if (filteredPayload.recipients.length === 0) {
      console.log('🔇 [NotificationBridge] No recipients after preference filtering');
      return;
    }

    // Send notification
    await this.sendNotification(filteredPayload);
  }

  /**
   * Create notification payload from chat event
   */
  private async createNotificationPayload(
    event: NotificationEvent, 
    data: any
  ): Promise<NotificationPayload | null> {
    const timestamp = new Date();

    switch (event) {
      case 'messageDelivered':
        return {
          event,
          context: {
            sessionId: data.message.sessionId,
            sessionMode: data.sessionMode || 'regular',
            participantCount: data.participantCount || 2,
            priority: this.determineMessagePriority(data.message),
            category: 'message'
          },
          data: {
            messageId: data.message.id,
            content: data.message.content,
            senderId: data.message.senderId,
            senderName: data.message.senderName,
            target: data.message.target
          },
          timestamp,
          recipients: data.deliveredTo || [],
          sender: {
            userId: data.message.senderId,
            name: data.message.senderName
          }
        };

      case 'participantJoined':
        return {
          event,
          context: {
            sessionId: data.sessionId,
            sessionMode: 'shared', // Only shared mode has participant joins
            participantCount: data.participantCount || 3,
            priority: 'normal',
            category: 'participant'
          },
          data: {
            participantId: data.participant.userId,
            participantName: data.participant.name,
            role: data.participant.role
          },
          timestamp,
          recipients: await this.getSessionParticipants(data.sessionId, data.participant.userId)
        };

      case 'participantLeft':
        return {
          event,
          context: {
            sessionId: data.sessionId,
            sessionMode: 'shared',
            participantCount: data.participantCount || 2,
            priority: 'low',
            category: 'participant'
          },
          data: {
            participantId: data.participant.userId,
            participantName: data.participant.name,
            role: data.participant.role
          },
          timestamp,
          recipients: await this.getSessionParticipants(data.sessionId, data.participant.userId)
        };

      case 'typingStatusChanged':
        // Only notify if user started typing (not stopped)
        if (!data.isTyping) return null;

        return {
          event,
          context: {
            sessionId: data.sessionId,
            sessionMode: data.sessionMode || 'regular',
            participantCount: data.participantCount || 2,
            priority: 'low',
            category: 'typing'
          },
          data: {
            userId: data.userId,
            userName: data.userName,
            isTyping: data.isTyping
          },
          timestamp,
          recipients: await this.getSessionParticipants(data.sessionId, data.userId)
        };

      case 'sessionModeChanged':
        return {
          event,
          context: {
            sessionId: data.sessionId,
            sessionMode: data.newMode,
            participantCount: data.participantCount || 2,
            priority: 'normal',
            category: 'system'
          },
          data: {
            oldMode: data.oldMode,
            newMode: data.newMode
          },
          timestamp,
          recipients: await this.getSessionParticipants(data.sessionId)
        };

      default:
        console.warn('🔔 [NotificationBridge] Unknown event type:', event);
        return null;
    }
  }

  /**
   * Determine message priority based on content and context
   */
  private determineMessagePriority(message: any): 'low' | 'normal' | 'high' | 'urgent' {
    // Check for urgent keywords
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'critical', 'important'];
    const content = message.content.toLowerCase();
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return 'urgent';
    }

    // Check for mentions
    if (content.includes('@')) {
      return 'high';
    }

    // Check for questions
    if (content.includes('?')) {
      return 'high';
    }

    // Default priority
    return 'normal';
  }

  /**
   * Apply user preferences to filter notifications
   */
  private async applyUserPreferences(payload: NotificationPayload): Promise<NotificationPayload> {
    const filteredRecipients: string[] = [];

    for (const recipientId of payload.recipients) {
      const preferences = this.userPreferences.get(recipientId);
      
      if (!preferences) {
        // No preferences found, include recipient
        filteredRecipients.push(recipientId);
        continue;
      }

      // Check if notifications are enabled
      if (!preferences.enableInAppNotifications && payload.context.category !== 'urgent') {
        continue;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Only allow urgent notifications during quiet hours
        if (payload.context.priority !== 'urgent') {
          continue;
        }
      }

      // Check session-specific preferences
      const sessionPref = preferences.sessionPreferences[payload.context.sessionId];
      if (sessionPref) {
        if (sessionPref.muted) {
          continue;
        }
        
        if (sessionPref.priority === 'mentions' && !this.isMentioned(recipientId, payload)) {
          continue;
        }
        
        if (sessionPref.priority === 'none') {
          continue;
        }
      }

      filteredRecipients.push(recipientId);
    }

    return {
      ...payload,
      recipients: filteredRecipients
    };
  }

  /**
   * Check if user is in quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = preferences.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Check if user is mentioned in the notification
   */
  private isMentioned(userId: string, payload: NotificationPayload): boolean {
    if (payload.event !== 'messageDelivered') return false;
    
    const content = payload.data.content.toLowerCase();
    return content.includes(`@${userId}`) || content.includes('@all') || content.includes('@everyone');
  }

  /**
   * Check if notification is rate limited
   */
  private isRateLimited(payload: NotificationPayload): boolean {
    const category = payload.context.category;
    const limit = this.RATE_LIMITS[category as keyof typeof this.RATE_LIMITS];
    
    if (!limit) return false;

    const key = `${payload.context.sessionId}_${category}`;
    const now = new Date();
    
    let rateLimiter = this.rateLimiters.get(key);
    
    if (!rateLimiter || now > rateLimiter.resetTime) {
      // Reset or create new rate limiter
      rateLimiter = {
        count: 1,
        resetTime: new Date(now.getTime() + limit.windowMs)
      };
      this.rateLimiters.set(key, rateLimiter);
      return false;
    }

    if (rateLimiter.count >= limit.maxPerMinute) {
      return true; // Rate limited
    }

    rateLimiter.count++;
    return false;
  }

  /**
   * Send notification through appropriate channels
   */
  private async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Queue notification for processing
      this.notificationQueue.push(payload);
      
      // Process notification based on type and preferences
      await this.processNotification(payload);
      
      console.log('✅ [NotificationBridge] Notification sent:', payload.event, 
        `to ${payload.recipients.length} recipients`);
      
      // Emit notification sent event
      this.emit('notificationSent', payload);
      
    } catch (error) {
      console.error('❌ [NotificationBridge] Failed to send notification:', error);
      
      // Emit notification failed event
      this.emit('notificationFailed', { payload, error });
    }
  }

  /**
   * Process notification through different channels
   */
  private async processNotification(payload: NotificationPayload): Promise<void> {
    // This would integrate with the actual notification service
    // For now, we'll emit events that the UI can listen to
    
    switch (payload.context.category) {
      case 'message':
        this.emit('messageNotification', payload);
        break;
        
      case 'participant':
        this.emit('participantNotification', payload);
        break;
        
      case 'typing':
        this.emit('typingNotification', payload);
        break;
        
      case 'system':
        this.emit('systemNotification', payload);
        break;
    }
  }

  /**
   * Get session participants (excluding specified user)
   */
  private async getSessionParticipants(sessionId: string, excludeUserId?: string): Promise<string[]> {
    // This would integrate with ParticipantManager
    // For now, return mock data
    const mockParticipants = ['user1', 'user2', 'user3'];
    
    return mockParticipants.filter(userId => userId !== excludeUserId);
  }

  /**
   * Load user notification preferences
   */
  private async loadUserPreferences(userId: string): Promise<void> {
    try {
      // This would load from Firebase or other persistence layer
      // For now, use default preferences
      const defaultPreferences: NotificationPreferences = {
        userId,
        enablePushNotifications: true,
        enableEmailNotifications: true,
        enableInAppNotifications: true,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        },
        sessionPreferences: {}
      };
      
      this.userPreferences.set(userId, defaultPreferences);
      
      console.log('🔔 [NotificationBridge] Loaded preferences for user:', userId);
    } catch (error) {
      console.error('❌ [NotificationBridge] Failed to load user preferences:', error);
    }
  }

  /**
   * Update user notification preferences
   */
  public async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const current = this.userPreferences.get(userId);
    if (!current) return;

    const updated = { ...current, ...preferences };
    this.userPreferences.set(userId, updated);
    
    // This would persist to Firebase or other storage
    console.log('🔔 [NotificationBridge] Updated preferences for user:', userId);
    
    this.emit('preferencesUpdated', { userId, preferences: updated });
  }

  /**
   * Mute session for user
   */
  public async muteSession(userId: string, sessionId: string): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return;

    preferences.sessionPreferences[sessionId] = {
      muted: true,
      priority: 'none'
    };

    await this.updateUserPreferences(userId, preferences);
    
    console.log('🔇 [NotificationBridge] Muted session:', sessionId, 'for user:', userId);
  }

  /**
   * Unmute session for user
   */
  public async unmuteSession(userId: string, sessionId: string): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return;

    preferences.sessionPreferences[sessionId] = {
      muted: false,
      priority: 'all'
    };

    await this.updateUserPreferences(userId, preferences);
    
    console.log('🔊 [NotificationBridge] Unmuted session:', sessionId, 'for user:', userId);
  }

  /**
   * Event system
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ [NotificationBridge] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [NotificationBridge] Cleaning up');
    
    this.eventListeners.clear();
    this.notificationQueue = [];
    this.userPreferences.clear();
    this.rateLimiters.clear();
    this.user = null;
  }
}

export default NotificationBridge;

