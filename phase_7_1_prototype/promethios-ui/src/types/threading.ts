/**
 * Threading System Types
 * 
 * Defines the data models and interfaces for the Week 3 Smart Threading System.
 * Supports branching conversations into focused sub-discussions with context preservation.
 */

import { Message, Participant } from './chat';

/**
 * Represents a conversation thread
 */
export interface Thread {
  /** Unique thread identifier */
  id: string;
  
  /** Parent session this thread belongs to */
  sessionId: string;
  
  /** Parent thread ID (for nested threads) */
  parentThreadId?: string;
  
  /** Thread title/subject */
  title: string;
  
  /** Thread description */
  description?: string;
  
  /** Message that started this thread */
  originMessageId: string;
  
  /** Thread creation timestamp */
  createdAt: number;
  
  /** Last activity timestamp */
  lastActivityAt: number;
  
  /** User who created the thread */
  createdBy: string;
  
  /** Thread participants */
  participants: string[];
  
  /** Thread status */
  status: ThreadStatus;
  
  /** Thread metadata */
  metadata: ThreadMetadata;
  
  /** Message count in this thread */
  messageCount: number;
  
  /** Unread message count per participant */
  unreadCounts: Record<string, number>;
}

/**
 * Thread status enumeration
 */
export type ThreadStatus = 
  | 'active'      // Thread is active and accepting messages
  | 'archived'    // Thread is archived but readable
  | 'closed'      // Thread is closed to new messages
  | 'merged';     // Thread has been merged into another thread

/**
 * Thread metadata for additional context
 */
export interface ThreadMetadata {
  /** Thread tags for categorization */
  tags?: string[];
  
  /** Thread priority level */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  /** Thread category */
  category?: string;
  
  /** Custom metadata fields */
  custom?: Record<string, any>;
  
  /** Thread color for UI */
  color?: string;
  
  /** Thread icon for UI */
  icon?: string;
}

/**
 * Thread message - extends base Message with thread context
 */
export interface ThreadMessage extends Message {
  /** Thread this message belongs to */
  threadId: string;
  
  /** Reference to parent message (for replies within thread) */
  parentMessageId?: string;
  
  /** Thread-specific metadata */
  threadMetadata?: {
    /** Position in thread */
    threadPosition: number;
    
    /** Thread context summary */
    contextSummary?: string;
    
    /** Related messages in other threads */
    relatedMessages?: string[];
  };
}

/**
 * Thread creation request
 */
export interface CreateThreadRequest {
  /** Parent session ID */
  sessionId: string;
  
  /** Parent thread ID (for nested threads) */
  parentThreadId?: string;
  
  /** Thread title */
  title: string;
  
  /** Thread description */
  description?: string;
  
  /** Origin message ID */
  originMessageId: string;
  
  /** Initial participants */
  participants?: string[];
  
  /** Thread metadata */
  metadata?: Partial<ThreadMetadata>;
}

/**
 * Thread update request
 */
export interface UpdateThreadRequest {
  /** Thread ID to update */
  threadId: string;
  
  /** Updated title */
  title?: string;
  
  /** Updated description */
  description?: string;
  
  /** Updated status */
  status?: ThreadStatus;
  
  /** Updated metadata */
  metadata?: Partial<ThreadMetadata>;
  
  /** Add participants */
  addParticipants?: string[];
  
  /** Remove participants */
  removeParticipants?: string[];
}

/**
 * Thread navigation context
 */
export interface ThreadNavigationContext {
  /** Current thread ID */
  currentThreadId?: string;
  
  /** Thread hierarchy path */
  threadPath: string[];
  
  /** Available threads in session */
  availableThreads: Thread[];
  
  /** Thread tree structure */
  threadTree: ThreadTreeNode[];
}

/**
 * Thread tree node for hierarchical display
 */
export interface ThreadTreeNode {
  /** Thread information */
  thread: Thread;
  
  /** Child threads */
  children: ThreadTreeNode[];
  
  /** Depth in tree */
  depth: number;
  
  /** Expanded state */
  expanded: boolean;
}

/**
 * Thread statistics
 */
export interface ThreadStats {
  /** Total threads in session */
  totalThreads: number;
  
  /** Active threads */
  activeThreads: number;
  
  /** Archived threads */
  archivedThreads: number;
  
  /** Total messages across all threads */
  totalMessages: number;
  
  /** Unread messages across all threads */
  unreadMessages: number;
  
  /** Most active thread */
  mostActiveThread?: Thread;
  
  /** Recent activity */
  recentActivity: ThreadActivity[];
}

/**
 * Thread activity record
 */
export interface ThreadActivity {
  /** Activity ID */
  id: string;
  
  /** Thread ID */
  threadId: string;
  
  /** Activity type */
  type: ThreadActivityType;
  
  /** User who performed the activity */
  userId: string;
  
  /** Activity timestamp */
  timestamp: number;
  
  /** Activity details */
  details: Record<string, any>;
}

/**
 * Thread activity types
 */
export type ThreadActivityType =
  | 'thread_created'
  | 'thread_updated'
  | 'thread_archived'
  | 'thread_closed'
  | 'thread_merged'
  | 'message_added'
  | 'participant_added'
  | 'participant_removed'
  | 'thread_renamed';

/**
 * Thread search criteria
 */
export interface ThreadSearchCriteria {
  /** Search query */
  query?: string;
  
  /** Filter by status */
  status?: ThreadStatus[];
  
  /** Filter by participants */
  participants?: string[];
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by date range */
  dateRange?: {
    start: number;
    end: number;
  };
  
  /** Filter by priority */
  priority?: ThreadMetadata['priority'][];
  
  /** Sort criteria */
  sortBy?: 'createdAt' | 'lastActivityAt' | 'messageCount' | 'title';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Limit results */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
}

/**
 * Thread search results
 */
export interface ThreadSearchResults {
  /** Found threads */
  threads: Thread[];
  
  /** Total count */
  totalCount: number;
  
  /** Search metadata */
  searchMetadata: {
    query: string;
    executionTime: number;
    filters: Record<string, any>;
  };
}

