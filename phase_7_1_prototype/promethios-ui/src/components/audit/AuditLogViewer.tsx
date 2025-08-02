import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface AuditLog {
  id: string;
  agentId: string;
  userId: string;
  eventType: string;
  eventData: any;
  timestamp: string;
  verificationStatus: 'verified' | 'pending' | 'failed';
  hash: string;
  signature: string;
  chainPosition: number;
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading: boolean;
  onLogSelect: (log: AuditLog) => void;
  selectedLog: AuditLog | null;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  loading,
  onLogSelect,
  selectedLog
}) => {
  const { isDarkMode } = useTheme();
  const [sortBy, setSortBy] = useState<'timestamp' | 'eventType' | 'verificationStatus'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const sortedLogs = [...logs].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];

    if (sortBy === 'timestamp') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'agent_created':
        return '🤖';
      case 'agent_updated':
        return '🔄';
      case 'agent_deleted':
        return '🗑️';
      case 'policy_violation':
        return '⚠️';
      case 'compliance_check':
        return '✅';
      case 'data_access':
        return '📊';
      case 'user_interaction':
        return '💬';
      case 'system_event':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  if (loading) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading audit logs...
          </span>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8 text-center`}>
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-medium mb-2">No Audit Logs Found</h3>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No audit logs match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Audit Log Entries</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {logs.length} entries found
            </p>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sort by:
            </span>
            {[
              { key: 'timestamp', label: 'Time' },
              { key: 'eventType', label: 'Event' },
              { key: 'verificationStatus', label: 'Status' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => handleSort(option.key as typeof sortBy)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  sortBy === option.key
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
                {sortBy === option.key && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {sortedLogs.map((log) => {
          const timestamp = formatTimestamp(log.timestamp);
          const isExpanded = expandedLog === log.id;
          const isSelected = selectedLog?.id === log.id;

          return (
            <div
              key={log.id}
              className={`p-4 transition-colors cursor-pointer ${
                isSelected
                  ? isDarkMode
                    ? 'bg-blue-900 bg-opacity-50'
                    : 'bg-blue-50'
                  : isDarkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-50'
              }`}
              onClick={() => onLogSelect(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Event Icon */}
                  <div className="text-2xl">
                    {getEventTypeIcon(log.eventType)}
                  </div>

                  {/* Log Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium">
                        {log.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVerificationStatusColor(log.verificationStatus)}`}>
                        {log.verificationStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Chain Position:
                        </span>
                        <span className="ml-1 font-medium">
                          #{log.chainPosition}
                        </span>
                      </div>
                      <div>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          User:
                        </span>
                        <span className="ml-1 font-medium">
                          {log.userId}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Hash:
                      </span>
                      <span className="ml-1 font-mono text-xs break-all">
                        {log.hash.substring(0, 32)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-right text-xs">
                  <div className="font-medium">
                    {timestamp.relative}
                  </div>
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {timestamp.time}
                  </div>
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {timestamp.date}
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <div className="mt-3 flex justify-between items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(log.id);
                  }}
                  className={`text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
                >
                  {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                </button>

                <div className="flex items-center space-x-2 text-xs">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Click to verify
                  </span>
                  <span className="text-blue-500">🔐</span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Event Data</h4>
                      <pre className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                        {JSON.stringify(log.eventData, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Cryptographic Details</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            Full Hash:
                          </span>
                          <div className="font-mono break-all mt-1">
                            {log.hash}
                          </div>
                        </div>
                        <div>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            Digital Signature:
                          </span>
                          <div className="font-mono break-all mt-1">
                            {log.signature}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

