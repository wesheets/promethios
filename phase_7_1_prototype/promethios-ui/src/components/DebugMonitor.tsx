import React, { useState, useEffect, useRef } from 'react';
import './DebugMonitor.css';

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
}

interface DebugStats {
  totalLogs: number;
  toolCalls: number;
  errors: number;
  lastUpdate: string;
}

const DebugMonitor: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [stats, setStats] = useState<DebugStats>({
    totalLogs: 0,
    toolCalls: 0,
    errors: 0,
    lastUpdate: 'Never'
  });
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

  const categories = [
    'all', 'tool_execution', 'tool_schema', 'provider', 'chat', 
    'openai_provider', 'anthropic_provider'
  ];

  useEffect(() => {
    // Auto-connect on component mount
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsConnecting(true);
    setIsConnected(false);

    try {
      const eventSource = new EventSource(`${API_BASE}/api/debug/live`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        console.log('🔍 Debug monitor connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing debug message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Debug monitor connection error:', error);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
            connect();
          }
        }, 5000);
      };

    } catch (error) {
      console.error('Failed to connect to debug monitor:', error);
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  const handleMessage = (data: any) => {
    if (data.type === 'new_log') {
      setLogs(prevLogs => {
        const newLogs = [data.log, ...prevLogs];
        return newLogs.slice(0, 1000); // Keep only last 1000 logs
      });
      updateStats();
    } else if (data.type === 'initial_logs') {
      setLogs(data.logs || []);
      updateStats();
    }
  };

  const updateStats = () => {
    setStats(prevStats => ({
      totalLogs: logs.length,
      toolCalls: logs.filter(log => 
        log.category.includes('tool') || log.message.includes('tool')
      ).length,
      errors: logs.filter(log => log.level === 'error').length,
      lastUpdate: new Date().toLocaleTimeString()
    }));
  };

  const clearLogs = async () => {
    setLogs([]);
    updateStats();
    
    try {
      await fetch(`${API_BASE}/api/debug/clear`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to clear server logs:', error);
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promethios-debug-logs-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = currentFilter === 'all' 
    ? logs 
    : logs.filter(log => log.category === currentFilter);

  const getStatusClass = () => {
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <div className="debug-monitor">
      <div className="debug-header">
        <h1>🔍 Tool Integration Debug Monitor</h1>
        <p>Real-time monitoring of tool calling process to identify silent failures</p>
      </div>

      <div className="debug-controls">
        <span className={`status ${getStatusClass()}`}>
          {getStatusText()}
        </span>
        <button 
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          className="control-btn"
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
        <button onClick={clearLogs} className="control-btn">
          Clear Logs
        </button>
        <button onClick={exportLogs} className="control-btn">
          Export Logs
        </button>
      </div>

      <div className="debug-stats">
        <div className="stat">
          <span className="stat-label">Total Logs:</span>
          <span className="stat-value">{stats.totalLogs}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Tool Calls:</span>
          <span className="stat-value">{stats.toolCalls}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Errors:</span>
          <span className="stat-value">{stats.errors}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Last Update:</span>
          <span className="stat-value">{stats.lastUpdate}</span>
        </div>
      </div>

      <div className="filter-controls">
        {categories.map(category => (
          <button
            key={category}
            className={`filter-btn ${currentFilter === category ? 'active' : ''}`}
            onClick={() => setCurrentFilter(category)}
          >
            {category.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <div className="logs-container" ref={logsContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            {currentFilter === 'all' 
              ? 'No logs yet. Try asking your agent to use a tool...' 
              : `No logs for category: ${currentFilter}`
            }
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={`${log.id}-${index}`} className={`log-entry ${log.level}`}>
              <div className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <div className="log-category">
                [{log.category.toUpperCase()}]
              </div>
              <div className="log-message">
                {log.message}
              </div>
              {log.data && Object.keys(log.data).length > 0 && (
                <div className="log-data">
                  <pre>{JSON.stringify(log.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugMonitor;

