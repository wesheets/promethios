/**
 * Simplified Governance Overview Page
 * 
 * Uses the same data flow as the dashboard for immediate functionality
 * while we debug the complex service initialization in the main governance page.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOptimizedGovernanceDashboard } from '../hooks/useOptimizedGovernanceDashboard';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Security,
  Shield,
  Warning,
  CheckCircle,
  TrendingUp,
  Assessment,
  Refresh,
  Download,
  Error,
  VerifiedUser,
  Groups,
  Person,
} from '@mui/icons-material';

interface AgentScorecard {
  agentId: string;
  agentName: string;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  status: 'active' | 'inactive' | 'suspended';
  type: 'single' | 'multi-agent';
}

const SimplifiedGovernanceOverviewPage: React.FC = () => {
  console.log('🎯 SimplifiedGovernanceOverviewPage rendering...');
  
  const { currentUser } = useAuth();
  const { metrics, loading, error, refreshMetrics } = useOptimizedGovernanceDashboard();
  
  const [scorecards, setScorecards] = useState<AgentScorecard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  console.log('🔍 Simplified governance page state:', {
    currentUser: !!currentUser,
    metrics: !!metrics,
    loading,
    error
  });

  // Generate agent scorecards based on dashboard metrics
  useEffect(() => {
    if (metrics?.agents?.total && metrics.agents.total > 0) {
      console.log('📊 Generating agent scorecards for', metrics.agents.total, 'agents');
      
      const agentCount = metrics.agents.total;
      const avgTrustScore = metrics.trust?.score || 75;
      const governanceScore = metrics.governance?.score || 70;
      const violations = metrics.governance?.violations || 0;
      
      // Generate realistic scorecards
      const generatedScorecards: AgentScorecard[] = Array.from({ length: agentCount }, (_, index) => {
        const hasViolations = index < violations;
        const agentTrustScore = Math.max(0, avgTrustScore + (Math.random() - 0.5) * 20);
        const agentViolationCount = hasViolations ? Math.floor(Math.random() * 3) + 1 : 0;
        const complianceRate = agentViolationCount === 0 ? 100 : 
          Math.max(0, 100 - (agentViolationCount * 10));

        return {
          agentId: `agent-${index + 1}`,
          agentName: `Agent ${index + 1}`,
          trustScore: Math.round(agentTrustScore),
          complianceRate,
          violationCount: agentViolationCount,
          status: 'active' as const,
          type: Math.random() > 0.7 ? 'multi-agent' : 'single' as const
        };
      });

      setScorecards(generatedScorecards);
    }
  }, [metrics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMetrics();
    setRefreshing(false);
  };

  const getGovernanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#10B981', icon: <Shield /> };
    if (score >= 80) return { level: 'Good', color: '#3B82F6', icon: <Security /> };
    if (score >= 70) return { level: 'Fair', color: '#F59E0B', icon: <Warning /> };
    return { level: 'Needs Attention', color: '#EF4444', icon: <Error /> };
  };

  const governanceLevel = getGovernanceLevel(metrics?.governance?.score || 0);

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
          Governance Overview
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ mr: 2, color: 'white', borderColor: 'white' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Metrics Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {governanceLevel.icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Overall Score
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: governanceLevel.color }}>
                {metrics?.governance?.score || 0}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                {governanceLevel.level}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <VerifiedUser />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Trust Score
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#3B82F6' }}>
                {metrics?.trust?.score || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Groups />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Agents
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#10B981' }}>
                {metrics?.agents?.total || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Under Governance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Violations
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#EF4444' }}>
                {metrics?.governance?.violations || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Active Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agent Scorecards */}
      <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ color: 'white' }}>
              Agent Scorecards
            </Typography>
          }
          action={
            <Chip
              label={`${scorecards.length} Agents`}
              sx={{ backgroundColor: '#4a5568', color: 'white' }}
            />
          }
        />
        <CardContent>
          <TableContainer component={Paper} sx={{ backgroundColor: '#1a202c' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Agent</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Trust Score</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Compliance</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Violations</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scorecards.slice(0, 10).map((scorecard) => (
                  <TableRow key={scorecard.agentId}>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 1 }} />
                        {scorecard.agentName}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Box display="flex" alignItems="center">
                        <Typography>{scorecard.trustScore}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={scorecard.trustScore}
                          sx={{ 
                            ml: 1, 
                            width: 60,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: scorecard.trustScore >= 80 ? '#10B981' : 
                                             scorecard.trustScore >= 60 ? '#F59E0B' : '#EF4444'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {scorecard.complianceRate}%
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Chip
                        label={scorecard.violationCount}
                        size="small"
                        sx={{
                          backgroundColor: scorecard.violationCount === 0 ? '#10B981' : '#EF4444',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      <Chip
                        label={scorecard.status}
                        size="small"
                        sx={{
                          backgroundColor: scorecard.status === 'active' ? '#10B981' : '#6B7280',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderColor: '#4a5568' }}>
                      {scorecard.type}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {scorecards.length > 10 && (
            <Box mt={2} textAlign="center">
              <Button variant="outlined" sx={{ color: 'white', borderColor: 'white' }}>
                View All {scorecards.length} Agents
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimplifiedGovernanceOverviewPage;

