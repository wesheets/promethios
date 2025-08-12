/**
 * Universal Training Management Page
 * 
 * This page provides fine-tuning capabilities as an enterprise contact service
 * for all agent types across all Promethios verticals
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Tune as FineTuningIcon,
  Business as EnterpriseIcon,
  ContactSupport as ContactIcon,
  Star as StarIcon,
  Speed as PerformanceIcon,
  Security as GovernanceIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Savings as SavingsIcon,
  SmartToy as AgentIcon,
  Chat as ChatIcon,
  School as EducationIcon,
  ChildCare as KidsIcon,
  Groups as MultiAgentIcon,
  AttachMoney as CostIcon,
  Timeline as TimelineIcon,
  CloudUpload as CloudIcon,
} from '@mui/icons-material';

interface WrappedAgent {
  id: string;
  name: string;
  description: string;
  provider: string;
  vertical: 'chat' | 'education' | 'kids' | 'enterprise' | 'multi-agent';
  status: 'active' | 'inactive';
  governanceLevel: string;
  trustScore: number;
  createdAt: string;
}

interface FineTuningRequest {
  id: string;
  agentName: string;
  vertical: string;
  company: string;
  contactName: string;
  email: string;
  useCase: string;
  dataSize: string;
  status: 'submitted' | 'in-review' | 'quoted' | 'in-progress' | 'completed';
  submittedAt: string;
  estimatedCost?: string;
  estimatedDuration?: string;
}

const providerPricing = [
  {
    provider: 'HuggingFace AutoTrain',
    cost: '$1.50',
    description: 'Most cost-effective option',
    features: ['Open source models', 'Own the model', 'T4 GPU training'],
    color: 'success'
  },
  {
    provider: 'Perplexity',
    cost: '$30',
    description: 'Base models with search',
    features: ['Real-time search', 'Base model training', 'Competitive rates'],
    color: 'info'
  },
  {
    provider: 'Cohere',
    cost: '$60',
    description: 'Custom model creation',
    features: ['Command models', 'Custom training', 'Enterprise support'],
    color: 'primary'
  },
  {
    provider: 'Google Gemini',
    cost: '$80',
    description: 'Vertex AI infrastructure',
    features: ['Google Cloud', 'Scalable training', 'Enterprise grade'],
    color: 'warning'
  },
  {
    provider: 'OpenAI',
    cost: '$240',
    description: 'Premium option',
    features: ['GPT models', 'High quality', 'Proven results'],
    color: 'secondary'
  },
  {
    provider: 'Anthropic Claude',
    cost: 'Contact',
    description: 'Enterprise only',
    features: ['Constitutional AI', 'Safety focused', 'Custom pricing'],
    color: 'error'
  }
];

const verticalIcons = {
  chat: <ChatIcon />,
  education: <EducationIcon />,
  kids: <KidsIcon />,
  enterprise: <EnterpriseIcon />,
  'multi-agent': <MultiAgentIcon />
};

const UniversalTrainingManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [wrappedAgents, setWrappedAgents] = useState<WrappedAgent[]>([]);
  const [fineTuningRequests, setFineTuningRequests] = useState<FineTuningRequest[]>([]);
  const [contactForm, setContactForm] = useState({
    agentId: '',
    name: '',
    email: '',
    company: '',
    phone: '',
    useCase: '',
    dataSize: '',
    timeline: '',
    budget: '',
    requirements: '',
    complianceNeeds: ''
  });

  // Mock data
  useEffect(() => {
    setWrappedAgents([
      {
        id: 'agent-1',
        name: 'Customer Support Assistant',
        description: 'AI assistant for customer support',
        provider: 'OpenAI',
        vertical: 'chat',
        status: 'active',
        governanceLevel: 'Standard',
        trustScore: 87,
        createdAt: '2024-08-10'
      },
      {
        id: 'agent-2',
        name: 'Math Tutor',
        description: 'Educational AI for mathematics',
        provider: 'Anthropic',
        vertical: 'education',
        status: 'active',
        governanceLevel: 'Advanced',
        trustScore: 92,
        createdAt: '2024-08-09'
      }
    ]);

    setFineTuningRequests([
      {
        id: 'req-1',
        agentName: 'Legal Document Analyzer',
        vertical: 'enterprise',
        company: 'LawFirm Inc.',
        contactName: 'John Smith',
        email: 'john@lawfirm.com',
        useCase: 'Contract analysis and legal document review',
        dataSize: 'Large (50K+ documents)',
        status: 'in-progress',
        submittedAt: '2024-08-05',
        estimatedCost: '$15,000',
        estimatedDuration: '3-4 weeks'
      },
      {
        id: 'req-2',
        agentName: 'Medical Diagnosis Assistant',
        vertical: 'enterprise',
        company: 'HealthCorp',
        contactName: 'Dr. Sarah Johnson',
        email: 'sarah@healthcorp.com',
        useCase: 'Medical diagnosis support with patient data',
        dataSize: 'Enterprise (100K+ records)',
        status: 'quoted',
        submittedAt: '2024-08-08',
        estimatedCost: '$25,000',
        estimatedDuration: '4-6 weeks'
      }
    ]);
  }, []);

  const handleContactSubmit = () => {
    // Handle contact form submission
    console.log('Fine-tuning request submitted:', contactForm);
    setContactDialogOpen(false);
    // Show success message and add to requests
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Enterprise Fine-tuning Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Custom model training as a premium enterprise service across all Promethios verticals.
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Fine-tuning is available as a premium enterprise service.</strong> Our expert team works with you to create custom models tailored to your specific needs with full governance oversight.
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FineTuningIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{fineTuningRequests.length}</Typography>
              <Typography variant="body2" color="text.secondary">Active Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">60%</Typography>
              <Typography variant="body2" color="text.secondary">Avg. Performance Gain</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SavingsIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">$1.50</Typography>
              <Typography variant="body2" color="text.secondary">Starting Cost</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimelineIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">2-6</Typography>
              <Typography variant="body2" color="text.secondary">Weeks Delivery</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>Why Choose Enterprise Fine-tuning?</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <PerformanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Superior Performance</Typography>
              <Typography variant="body2" color="text.secondary">
                Custom models perform 40-60% better on domain-specific tasks compared to general models.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <GovernanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Full Governance</Typography>
              <Typography variant="body2" color="text.secondary">
                All custom models include complete Promethios governance oversight and compliance monitoring.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <EnterpriseIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Enterprise Support</Typography>
              <Typography variant="body2" color="text.secondary">
                Dedicated support team, custom pricing, and ongoing model maintenance and updates.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPricing = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Provider Cost Comparison
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Educational pricing comparison across all supported providers. Final pricing depends on your specific requirements.
      </Typography>

      <Grid container spacing={3}>
        {providerPricing.map((provider, index) => (
          <Grid item xs={12} md={6} lg={4} key={provider.provider}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              {index === 0 && (
                <Badge 
                  badgeContent="Most Popular" 
                  color="success"
                  sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16,
                    '& .MuiBadge-badge': { fontSize: '0.7rem' }
                  }}
                />
              )}
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {provider.provider}
                </Typography>
                <Typography variant="h3" color={`${provider.color}.main`} gutterBottom>
                  {provider.cost}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {provider.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <List dense>
                  {provider.features.map((feature, idx) => (
                    <ListItem key={idx} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Alert severity="warning" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Pricing shown is for educational purposes. Actual enterprise pricing includes setup, training, deployment, governance integration, and ongoing support. Contact our sales team for accurate quotes.
        </Typography>
      </Alert>
    </Box>
  );

  const renderRequests = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Fine-tuning Requests</Typography>
        <Button 
          variant="contained" 
          startIcon={<ContactIcon />}
          onClick={() => setContactDialogOpen(true)}
        >
          New Request
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent/Use Case</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Data Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Estimated Cost</TableCell>
              <TableCell>Timeline</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fineTuningRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{request.agentName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.useCase}
                    </Typography>
                    <br />
                    <Chip 
                      icon={verticalIcons[request.vertical as keyof typeof verticalIcons]}
                      label={request.vertical}
                      size="small"
                      sx={{ textTransform: 'capitalize', mt: 0.5 }}
                    />
                  </Box>
                </TableCell>
                <TableCell>{request.company}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{request.contactName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{request.dataSize}</TableCell>
                <TableCell>
                  <Chip 
                    label={request.status}
                    size="small"
                    color={
                      request.status === 'completed' ? 'success' :
                      request.status === 'in-progress' ? 'warning' :
                      request.status === 'quoted' ? 'info' : 'default'
                    }
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>{request.estimatedCost || 'TBD'}</TableCell>
                <TableCell>{request.estimatedDuration || 'TBD'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {fineTuningRequests.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            No fine-tuning requests yet. Contact our sales team to get started with custom model training.
          </Typography>
        </Alert>
      )}
    </Box>
  );

  const renderProcess = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Enterprise Fine-tuning Process
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Our proven process ensures successful custom model deployment with full governance integration.
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper orientation="vertical">
          <Step active>
            <StepLabel>
              <Typography variant="h6">Initial Consultation</Typography>
            </StepLabel>
            <Box sx={{ ml: 4, pb: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Our team reviews your requirements, data, and use case to recommend the best approach.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Requirements analysis" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Data assessment" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Provider recommendation" />
                </ListItem>
              </List>
            </Box>
          </Step>

          <Step active>
            <StepLabel>
              <Typography variant="h6">Custom Quote & Timeline</Typography>
            </StepLabel>
            <Box sx={{ ml: 4, pb: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Detailed proposal with pricing, timeline, and success metrics based on your specific needs.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Detailed cost breakdown" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Project timeline" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Success criteria" />
                </ListItem>
              </List>
            </Box>
          </Step>

          <Step active>
            <StepLabel>
              <Typography variant="h6">Data Preparation & Training</Typography>
            </StepLabel>
            <Box sx={{ ml: 4, pb: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Our experts prepare your data and manage the training process with full governance oversight.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Data cleaning & formatting" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Training job management" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Quality assurance testing" />
                </ListItem>
              </List>
            </Box>
          </Step>

          <Step active>
            <StepLabel>
              <Typography variant="h6">Deployment & Integration</Typography>
            </StepLabel>
            <Box sx={{ ml: 4, pb: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Seamless deployment with full Promethios governance integration and ongoing support.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Governance integration" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Performance monitoring" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Ongoing support" />
                </ListItem>
              </List>
            </Box>
          </Step>
        </Stepper>
      </Paper>

      <Box textAlign="center">
        <Button 
          variant="contained" 
          size="large"
          startIcon={<ContactIcon />}
          onClick={() => setContactDialogOpen(true)}
        >
          Start Your Fine-tuning Project
        </Button>
      </Box>
    </Box>
  );

  const renderContactDialog = () => (
    <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <FineTuningIcon sx={{ mr: 1 }} />
          Enterprise Fine-tuning Request
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Tell us about your fine-tuning requirements and our team will create a custom solution for your organization.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Agent to Enhance</InputLabel>
              <Select
                value={contactForm.agentId}
                onChange={(e) => setContactForm({...contactForm, agentId: e.target.value})}
                label="Agent to Enhance"
              >
                <MenuItem value="">New Agent (Not Yet Wrapped)</MenuItem>
                {wrappedAgents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.vertical})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
              value={contactForm.name}
              onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company"
              value={contactForm.company}
              onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={contactForm.phone}
              onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Data Size</InputLabel>
              <Select
                value={contactForm.dataSize}
                onChange={(e) => setContactForm({...contactForm, dataSize: e.target.value})}
                label="Data Size"
              >
                <MenuItem value="small">Small (&lt; 1K samples)</MenuItem>
                <MenuItem value="medium">Medium (1K - 10K samples)</MenuItem>
                <MenuItem value="large">Large (10K - 100K samples)</MenuItem>
                <MenuItem value="enterprise">Enterprise (&gt; 100K samples)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Timeline</InputLabel>
              <Select
                value={contactForm.timeline}
                onChange={(e) => setContactForm({...contactForm, timeline: e.target.value})}
                label="Timeline"
              >
                <MenuItem value="asap">ASAP (Rush job)</MenuItem>
                <MenuItem value="1-2weeks">1-2 weeks</MenuItem>
                <MenuItem value="3-4weeks">3-4 weeks</MenuItem>
                <MenuItem value="1-2months">1-2 months</MenuItem>
                <MenuItem value="flexible">Flexible</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Use Case"
              value={contactForm.useCase}
              onChange={(e) => setContactForm({...contactForm, useCase: e.target.value})}
              margin="normal"
              placeholder="e.g., Customer support, Legal document analysis, Medical diagnosis..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Budget Range"
              value={contactForm.budget}
              onChange={(e) => setContactForm({...contactForm, budget: e.target.value})}
              margin="normal"
              placeholder="e.g., $5K-10K, $10K-25K, $25K+, or 'Need estimate'"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Technical Requirements"
              value={contactForm.requirements}
              onChange={(e) => setContactForm({...contactForm, requirements: e.target.value})}
              margin="normal"
              placeholder="Describe your specific requirements, performance goals, integration needs..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Compliance Needs"
              value={contactForm.complianceNeeds}
              onChange={(e) => setContactForm({...contactForm, complianceNeeds: e.target.value})}
              margin="normal"
              placeholder="e.g., HIPAA, GDPR, SOC2, industry-specific regulations..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleContactSubmit}>
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Universal Training Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enterprise fine-tuning services for all agent types across all Promethios verticals.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Pricing" />
          <Tab label="Requests" />
          <Tab label="Process" />
        </Tabs>
      </Paper>

      <Box>
        {selectedTab === 0 && renderOverview()}
        {selectedTab === 1 && renderPricing()}
        {selectedTab === 2 && renderRequests()}
        {selectedTab === 3 && renderProcess()}
      </Box>

      {renderContactDialog()}

      <Box mt={4} textAlign="center">
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Ready to get started?</strong> Contact our enterprise team at{' '}
            <strong>enterprise@promethios.ai</strong> or call <strong>(555) 123-4567</strong> for immediate assistance.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default UniversalTrainingManagement;

