/**
 * CrisisSafetyDashboard - Real-time monitoring of crisis detection and safety metrics
 * Provides oversight and control for mental health safety features
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Warning,
  Security,
  Psychology,
  Emergency,
  TrendingUp,
  Settings,
  Visibility,
  Block,
  CheckCircle,
  Error
} from '@mui/icons-material';
import EnhancedGovernanceIntegration, { SafetyPolicy } from '../../services/EnhancedGovernanceIntegration';
import CrisisDetectionService from '../../services/CrisisDetectionService';

interface SafetyMetrics {
  totalInteractions: number;
  crisisInterventions: number;
  policyViolations: number;
  escalations: number;
  userRiskDistribution: Record<string, number>;
  interventionEffectiveness: number;
}

interface RecentIncident {
  id: string;
  timestamp: string;
  type: 'crisis' | 'policy_violation' | 'safety_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  agentId: string;
  status: 'active' | 'resolved' | 'escalated';
  description: string;
}

const CrisisSafetyDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null);
  const [safetyPolicies, setSafetyPolicies] = useState<SafetyPolicy[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SafetyPolicy | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const enhancedGovernance = EnhancedGovernanceIntegration.getInstance();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [metricsData, policiesData] = await Promise.all([
        enhancedGovernance.getSafetyMetrics(selectedTimeRange),
        Promise.resolve(enhancedGovernance.getSafetyPolicies())
      ]);

      setMetrics(metricsData);
      setSafetyPolicies(policiesData);
      
      // Mock recent incidents data
      setRecentIncidents([
        {
          id: 'inc_001',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'crisis',
          severity: 'high',
          userId: 'user_123',
          agentId: 'agent_456',
          status: 'resolved',
          description: 'Suicide ideation detected, resources provided'
        },
        {
          id: 'inc_002',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          type: 'policy_violation',
          severity: 'medium',
          userId: 'user_789',
          agentId: 'agent_456',
          status: 'resolved',
          description: 'Inappropriate content blocked'
        }
      ]);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyToggle = (policyId: string, enabled: boolean) => {
    const success = enhancedGovernance.updateSafetyPolicy(policyId, { enabled });
    if (success) {
      setSafetyPolicies(prev => 
        prev.map(policy => 
          policy.id === policyId ? { ...policy, enabled } : policy
        )
      );
    }
  };

  const handleTestCrisisDetection = async () => {
    if (!testMessage.trim()) return;
    
    try {
      const result = await enhancedGovernance.testCrisisDetection(testMessage);
      setTestResult(result);
    } catch (error) {
      console.error('Crisis detection test failed:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle sx={{ color: '#22c55e' }} />;
      case 'escalated': return <Warning sx={{ color: '#f97316' }} />;
      case 'active': return <Error sx={{ color: '#ef4444' }} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading safety dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#0f172a', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Security sx={{ color: '#3b82f6' }} />
          Crisis Safety Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small">
            <InputLabel sx={{ color: '#94a3b8' }}>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              sx={{ color: 'white', minWidth: 120 }}
            >
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setPolicyDialogOpen(true)}
            sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}
          >
            Configure Policies
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Psychology sx={{ color: '#3b82f6', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white' }}>
                    {metrics?.crisisInterventions || 0}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8' }}>Crisis Interventions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Block sx={{ color: '#f97316', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white' }}>
                    {metrics?.policyViolations || 0}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8' }}>Policy Violations</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Emergency sx={{ color: '#ef4444', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white' }}>
                    {metrics?.escalations || 0}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8' }}>Escalations</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ color: '#22c55e', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white' }}>
                    {Math.round((metrics?.interventionEffectiveness || 0) * 100)}%
                  </Typography>
                  <Typography sx={{ color: '#94a3b8' }}>Effectiveness</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Risk Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                User Risk Distribution
              </Typography>
              
              {metrics?.userRiskDistribution && Object.entries(metrics.userRiskDistribution).map(([level, count]) => (
                <Box key={level} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#94a3b8', textTransform: 'capitalize' }}>
                      {level} Risk
                    </Typography>
                    <Typography sx={{ color: 'white' }}>{count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(count / metrics.totalInteractions) * 100}
                    sx={{
                      bgcolor: '#334155',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getSeverityColor(level)
                      }
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Test Crisis Detection
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Enter a message to test crisis detection..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' }
                  }
                }}
              />
              
              <Button
                variant="contained"
                onClick={handleTestCrisisDetection}
                disabled={!testMessage.trim()}
                sx={{ mb: 2 }}
              >
                Test Detection
              </Button>
              
              {testResult && (
                <Alert 
                  severity={testResult.shouldIntervene ? 'warning' : 'success'}
                  sx={{ mt: 2 }}
                >
                  <Typography variant="subtitle2">
                    {testResult.shouldIntervene ? 'Crisis Detected' : 'No Crisis Detected'}
                  </Typography>
                  {testResult.message && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {testResult.message}
                    </Typography>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Incidents */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Recent Safety Incidents
          </Typography>
          
          <TableContainer component={Paper} sx={{ bgcolor: '#0f172a' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8' }}>Time</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Type</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Severity</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell sx={{ color: 'white' }}>
                      {new Date(incident.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={incident.type.replace('_', ' ')}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={incident.severity}
                        size="small"
                        sx={{
                          bgcolor: getSeverityColor(incident.severity),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(incident.status)}
                        <Typography sx={{ color: 'white', textTransform: 'capitalize' }}>
                          {incident.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>
                      {incident.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Safety Policies */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Active Safety Policies
          </Typography>
          
          <Grid container spacing={2}>
            {safetyPolicies.map((policy) => (
              <Grid item xs={12} md={6} key={policy.id}>
                <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: 'white' }}>
                          {policy.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {policy.description}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={policy.enabled}
                            onChange={(e) => handlePolicyToggle(policy.id, e.target.checked)}
                          />
                        }
                        label=""
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={policy.severity}
                        size="small"
                        sx={{
                          bgcolor: getSeverityColor(policy.severity),
                          color: 'white'
                        }}
                      />
                      <Chip
                        label={policy.action}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#94a3b8', borderColor: '#334155' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Policy Configuration Dialog */}
      <Dialog
        open={policyDialogOpen}
        onClose={() => setPolicyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configure Safety Policies</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Manage crisis detection and safety policies for AI interactions.
          </Typography>
          {/* Policy configuration form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CrisisSafetyDashboard;

