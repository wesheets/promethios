/**
 * VERITAS Admin Panel
 * 
 * This component provides an administrative interface for configuring and
 * controlling the enhanced VERITAS verification system.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { 
  InfoOutlined, 
  SecurityOutlined, 
  SettingsOutlined,
  ToggleOn,
  ToggleOff,
  Domain,
  Psychology,
  BarChart,
  History
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DomainConfig } from '../veritasConfig';
import { VeritasMetricsData } from '../veritasMetrics';

// Styled components for enhanced visual appeal
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const StatusIndicator = styled('div')<{ active: boolean }>(({ theme, active }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: active ? theme.palette.success.main : theme.palette.error.main,
  marginRight: theme.spacing(1),
  boxShadow: active ? `0 0 8px ${theme.palette.success.main}` : 'none',
  transition: 'all 0.3s ease'
}));

const AnimatedToggle = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    transform: 'translateX(16px)',
    color: theme.palette.primary.main,
    '& + .MuiSwitch-track': {
      backgroundColor: theme.palette.primary.main,
      opacity: 0.5,
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)',
    transition: theme.transitions.create(['transform'], {
      duration: 500,
    }),
  }
}));

// Interface for component props
interface VeritasAdminPanelProps {
  onConfigChange?: (config: any) => void;
  onToggleVeritas?: (enabled: boolean) => void;
}

// TabPanel component for tab content
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`veritas-tabpanel-${index}`}
      aria-labelledby={`veritas-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

/**
 * VERITAS Admin Panel Component
 */
