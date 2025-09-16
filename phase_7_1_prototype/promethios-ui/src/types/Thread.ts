/**
 * Thread Data Models
 * TypeScript interfaces for threaded conversation system with resolution and integration
 */

export interface ThreadMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'ai_agent';
  timestamp: Date;
  attachments?: ThreadAttachment[];
  metadata?: {
    agentId?: string;
    behaviorType?: string;
    isDirectResponse?: boolean;
  };
}

export interface ThreadAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  size?: number;
}

export interface ThreadResolution {
  summary: string;
  keyOutcomes: string[];
  keyMessages: string[]; // Message IDs of important messages
  resolvedBy: string;
  resolvedAt: Date;
  aiGeneratedSummary?: string;
  userEditedSummary?: string;
}

export interface Thread {
  id: string; // Same as parentMessageId
  parentMessageId: string;
  conversationId: string;
  lastReplyAt: Date;
  replyCount: number;
  participants: string[]; // Array of user/agent IDs who have participated
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  status: 'active' | 'resolved' | 'archived' | 'integrated';
  resolution?: ThreadResolution;
}

export interface ThreadSummary {
  id: string;
  threadId: string;
  conversationId: string;
  summaryContent: string;
  keyPoints: string[];
  keyMessages: ThreadMessage[]; // Promoted messages
  generatedBy: string; // AI agent ID or user ID
  createdAt: Date;
  integratedAt?: Date;
  integrationMessageId?: string; // ID of the integration message in main chat
}

export interface ThreadInfo {
  replyCount: number;
  lastReplyAt: Date;
  participants: string[];
  status?: 'active' | 'resolved' | 'archived' | 'integrated';
}

// Integration message for main chat
export interface ThreadIntegrationMessage {
  id: string;
  type: 'thread_integration';
  content: string; // Summary content
  senderId: string;
  senderName: string;
  timestamp: Date;
  threadReference: {
    threadId: string;
    parentMessageId: string;
    originalMessageCount: number;
    participants: string[];
    resolvedBy: string;
  };
  integrationData: {
    summary: string;
    keyPoints: string[];
    keyMessages: ThreadMessage[];
    promotedBy: string;
  };
}

// Extended message interface to include thread information
export interface MessageWithThread {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type?: 'regular' | 'thread_integration';
  thread?: ThreadInfo;
  threadIntegration?: ThreadIntegrationMessage['integrationData'];
  // ... other existing message fields
}

// Thread creation request
export interface CreateThreadRequest {
  parentMessageId: string;
  conversationId: string;
  initialReply: {
    content: string;
    senderId: string;
    senderName: string;
    senderType: 'user' | 'ai_agent';
    attachments?: ThreadAttachment[];
  };
}

// Thread reply request
export interface AddThreadReplyRequest {
  threadId: string;
  reply: {
    content: string;
    senderId: string;
    senderName: string;
    senderType: 'user' | 'ai_agent';
    attachments?: ThreadAttachment[];
    metadata?: {
      agentId?: string;
      behaviorType?: string;
      isDirectResponse?: boolean;
    };
  };
}

// Thread resolution request
export interface ResolveThreadRequest {
  threadId: string;
  resolvedBy: string;
  resolution: {
    summary: string;
    keyOutcomes: string[];
    keyMessageIds: string[];
  };
  integrateToMainChat: boolean;
  integrationOptions?: {
    includeKeyMessages: boolean;
    generateAISummary: boolean;
  };
}

// Thread integration request
export interface IntegrateThreadRequest {
  threadId: string;
  conversationId: string;
  integratedBy: string;
  integrationData: {
    summary: string;
    keyPoints: string[];
    selectedMessageIds: string[];
  };
}

// Thread subscription data
export interface ThreadSubscription {
  thread: Thread;
  messages: ThreadMessage[];
}

// Thread notification
export interface ThreadNotification {
  threadId: string;
  parentMessageId: string;
  conversationId: string;
  type: 'new_reply' | 'thread_created' | 'thread_resolved' | 'thread_integrated';
  message?: ThreadMessage;
  resolution?: ThreadResolution;
  timestamp: Date;
}

