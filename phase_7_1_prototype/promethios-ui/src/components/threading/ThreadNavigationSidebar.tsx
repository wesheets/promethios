/**
 * Thread Navigation Sidebar
 * 
 * Sidebar component for navigating conversation threads.
 * Displays thread tree with expand/collapse, search, and filtering.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  MessageSquare, 
  Search, 
  Filter, 
  Archive, 
  Clock,
  Users,
  Tag,
  AlertCircle,
  CheckCircle,
  Circle,
  MoreHorizontal
} from 'lucide-react';
import { 
  Thread, 
  ThreadTreeNode, 
  ThreadNavigationContext,
  ThreadSearchCriteria,
  ThreadStatus 
} from '../../types/threading';
import { ThreadingService } from '../../services/ThreadingService';

interface ThreadNavigationSidebarProps {
  /** Current session ID */
  sessionId: string;
  
  /** Current thread ID */
  currentThreadId?: string;
  
  /** Callback when thread is selected */
  onThreadSelect: (threadId: string) => void;
  
  /** Callback when thread is created */
  onCreateThread?: () => void;
  
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
}

/**
 * Thread Navigation Sidebar Component
 */
export const ThreadNavigationSidebar: React.FC<ThreadNavigationSidebarProps> = ({
  sessionId,
  currentThreadId,
  onThreadSelect,
  onCreateThread,
  collapsed = false
}) => {
  const [navigationContext, setNavigationContext] = useState<ThreadNavigationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ThreadStatus[]>(['active']);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Threading service
  const threadingService = ThreadingService.getInstance();

  /**
   * Load navigation context
   */
  const loadNavigationContext = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🧭 [ThreadNavigationSidebar] Loading navigation context for session:', sessionId);

      const context = await threadingService.buildNavigationContext(sessionId, currentThreadId);
      setNavigationContext(context);

      // Auto-expand nodes in current thread path
      if (context.threadPath.length > 0) {
        setExpandedNodes(new Set(context.threadPath));
      }

      console.log('✅ [ThreadNavigationSidebar] Navigation context loaded:', {
        totalThreads: context.availableThreads.length,
        currentThread: currentThreadId,
        threadPath: context.threadPath
      });

    } catch (err) {
      console.error('❌ [ThreadNavigationSidebar] Failed to load navigation context:', err);
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  // Load navigation context on mount and when session/thread changes
  useEffect(() => {
    if (sessionId) {
      loadNavigationContext();
    }
  }, [sessionId, currentThreadId]);

  // Set up thread event listeners
  useEffect(() => {
    const handleThreadEvent = (event: string, thread: Thread) => {
      console.log('🔄 [ThreadNavigationSidebar] Thread event received:', event, thread.id);
      loadNavigationContext(); // Reload context on thread changes
    };

    threadingService.addThreadListener(sessionId, handleThreadEvent);

    return () => {
      threadingService.removeThreadListener(sessionId, handleThreadEvent);
    };
  }, [sessionId]);

  /**
   * Filter threads based on search and filters
   */
  const filteredThreads = useMemo(() => {
    if (!navigationContext) return [];

    let threads = navigationContext.availableThreads;

    // Apply status filter
    if (statusFilter.length > 0) {
      threads = threads.filter(thread => statusFilter.includes(thread.status));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      threads = threads.filter(thread => 
        thread.title.toLowerCase().includes(query) ||
        thread.description?.toLowerCase().includes(query) ||
        thread.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return threads;
  }, [navigationContext, searchQuery, statusFilter]);

  /**
   * Build filtered thread tree
   */
  const filteredThreadTree = useMemo(() => {
    if (!navigationContext) return [];

    const filteredIds = new Set(filteredThreads.map(t => t.id));
    
    const filterTree = (nodes: ThreadTreeNode[]): ThreadTreeNode[] => {
      return nodes
        .filter(node => filteredIds.has(node.thread.id))
        .map(node => ({
          ...node,
          children: filterTree(node.children)
        }));
    };

    return filterTree(navigationContext.threadTree);
  }, [navigationContext, filteredThreads]);

  /**
   * Toggle node expansion
   */
  const toggleNodeExpansion = (threadId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  /**
   * Get thread status icon
   */
  const getStatusIcon = (status: ThreadStatus) => {
    switch (status) {
      case 'active':
        return <Circle className="w-3 h-3 text-green-500" />;
      case 'archived':
        return <Archive className="w-3 h-3 text-gray-500" />;
      case 'closed':
        return <CheckCircle className="w-3 h-3 text-blue-500" />;
      case 'merged':
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-gray-600';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  /**
   * Render thread node
   */
  const renderThreadNode = (node: ThreadTreeNode) => {
    const { thread, children, depth } = node;
    const isExpanded = expandedNodes.has(thread.id);
    const isSelected = thread.id === currentThreadId;
    const hasChildren = children.length > 0;
    const hasUnread = Object.values(thread.unreadCounts).some(count => count > 0);

    return (
      <div key={thread.id} className="select-none">
        {/* Thread Item */}
        <div
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}
            ${hasUnread ? 'font-medium' : ''}
          `}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => onThreadSelect(thread.id)}
        >
          {/* Expansion Toggle */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(thread.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Status Icon */}
          <div className="flex-shrink-0">
            {getStatusIcon(thread.status)}
          </div>

          {/* Thread Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-sm truncate ${getPriorityColor(thread.metadata.priority)}`}>
                {thread.title}
              </span>
              {hasUnread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            
            {/* Thread Metadata */}
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <MessageSquare className="w-3 h-3" />
              <span>{thread.messageCount}</span>
              
              {thread.participants.length > 0 && (
                <>
                  <Users className="w-3 h-3" />
                  <span>{thread.participants.length}</span>
                </>
              )}
              
              {thread.metadata.tags && thread.metadata.tags.length > 0 && (
                <>
                  <Tag className="w-3 h-3" />
                  <span>{thread.metadata.tags[0]}</span>
                  {thread.metadata.tags.length > 1 && (
                    <span>+{thread.metadata.tags.length - 1}</span>
                  )}
                </>
              )}
              
              <Clock className="w-3 h-3" />
              <span>{new Date(thread.lastActivityAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Show thread actions menu
            }}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>

        {/* Child Threads */}
        {hasChildren && isExpanded && (
          <div>
            {children.map(childNode => renderThreadNode(childNode))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onCreateThread}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          title="Create Thread"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Threads</h3>
          {onCreateThread && (
            <button
              onClick={onCreateThread}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="Create Thread"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {showFilters && (
            <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Status</label>
                {(['active', 'archived', 'closed'] as ThreadStatus[]).map(status => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter([...statusFilter, status]);
                        } else {
                          setStatusFilter(statusFilter.filter(s => s !== status));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading threads...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadNavigationContext}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredThreadTree.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No threads found</p>
            {onCreateThread && (
              <button
                onClick={onCreateThread}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Create your first thread
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredThreadTree.map(node => renderThreadNode(node))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {navigationContext && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Total Threads:</span>
              <span>{navigationContext.availableThreads.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Active:</span>
              <span>{navigationContext.availableThreads.filter(t => t.status === 'active').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Filtered:</span>
              <span>{filteredThreads.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