export const VeritasAdminPanel: React.FC<VeritasAdminPanelProps> = ({
  onConfigChange,
  onToggleVeritas
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [veritasEnabled, setVeritasEnabled] = useState(true);
  const [domainSpecificEnabled, setDomainSpecificEnabled] = useState(true);
  const [uncertaintyRewardEnabled, setUncertaintyRewardEnabled] = useState(true);
  const [domains, setDomains] = useState<DomainConfig[]>([
    {
      id: 'legal',
      name: 'Legal',
      riskLevel: 'high',
      confidenceThreshold: 90,
      evidenceRequirement: 80,
      blockingEnabled: true,
      uncertaintyRequired: true,
      keywords: ['court', 'legal', 'law', 'judge', 'attorney', 'lawsuit']
    },
    {
      id: 'medical',
      name: 'Medical',
      riskLevel: 'high',
      confidenceThreshold: 90,
      evidenceRequirement: 80,
      blockingEnabled: true,
      uncertaintyRequired: true,
      keywords: ['health', 'medical', 'doctor', 'disease', 'treatment', 'diagnosis']
    },
    {
      id: 'historical',
      name: 'Historical',
      riskLevel: 'medium',
      confidenceThreshold: 70,
      evidenceRequirement: 60,
      blockingEnabled: true,
      uncertaintyRequired: false,
      keywords: ['history', 'historical', 'ancient', 'century', 'era', 'period']
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      riskLevel: 'low',
      confidenceThreshold: 50,
      evidenceRequirement: 40,
      blockingEnabled: false,
      uncertaintyRequired: false,
      keywords: ['movie', 'film', 'actor', 'actress', 'entertainment', 'celebrity']
    }
  ]);
  const [selectedDomain, setSelectedDomain] = useState<string>('legal');
  const [metrics, setMetrics] = useState<VeritasMetricsData>({
    verificationCounts: {
      total: 120,
      blocked: 15,
      allowed: 105
    },
    domainClassification: {
      total: 120,
      correct: 112,
      byDomain: {
        legal: { correct: 28, total: 30 },
        medical: { correct: 25, total: 28 },
        historical: { correct: 32, total: 35 },
        entertainment: { correct: 27, total: 27 }
      }
    },
    uncertaintyDetection: {
      detected: 45,
      missed: 8,
      incorrectlyIdentified: 3
    },
    trustAdjustments: {
      adjustmentCount: 120,
      totalPenalty: 75,
      totalBonus: 25,
      netAdjustment: -50
    },
    performance: {
      processingCount: 120,
      averageProcessingTime: 125,
      processingTimesByDomain: {
        legal: 145,
        medical: 140,
        historical: 120,
        entertainment: 95
      }
    },
    toggle: {
      enableCount: 5,
      disableCount: 3,
      averageEnableTime: 120,
      averageDisableTime: 80
    }
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle VERITAS toggle
  const handleVeritasToggle = () => {
    const newState = !veritasEnabled;
    setVeritasEnabled(newState);
    if (onToggleVeritas) {
      onToggleVeritas(newState);
    }
  };

  // Handle domain-specific toggle
  const handleDomainSpecificToggle = () => {
    setDomainSpecificEnabled(!domainSpecificEnabled);
  };

  // Handle uncertainty reward toggle
  const handleUncertaintyRewardToggle = () => {
    setUncertaintyRewardEnabled(!uncertaintyRewardEnabled);
  };

  // Handle domain selection
  const handleDomainChange = (domainId: string) => {
    setSelectedDomain(domainId);
  };

  // Handle domain config change
  const handleDomainConfigChange = (field: string, value: any) => {
    const updatedDomains = domains.map(domain => {
      if (domain.id === selectedDomain) {
        return { ...domain, [field]: value };
      }
      return domain;
    });
    setDomains(updatedDomains);
  };

  // Update config when settings change
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        enabled: veritasEnabled,
        domainSpecificEnabled,
        uncertaintyRewardEnabled,
        domains
      });
    }
  }, [veritasEnabled, domainSpecificEnabled, uncertaintyRewardEnabled, domains, onConfigChange]);

  // Get the currently selected domain
  const currentDomain = domains.find(d => d.id === selectedDomain) || domains[0];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          width: '150px', 
          height: '150px', 
          background: `radial-gradient(circle, ${theme.palette.primary.main}22 0%, transparent 70%)`,
          borderRadius: '0 0 0 100%',
          zIndex: 0
        }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
          <SecurityOutlined fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            VERITAS Administration
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StatusIndicator active={veritasEnabled} />
            <Typography variant="body2" color={veritasEnabled ? 'success.main' : 'error.main'} sx={{ mr: 2 }}>
              {veritasEnabled ? 'Active' : 'Inactive'}
            </Typography>
            <IconButton 
              color={veritasEnabled ? 'primary' : 'default'} 
              onClick={handleVeritasToggle}
              sx={{ 
                transition: 'all 0.3s ease',
                transform: veritasEnabled ? 'none' : 'rotate(180deg)'
              }}
            >
              {veritasEnabled ? <ToggleOn fontSize="large" /> : <ToggleOff fontSize="large" />}
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ position: 'relative', zIndex: 1 }}>
          Configure and monitor the enhanced VERITAS verification system for AI governance.
        </Typography>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="VERITAS admin tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: '64px',
              fontSize: '0.9rem'
            }
          }}
        >
          <Tab icon={<SettingsOutlined />} label="General Settings" iconPosition="start" />
          <Tab icon={<Domain />} label="Domain Configuration" iconPosition="start" />
          <Tab icon={<Psychology />} label="Uncertainty Detection" iconPosition="start" />
          <Tab icon={<BarChart />} label="Performance Metrics" iconPosition="start" />
          <Tab icon={<History />} label="Activity Log" iconPosition="start" />
        </Tabs>
      </Box>

      {/* General Settings Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader 
                title="System Status" 
                subheader="Control the VERITAS verification system"
                avatar={<SecurityOutlined color="primary" />}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    VERITAS Verification
                  </Typography>
                  <AnimatedToggle
                    checked={veritasEnabled}
                    onChange={handleVeritasToggle}
                    inputProps={{ 'aria-label': 'toggle VERITAS' }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {veritasEnabled 
                    ? "VERITAS is currently active and verifying content according to configured settings."
                    : "VERITAS is currently disabled. No verification or trust adjustments will be applied."}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Last toggled: 2 hours ago
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader 
                title="Core Features" 
                subheader="Enable or disable specific VERITAS capabilities"
                avatar={<SettingsOutlined color="primary" />}
              />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={domainSpecificEnabled} 
                        onChange={handleDomainSpecificToggle}
                        disabled={!veritasEnabled}
                      />
                    }
                    label="Domain-Specific Verification"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Apply different verification standards based on content domain
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={uncertaintyRewardEnabled} 
                        onChange={handleUncertaintyRewardToggle}
                        disabled={!veritasEnabled}
                      />
                    }
                    label="Uncertainty Expression Reward"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                    Reward appropriate expression of uncertainty in responses
                  </Typography>
                </FormGroup>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="System Overview" 
                subheader="Current verification statistics"
                avatar={<InfoOutlined color="primary" />}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h4" color="primary">
                        {metrics.verificationCounts.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Verifications
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h4" color="error">
                        {metrics.verificationCounts.blocked}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Blocked Responses
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h4" color="success.main">
                        {metrics.verificationCounts.allowed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Allowed Responses
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h4" color={metrics.trustAdjustments.netAdjustment >= 0 ? 'success.main' : 'error'}>
                        {metrics.trustAdjustments.netAdjustment}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Net Trust Adjustment
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Domain Configuration Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardHeader 
                title="Domain Selection" 
                subheader="Configure verification by domain"
              />
              <CardContent>
                <Stack spacing={2}>
                  {domains.map((domain) => (
                    <Button
                      key={domain.id}
                      variant={selectedDomain === domain.id ? "contained" : "outlined"}
                      onClick={() => handleDomainChange(domain.id)}
                      startIcon={<Domain />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                    >
                      {domain.name}
                      <Box 
                        sx={{ 
                          ml: 'auto', 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%',
                          bgcolor: domain.riskLevel === 'high' 
                            ? 'error.main' 
                            : domain.riskLevel === 'medium' 
                              ? 'warning.main' 
                              : 'success.main'
                        }} 
                      />
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={8}>
            <StyledCard>
              <CardHeader 
                title={`${currentDomain.name} Domain Configuration`}
                subheader={`Risk Level: ${currentDomain.riskLevel.charAt(0).toUpperCase() + currentDomain.riskLevel.slice(1)}`}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Confidence Threshold</Typography>
                    <Slider
                      value={currentDomain.confidenceThreshold}
                      onChange={(_, value) => handleDomainConfigChange('confidenceThreshold', value)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={0}
                      max={100}
                      disabled={!veritasEnabled || !domainSpecificEnabled}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Minimum confidence required for verification
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Evidence Requirement</Typography>
                    <Slider
                      value={currentDomain.evidenceRequirement}
                      onChange={(_, value) => handleDomainConfigChange('evidenceRequirement', value)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={0}
                      max={100}
                      disabled={!veritasEnabled || !domainSpecificEnabled}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Minimum evidence strength required
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={currentDomain.blockingEnabled}
                            onChange={(_, checked) => handleDomainConfigChange('blockingEnabled', checked)}
                            disabled={!veritasEnabled || !domainSpecificEnabled}
                          />
                        }
                        label="Enable Content Blocking"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                        Block responses that fail verification in this domain
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={currentDomain.uncertaintyRequired}
                            onChange={(_, checked) => handleDomainConfigChange('uncertaintyRequired', checked)}
                            disabled={!veritasEnabled || !domainSpecificEnabled || !uncertaintyRewardEnabled}
                          />
                        }
                        label="Require Uncertainty Expression"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                        Require uncertainty qualifiers for unverified claims
                      </Typography>
                    </FormGroup>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography gutterBottom>Domain Keywords</Typography>
                    <TextField
                      fullWidth
                      value={currentDomain.keywords.join(', ')}
                      onChange={(e) => handleDomainConfigChange('keywords', e.target.value.split(', '))}
                      helperText="Comma-separated keywords for domain classification"
                      disabled={!veritasEnabled || !domainSpecificEnabled}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Uncertainty Detection Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>Uncertainty Detection Configuration</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure how VERITAS detects and evaluates expressions of uncertainty in responses. Fine-tune patterns and thresholds to balance factual accuracy with appropriate humility.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="Detection Settings" avatar={<Psychology color="primary" />} />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={uncertaintyRewardEnabled} 
                        onChange={handleUncertaintyRewardToggle}
                        disabled={!veritasEnabled}
                      />
                    }
                    label="Enable Uncertainty Reward System"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Reward agents for appropriately expressing uncertainty when verification confidence is low.
                  </Typography>
                </FormGroup>
                
                <Divider sx={{ my: 2 }} />

                <Typography gutterBottom>Uncertainty Confidence Threshold</Typography>
                <Slider
                  defaultValue={60} // Placeholder value, replace with actual state
                  // onChange={(_, value) => handleUncertaintyConfigChange("threshold", value)}
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                  disabled={!veritasEnabled || !uncertaintyRewardEnabled}
                />
                <Typography variant="caption" color="text.secondary">
                  Confidence level below which uncertainty expression is encouraged/rewarded.
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader title="Uncertainty Patterns" subheader="Manage phrases indicating uncertainty" />
              <CardContent>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  defaultValue={[
                    "I think",
                    "It seems",
                    "Based on my knowledge",
                    "appears to be",
                    "might be",
                    "could be",
                    "possibly"
                  ].join("\n")} // Placeholder value, replace with actual state
                  // onChange={(e) => handleUncertaintyConfigChange("patterns", e.target.value.split("\n"))}
                  helperText="Enter one pattern per line. These phrases will be recognized as uncertainty expressions."
                  disabled={!veritasEnabled || !uncertaintyRewardEnabled}
                />
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12}>
            <StyledCard>
              <CardHeader title="Test Uncertainty Detection" />
              <CardContent>
                <TextField
                  fullWidth
                  label="Enter text to test detection"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" disabled={!veritasEnabled || !uncertaintyRewardEnabled}>
                  Test Detection
                </Button>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {/* Placeholder for test results */}
                  Test results will appear here...
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Metrics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" sx={{ mb: 2 }}>Performance Metrics</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Monitor the performance and effectiveness of the VERITAS verification system in real-time.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="Real-time Verification Performance" 
                subheader="Last 24 hours of verification activity"
                avatar={<BarChart color="primary" />}
              />
              <CardContent sx={{ height: 300 }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                }}>
                  <Typography variant="body1" color="primary" sx={{ mb: 2 }}>
                    Verification Activity Timeline
                  </Typography>
                  
                  {/* Placeholder for chart - would be replaced with actual chart component */}
                  <Box sx={{ 
                    width: '90%', 
                    height: '60%', 
                    position: 'relative',
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* Simulated chart lines */}
                    <Box sx={{ 
                      position: 'absolute', 
                      top: '30%', 
                      left: 0, 
                      width: '100%', 
                      height: '2px', 
                      bgcolor: theme.palette.primary.main,
                      opacity: 0.7,
                      zIndex: 1
                    }} />
                    <Box sx={{ 
                      position: 'absolute', 
                      top: '60%', 
                      left: 0, 
                      width: '100%', 
                      height: '2px', 
                      bgcolor: theme.palette.error.main,
                      opacity: 0.7,
                      zIndex: 1
                    }} />
                    
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-end' }}>
                      Total: {metrics.verificationCounts.total} verifications
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mt: 2, gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.primary.main, mr: 1, borderRadius: '50%' }} />
                      <Typography variant="caption">Allowed</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.error.main, mr: 1, borderRadius: '50%' }} />
                      <Typography variant="caption">Blocked</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader 
                title="Processing Performance" 
                subheader="Response time analysis"
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h5" color="primary">
                        {metrics.performance.averageProcessingTime} ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Processing Time
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h5" color="secondary">
                        {metrics.performance.processingCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Processed
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Processing Time by Domain</Typography>
                <Box sx={{ px: 1 }}>
                  {Object.entries(metrics.performance.processingTimesByDomain).map(([domain, time]) => (
                    <Box key={domain} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{domain.charAt(0).toUpperCase() + domain.slice(1)}</Typography>
                        <Typography variant="body2">{time} ms</Typography>
                      </Box>
                      <Box sx={{ width: '100%', bgcolor: 'background.default', borderRadius: 1, height: 8 }}>
                        <Box 
                          sx={{ 
                            height: '100%', 
                            width: `${Math.min(100, (time / 150) * 100)}%`,
                            bgcolor: domain === 'legal' || domain === 'medical' ? 'error.main' : 
                                    domain === 'historical' ? 'warning.main' : 'success.main',
                            borderRadius: 1
                          }} 
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardHeader 
                title="Performance Alerts" 
                subheader="Configure performance monitoring"
              />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable Performance Alerts"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Receive notifications when performance metrics exceed thresholds
                  </Typography>
                </FormGroup>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography gutterBottom>Processing Time Threshold (ms)</Typography>
                <Slider
                  defaultValue={200}
                  valueLabelDisplay="auto"
                  step={10}
                  marks
                  min={50}
                  max={500}
                />
                <Typography variant="caption" color="text.secondary">
                  Alert when average processing time exceeds this threshold
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Button variant="outlined" color="primary" fullWidth>
                    View Alert History
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Activity Log Tab */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>Activity Log</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          View the history of VERITAS verification activities and configuration changes. Track system events and user actions.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="Log Filters" 
                subheader="Refine log display"
                avatar={<History color="primary" />}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Typography variant="caption" gutterBottom>Event Type</Typography>
                      <TextField
                        select
                        defaultValue="all"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        <option value="all">All Events</option>
                        <option value="verification">Verification</option>
                        <option value="configuration">Configuration</option>
                        <option value="toggle">Toggle</option>
                        <option value="error">Error</option>
                      </TextField>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Typography variant="caption" gutterBottom>Domain</Typography>
                      <TextField
                        select
                        defaultValue="all"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        <option value="all">All Domains</option>
                        <option value="legal">Legal</option>
                        <option value="medical">Medical</option>
                        <option value="historical">Historical</option>
                        <option value="entertainment">Entertainment</option>
                      </TextField>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Typography variant="caption" gutterBottom>Time Range</Typography>
                      <TextField
                        select
                        defaultValue="24h"
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                      </TextField>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button variant="contained" fullWidth>
                      Apply Filters
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="Activity Log" 
                subheader="Recent system events"
                action={
                  <Button size="small" startIcon={<BarChart />}>
                    Export Log
                  </Button>
                }
              />
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  maxHeight: '400px', 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: theme.palette.background.default,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.divider,
                    borderRadius: '4px',
                  }
                }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                    <Box component="thead" sx={{ position: 'sticky', top: 0, bgcolor: theme.palette.background.paper, zIndex: 1 }}>
                      <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box component="th" sx={{ py: 2, px: 2, textAlign: 'left' }}>Timestamp</Box>
                        <Box component="th" sx={{ py: 2, px: 2, textAlign: 'left' }}>Event Type</Box>
                        <Box component="th" sx={{ py: 2, px: 2, textAlign: 'left' }}>Domain</Box>
                        <Box component="th" sx={{ py: 2, px: 2, textAlign: 'left' }}>Description</Box>
                        <Box component="th" sx={{ py: 2, px: 2, textAlign: 'center' }}>Status</Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {/* Sample log entries */}
                      <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>2025-06-02 15:45:12</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Verification</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Legal</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Verified claim about Turner v. Cognivault</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                          <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: theme.palette.error.main + '22', color: theme.palette.error.main }}>
                            Blocked
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>2025-06-02 15:42:37</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Verification</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Historical</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Verified claim about Neil Armstrong quote</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                          <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: theme.palette.success.main + '22', color: theme.palette.success.main }}>
                            Allowed
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>2025-06-02 15:30:05</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Configuration</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>System</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Updated uncertainty detection patterns</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                          <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: theme.palette.info.main + '22', color: theme.palette.info.main }}>
                            Updated
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>2025-06-02 15:15:22</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Toggle</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>System</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>VERITAS system enabled</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                          <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: theme.palette.success.main + '22', color: theme.palette.success.main }}>
                            Enabled
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>2025-06-02 14:58:41</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Verification</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Entertainment</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2 }}>Verified claim about Monopoly Man monocle</Box>
                        <Box component="td" sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                          <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: theme.palette.warning.main + '22', color: theme.palette.warning.main }}>
                            Warning
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button size="small" disabled>Previous</Button>
                <Typography variant="body2" color="text.secondary">
                  Showing 5 of 120 entries
                </Typography>
                <Button size="small">Next</Button>
              </Box>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12}>
            <StyledCard>
              <CardHeader 
                title="Log Management" 
                subheader="Configure log retention and export settings"
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Log Retention Period (days)</Typography>
                    <Slider
                      defaultValue={30}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={7}
                      max={90}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Logs older than this will be automatically purged
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormGroup>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Enable Automatic Log Export"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                        Automatically export logs to storage at midnight
                      </Typography>
                      
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Include Detailed Event Data"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                        Include full event details in log exports
                      </Typography>
                    </FormGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default VeritasAdminPanel;
