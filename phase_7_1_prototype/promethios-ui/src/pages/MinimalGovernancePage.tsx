import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';

// Minimal version of SimplifiedGovernanceOverviewPage to test navigation
const MinimalGovernancePage: React.FC = () => {
  console.log('🎯 MinimalGovernancePage rendering');
  
  const { currentUser } = useAuth();
  const { metrics, loading, error, refreshMetrics } = useOptimizedGovernanceDashboard();
  const location = useLocation();
  
  // Basic state only
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMetrics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2, color: '#a0aec0' }}>
          Loading governance data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6">Failed to load governance data</Typography>
          <Typography>{error}</Typography>
          <Button onClick={handleRefresh} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Minimal Governance Overview
        </Typography>
        
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{ color: 'white', borderColor: 'white' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Basic Metrics */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#10B981', mb: 2 }}>
          Basic Metrics
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box sx={{ p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: '#10B981' }}>
              Agents
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              {metrics?.agents?.total || 0}
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: '#3B82F6' }}>
              Governance Score
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              {metrics?.governance?.score || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: '#EF4444' }}>
              Violations
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              {metrics?.governance?.violations || 0}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Test */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ color: '#10B981', mb: 2 }}>
          Navigation Test
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          This is a minimal version of the governance page. If navigation works here but not with the full page, 
          the issue is in the complex UI components.
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
          Current path: {location.pathname}
        </Typography>
      </Box>
    </Box>
  );
};

export default MinimalGovernancePage;
