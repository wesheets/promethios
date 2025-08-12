/**
 * Provider Selection Wizard
 * 
 * Guided wizard to help enterprises choose the right fine-tuning provider
 * based on their specific requirements and constraints
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Slider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  AttachMoney as CostIcon,
  Timeline as TimelineIcon,
  Support as SupportIcon,
  ExpandMore as ExpandIcon,
  Lightbulb as RecommendationIcon,
  Compare as CompareIcon,
  ContactSupport as ContactIcon,
} from '@mui/icons-material';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface Requirements {
  // Business Requirements
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  useCase: string;
  complianceNeeds: string[];
  
  // Technical Requirements
  dataSize: number;
  dataComplexity: 'simple' | 'medium' | 'complex';
  technicalExpertise: 'low' | 'medium' | 'high';
  integrationNeeds: string[];
  
  // Budget & Timeline
  budget: number;
  timeline: 'asap' | '1-2weeks' | '1month' | '3months' | 'flexible';
  supportLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
  
  // Preferences
  priorities: string[];
  dealBreakers: string[];
}

interface ProviderRecommendation {
  provider: string;
  displayName: string;
  score: number;
  matchReasons: string[];
  concerns: string[];
  estimatedCost: number;
  estimatedDuration: string;
  confidence: 'low' | 'medium' | 'high';
  color: 'success' | 'info' | 'primary' | 'warning' | 'secondary' | 'error';
}

const wizardSteps: WizardStep[] = [
  {
    id: 'business',
    title: 'Business Requirements',
    description: 'Tell us about your company and use case',
    completed: false
  },
  {
    id: 'technical',
    title: 'Technical Requirements',
    description: 'Data size, complexity, and integration needs',
    completed: false
  },
  {
    id: 'budget',
    title: 'Budget & Timeline',
    description: 'Budget constraints and timeline requirements',
    completed: false
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Priorities and deal-breakers',
    completed: false
  },
  {
    id: 'recommendations',
    title: 'Recommendations',
    description: 'Personalized provider recommendations',
    completed: false
  }
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Legal', 'Education', 'Retail',
  'Manufacturing', 'Government', 'Non-profit', 'Consulting', 'Other'
];

const useCases = [
  'Customer Support', 'Legal Document Analysis', 'Medical Diagnosis',
  'Financial Analysis', 'Content Creation', 'Code Review',
  'Educational Content', 'Research Assistant', 'Sales Assistant',
  'HR Assistant', 'Marketing Content', 'Other'
];

const complianceOptions = [
  'HIPAA', 'GDPR', 'SOC2', 'PCI DSS', 'FERPA', 'CCPA', 'ISO 27001', 'None'
];

const integrationOptions = [
  'Salesforce', 'HubSpot', 'Zendesk', 'Intercom', 'SharePoint',
  'Google Workspace', 'Microsoft 365', 'Slack', 'Teams', 'Custom API'
];

const priorityOptions = [
  'Lowest Cost', 'Highest Quality', 'Fastest Deployment', 'Best Support',
  'Data Privacy', 'Scalability', 'Ease of Use', 'Model Ownership'
];

const ProviderSelectionWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [requirements, setRequirements] = useState<Requirements>({
    companySize: 'medium',
    industry: '',
    useCase: '',
    complianceNeeds: [],
    dataSize: 10000,
    dataComplexity: 'medium',
    technicalExpertise: 'medium',
    integrationNeeds: [],
    budget: 10000,
    timeline: 'flexible',
    supportLevel: 'standard',
    priorities: [],
    dealBreakers: []
  });
  
  const [recommendations, setRecommendations] = useState<ProviderRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const updateRequirements = (updates: Partial<Requirements>) => {
    setRequirements(prev => ({ ...prev, ...updates }));
  };

  const calculateRecommendations = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const providers = [
        {
          provider: 'huggingface',
          displayName: 'HuggingFace AutoTrain',
          baseCost: 1.50,
          supportLevel: 'basic',
          complexity: 'medium',
          speed: 'fast',
          color: 'success' as const
        },
        {
          provider: 'perplexity',
          displayName: 'Perplexity',
          baseCost: 30,
          supportLevel: 'standard',
          complexity: 'low',
          speed: 'medium',
          color: 'info' as const
        },
        {
          provider: 'cohere',
          displayName: 'Cohere',
          baseCost: 60,
          supportLevel: 'premium',
          complexity: 'medium',
          speed: 'medium',
          color: 'primary' as const
        },
        {
          provider: 'gemini',
          displayName: 'Google Gemini',
          baseCost: 80,
          supportLevel: 'enterprise',
          complexity: 'high',
          speed: 'slow',
          color: 'warning' as const
        },
        {
          provider: 'openai',
          displayName: 'OpenAI',
          baseCost: 240,
          supportLevel: 'enterprise',
          complexity: 'low',
          speed: 'medium',
          color: 'secondary' as const
        }
      ];

      const scored = providers.map(provider => {
        let score = 0;
        const matchReasons: string[] = [];
        const concerns: string[] = [];

        // Budget scoring
        const costMultiplier = Math.log10(requirements.dataSize / 1000) + 1;
        const estimatedCost = provider.baseCost * costMultiplier;
        
        if (estimatedCost <= requirements.budget * 0.5) {
          score += 30;
          matchReasons.push('Well within budget');
        } else if (estimatedCost <= requirements.budget) {
          score += 20;
          matchReasons.push('Fits budget');
        } else {
          score -= 20;
          concerns.push('Over budget');
        }

        // Company size matching
        const sizeScores = {
          startup: { huggingface: 25, perplexity: 15, cohere: 10, gemini: 5, openai: 0 },
          small: { huggingface: 20, perplexity: 20, cohere: 15, gemini: 10, openai: 5 },
          medium: { huggingface: 15, perplexity: 20, cohere: 25, gemini: 15, openai: 10 },
          large: { huggingface: 10, perplexity: 15, cohere: 20, gemini: 25, openai: 20 },
          enterprise: { huggingface: 5, perplexity: 10, cohere: 15, gemini: 25, openai: 25 }
        };
        
        score += sizeScores[requirements.companySize][provider.provider as keyof typeof sizeScores.startup] || 0;

        // Support level matching
        const supportScores = {
          basic: { basic: 20, standard: 10, premium: 5, enterprise: 0 },
          standard: { basic: 5, standard: 20, premium: 15, enterprise: 10 },
          premium: { basic: 0, standard: 10, premium: 20, enterprise: 15 },
          enterprise: { basic: 0, standard: 5, premium: 15, enterprise: 20 }
        };
        
        score += supportScores[requirements.supportLevel][provider.supportLevel as keyof typeof supportScores.basic] || 0;

        // Timeline scoring
        if (requirements.timeline === 'asap' && provider.speed === 'fast') {
          score += 15;
          matchReasons.push('Fast deployment');
        } else if (requirements.timeline === 'flexible' && provider.speed === 'slow') {
          score += 5;
        }

        // Technical expertise matching
        if (requirements.technicalExpertise === 'low' && provider.complexity === 'low') {
          score += 15;
          matchReasons.push('Easy to use');
        } else if (requirements.technicalExpertise === 'high' && provider.complexity === 'high') {
          score += 10;
          matchReasons.push('Advanced capabilities');
        }

        // Priority matching
        if (requirements.priorities.includes('Lowest Cost') && provider.provider === 'huggingface') {
          score += 20;
          matchReasons.push('Most cost-effective');
        }
        if (requirements.priorities.includes('Highest Quality') && provider.provider === 'openai') {
          score += 20;
          matchReasons.push('Premium quality');
        }
        if (requirements.priorities.includes('Best Support') && provider.supportLevel === 'enterprise') {
          score += 15;
          matchReasons.push('Enterprise support');
        }

        // Industry-specific bonuses
        if (requirements.industry === 'Healthcare' && requirements.complianceNeeds.includes('HIPAA')) {
          if (provider.provider === 'openai' || provider.provider === 'gemini') {
            score += 10;
            matchReasons.push('HIPAA compliance ready');
          }
        }

        // Deal breakers
        if (requirements.dealBreakers.includes('Vendor Lock-in') && provider.provider !== 'huggingface') {
          score -= 15;
          concerns.push('Potential vendor lock-in');
        }

        const confidence: 'low' | 'medium' | 'high' = 
          score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';

        return {
          provider: provider.provider,
          displayName: provider.displayName,
          score: Math.max(0, Math.min(100, score)),
          matchReasons,
          concerns,
          estimatedCost,
          estimatedDuration: provider.speed === 'fast' ? '2-6 hours' : 
                           provider.speed === 'medium' ? '1-3 days' : '1-2 weeks',
          confidence,
          color: provider.color
        };
      }).sort((a, b) => b.score - a.score);

      setRecommendations(scored);
      setLoading(false);
      setShowResults(true);
    }, 2000);
  };

  const handleNext = () => {
    if (activeStep === wizardSteps.length - 2) {
      calculateRecommendations();
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const renderBusinessStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Company Size</InputLabel>
            <Select
              value={requirements.companySize}
              onChange={(e) => updateRequirements({ companySize: e.target.value as any })}
              label="Company Size"
            >
              <MenuItem value="startup">Startup (1-10 employees)</MenuItem>
              <MenuItem value="small">Small (11-50 employees)</MenuItem>
              <MenuItem value="medium">Medium (51-200 employees)</MenuItem>
              <MenuItem value="large">Large (201-1000 employees)</MenuItem>
              <MenuItem value="enterprise">Enterprise (1000+ employees)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Industry</InputLabel>
            <Select
              value={requirements.industry}
              onChange={(e) => updateRequirements({ industry: e.target.value })}
              label="Industry"
            >
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>{industry}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Primary Use Case</InputLabel>
            <Select
              value={requirements.useCase}
              onChange={(e) => updateRequirements({ useCase: e.target.value })}
              label="Primary Use Case"
            >
              {useCases.map((useCase) => (
                <MenuItem key={useCase} value={useCase}>{useCase}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Compliance Requirements
          </Typography>
          <FormGroup row>
            {complianceOptions.map((compliance) => (
              <FormControlLabel
                key={compliance}
                control={
                  <Checkbox
                    checked={requirements.complianceNeeds.includes(compliance)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...requirements.complianceNeeds, compliance]
                        : requirements.complianceNeeds.filter(c => c !== compliance);
                      updateRequirements({ complianceNeeds: updated });
                    }}
                  />
                }
                label={compliance}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTechnicalStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography gutterBottom>
            Training Data Size: {requirements.dataSize.toLocaleString()} samples
          </Typography>
          <Slider
            value={requirements.dataSize}
            onChange={(_, value) => updateRequirements({ dataSize: value as number })}
            min={1000}
            max={100000}
            step={1000}
            marks={[
              { value: 1000, label: '1K' },
              { value: 10000, label: '10K' },
              { value: 50000, label: '50K' },
              { value: 100000, label: '100K' }
            ]}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Data Complexity</InputLabel>
            <Select
              value={requirements.dataComplexity}
              onChange={(e) => updateRequirements({ dataComplexity: e.target.value as any })}
              label="Data Complexity"
            >
              <MenuItem value="simple">Simple (FAQ, basic Q&A)</MenuItem>
              <MenuItem value="medium">Medium (Documents, conversations)</MenuItem>
              <MenuItem value="complex">Complex (Technical, multi-modal)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Technical Expertise</InputLabel>
            <Select
              value={requirements.technicalExpertise}
              onChange={(e) => updateRequirements({ technicalExpertise: e.target.value as any })}
              label="Technical Expertise"
            >
              <MenuItem value="low">Low (Need managed service)</MenuItem>
              <MenuItem value="medium">Medium (Some technical knowledge)</MenuItem>
              <MenuItem value="high">High (Can handle complex setup)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Integration Requirements
          </Typography>
          <FormGroup row>
            {integrationOptions.map((integration) => (
              <FormControlLabel
                key={integration}
                control={
                  <Checkbox
                    checked={requirements.integrationNeeds.includes(integration)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...requirements.integrationNeeds, integration]
                        : requirements.integrationNeeds.filter(i => i !== integration);
                      updateRequirements({ integrationNeeds: updated });
                    }}
                  />
                }
                label={integration}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );

  const renderBudgetStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography gutterBottom>
            Budget: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(requirements.budget)}
          </Typography>
          <Slider
            value={requirements.budget}
            onChange={(_, value) => updateRequirements({ budget: value as number })}
            min={1000}
            max={50000}
            step={1000}
            marks={[
              { value: 1000, label: '$1K' },
              { value: 10000, label: '$10K' },
              { value: 25000, label: '$25K' },
              { value: 50000, label: '$50K+' }
            ]}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Timeline</InputLabel>
            <Select
              value={requirements.timeline}
              onChange={(e) => updateRequirements({ timeline: e.target.value as any })}
              label="Timeline"
            >
              <MenuItem value="asap">ASAP (Rush job)</MenuItem>
              <MenuItem value="1-2weeks">1-2 weeks</MenuItem>
              <MenuItem value="1month">1 month</MenuItem>
              <MenuItem value="3months">3 months</MenuItem>
              <MenuItem value="flexible">Flexible</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Support Level Needed</InputLabel>
            <Select
              value={requirements.supportLevel}
              onChange={(e) => updateRequirements({ supportLevel: e.target.value as any })}
              label="Support Level Needed"
            >
              <MenuItem value="basic">Basic (Documentation only)</MenuItem>
              <MenuItem value="standard">Standard (Email support)</MenuItem>
              <MenuItem value="premium">Premium (Priority support)</MenuItem>
              <MenuItem value="enterprise">Enterprise (Dedicated support)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPreferencesStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            What are your top priorities? (Select up to 3)
          </Typography>
          <FormGroup>
            {priorityOptions.map((priority) => (
              <FormControlLabel
                key={priority}
                control={
                  <Checkbox
                    checked={requirements.priorities.includes(priority)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...requirements.priorities, priority].slice(0, 3)
                        : requirements.priorities.filter(p => p !== priority);
                      updateRequirements({ priorities: updated });
                    }}
                    disabled={!requirements.priorities.includes(priority) && requirements.priorities.length >= 3}
                  />
                }
                label={priority}
              />
            ))}
          </FormGroup>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Deal Breakers (What would you absolutely avoid?)
          </Typography>
          <FormGroup>
            {['High Cost', 'Vendor Lock-in', 'Complex Setup', 'Poor Support', 'Data Privacy Concerns'].map((dealBreaker) => (
              <FormControlLabel
                key={dealBreaker}
                control={
                  <Checkbox
                    checked={requirements.dealBreakers.includes(dealBreaker)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...requirements.dealBreakers, dealBreaker]
                        : requirements.dealBreakers.filter(d => d !== dealBreaker);
                      updateRequirements({ dealBreakers: updated });
                    }}
                  />
                }
                label={dealBreaker}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );

  const renderRecommendations = () => (
    <Box>
      {loading && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Analyzing your requirements...
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Comparing providers based on your specific needs
          </Typography>
        </Box>
      )}

      {showResults && (
        <Box>
          <Typography variant="h6" gutterBottom>
            <RecommendationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Personalized Recommendations
          </Typography>

          <Grid container spacing={3}>
            {recommendations.map((rec, index) => (
              <Grid item xs={12} key={rec.provider}>
                <Card 
                  sx={{ 
                    border: index === 0 ? 2 : 1,
                    borderColor: index === 0 ? 'success.main' : 'divider',
                    position: 'relative'
                  }}
                >
                  {index === 0 && (
                    <Chip
                      label="Best Match"
                      color="success"
                      sx={{ position: 'absolute', top: 16, right: 16 }}
                    />
                  )}
                  
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Typography variant="h6">{rec.displayName}</Typography>
                          <Chip 
                            label={`${rec.score}% match`}
                            color={rec.confidence === 'high' ? 'success' : rec.confidence === 'medium' ? 'warning' : 'error'}
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                        
                        <Typography variant="h4" color={rec.color + '.main'} gutterBottom>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rec.estimatedCost)}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          Estimated Duration: {rec.estimatedDuration}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom color="success.main">
                          Why this matches:
                        </Typography>
                        <List dense>
                          {rec.matchReasons.map((reason, idx) => (
                            <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 24 }}>
                                <CheckIcon color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={reason}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        {rec.concerns.length > 0 && (
                          <>
                            <Typography variant="subtitle2" gutterBottom color="warning.main">
                              Considerations:
                            </Typography>
                            <List dense>
                              {rec.concerns.map((concern, idx) => (
                                <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 24 }}>
                                    <WarningIcon color="warning" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={concern}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </>
                        )}

                        <Box mt={2}>
                          <Button 
                            variant={index === 0 ? 'contained' : 'outlined'}
                            color={rec.color}
                            startIcon={<ContactIcon />}
                            fullWidth
                          >
                            {index === 0 ? 'Get Started' : 'Learn More'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Next Steps:</strong> Contact our sales team to discuss your specific requirements 
              and get a detailed quote for your recommended provider. We'll help you get started with 
              the setup and ensure a smooth implementation.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: return renderBusinessStep();
      case 1: return renderTechnicalStep();
      case 2: return renderBudgetStep();
      case 3: return renderPreferencesStep();
      case 4: return renderRecommendations();
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Provider Selection Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Answer a few questions to get personalized provider recommendations for your fine-tuning needs.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {wizardSteps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel>
                <Typography variant="h6">{step.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 3 }}>
                  {renderStepContent(index)}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                  >
                    Back
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={activeStep === wizardSteps.length - 1 ? <CheckIcon /> : <NextIcon />}
                    disabled={loading}
                  >
                    {activeStep === wizardSteps.length - 2 ? 'Get Recommendations' : 
                     activeStep === wizardSteps.length - 1 ? 'Complete' : 'Next'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Container>
  );
};

export default ProviderSelectionWizard;

