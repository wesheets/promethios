/**
 * Observer Console
 * 
 * A comprehensive dashboard for monitoring constitutional observers (PRISM and VIGIL)
 * in the Promethios governance framework. This console provides real-time visibility
 * into observer activities, violations, and governance metrics.
 * 
 * @module ui/observers/console
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardHeader, CardContent, Typography, Tabs, Tab, Box, Button, Chip, Alert, LinearProgress } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle, XCircle, Info, Activity, Eye } from 'lucide-react';

// Import components
import PrismDashboard from './PrismDashboard';
import VigilDashboard from './VigilDashboard';
import ViolationAlerts from './ViolationAlerts';
import ConfigurationPanel from './ConfigurationPanel';

// Import services
import { fetchObserverStatus, fetchViolations, fetchAnalytics } from '../../services/observers';
import { registerWithPhaseChangeTracker } from '../../tools/phase-change-tracker';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ObserverConsole = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [observerStatus, setObserverStatus] = useState({
    prism: { enabled: true, status: 'active', violations: 0 },
    vigil: { enabled: true, status: 'staged', violations: 0 }
  });
  const [violations, setViolations] = useState([]);
  const [analytics, setAnalytics] = useState({
    prism: { traceStats: {}, sourceTypes: {} },
    vigil: { driftStats: {}, adherenceDistribution: {} }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  // Register with Phase Change Tracker
  useEffect(() => {
    try {
      registerWithPhaseChangeTracker({
        componentType: 'ui',
        componentName: 'observer_console',
        version: '1.0.0',
        apis: [
          { name: 'viewObserverStatus', version: '1.0.0', description: 'View status of constitutional observers' },
          { name: 'viewViolations', version: '1.0.0', description: 'View governance violations' },
          { name: 'configureObservers', version: '1.0.0', description: 'Configure observer settings' },
          { name: 'runDemonstration', version: '1.0.0', description: 'Run governance demonstration' }
        ]
      });
    } catch (error) {
      console.error('Failed to register with Phase Change Tracker', error);
    }
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statusData = await fetchObserverStatus();
        const violationsData = await fetchViolations();
        const analyticsData = await fetchAnalytics();
        
        setObserverStatus(statusData);
        setViolations(violationsData);
        setAnalytics(analyticsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch observer data. Please try again.');
        console.error('Error fetching observer data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Toggle demo mode
  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
  };

  // Run demonstration
  const runDemonstration = (demoType) => {
    // In a real implementation, this would trigger a demonstration scenario
    console.log(`Running ${demoType} demonstration`);
    
    // Simulate demonstration results
    setTimeout(() => {
      if (demoType === 'prism') {
        setViolations(prev => [
          {
            id: `demo-${Date.now()}`,
            type: 'missing_trace',
            observer: 'prism',
            severity: 'high',
            message: 'Belief has no trace information',
            timestamp: new Date().toISOString(),
            source: 'demonstration'
          },
          ...prev
        ]);
      } else if (demoType === 'vigil') {
        setViolations(prev => [
          {
            id: `demo-${Date.now()}`,
            type: 'significant_trust_decay',
            observer: 'vigil',
            severity: 'medium',
            message: 'Trust decreased by 23.5%',
            timestamp: new Date().toISOString(),
            source: 'demonstration'
          },
          ...prev
        ]);
      }
    }, 2000);
  };

  // Render summary metrics
  const renderSummaryMetrics = () => {
    const totalViolations = violations.length;
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    const prismViolations = violations.filter(v => v.observer === 'prism').length;
    const vigilViolations = violations.filter(v => v.observer === 'vigil').length;
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                <Shield style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Observer Status
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">
                  {observerStatus.prism.status === 'active' && observerStatus.vigil.status === 'active' ? 'Active' : 'Partial'}
                </Typography>
                <Chip 
                  label={observerStatus.prism.status === 'active' && observerStatus.vigil.status === 'active' ? 'All Systems Active' : 'Partial Coverage'} 
                  color={observerStatus.prism.status === 'active' && observerStatus.vigil.status === 'active' ? 'success' : 'warning'} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                <ShieldAlert style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Total Violations
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">{totalViolations}</Typography>
                <Chip 
                  label={highSeverityCount > 0 ? `${highSeverityCount} High Severity` : 'No High Severity'} 
                  color={highSeverityCount > 0 ? 'error' : 'success'} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                <Eye style={{ verticalAlign: 'middle', marginRight: 8 }} />
                PRISM Alerts
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">{prismViolations}</Typography>
                <Chip 
                  label={observerStatus.prism.status} 
                  color={observerStatus.prism.status === 'active' ? 'success' : 'warning'} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                <Activity style={{ verticalAlign: 'middle', marginRight: 8 }} />
                VIGIL Alerts
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">{vigilViolations}</Typography>
                <Chip 
                  label={observerStatus.vigil.status} 
                  color={observerStatus.vigil.status === 'active' ? 'success' : 'warning'} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render demonstration panel
  const renderDemonstrationPanel = () => {
    if (!demoMode) return null;
    
    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Governance Demonstration" />
        <CardContent>
          <Typography variant="body1" paragraph>
            Run demonstrations to see how Promethios constitutional observers detect and report governance violations in real-time.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Eye style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    PRISM Demonstration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Demonstrates how PRISM detects when an agent makes claims without proper source attribution.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => runDemonstration('prism')}
                    fullWidth
                  >
                    Run PRISM Demo
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Activity style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    VIGIL Demonstration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Shows how VIGIL identifies when an agent's trust score decays during operation.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => runDemonstration('vigil')}
                    fullWidth
                  >
                    Run VIGIL Demo
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Overview
        return (
          <>
            {renderSummaryMetrics()}
            {renderDemonstrationPanel()}
            <ViolationAlerts violations={violations} />
          </>
        );
      case 1: // PRISM
        return <PrismDashboard status={observerStatus.prism} analytics={analytics.prism} />;
      case 2: // VIGIL
        return <VigilDashboard status={observerStatus.vigil} analytics={analytics.vigil} />;
      case 3: // Configuration
        return <ConfigurationPanel observerStatus={observerStatus} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Shield style={{ verticalAlign: 'middle', marginRight: 12 }} />
          Constitutional Observer Console
        </Typography>
        <Button 
          variant="outlined" 
          color={demoMode ? "secondary" : "primary"} 
          onClick={toggleDemoMode}
        >
          {demoMode ? "Exit Demo Mode" : "Enter Demo Mode"}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading && <LinearProgress sx={{ mb: 4 }} />}
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4 }}>
        <Tab label="Overview" icon={<Info />} iconPosition="start" />
        <Tab label="PRISM" icon={<Eye />} iconPosition="start" />
        <Tab label="VIGIL" icon={<Activity />} iconPosition="start" />
        <Tab label="Configuration" icon={<Shield />} iconPosition="start" />
      </Tabs>
      
      {renderTabContent()}
    </Container>
  );
};

export default ObserverConsole;
