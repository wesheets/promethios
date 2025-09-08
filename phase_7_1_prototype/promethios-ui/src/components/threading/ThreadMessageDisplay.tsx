/**
 * Thread Message Display
 * 
 * Component for displaying messages within a thread context.
 * Shows thread hierarchy, context, and thread-specific actions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Reply, 
  MoreHorizontal, 
  ArrowUp, 
  Users, 
  Clock,
  Hash,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ThreadMessage, Thread, ThreadNavigationContext } from '../../types/threading';
import { Message } from '../../types/chat';
import { ThreadingService } from '../../services/ThreadingService';

interface ThreadMessageDisplayProps {
  /** Current thread */
  thread: Thread;
  
  /** Messages in the thread */
  messages: ThreadMessage[];
  
  /** Navigation context */
  navigationContext: ThreadNavigationContext;
  
  /** Loading state */
  loading?: boolean;
  
  /** Callback when message is selected for reply */
  onReplyToMessage?: (message: ThreadMessage) => void;
  
  /** Callback when creating new thread from message */
  onCreateThreadFromMessage?: (message: ThreadMessage) => void;
  
  /** Callback when navigating to origin message */
  onNavigateToOrigin?: (messageId: string) => void;
  
  /** Current user ID */
  currentUserId?: string;
}

/**
 * Thread Message Display Component
 */
export const ThreadMessageDisplay: React.FC<ThreadMessageDisplayProps> = ({
  thread,
  messages,
  navigationContext,
  loading = false,
  onReplyToMessage,
  onCreateThreadFromMessage,
  onNavigateToOrigin,
  currentUserId
}) => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadingService = ThreadingService.getInstance();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Get thread path display
   */
  const getThreadPath = () => {
    const path = navigationContext.threadPath;
    const pathThreads = path.map(threadId => 
      navigationContext.availableThreads.find(t => t.id === threadId)
    ).filter(Boolean);

    return pathThreads;
  };

  /**
   * Format message timestamp
   */
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  /**
   * Get message position in thread
   */
  const getMessagePosition = (message: ThreadMessage) => {
    return message.threadMetadata?.threadPosition || 0;
  };

  /**
   * Check if message is from current user
   */
  const isOwnMessage = (message: ThreadMessage) => {
    return currentUserId && message.senderId === currentUserId;
  };

  /**
   * Render message actions
   */
  const renderMessageActions = (message: ThreadMessage) => {
    return (
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onReplyToMessage && (
          <button
            onClick={() => onReplyToMessage(message)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Reply to this message"
          >
            <Reply className="w-4 h-4" />
          </button>
        )}
        
        {onCreateThreadFromMessage && (
          <button
            onClick={() => onCreateThreadFromMessage(message)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Create thread from this message"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    );
  };

  /**
   * Render thread breadcrumb
   */
  const renderThreadBreadcrumb = () => {
    const pathThreads = getThreadPath();
    
    if (pathThreads.length <= 1) return null;

    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-50 border-b border-gray-200 text-sm">
        <Hash className="w-4 h-4 text-gray-500" />
        <div className="flex items-center space-x-1">
          {pathThreads.map((pathThread, index) => (
            <React.Fragment key={pathThread!.id}>
              {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
              <button
                onClick={() => onNavigateToOrigin?.(pathThread!.id)}
                className={`
                  px-2 py-1 rounded hover:bg-gray-200 transition-colors
                  ${pathThread!.id === thread.id ? 'font-medium text-blue-600' : 'text-gray-600'}
                `}
              >
                {pathThread!.title}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render thread header
   */
  const renderThreadHeader = () => {
    return (
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {thread.title}
            </h2>
            
            {thread.description && (
              <p className="text-sm text-gray-600 mb-3">
                {thread.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3" />
                <span>{thread.messageCount} messages</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{thread.participants.length} participants</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Created {new Date(thread.createdAt).toLocaleDateString()}</span>
              </div>
              
              {thread.metadata.priority && thread.metadata.priority !== 'normal' && (
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${thread.metadata.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    thread.metadata.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'}
                `}>
                  {thread.metadata.priority}
                </span>
              )}
            </div>
            
            {thread.metadata.tags && thread.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {thread.metadata.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {onNavigateToOrigin && (
            <button
              onClick={() => onNavigateToOrigin(thread.originMessageId)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go to origin message"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Origin</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render message item
   */
  const renderMessage = (message: ThreadMessage, index: number) => {
    const isOwn = isOwnMessage(message);
    const position = getMessagePosition(message);
    const isSelected = selectedMessage === message.id;

    return (
      <div
        key={message.id}
        className={`
          group relative p-4 hover:bg-gray-50 transition-colors
          ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
        `}
      >
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {message.senderName}
              </span>
              
              <span className="text-xs text-gray-500">
                #{position + 1}
              </span>
              
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </span>
              
              {message.threadMetadata?.contextSummary && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Context
                </span>
              )}
            </div>

            {/* Content */}
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {message.content}
            </div>

            {/* Thread Context Summary */}
            {message.threadMetadata?.contextSummary && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Context:</strong> {message.threadMetadata.contextSummary}
              </div>
            )}

            {/* Related Messages */}
            {message.threadMetadata?.relatedMessages && message.threadMetadata.relatedMessages.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <span>Related to {message.threadMetadata.relatedMessages.length} other message(s)</span>
              </div>
            )}

            {/* Parent Message Reference */}
            {message.parentMessageId && (
              <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
                <ArrowUp className="w-3 h-3" />
                <span>Reply to message</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0">
            {renderMessageActions(message)}
          </div>
        </div>

        {/* Expanded Actions */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <button className="hover:text-gray-700">Copy Link</button>
              <button className="hover:text-gray-700">Quote</button>
              <button className="hover:text-gray-700">Edit</button>
              <button className="hover:text-gray-700 text-red-600">Delete</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading thread messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Thread Breadcrumb */}
      {renderThreadBreadcrumb()}
      
      {/* Thread Header */}
      {renderThreadHeader()}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-sm text-gray-500">
                This thread is ready for your first message.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

