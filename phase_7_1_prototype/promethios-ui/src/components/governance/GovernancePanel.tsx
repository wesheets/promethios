/**
 * GovernancePanel - Comprehensive governance dashboard for the right panel
 * 
 * Integrates all governance features into a unified interface:
 * - Autonomous governance dashboard
 * - Trust metrics and network visualization
 * - Governance heatmap and status
 * - Policy assignments and management
 * - Real-time governance monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Policy as PolicyIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

// Self-contained components for right panel (no external links)

// Import governance services
import { UniversalGovernanceAdapter } from '../../services/UniversalGovernanceAdapter';

interface GovernancePanelProps {
  userId: string;
  userName: string;
  currentAgentId?: string;
  currentAgentName?: string;
}

interface GovernanceStatus {
  overall_score: number;
  trust_level: 'high' | 'medium' | 'low';
  active_policies: number;
  compliance_status: 'compliant' | 'warning' | 'violation';
  recent_violations: number;
  pending_approvals: number;
}

interface GovernanceMetrics {
  trust_score: number;
  policy_compliance: number;
  risk_score: number;
  audit_score: number;
  last_updated: string;
}

type GovernanceTabType = 'overview' | 'trust' | 'policies' | 'heatmap';

const GovernancePanel: React.FC<GovernancePanelProps> = ({
  userId,
  userName,
  currentAgentId,
  currentAgentName
}) => {
  // State
  const [activeTab, setActiveTab] = useState<GovernanceTabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [governanceStatus, setGovernanceStatus] = useState<GovernanceStatus | null>(null);
  const [governanceMetrics, setGovernanceMetrics] = useState<GovernanceMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Services
  const [governanceAdapter] = useState(() => UniversalGovernanceAdapter.getInstance());

  // =====================================
  // INITIALIZATION
  // =====================================

  useEffect(() => {
    initializeGovernance();
  }, [userId, currentAgentId]);

  const initializeGovernance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load governance status
      await loadGovernanceStatus();
      
      // Load governance metrics
      await loadGovernanceMetrics();

    } catch (err) {
      console.error('Error initializing governance:', err);
      setError('Failed to load governance data');
    } finally {
      setLoading(false);
    }
  };

  const loadGovernanceStatus = async () => {
    try {
      // Mock governance status (would integrate with real backend)
      const status: GovernanceStatus = {
        overall_score: 87,
        trust_level: 'high',
        active_policies: 12,
        compliance_status: 'compliant',
        recent_violations: 0,
        pending_approvals: 2
      };
      
      setGovernanceStatus(status);
    } catch (err) {
      console.error('Error loading governance status:', err);
    }
  };

  const loadGovernanceMetrics = async () => {
    try {
      // Mock governance metrics (would integrate with real backend)
      const metrics: GovernanceMetrics = {
        trust_score: 0.87,
        policy_compliance: 0.94,
        risk_score: 0.23,
        audit_score: 0.91,
        last_updated: new Date().toISOString()
      };
      
      setGovernanceMetrics(metrics);
    } catch (err) {
      console.error('Error loading governance metrics:', err);
    }
  };

  // =====================================
  // EVENT HANDLERS
  // =====================================

  const handleTabChange = (event: React.SyntheticEvent, newValue: GovernanceTabType) => {
    setActiveTab(newValue);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGovernanceStatus();
      await loadGovernanceMetrics();
    } catch (err) {
      console.error('Error refreshing governance data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================
  // RENDER HELPERS
  // =====================================

  const renderGovernanceOverview = () => {
    if (!governanceStatus || !governanceMetrics) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading governance overview...
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        {/* Status Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight="medium">
                    Overall Score
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary" sx={{ mt: 0.5 }}>
                  {governanceStatus.overall_score}
                </Typography>
                <Chip 
                  label={governanceStatus.trust_level.toUpperCase()} 
                  size="small" 
                  color={governanceStatus.trust_level === 'high' ? 'success' : 
                         governanceStatus.trust_level === 'medium' ? 'warning' : 'error'}
                  sx={{ mt: 0.5 }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PolicyIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight="medium">
                    Active Policies
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary" sx={{ mt: 0.5 }}>
                  {governanceStatus.active_policies}
                </Typography>
                <Chip 
                  label={governanceStatus.compliance_status.toUpperCase()} 
                  size="small" 
                  color={governanceStatus.compliance_status === 'compliant' ? 'success' : 
                         governanceStatus.compliance_status === 'warning' ? 'warning' : 'error'}
                  sx={{ mt: 0.5 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Metrics */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Governance Metrics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Trust Score
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {Math.round(governanceMetrics.trust_score * 100)}%
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Policy Compliance
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {Math.round(governanceMetrics.policy_compliance * 100)}%
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Risk Score
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {Math.round(governanceMetrics.risk_score * 100)}%
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Audit Score
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {Math.round(governanceMetrics.audit_score * 100)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Alerts */}
        {governanceStatus.recent_violations > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {governanceStatus.recent_violations} recent governance violation(s) detected
            </Typography>
          </Alert>
        )}

        {governanceStatus.pending_approvals > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {governanceStatus.pending_approvals} governance approval(s) pending
            </Typography>
          </Alert>
        )}

        {/* Quick Actions */}
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label="View Policies" 
                size="small" 
                clickable 
                onClick={() => setActiveTab('policies')}
                icon={<PolicyIcon />}
              />
              <Chip 
                label="Trust Network" 
                size="small" 
                clickable 
                onClick={() => setActiveTab('trust')}
                icon={<TrendingUpIcon />}
              />
              <Chip 
                label="Governance Map" 
                size="small" 
                clickable 
                onClick={() => setActiveTab('heatmap')}
                icon={<AssessmentIcon />}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderTrustNetwork = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Trust Metrics
        </Typography>
        
        {/* Compact trust visualization for right panel */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    87%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trust Score
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    12
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trusted Agents
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Trust trend indicators */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">Agent Trust</Typography>
            <Chip label="High" size="small" color="success" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">Policy Compliance</Typography>
            <Chip label="Excellent" size="small" color="success" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">Risk Level</Typography>
            <Chip label="Low" size="small" color="success" />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderPolicyAssignment = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Policy Status
        </Typography>
        
        {/* Active policies summary */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Active Policies
              </Typography>
              <Typography variant="h6" color="primary">
                12
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Compliance Rate
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight="medium">
                94%
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Policy categories */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">Security Policies</Typography>
            <Chip label="5 Active" size="small" color="primary" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">Data Policies</Typography>
            <Chip label="4 Active" size="small" color="primary" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">Access Policies</Typography>
            <Chip label="3 Active" size="small" color="primary" />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderGovernanceHeatmap = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Governance Status
        </Typography>
        
        {/* Status grid */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent sx={{ p: 1, textAlign: 'center', '&:last-child': { pb: 1 } }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="caption" display="block">
                  Compliant
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent sx={{ p: 1, textAlign: 'center', '&:last-child': { pb: 1 } }}>
                <WarningIcon fontSize="small" />
                <Typography variant="caption" display="block">
                  2 Warnings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent activity */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Recent Activity
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon fontSize="small" color="success" />
            <Typography variant="body2">Policy updated</Typography>
            <Typography variant="caption" color="text.secondary">2m ago</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon fontSize="small" color="primary" />
            <Typography variant="body2">Trust score increased</Typography>
            <Typography variant="caption" color="text.secondary">5m ago</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon fontSize="small" color="warning" />
            <Typography variant="body2">Approval pending</Typography>
            <Typography variant="caption" color="text.secondary">10m ago</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderGovernanceOverview();
      case 'trust':
        return renderTrustNetwork();
      case 'policies':
        return renderPolicyAssignment();
      case 'heatmap':
        return renderGovernanceHeatmap();
      default:
        return renderGovernanceOverview();
    }
  };

  // =====================================
  // MAIN RENDER
  // =====================================

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 200,
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading governance data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          Governance Dashboard
        </Typography>
        
        <Tooltip title="Refresh governance data">
          <IconButton 
            size="small" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              fontSize: '0.75rem',
              py: 1
            }
          }}
        >
          <Tab 
            label="Overview" 
            value="overview"
            icon={<SecurityIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab 
            label="Trust" 
            value="trust"
            icon={<TrendingUpIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab 
            label="Policies" 
            value="policies"
            icon={<PolicyIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab 
            label="Heatmap" 
            value="heatmap"
            icon={<AssessmentIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default GovernancePanel;

