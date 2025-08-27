/**
 * AgentPermissionService - Manages AI agent addition permissions in shared conversations
 * Handles permission requests from guest users to add their AI agents
 */

export interface AgentPermissionRequest {
  id: string;
  conversationId: string;
  requesterId: string;
  requesterName: string;
  agentId: string;
  agentName: string;
  agentType: string; // 'claude', 'openai', 'gemini', etc.
  message?: string; // Optional message from requester
  status: 'pending' | 'approved' | 'denied';
  createdAt: Date;
  respondedAt?: Date;
  respondedBy?: string; // Chat owner who responded
}

export interface PermissionNotification {
  id: string;
  type: 'agent_permission_request' | 'agent_permission_response';
  conversationId: string;
  conversationName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  agentName: string;
  agentType: string;
  status?: 'approved' | 'denied';
  message?: string;
  timestamp: Date;
}

class AgentPermissionService {
  private static instance: AgentPermissionService;
  private pendingRequests: Map<string, AgentPermissionRequest> = new Map();
  private permissionHistory: Map<string, AgentPermissionRequest[]> = new Map();
  private notificationListeners: Set<(notification: PermissionNotification) => void> = new Set();

  private constructor() {
    console.log('🔒 AgentPermissionService initialized');
  }

  public static getInstance(): AgentPermissionService {
    if (!AgentPermissionService.instance) {
      AgentPermissionService.instance = new AgentPermissionService();
    }
    return AgentPermissionService.instance;
  }

  /**
   * Request permission to add AI agent to conversation
   */
  async requestAgentPermission(
    conversationId: string,
    requesterId: string,
    requesterName: string,
    agentId: string,
    agentName: string,
    agentType: string,
    message?: string
  ): Promise<AgentPermissionRequest> {
    const request: AgentPermissionRequest = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      requesterId,
      requesterName,
      agentId,
      agentName,
      agentType,
      message,
      status: 'pending',
      createdAt: new Date()
    };

    // Store pending request
    this.pendingRequests.set(request.id, request);

    // Add to history
    const history = this.permissionHistory.get(conversationId) || [];
    history.push(request);
    this.permissionHistory.set(conversationId, history);

    // Create notification for chat owner
    const notification: PermissionNotification = {
      id: `notif_${request.id}`,
      type: 'agent_permission_request',
      conversationId,
      conversationName: 'AI Conversation', // Would get from SharedConversationService
      fromUserId: requesterId,
      fromUserName: requesterName,
      toUserId: 'chat_owner', // Would get actual owner ID
      agentName,
      agentType,
      message,
      timestamp: new Date()
    };

    // Notify listeners (chat owner)
    this.notifyListeners(notification);

    console.log('🔒 Created agent permission request:', request.id, agentName);
    return request;
  }

  /**
   * Approve agent permission request
   */
  async approveAgentRequest(
    requestId: string,
    approverId: string,
    approverName: string
  ): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error('Permission request not found');
    }

    // Update request status
    request.status = 'approved';
    request.respondedAt = new Date();
    request.respondedBy = approverId;

    // Remove from pending
    this.pendingRequests.delete(requestId);

    // Update history
    const history = this.permissionHistory.get(request.conversationId) || [];
    const historyIndex = history.findIndex(r => r.id === requestId);
    if (historyIndex >= 0) {
      history[historyIndex] = request;
    }

    // Create response notification for requester
    const notification: PermissionNotification = {
      id: `notif_resp_${requestId}`,
      type: 'agent_permission_response',
      conversationId: request.conversationId,
      conversationName: 'AI Conversation',
      fromUserId: approverId,
      fromUserName: approverName,
      toUserId: request.requesterId,
      agentName: request.agentName,
      agentType: request.agentType,
      status: 'approved',
      timestamp: new Date()
    };

    this.notifyListeners(notification);

    // TODO: Actually add the AI agent to the conversation
    // This would integrate with SharedConversationService
    
    console.log('✅ Approved agent permission request:', requestId, request.agentName);
  }

  /**
   * Deny agent permission request
   */
  async denyAgentRequest(
    requestId: string,
    deniedById: string,
    deniedByName: string,
    reason?: string
  ): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error('Permission request not found');
    }

    // Update request status
    request.status = 'denied';
    request.respondedAt = new Date();
    request.respondedBy = deniedById;

    // Remove from pending
    this.pendingRequests.delete(requestId);

    // Update history
    const history = this.permissionHistory.get(request.conversationId) || [];
    const historyIndex = history.findIndex(r => r.id === requestId);
    if (historyIndex >= 0) {
      history[historyIndex] = request;
    }

    // Create response notification for requester
    const notification: PermissionNotification = {
      id: `notif_resp_${requestId}`,
      type: 'agent_permission_response',
      conversationId: request.conversationId,
      conversationName: 'AI Conversation',
      fromUserId: deniedById,
      fromUserName: deniedByName,
      toUserId: request.requesterId,
      agentName: request.agentName,
      agentType: request.agentType,
      status: 'denied',
      message: reason,
      timestamp: new Date()
    };

    this.notifyListeners(notification);

    console.log('❌ Denied agent permission request:', requestId, request.agentName, reason);
  }

  /**
   * Get pending permission requests for conversation
   */
  getPendingRequests(conversationId: string): AgentPermissionRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(request => request.conversationId === conversationId);
  }

  /**
   * Get permission history for conversation
   */
  getPermissionHistory(conversationId: string): AgentPermissionRequest[] {
    return this.permissionHistory.get(conversationId) || [];
  }

  /**
   * Check if user can add agent without permission (i.e., they're the chat owner)
   */
  canAddAgentDirectly(conversationId: string, userId: string): boolean {
    // TODO: Check if user is the conversation owner
    // For now, assume first participant is owner
    return true; // Would implement actual ownership check
  }

  /**
   * Subscribe to permission notifications
   */
  subscribeToNotifications(callback: (notification: PermissionNotification) => void): () => void {
    this.notificationListeners.add(callback);
    
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of permission events
   */
  private notifyListeners(notification: PermissionNotification): void {
    this.notificationListeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in permission notification listener:', error);
      }
    });
  }

  /**
   * Get permission request by ID
   */
  getPermissionRequest(requestId: string): AgentPermissionRequest | undefined {
    return this.pendingRequests.get(requestId) || 
           Array.from(this.permissionHistory.values())
             .flat()
             .find(request => request.id === requestId);
  }

  /**
   * Cancel permission request (by requester)
   */
  cancelPermissionRequest(requestId: string, userId: string): void {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error('Permission request not found');
    }

    if (request.requesterId !== userId) {
      throw new Error('Only the requester can cancel their permission request');
    }

    // Remove from pending
    this.pendingRequests.delete(requestId);

    // Update history
    request.status = 'denied'; // Mark as cancelled
    request.respondedAt = new Date();

    console.log('🚫 Cancelled agent permission request:', requestId);
  }

  /**
   * Auto-deny expired permission requests
   */
  cleanupExpiredRequests(): void {
    const now = new Date();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (now.getTime() - request.createdAt.getTime() > expirationTime) {
        this.denyAgentRequest(
          requestId,
          'system',
          'System',
          'Permission request expired after 24 hours'
        );
      }
    }
  }

  /**
   * Start cleanup interval for expired requests
   */
  startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredRequests();
    }, 60 * 60 * 1000); // Check every hour
  }
}

export default AgentPermissionService;

