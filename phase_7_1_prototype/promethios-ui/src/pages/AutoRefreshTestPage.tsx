import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';

// Test if auto-refresh intervals are causing navigation issues
const AutoRefreshTestPage: React.FC = () => {
  console.log('🧪 AutoRefreshTestPage rendering');
  
  const { currentUser } = useAuth();
  const { metrics, loading, error, refreshMetrics } = useOptimizedGovernanceDashboard();
  
  // Auto-refresh state (like SimplifiedGovernanceOverviewPage)
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Auto-refresh toggle (copied from SimplifiedGovernanceOverviewPage)
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
      console.log('Auto-refresh disabled');
    } else {
      const interval = setInterval(async () => {
        await refreshMetrics();
        setLastUpdate(new Date());
        console.log('Auto-refresh triggered');
      }, 30000); // Refresh every 30 seconds
      
      setRefreshInterval(interval);
      setAutoRefresh(true);
      console.log('Auto-refresh enabled');
    }
  };
  
  // Cleanup effect (like SimplifiedGovernanceOverviewPage)
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
        Auto-Refresh Test Page
      </Typography>
      
      <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
        Testing if auto-refresh intervals break navigation. Current user: {currentUser?.email || 'None'}
      </Alert>
      
      <Alert severity={autoRefresh ? "warning" : "info"} sx={{ mt: 1 }}>
        Auto-refresh: {autoRefresh ? "ENABLED (30s interval)" : "DISABLED"}
        {autoRefresh && ` | Last update: ${lastUpdate.toLocaleTimeString()}`}
      </Alert>
      
      <Typography variant="body1" sx={{ mt: 2 }}>
        This page tests if the auto-refresh intervals are causing navigation issues.
        Try enabling auto-refresh and then navigating to other pages.
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={toggleAutoRefresh}
        sx={{ mt: 2, mr: 2 }}
        color={autoRefresh ? "error" : "primary"}
      >
        {autoRefresh ? "Disable Auto-Refresh" : "Enable Auto-Refresh"}
      </Button>
      
      <Typography variant="body2" sx={{ mt: 2, color: '#a0aec0' }}>
        If navigation breaks after enabling auto-refresh, we found the culprit!
      </Typography>
      
      {metrics && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
          <Typography variant="h6">Metrics Preview:</Typography>
          <Typography variant="body2">Agents: {metrics.agents?.total || 0}</Typography>
          <Typography variant="body2">Governance Score: {metrics.governance?.score || 0}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default AutoRefreshTestPage;
