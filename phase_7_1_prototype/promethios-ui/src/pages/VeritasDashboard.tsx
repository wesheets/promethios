/**
 * Veritas Dashboard
 * 
 * A comprehensive dashboard for viewing verification analytics and configuring
 * agent verification settings. Integrates with the agent wrapper system.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { authApiService } from '../services/authApiService';

interface VerificationMetrics {
  totalVerifications: number;
  truthfulResponses: number;
  hallucinationDetected: number;
  averageConfidence: number;
  complianceScore: number;
}

interface AgentVerificationSettings {
  enabled: boolean;
  truthThreshold: number;
  confidenceThreshold: number;
  complianceLevel: 'basic' | 'enhanced' | 'enterprise';
  riskTolerance: 'low' | 'medium' | 'high';
  autoBlock: boolean;
  notifyOnHallucination: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`veritas-tabpanel-${index}`}
      aria-labelledby={`veritas-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const VeritasDashboard: React.FC = () => {
  // Authentication context
  const { currentUser } = useAuth();
  
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null);
  const [settings, setSettings] = useState<AgentVerificationSettings>({
    enabled: true,
    truthThreshold: 0.8,
    confidenceThreshold: 0.7,
    complianceLevel: 'enhanced',
    riskTolerance: 'medium',
    autoBlock: true,
    notifyOnHallucination: true
  });
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<any[]>([]);

  // Load verification data
  const loadVerificationData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Load verification metrics
      const metricsResponse = await authApiService.authenticatedFetch(
        currentUser,
        '/api/veritas-enterprise/metrics'
      );
      setMetrics(await metricsResponse.json());

      // Load verification history
      const historyResponse = await authApiService.authenticatedFetch(
        currentUser,
        '/api/veritas-enterprise/verification-history'
      );
      setVerificationHistory(await historyResponse.json());

      // Load agent performance data
      const performanceResponse = await authApiService.authenticatedFetch(
        currentUser,
        '/api/veritas-enterprise/agent-performance'
      );
      setAgentPerformance(await performanceResponse.json());

      // Load current settings
      const settingsResponse = await authApiService.authenticatedFetch(
        currentUser,
        '/api/veritas-enterprise/settings'
      );
      setSettings(await settingsResponse.json());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const saveSettings = async (newSettings: AgentVerificationSettings) => {
    if (!currentUser) return;

    try {
      await authApiService.authenticatedFetch(
        currentUser,
        '/api/veritas-enterprise/settings',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        }
      );
      setSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (currentUser) {
      loadVerificationData();
    }
  }, [currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (key: keyof AgentVerificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Please log in to access the Veritas Dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        Veritas Governance Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="veritas dashboard tabs">
          <Tab label="Overview" />
          <Tab label="Agent Settings" />
          <Tab label="Analytics" />
          <Tab label="Verification History" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Metrics Cards */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Verifications
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.totalVerifications || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Truthful Responses
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {metrics?.truthfulResponses || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Hallucinations Detected
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {metrics?.hallucinationDetected || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Compliance Score
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.complianceScore || 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics?.complianceScore || 0} 
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Verification Trends Chart */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Verification Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={verificationHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="truthful" stroke="#00C49F" name="Truthful" />
                      <Line type="monotone" dataKey="hallucination" stroke="#FF8042" name="Hallucination" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Agent Performance */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Agent Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={agentPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {agentPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Agent Settings Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enabled}
                      onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                    />
                  }
                  label="Enable Verification"
                  sx={{ mb: 2 }}
                />

                <Typography gutterBottom>
                  Truth Threshold: {settings.truthThreshold}
                </Typography>
                <Slider
                  value={settings.truthThreshold}
                  onChange={(e, value) => handleSettingChange('truthThreshold', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  marks
                  sx={{ mb: 3 }}
                />

                <Typography gutterBottom>
                  Confidence Threshold: {settings.confidenceThreshold}
                </Typography>
                <Slider
                  value={settings.confidenceThreshold}
                  onChange={(e, value) => handleSettingChange('confidenceThreshold', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  marks
                  sx={{ mb: 3 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Compliance Level</InputLabel>
                  <Select
                    value={settings.complianceLevel}
                    onChange={(e) => handleSettingChange('complianceLevel', e.target.value)}
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="enhanced">Enhanced</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Risk Tolerance</InputLabel>
                  <Select
                    value={settings.riskTolerance}
                    onChange={(e) => handleSettingChange('riskTolerance', e.target.value)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Settings
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoBlock}
                      onChange={(e) => handleSettingChange('autoBlock', e.target.checked)}
                    />
                  }
                  label="Auto-block Hallucinations"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifyOnHallucination}
                      onChange={(e) => handleSettingChange('notifyOnHallucination', e.target.checked)}
                    />
                  }
                  label="Notify on Hallucination Detection"
                  sx={{ mb: 2 }}
                />

                <Alert severity="info" sx={{ mt: 2 }}>
                  These settings will be applied to all your agents through the agent wrapper system.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Analytics
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={verificationHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="truthful" fill="#00C49F" name="Truthful" />
                    <Bar dataKey="hallucination" fill="#FF8042" name="Hallucination" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Verification History Tab */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Verifications
            </Typography>
            {verificationHistory.map((verification, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">
                    Agent: {verification.agentName}
                  </Typography>
                  <Chip 
                    label={verification.result} 
                    color={verification.result === 'truthful' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {verification.timestamp}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Confidence: {verification.confidence}%
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
};

export default VeritasDashboard;

