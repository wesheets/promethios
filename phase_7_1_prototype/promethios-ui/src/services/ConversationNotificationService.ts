/**
 * ConversationNotificationService - Manages conversation invitations and real-time notifications
 * Handles email notifications, in-app notifications, and notification state for shared conversations
 */

import { ConversationInvitationNotification } from '../components/collaboration/InAppNotificationPopup';
import SharedConversationService, { ConversationInvitation } from './SharedConversationService';

export interface EmailNotificationData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;
}

class ConversationNotificationService {
  private static instance: ConversationNotificationService;
  private sharedConversationService: SharedConversationService;
  private activeNotifications: Map<string, ConversationInvitationNotification> = new Map();
  private notificationListeners: Set<(notifications: ConversationInvitationNotification[]) => void> = new Set();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  private constructor() {
    this.sharedConversationService = SharedConversationService.getInstance();
    this.initializeDefaultPreferences();
  }

  public static getInstance(): ConversationNotificationService {
    if (!ConversationNotificationService.instance) {
      ConversationNotificationService.instance = new ConversationNotificationService();
    }
    return ConversationNotificationService.instance;
  }

  /**
   * Initialize default notification preferences
   */
  private initializeDefaultPreferences(): void {
    // Default preferences for all users
    const defaultPrefs: NotificationPreferences = {
      emailNotifications: true,
      inAppNotifications: true,
      pushNotifications: true,
      notificationSound: true
    };
    
    // In real app, this would load from user settings
    this.userPreferences.set('default', defaultPrefs);
  }

