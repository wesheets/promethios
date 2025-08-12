/**
 * Hosted API Setup Component
 * 
 * Configuration for users who want to use Promethios hosted API services
 * with managed infrastructure and scaling.
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
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  MonetizationOn as PricingIcon,
  Support as SupportIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material';

const HostedApiSetup: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [apiName, setApiName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [autoScaling, setAutoScaling] = useState(true);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29/month',
      requests: '10K requests/month',
      features: ['Basic API access', 'Standard support', '99.9% uptime SLA'],
      recommended: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$99/month',
      requests: '100K requests/month',
      features: ['Advanced API features', 'Priority support', '99.95% uptime SLA', 'Custom domains'],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom pricing',
      requests: 'Unlimited requests',
      features: ['Full API suite', 'Dedicated support', '99.99% uptime SLA', 'Custom integrations', 'On-premise option'],
      recommended: false,
    },
  ];

  const regions = [
    { id: 'us-east-1', name: 'US East (N. Virginia)', latency: '< 50ms' },
    { id: 'us-west-2', name: 'US West (Oregon)', latency: '< 60ms' },
    { id: 'eu-west-1', name: 'Europe (Ireland)', latency: '< 40ms' },
    { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', latency: '< 70ms' },
  ];

  const features = [
    {
      icon: <CloudIcon sx={{ color: '#4299e1' }} />,
      title: 'Managed Infrastructure',
      description: 'Fully managed cloud infrastructure with automatic scaling and maintenance',
    },
    {
      icon: <SecurityIcon sx={{ color: '#4299e1' }} />,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant with end-to-end encryption and advanced threat protection',
    },
    {
      icon: <SpeedIcon sx={{ color: '#4299e1' }} />,
      title: 'Global CDN',
      description: 'Low-latency access worldwide with edge caching and optimized routing',
    },
    {
      icon: <SupportIcon sx={{ color: '#4299e1' }} />,
      title: '24/7 Support',
      description: 'Round-the-clock technical support with dedicated account management',
    },
  ];

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 3, bgcolor: 'transparent' }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <CloudIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          Hosted API Setup
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Deploy your chatbot using our managed cloud infrastructure with enterprise-grade reliability
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Features Overview */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Hosted API Benefits
              </Typography>
              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box sx={{ textAlign: 'center' }}>
                      {feature.icon}
                      <Typography variant="h6" sx={{ color: 'white', mt: 1, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {feature.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Selection */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
            Choose Your Plan
          </Typography>
          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.id}>
                <Card
                  sx={{
                    backgroundColor: selectedPlan === plan.id ? 'rgba(66, 153, 225, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedPlan === plan.id ? '2px solid #4299e1' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'rgba(66, 153, 225, 0.1)',
                      borderColor: '#4299e1',
                    },
                  }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.recommended && (
                    <Chip
                      label="Recommended"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: 16,
                        backgroundColor: '#4299e1',
                        color: 'white',
                      }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#4299e1', mb: 1 }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                      {plan.requests}
                    </Typography>
                    <List dense>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckIcon sx={{ color: '#48bb78', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Configuration */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                API Configuration
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Instance Name"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="e.g., my-chatbot-api"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#4299e1' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiOutlinedInput-input': { color: 'white' },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Region</InputLabel>
                    <Select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4299e1' },
                        '& .MuiSelect-select': { color: 'white' },
                      }}
                    >
                      {regions.map((reg) => (
                        <MenuItem key={reg.id} value={reg.id}>
                          <Box>
                            <Typography>{reg.name}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Latency: {reg.latency}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Advanced Options
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoScaling}
                        onChange={(e) => setAutoScaling(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4299e1' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4299e1' },
                        }}
                      />
                    }
                    label="Auto Scaling"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={backupEnabled}
                        onChange={(e) => setBackupEnabled(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4299e1' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4299e1' },
                        }}
                      />
                    }
                    label="Automated Backups"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={monitoringEnabled}
                        onChange={(e) => setMonitoringEnabled(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4299e1' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4299e1' },
                        }}
                      />
                    }
                    label="Advanced Monitoring"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Pricing Summary
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Selected Plan
                </Typography>
                <Typography variant="h5" sx={{ color: '#4299e1' }}>
                  {plans.find(p => p.id === selectedPlan)?.name}
                </Typography>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {plans.find(p => p.id === selectedPlan)?.price}
                </Typography>
              </Box>

              <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />

              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <ApiIcon sx={{ color: '#4299e1' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="API Requests"
                    secondary={plans.find(p => p.id === selectedPlan)?.requests}
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <StorageIcon sx={{ color: '#4299e1' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Storage"
                    secondary="Unlimited"
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <NetworkIcon sx={{ color: '#4299e1' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Bandwidth"
                    secondary="Unlimited"
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                </ListItem>
              </List>

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  backgroundColor: '#4299e1',
                  '&:hover': { backgroundColor: '#3182ce' },
                }}
                disabled={!apiName}
              >
                Deploy API Instance
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* API Endpoints Preview */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                API Endpoints Preview
              </Typography>
              
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Method</TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Endpoint</TableCell>
                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: '#48bb78', borderColor: 'rgba(255, 255, 255, 0.1)' }}>POST</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        /api/v1/chat/message
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        Send message to chatbot
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#4299e1', borderColor: 'rgba(255, 255, 255, 0.1)' }}>GET</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        /api/v1/chat/history
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        Get conversation history
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#4299e1', borderColor: 'rgba(255, 255, 255, 0.1)' }}>GET</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        /api/v1/analytics/metrics
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        Get performance metrics
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HostedApiSetup;

