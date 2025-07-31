import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';
import { userAgentStorageService, AgentProfile } from '../services/UserAgentStorageService';
import { Box, Typography, CircularProgress, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Incremental version - adding components step by step to find navigation killer
const IncrementalGovernancePage: React.FC = () => {
  console.log('🎯 IncrementalGovernancePage rendering');
  
  const { currentUser } = useAuth();
  const { metrics, loading, error, refreshMetrics } = useOptimizedGovernanceDashboard();
  const location = useLocation();
  
  // Basic state
  const [refreshing, setRefreshing] = useState(false);
  
  // STEP 1: Add agent data loading (like SimplifiedGovernanceOverviewPage)
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // Load agent data (copied from SimplifiedGovernanceOverviewPage)
  useEffect(() => {
    const loadRealAgentData = async () => {
      if (!currentUser) return;
      
      setLoadingAgents(true);
      try {
        userAgentStorageService.setCurrentUser(currentUser);
        
        const agents = await userAgentStorageService.loadUserAgents();
        console.log(`Loaded ${agents.length} agents from UserAgentStorageService`);
        
        const allScorecards = agents.map((agent: AgentProfile) => ({
          agentId: agent.id,
          name: agent.name,
          type: agent.type || 'single',
          trustScore: Math.floor(Math.random() * 100),
          compliance: Math.floor(Math.random() * 100),
          violationCount: Math.floor(Math.random() * 3),
          healthStatus: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)],
          status: agent.status || 'active',
          governance: Math.floor(Math.random() * 100),
          lastActivity: new Date(),
          isRealData: true
        }));
        
        setScorecards(allScorecards);
        
      } catch (error) {
        console.error('Error loading agent data:', error);
      } finally {
        setLoadingAgents(false);
      }
    };
    
    loadRealAgentData();
  }, [currentUser, metrics?.agents]);

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
          Incremental Governance Test - Step 1
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
              {scorecards.length || metrics?.agents?.total || 0}
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

      {/* STEP 1: Simple Agent Table (no pagination, no selection, no modals) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#10B981', mb: 2 }}>
          Agent Scorecards (Step 1: Basic Table)
        </Typography>
        
        {loadingAgents ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2, color: '#a0aec0' }}>Loading agents...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ backgroundColor: '#2d3748' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Agent</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Trust Score</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scorecards.slice(0, 10).map((scorecard) => (
                  <TableRow key={scorecard.agentId}>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {scorecard.name}
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {scorecard.type}
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {scorecard.trustScore}
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {scorecard.healthStatus}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Navigation Test */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: '#2d3748', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ color: '#10B981', mb: 2 }}>
          Navigation Test - Step 1
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Added: Agent data loading + basic table (no pagination, no selection, no modals)
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
          Current path: {location.pathname} | Agents loaded: {scorecards.length}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
          If navigation still works, the issue is in pagination/selection/modals.
        </Typography>
      </Box>
    </Box>
  );
};

export default IncrementalGovernancePage;
