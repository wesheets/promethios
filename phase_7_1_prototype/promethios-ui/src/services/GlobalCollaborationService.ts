/**
 * Global Collaboration Service
 * 
 * Manages collaboration state that persists across all command centers
 * for users with multiple wrapped agents
 */

import { UserInteraction } from './UserInteractionRegistry';

export interface GlobalCollaboration {
  id: string;
  invitationId: string;
  conversationName: string;
  agentName: string;
  participants: {
    id: string;
    name: string;
    photo?: string;
    role: 'host' | 'participant';
  }[];
  status: 'active' | 'ended';
  createdAt: Date;
  lastActivity: Date;
}

class GlobalCollaborationService {
  private activeCollaborations: Map<string, GlobalCollaboration> = new Map();
  private listeners: Set<(collaborations: GlobalCollaboration[]) => void> = new Set();

  /**
   * Add a collaboration from an accepted invitation
   */
  addCollaborationFromInvitation(invitation: UserInteraction): GlobalCollaboration {
    const collaboration: GlobalCollaboration = {
      id: `collab-${invitation.id}`,
      invitationId: invitation.id,
      conversationName: invitation.metadata?.conversationName || 'AI Conversation',
      agentName: invitation.metadata?.agentName || 'AI Assistant',
      participants: [
        {
          id: invitation.fromUserId,
          name: invitation.fromUserName,
          photo: invitation.fromUserPhoto,
          role: 'host'
        },
        {
          id: invitation.toUserId,
          name: 'You', // Will be replaced with actual user name
          role: 'participant'
        }
      ],
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.activeCollaborations.set(collaboration.id, collaboration);
    this.notifyListeners();
    
    console.log('🤝 [GlobalCollaboration] Added collaboration:', collaboration);
    return collaboration;
  }

  /**
   * Get all active collaborations for the current user
   */
  getActiveCollaborations(): GlobalCollaboration[] {
    return Array.from(this.activeCollaborations.values())
      .filter(collab => collab.status === 'active')
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Get a specific collaboration by ID
   */
  getCollaboration(collaborationId: string): GlobalCollaboration | null {
    return this.activeCollaborations.get(collaborationId) || null;
  }

  /**
   * Check if user has any active collaborations
   */
  hasActiveCollaborations(): boolean {
    return this.getActiveCollaborations().length > 0;
  }

  /**
   * Update last activity for a collaboration
   */
  updateActivity(collaborationId: string): void {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (collaboration) {
      collaboration.lastActivity = new Date();
      this.notifyListeners();
    }
  }

  /**
   * End a collaboration
   */
  endCollaboration(collaborationId: string): void {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (collaboration) {
      collaboration.status = 'ended';
      this.notifyListeners();
      console.log('🔚 [GlobalCollaboration] Ended collaboration:', collaborationId);
    }
  }

  /**
   * Subscribe to collaboration changes
   */
  subscribe(listener: (collaborations: GlobalCollaboration[]) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current state
    listener(this.getActiveCollaborations());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const activeCollaborations = this.getActiveCollaborations();
    this.listeners.forEach(listener => listener(activeCollaborations));
  }

  /**
   * Clear all collaborations (for logout/cleanup)
   */
  clear(): void {
    this.activeCollaborations.clear();
    this.notifyListeners();
  }
}

// Export singleton instance
export const globalCollaborationService = new GlobalCollaborationService();
export default globalCollaborationService;

