/**
 * CMU Benchmark Dashboard Integration
 * 
 * Integrates the constitutional observers and governance modules with the CMU benchmark
 * dashboard, providing real-time visualization of governance capabilities during benchmark tests.
 * 
 * @module ui/benchmark/GovernanceIntegration
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Box, Card, CardHeader, CardContent, Typography, Grid, Chip, Switch, FormControlLabel, Divider, Button, Alert } from '@mui/material';
import { Shield, Eye, Activity, AlertTriangle, CheckCircle, TrendingDown, FileText } from 'lucide-react';

// Import services
import { fetchObserverStatus, toggleObserver } from '../../services/observers';
import { registerWithPhaseChangeTracker } from '../../tools/phase-change-tracker';

const GovernanceIntegration = ({ benchmarkRunning, benchmarkData }) => {
  const [observersEnabled, setObserversEnabled] = useState({
    prism: true,
    vigil: true
  });
  const [observerStatus, setObserverStatus] = useState({
    prism: { status: 'active', violations: 0 },
    vigil: { status: 'staged', violations: 0 }
  });
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Register with Phase Change Tracker
  useEffect(() => {
    try {
      registerWithPhaseChangeTracker({
        componentType: 'ui',
        componentName: 'benchmark_governance_integration',
        version: '1.0.0',
        apis: [
          { name: 'toggleObservers', version: '1.0.0', description: 'Toggle observers during benchmark tests' },
          { name: 'viewGovernanceMetrics', version: '1.0.0', description: 'View governance metrics during benchmark tests' }
        ]
      });
    } catch (error) {
      console.error('Failed to register with Phase Change Tracker', error);
    }
  }, []);

  // Fetch observer status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusData = await fetchObserverStatus();
        setObserverStatus(statusData);
      } catch (err) {
        setError('Failed to fetch observer status');
        console.error('Error fetching observer status:', err);
      }
    };

    fetchStatus();
    
    // Set up polling if benchmark is running
    if (benchmarkRunning) {
      const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds during benchmark
      return () => clearInterval(interval);
    }
  }, [benchmarkRunning]);

  // Update violations when benchmark data changes
  useEffect(() => {
    if (benchmarkData && benchmarkData.governanceViolations) {
      setViolations(benchmarkData.governanceViolations);
    }
  }, [benchmarkData]);

  // Handle observer toggle
  const handleObserverToggle = async (observer) => {
    setLoading(true);
    try {
      const newState = !observersEnabled[observer];
      await toggleObserver(observer, newState);
      setObserversEnabled(prev => ({
        ...prev,
        [observer]: newState
      }));
      setError(null);
    } catch (err) {
      setError(`Failed to toggle ${observer} observer`);
      console.error(`Error toggling ${observer} observer:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Render observer controls
  const renderObserverControls = () => {
    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Shield style={{ marginRight: 8 }} />
            Governance Observers
          </Box>
        } />
        <CardContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enable or disable constitutional observers during benchmark tests to see how they monitor agent behavior.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Eye style={{ marginRight: 8 }} />
                    <Typography variant="h6">PRISM Observer</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Monitors belief trace compliance and manifest validation.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={observerStatus.prism.status} 
                      color={observerStatus.prism.status === 'active' ? 'success' : 'warning'} 
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={observersEnabled.prism}
                          onChange={() => handleObserverToggle('prism')}
                          disabled={loading || !benchmarkRunning}
                        />
                      }
                      label={observersEnabled.prism ? "Enabled" : "Disabled"}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Activity style={{ marginRight: 8 }} />
                    <Typography variant="h6">VIGIL Observer</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Tracks trust decay and loop outcome analysis.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={observerStatus.vigil.status} 
                      color={observerStatus.vigil.status === 'active' ? 'success' : 'warning'} 
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={observersEnabled.vigil}
                          onChange={() => handleObserverToggle('vigil')}
                          disabled={loading || !benchmarkRunning}
                        />
                      }
                      label={observersEnabled.vigil ? "Enabled" : "Disabled"}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render governance metrics
  const renderGovernanceMetrics = () => {
    // Only show metrics if benchmark is running
    if (!benchmarkRunning) {
      return (
        <Alert severity="info" sx={{ mb: 4 }}>
          Start a benchmark test to see real-time governance metrics.
        </Alert>
      );
    }

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingDown style={{ marginRight: 8 }} />
            Governance Metrics
          </Box>
        } />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>Belief Trace Coverage</Typography>
                  <Typography variant="h3" align="center">
                    {benchmarkData?.governanceMetrics?.beliefTraceCoverage || '0%'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Percentage of beliefs with proper source traces
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>Goal Adherence</Typography>
                  <Typography variant="h3" align="center">
                    {benchmarkData?.governanceMetrics?.goalAdherence || '0%'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Average adherence to original objectives
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>Trust Stability</Typography>
                  <Typography variant="h3" align="center">
                    {benchmarkData?.governanceMetrics?.trustStability || '0%'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Percentage of loops without trust decay
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render governance violations
  const renderGovernanceViolations = () => {
    if (!benchmarkRunning || violations.length === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AlertTriangle style={{ marginRight: 8 }} />
            Governance Violations
          </Box>
        } />
        <CardContent>
          {violations.map((violation, index) => (
            <Alert 
              key={index}
              severity={violation.severity === 'high' ? 'error' : violation.severity === 'medium' ? 'warning' : 'info'}
              sx={{ mb: 2 }}
              icon={violation.observer === 'prism' ? <Eye /> : <Activity />}
            >
              <Typography variant="subtitle2">
                {violation.observer.toUpperCase()}: {violation.type}
              </Typography>
              <Typography variant="body2">
                {violation.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(violation.timestamp).toLocaleString()}
              </Typography>
            </Alert>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {renderObserverControls()}
      {renderGovernanceMetrics()}
      {renderGovernanceViolations()}
    </Box>
  );
};

export default GovernanceIntegration;
