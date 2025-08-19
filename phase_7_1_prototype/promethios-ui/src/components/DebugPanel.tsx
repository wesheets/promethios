import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Circle as CircleIcon
} from '@mui/icons-material';

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
}

interface DebugPanelProps {
  darkTheme: any;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ darkTheme }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalLogs: 0,
    toolCalls: 0,
    errors: 0,
    lastUpdate: 'Never'
  });
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'https://promethios-phase-7-1-api.onrender.com';

  const categories = ['all', 'tool_execution', 'provider', 'chat'];

  useEffect(() => {
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
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing debug message:', error);
        }
      };

      eventSource.onerror = () => {
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
        return newLogs.slice(0, 100); // Keep only last 100 logs for sidebar
      });
      updateStats();
    } else if (data.type === 'initial_logs') {
      setLogs(data.logs?.slice(0, 100) || []);
      updateStats();
    }
  };

  const updateStats = () => {
    setStats({
      totalLogs: logs.length,
      toolCalls: logs.filter(log => 
        log.category.includes('tool') || log.message.includes('tool')
      ).length,
      errors: logs.filter(log => log.level === 'error').length,
      lastUpdate: new Date().toLocaleTimeString()
    });
  };

  const clearLogs = async () => {
    setLogs([]);
    setExpandedLogs(new Set());
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
    link.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getStatusColor = () => {
    if (isConnecting) return darkTheme.warning;
    if (isConnected) return darkTheme.success;
    return darkTheme.error;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return darkTheme.error;
      case 'warn': return darkTheme.warning;
      case 'info': return darkTheme.primary;
      case 'debug': return darkTheme.text.secondary;
      default: return darkTheme.text.primary;
    }
  };

  const filteredLogs = currentFilter === 'all' 
    ? logs 
    : logs.filter(log => log.category === currentFilter);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', minHeight: '700px' }}>
      <Typography variant="h6" sx={{ color: darkTheme.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReportIcon sx={{ fontSize: 20 }} />
        Tool Debug Monitor
      </Typography>

      {/* Connection Status */}
      <Card sx={{ bgcolor: darkTheme.background, border: `1px solid ${darkTheme.border}` }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircleIcon sx={{ fontSize: 12, color: getStatusColor() }} />
              <Typography variant="body2" sx={{ color: darkTheme.text.primary }}>
                {getStatusText()}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              sx={{ color: darkTheme.primary }}
            >
              {isConnected ? <StopIcon /> : <PlayIcon />}
            </IconButton>
          </Box>
          
          {isConnecting && (
            <LinearProgress sx={{ height: 2, borderRadius: 1 }} />
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip 
          label={`${stats.totalLogs} logs`} 
          size="small" 
          sx={{ bgcolor: darkTheme.background, color: darkTheme.text.primary, border: `1px solid ${darkTheme.border}` }}
        />
        <Chip 
          label={`${stats.toolCalls} tools`} 
          size="small" 
          sx={{ bgcolor: darkTheme.background, color: darkTheme.primary, border: `1px solid ${darkTheme.primary}` }}
        />
        <Chip 
          label={`${stats.errors} errors`} 
          size="small" 
          sx={{ bgcolor: darkTheme.background, color: darkTheme.error, border: `1px solid ${darkTheme.error}` }}
        />
      </Box>

      {/* Filter Buttons */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {categories.map(category => (
          <Button
            key={category}
            size="small"
            variant={currentFilter === category ? 'contained' : 'outlined'}
            onClick={() => setCurrentFilter(category)}
            sx={{
              fontSize: '10px',
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              color: currentFilter === category ? 'white' : darkTheme.text.secondary,
              borderColor: darkTheme.border,
              bgcolor: currentFilter === category ? darkTheme.primary : 'transparent'
            }}
          >
            {category.replace('_', ' ').toUpperCase()}
          </Button>
        ))}
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          size="small"
          onClick={clearLogs}
          sx={{ color: darkTheme.text.secondary }}
          title="Clear logs"
        >
          <ClearIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={exportLogs}
          sx={{ color: darkTheme.text.secondary }}
          title="Export logs"
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Logs */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        minHeight: '600px',
        maxHeight: '80vh',
        border: `1px solid ${darkTheme.border}`,
        borderRadius: 1,
        bgcolor: darkTheme.background
      }}>
        {filteredLogs.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: darkTheme.text.secondary, fontStyle: 'italic' }}>
              {currentFilter === 'all' 
                ? 'No logs yet. Try asking your agent to use a tool...' 
                : `No logs for: ${currentFilter}`
              }
            </Typography>
          </Box>
        ) : (
          filteredLogs.map((log, index) => (
            <Box key={`${log.id}-${index}`} sx={{ borderBottom: `1px solid ${darkTheme.border}` }}>
              <Box 
                sx={{ 
                  p: 1, 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: darkTheme.hover }
                }}
                onClick={() => toggleLogExpansion(log.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                    <CircleIcon sx={{ fontSize: 8, color: getLevelColor(log.level) }} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: darkTheme.text.secondary,
                        fontSize: '10px'
                      }}
                    >
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Chip 
                      label={log.category} 
                      size="small" 
                      sx={{ 
                        height: 16, 
                        fontSize: '8px',
                        bgcolor: getLevelColor(log.level),
                        color: 'white'
                      }}
                    />
                  </Box>
                  <IconButton size="small" sx={{ color: darkTheme.text.secondary }}>
                    {expandedLogs.has(log.id) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Box>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: darkTheme.text.primary,
                    fontSize: '11px',
                    mt: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: expandedLogs.has(log.id) ? 'normal' : 'nowrap'
                  }}
                >
                  {log.message}
                </Typography>
              </Box>
              
              <Collapse in={expandedLogs.has(log.id)}>
                {log.data && Object.keys(log.data).length > 0 && (
                  <Box sx={{ p: 1, bgcolor: darkTheme.hover }}>
                    <Typography 
                      variant="caption" 
                      component="pre"
                      sx={{ 
                        color: darkTheme.text.secondary,
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {JSON.stringify(log.data, null, 2)}
                    </Typography>
                  </Box>
                )}
              </Collapse>
            </Box>
          ))
        )}
      </Box>

      {/* Status Alert */}
      {!isConnected && !isConnecting && (
        <Alert 
          severity="warning" 
          sx={{ 
            fontSize: '11px',
            '& .MuiAlert-message': { fontSize: '11px' }
          }}
        >
          Debug monitor disconnected. Tool calls won't be visible.
        </Alert>
      )}
    </Box>
  );
};

export default DebugPanel;

