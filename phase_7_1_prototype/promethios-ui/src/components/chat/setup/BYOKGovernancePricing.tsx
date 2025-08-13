/**
 * BYOK Governance Pricing Component
 * 
 * Pricing tiers for governance features when using Bring Your Own Key (BYOK)
 * Shows governance monitoring, compliance, and security features during beta.
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
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Visibility as MonitoringIcon,
  Assessment as ComplianceIcon,
  Support as SupportIcon,
  CheckCircle as CheckIcon,
  Shield as GovernanceIcon,
  Analytics as AnalyticsIcon,
  Policy as PolicyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BYOKGovernancePricing: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const navigate = useNavigate();

  const plans = [
    {
      id: 'basic',
      name: 'Basic Governance',
      price: '$19/month',
      originalPrice: '$19',
      description: 'Essential governance and monitoring',
      features: [
        'Trust threshold monitoring',
        'Basic compliance tracking', 
        'Audit logs',
        'Email notifications',
        'Standard support'
      ],
      recommended: false,
    },
    {
      id: 'professional',
      name: 'Professional Governance',
      price: '$49/month',
      originalPrice: '$49',
      description: 'Advanced governance with real-time monitoring',
      features: [
        'Real-time trust monitoring',
        'Advanced policy management',
        'Custom compliance rules',
        'Violation alerts',
        'Priority support',
        'Custom dashboards'
      ],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Governance',
      price: '$99/month',
      originalPrice: '$99',
      description: 'Complete governance suite with dedicated support',
      features: [
        'Full compliance suite',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced analytics',
        'White-label reporting',
        'SLA guarantees',
        'On-premise deployment'
      ],
      recommended: false,
    },
  ];

  const features = [
    {
      icon: <GovernanceIcon sx={{ color: '#4299e1' }} />,
      title: 'Governance Monitoring',
      description: 'Real-time monitoring of trust thresholds, compliance violations, and policy adherence',
    },
    {
      icon: <PolicyIcon sx={{ color: '#4299e1' }} />,
      title: 'Policy Management',
      description: 'Automated policy enforcement with customizable rules and violation handling',
    },
    {
      icon: <ComplianceIcon sx={{ color: '#4299e1' }} />,
      title: 'Audit & Compliance',
      description: 'Complete audit trails, compliance reporting, and regulatory framework support',
    },
    {
      icon: <SupportIcon sx={{ color: '#4299e1' }} />,
      title: 'Enterprise Security',
      description: 'Advanced security controls, threat detection, and enterprise-grade monitoring',
    },
  ];

  const handleContinue = () => {
    // Navigate to the BYOK wizard with selected governance plan
    navigate('/ui/chat/builder/chatbot-wrapping', { 
      state: { governancePlan: selectedPlan } 
    });
  };

  const handleCancel = () => {
    navigate('/ui/chat/setup/quick-start');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'transparent' }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          <GovernanceIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'white' }} />
          BYOK Governance Setup
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Add enterprise governance controls to your bring-your-own-key chatbot deployment
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Features Overview */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Governance Benefits
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: 'white', mr: 2 }}>
              Choose Your Governance Plan
            </Typography>
            <Chip
              label="BETA - FREE"
              sx={{
                backgroundColor: '#48bb78',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            During beta, all governance plans are free! You only pay for AI model token usage.
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.4)', 
                          textDecoration: 'line-through',
                          mr: 2 
                        }}
                      >
                        {plan.price}
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#48bb78' }}>
                        FREE
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                      {plan.description}
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

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              CANCEL
            </Button>
            <Button
              variant="contained"
              onClick={handleContinue}
              sx={{
                backgroundColor: '#4299e1',
                '&:hover': { backgroundColor: '#3182ce' },
                px: 4,
              }}
            >
              CONTINUE WITH {plans.find(p => p.id === selectedPlan)?.name.toUpperCase()}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BYOKGovernancePricing;

