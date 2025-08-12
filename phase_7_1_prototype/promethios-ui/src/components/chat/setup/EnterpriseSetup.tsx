/**
 * Enterprise Setup Component
 * 
 * Comprehensive enterprise-grade chatbot setup with advanced features,
 * compliance controls, and enterprise integrations.
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Business as EnterpriseIcon,
  SmartToy as BotIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Policy as PolicyIcon,
  Assessment as ComplianceIcon,
  Group as TeamIcon,
  CloudUpload as CloudIcon,
  Integration as IntegrationIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  VpnLock as VpnIcon,
  Backup as BackupIcon,
  MonitorHeart as MonitorIcon,
  Support as SupportIcon,
} from '@mui/icons-material';

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

interface EnterpriseFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  premium: boolean;
}

const EnterpriseSetup: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [organizationName, setOrganizationName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [deploymentType, setDeploymentType] = useState('');
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [enterpriseFeatures, setEnterpriseFeatures] = useState<EnterpriseFeature[]>([]);
  const [securitySettings, setSecuritySettings] = useState({
    ssoEnabled: false,
    mfaRequired: false,
    dataEncryption: true,
    auditLogging: true,
    ipWhitelisting: false,
    dataResidency: 'us-east-1',
  });
  const [contactInfo, setContactInfo] = useState({
    adminName: '',
    adminEmail: '',
    phone: '',
    department: '',
  });

  const steps = [
    'Organization Details',
    'Compliance & Security',
    'Enterprise Features',
    'Deployment Configuration',
    'Review & Deploy'
  ];

  const industries = [
    'Financial Services',
    'Healthcare',
    'Government',
    'Education',
    'Technology',
    'Manufacturing',
    'Retail',
    'Legal',
    'Insurance',
    'Other'
  ];

  const companySizes = [
    '1-50 employees',
    '51-200 employees',
    '201-1000 employees',
    '1001-5000 employees',
    '5000+ employees'
  ];

  const deploymentTypes = [
    'Cloud (Multi-tenant)',
    'Cloud (Single-tenant)',
    'On-premises',
    'Hybrid',
    'Private Cloud'
  ];

  const mockComplianceFrameworks: ComplianceFramework[] = [
    {
      id: 'gdpr',
      name: 'GDPR',
      description: 'General Data Protection Regulation (EU)',
      required: false,
      enabled: false
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      description: 'Health Insurance Portability and Accountability Act',
      required: false,
      enabled: false
    },
    {
      id: 'sox',
      name: 'SOX',
      description: 'Sarbanes-Oxley Act',
      required: false,
      enabled: false
    },
    {
      id: 'pci',
      name: 'PCI DSS',
      description: 'Payment Card Industry Data Security Standard',
      required: false,
      enabled: false
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'Information Security Management',
      required: false,
      enabled: false
    },
    {
      id: 'fedramp',
      name: 'FedRAMP',
      description: 'Federal Risk and Authorization Management Program',
      required: false,
      enabled: false
    }
  ];

  const mockEnterpriseFeatures: EnterpriseFeature[] = [
    {
      id: 'sso',
      name: 'Single Sign-On (SSO)',
      description: 'SAML, OIDC, and Active Directory integration',
      category: 'Authentication',
      enabled: false,
      premium: true
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Custom dashboards, reports, and business intelligence',
      category: 'Analytics',
      enabled: false,
      premium: true
    },
    {
      id: 'api_management',
      name: 'API Management',
      description: 'Rate limiting, API keys, and webhook management',
      category: 'Integration',
      enabled: true,
      premium: false
    },
    {
      id: 'custom_branding',
      name: 'Custom Branding',
      description: 'White-label interface and custom domains',
      category: 'Customization',
      enabled: false,
      premium: true
    },
    {
      id: 'priority_support',
      name: 'Priority Support',
      description: '24/7 dedicated support with SLA guarantees',
      category: 'Support',
      enabled: false,
      premium: true
    },
    {
      id: 'backup_recovery',
      name: 'Backup & Recovery',
      description: 'Automated backups and disaster recovery',
      category: 'Operations',
      enabled: true,
      premium: false
    }
  ];

  React.useEffect(() => {
    setComplianceFrameworks(mockComplianceFrameworks);
    setEnterpriseFeatures(mockEnterpriseFeatures);
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const toggleCompliance = (frameworkId: string) => {
    setComplianceFrameworks(frameworks =>
      frameworks.map(framework =>
        framework.id === frameworkId
          ? { ...framework, enabled: !framework.enabled }
          : framework
      )
    );
  };

  const toggleFeature = (featureId: string) => {
    setEnterpriseFeatures(features =>
      features.map(feature =>
        feature.id === featureId
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
  };

  const renderOrganizationDetails = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Organization Details
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
        Tell us about your organization to customize your enterprise chatbot experience.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Organization Name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Acme Corporation"
            sx={{ 
              mb: 2,
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#a0aec0' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Industry</InputLabel>
            <Select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a0aec0' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            >
              {industries.map((ind) => (
                <MenuItem key={ind} value={ind}>{ind}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Company Size</InputLabel>
            <Select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a0aec0' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            >
              {companySizes.map((size) => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Admin Name"
            value={contactInfo.adminName}
            onChange={(e) => setContactInfo({...contactInfo, adminName: e.target.value})}
            placeholder="John Smith"
            sx={{ 
              mb: 2,
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#a0aec0' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />

          <TextField
            fullWidth
            label="Admin Email"
            type="email"
            value={contactInfo.adminEmail}
            onChange={(e) => setContactInfo({...contactInfo, adminEmail: e.target.value})}
            placeholder="admin@company.com"
            sx={{ 
              mb: 2,
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#a0aec0' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />

          <TextField
            fullWidth
            label="Department"
            value={contactInfo.department}
            onChange={(e) => setContactInfo({...contactInfo, department: e.target.value})}
            placeholder="IT Department"
            sx={{ 
              mb: 2,
              '& .MuiInputLabel-root': { color: '#a0aec0' },
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: '#4a5568' },
                '&:hover fieldset': { borderColor: '#a0aec0' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3, backgroundColor: '#2d3748', color: 'white' }}>
        <Typography variant="body2">
          This information helps us configure appropriate security settings and compliance frameworks for your industry.
        </Typography>
      </Alert>
    </Box>
  );

  const renderComplianceSecurity = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Compliance & Security
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
        Configure compliance frameworks and security settings for your organization.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3, backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Compliance Frameworks
              </Typography>
              <FormGroup>
                {complianceFrameworks.map((framework) => (
                  <FormControlLabel
                    key={framework.id}
                    control={
                      <Checkbox
                        checked={framework.enabled}
                        onChange={() => toggleCompliance(framework.id)}
                        sx={{ color: '#a0aec0' }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white' }}>{framework.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          {framework.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3, backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Security Settings
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.ssoEnabled}
                      onChange={(e) => setSecuritySettings({...securitySettings, ssoEnabled: e.target.checked})}
                    />
                  }
                  label="Single Sign-On (SSO)"
                  sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.mfaRequired}
                      onChange={(e) => setSecuritySettings({...securitySettings, mfaRequired: e.target.checked})}
                    />
                  }
                  label="Multi-Factor Authentication"
                  sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.dataEncryption}
                      onChange={(e) => setSecuritySettings({...securitySettings, dataEncryption: e.target.checked})}
                      disabled
                    />
                  }
                  label="Data Encryption (Required)"
                  sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.auditLogging}
                      onChange={(e) => setSecuritySettings({...securitySettings, auditLogging: e.target.checked})}
                      disabled
                    />
                  }
                  label="Audit Logging (Required)"
                  sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.ipWhitelisting}
                      onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelisting: e.target.checked})}
                    />
                  }
                  label="IP Whitelisting"
                  sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderEnterpriseFeatures = () => {
    const featuresByCategory = enterpriseFeatures.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<string, EnterpriseFeature[]>);

    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
          Enterprise Features
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
          Select the enterprise features you need for your organization.
        </Typography>

        <Grid container spacing={3}>
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <Grid item xs={12} md={6} key={category}>
              <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                    {category}
                  </Typography>
                  <List>
                    {features.map((feature) => (
                      <ListItem key={feature.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Switch
                            checked={feature.enabled}
                            onChange={() => toggleFeature(feature.id)}
                            disabled={feature.premium && !feature.enabled}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {feature.name}
                              </Typography>
                              {feature.premium && (
                                <Chip 
                                  label="Premium" 
                                  size="small" 
                                  color="primary" 
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                              {feature.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderDeploymentConfig = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Deployment Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
        Choose your deployment model and configure infrastructure settings.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Deployment Type</InputLabel>
            <Select
              value={deploymentType}
              onChange={(e) => setDeploymentType(e.target.value)}
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a0aec0' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            >
              {deploymentTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: '#a0aec0' }}>Data Residency</InputLabel>
            <Select
              value={securitySettings.dataResidency}
              onChange={(e) => setSecuritySettings({...securitySettings, dataResidency: e.target.value})}
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a0aec0' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            >
              <MenuItem value="us-east-1">US East (Virginia)</MenuItem>
              <MenuItem value="us-west-2">US West (Oregon)</MenuItem>
              <MenuItem value="eu-west-1">EU West (Ireland)</MenuItem>
              <MenuItem value="ap-southeast-1">Asia Pacific (Singapore)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#2d3748', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Infrastructure Features
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="99.9% SLA Uptime"
                    sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Auto-scaling"
                    sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Load Balancing"
                    sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Disaster Recovery"
                    sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderReviewDeploy = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Review & Deploy
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ color: '#a0aec0' }}>
        Review your enterprise configuration before deployment.
      </Typography>

      <TableContainer component={Paper} sx={{ backgroundColor: '#2d3748' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Configuration</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ color: '#a0aec0' }}>Organization</TableCell>
              <TableCell sx={{ color: 'white' }}>{organizationName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#a0aec0' }}>Industry</TableCell>
              <TableCell sx={{ color: 'white' }}>{industry}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#a0aec0' }}>Deployment Type</TableCell>
              <TableCell sx={{ color: 'white' }}>{deploymentType}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#a0aec0' }}>Compliance Frameworks</TableCell>
              <TableCell sx={{ color: 'white' }}>
                {complianceFrameworks.filter(f => f.enabled).map(f => f.name).join(', ') || 'None'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#a0aec0' }}>Enterprise Features</TableCell>
              <TableCell sx={{ color: 'white' }}>
                {enterpriseFeatures.filter(f => f.enabled).length} features enabled
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box textAlign="center" sx={{ mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<CloudIcon />}
          sx={{ mr: 2 }}
        >
          Deploy Enterprise Chatbot
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<SupportIcon />}
          sx={{ color: 'white', borderColor: 'white' }}
        >
          Contact Enterprise Support
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 3, backgroundColor: '#2d3748', color: 'white' }}>
        <Typography variant="body2">
          <strong>Enterprise Support:</strong> Your dedicated customer success manager will contact you within 24 hours to assist with onboarding and configuration.
        </Typography>
      </Alert>
    </Box>
  );

  return (
    <Container maxWidth={false} sx={{ py: 4, backgroundColor: '#1a202c', minHeight: '100vh' }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Enterprise Setup
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ color: '#a0aec0' }}>
          Configure your enterprise-grade chatbot with advanced security, compliance, and features.
        </Typography>
      </Box>

      <Card sx={{ mb: 4, backgroundColor: '#2d3748', color: 'white' }}>
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ p: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>

      <Box>
        {activeStep === 0 && renderOrganizationDetails()}
        {activeStep === 1 && renderComplianceSecurity()}
        {activeStep === 2 && renderEnterpriseFeatures()}
        {activeStep === 3 && renderDeploymentConfig()}
        {activeStep === 4 && renderReviewDeploy()}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, mt: 4 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1, color: 'white' }}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep < steps.length - 1 && (
          <Button 
            onClick={handleNext}
            disabled={
              (activeStep === 0 && (!organizationName || !industry || !contactInfo.adminEmail)) ||
              (activeStep === 3 && !deploymentType)
            }
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default EnterpriseSetup;