  /**
   * Send conversation invitation with notifications
   */
  async sendConversationInvitation(
    conversationId: string,
    fromUserId: string,
    toEmails: string[],
    message?: string,
    includeHistory: boolean = true,
    historyDays?: number
  ): Promise<void> {
    try {
      const invitations: ConversationInvitation[] = [];
      
      // Send invitations through SharedConversationService
      for (const email of toEmails) {
        const invitation = await this.sharedConversationService.sendInvitation(
          conversationId,
          fromUserId,
          email,
          message,
          includeHistory,
          historyDays ? new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000) : undefined
        );
        invitations.push(invitation);
      }

      // Send email notifications
      await this.sendEmailNotifications(invitations);
      
      // Create in-app notifications for existing users
      await this.createInAppNotifications(invitations);
      
      console.log('✅ Sent conversation invitations with notifications:', invitations.length);
    } catch (error) {
      console.error('❌ Failed to send conversation invitations:', error);
      throw error;
    }
  }

  /**
   * Send email notifications for invitations
   */
  private async sendEmailNotifications(invitations: ConversationInvitation[]): Promise<void> {
    for (const invitation of invitations) {
      try {
        const emailData = this.generateInvitationEmail(invitation);
        await this.sendEmail(emailData);
        console.log('📧 Sent email invitation to:', invitation.toEmail);
      } catch (error) {
        console.error('📧 Failed to send email to:', invitation.toEmail, error);
      }
    }
  }

  /**
   * Generate email content for invitation
   */
  private generateInvitationEmail(invitation: ConversationInvitation): EmailNotificationData {
    const conversation = this.sharedConversationService.getUserSharedConversations(invitation.fromUserId)
      .find(conv => conv.id === invitation.conversationId);
    
    const participantCount = conversation?.participants.filter(p => p.type === 'human').length || 0;
    const aiAgentCount = conversation?.participants.filter(p => p.type === 'ai_agent').length || 0;

    const subject = `${invitation.fromUserName} invited you to join "${conversation?.name || 'AI Conversation'}" on Promethios`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .conversation-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .participants { display: flex; gap: 10px; margin: 15px 0; }
          .participant-chip { background: #3b82f6; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; }
          .ai-chip { background: #8b5cf6; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button.decline { background: #ef4444; }
          .message { background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 15px 0; font-style: italic; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 AI Conversation Invitation</h1>
            <p>You've been invited to collaborate with AI agents!</p>
          </div>
          
          <div class="content">
            <h2>Hi there!</h2>
            <p><strong>${invitation.fromUserName}</strong> has invited you to join an AI-powered conversation on Promethios.</p>
            
            <div class="conversation-info">
              <h3>"${conversation?.name || 'AI Conversation'}"</h3>
              <div class="participants">
                <span class="participant-chip">${participantCount} humans</span>
                <span class="participant-chip ai-chip">${aiAgentCount} AI agents</span>
                ${invitation.includeHistory ? '<span class="participant-chip" style="background: #10b981;">Includes history</span>' : ''}
              </div>
            </div>
            
            ${invitation.message ? `
              <div class="message">
                <strong>Personal message:</strong><br>
                "${invitation.message}"
              </div>
            ` : ''}
            
            <p>Join this conversation to collaborate with both humans and AI agents in real-time. Experience the future of human-AI collaboration!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://promethios.ai/accept-invitation/${invitation.id}" class="button">Accept Invitation</a>
              <a href="https://promethios.ai/decline-invitation/${invitation.id}" class="button decline">Decline</a>
            </div>
            
            <p><small>This invitation expires on ${invitation.expiresAt.toLocaleDateString()}. If you don't have a Promethios account, you'll be able to create one when you accept.</small></p>
          </div>
          
          <div class="footer">
            <p>Promethios - The Future of Human-AI Collaboration</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${invitation.fromUserName} invited you to join "${conversation?.name || 'AI Conversation'}" on Promethios

Conversation Details:
- ${participantCount} humans, ${aiAgentCount} AI agents
${invitation.includeHistory ? '- Includes conversation history' : ''}

${invitation.message ? `Personal message: "${invitation.message}"` : ''}

Join this conversation to collaborate with both humans and AI agents in real-time.

Accept: https://promethios.ai/accept-invitation/${invitation.id}
Decline: https://promethios.ai/decline-invitation/${invitation.id}

This invitation expires on ${invitation.expiresAt.toLocaleDateString()}.

Promethios - The Future of Human-AI Collaboration
    `;

    return {
      to: invitation.toEmail,
      subject,
      htmlContent,
      textContent
    };
  }

  /**
   * Send email (mock implementation)
   */
  private async sendEmail(emailData: EmailNotificationData): Promise<void> {
    // Mock email sending - in real app, use SendGrid, AWS SES, etc.
    console.log('📧 [EMAIL] Sending to:', emailData.to);
    console.log('📧 [EMAIL] Subject:', emailData.subject);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation:
    // await emailProvider.send(emailData);
  }

  /**
   * Create in-app notifications for existing users
   */
  private async createInAppNotifications(invitations: ConversationInvitation[]): Promise<void> {
    for (const invitation of invitations) {
      // Check if email belongs to existing user
      const existingUserId = await this.findUserByEmail(invitation.toEmail);
      
      if (existingUserId) {
        const notification = this.createNotificationFromInvitation(invitation);
        this.activeNotifications.set(notification.id, notification);
        this.notifyListeners();
        console.log('🔔 Created in-app notification for user:', existingUserId);
      }
    }
  }

  /**
   * Create notification object from invitation
   */
  private createNotificationFromInvitation(invitation: ConversationInvitation): ConversationInvitationNotification {
    const conversation = this.sharedConversationService.getUserSharedConversations(invitation.fromUserId)
      .find(conv => conv.id === invitation.conversationId);
    
    const participantCount = conversation?.participants.filter(p => p.type === 'human').length || 0;
    const aiAgentCount = conversation?.participants.filter(p => p.type === 'ai_agent').length || 0;

    return {
      id: invitation.id,
      type: 'conversation_invitation',
      fromUserId: invitation.fromUserId,
      fromUserName: invitation.fromUserName,
      conversationId: invitation.conversationId,
      conversationName: conversation?.name || 'AI Conversation',
      message: invitation.message,
      participantCount,
      aiAgentCount,
      includeHistory: invitation.includeHistory,
      timestamp: invitation.createdAt,
      expiresAt: invitation.expiresAt
    };
  }

  /**
   * Find user by email (mock implementation)
   */
  private async findUserByEmail(email: string): Promise<string | null> {
    // Mock user lookup - in real app, query user database
    const mockUsers = [
      { id: 'user1', email: 'sarah.chen@techcorp.com' },
      { id: 'user2', email: 'mike.r@designstudio.com' },
      { id: 'user3', email: 'e.watson@research.edu' },
      { id: 'user4', email: 'alex@startup.io' }
    ];
    
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user?.id || null;
  }

  /**
   * Get active notifications for user
   */
  getActiveNotifications(userId: string): ConversationInvitationNotification[] {
    // In real app, filter by userId
    return Array.from(this.activeNotifications.values());
  }

  /**
   * Accept invitation - Only adds the human user, not their AI agents
   */
  async acceptInvitation(notificationId: string, userId: string, userName: string): Promise<void> {
    try {
      // Only add the human user to the conversation
      // AI agents are NOT automatically added - user can add them later if desired
      await this.sharedConversationService.acceptInvitation(notificationId, userId, userName);
      this.activeNotifications.delete(notificationId);
      this.notifyListeners();
      console.log('✅ Accepted invitation - added human user only (no AI agents):', notificationId);
    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Decline invitation
   */
  async declineInvitation(notificationId: string): Promise<void> {
    try {
      // Update invitation status in SharedConversationService
      // For now, just remove from active notifications
      this.activeNotifications.delete(notificationId);
      this.notifyListeners();
      console.log('❌ Declined invitation:', notificationId);
    } catch (error) {
      console.error('❌ Failed to decline invitation:', error);
      throw error;
    }
  }

  /**
   * Dismiss notification
   */
  dismissNotification(notificationId: string): void {
    this.activeNotifications.delete(notificationId);
    this.notifyListeners();
    console.log('🔕 Dismissed notification:', notificationId);
  }

  /**
   * Subscribe to notification updates
   */
  subscribeToNotifications(callback: (notifications: ConversationInvitationNotification[]) => void): () => void {
    this.notificationListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of notification changes
   */
  private notifyListeners(): void {
    const notifications = Array.from(this.activeNotifications.values());
    this.notificationListeners.forEach(callback => callback(notifications));
  }

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string): NotificationPreferences {
    return this.userPreferences.get(userId) || this.userPreferences.get('default')!;
  }

  /**
   * Update user notification preferences
   */
  updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.getUserPreferences(userId);
    this.userPreferences.set(userId, { ...current, ...preferences });
    console.log('⚙️ Updated notification preferences for user:', userId);
  }
}

export default ConversationNotificationService;

