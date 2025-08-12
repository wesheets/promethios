/**
 * Agent Enhancement Page for Promethios Chat
 * 
 * This page allows users to enhance their wrapped agents with:
 * 1. RAG (Knowledge & Training) - Self-service
 * 2. Fine-tuning - Enterprise contact service
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
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  School as KnowledgeIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Tune as FineTuningIcon,
  Business as EnterpriseIcon,
  ContactSupport as ContactIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  ExpandMore as ExpandIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Speed as PerformanceIcon,
  Security as GovernanceIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';

interface WrappedAgent {
  id: string;
  name: string;
  description: string;
  provider: string;
  status: 'active' | 'inactive';
  governanceLevel: string;
  trustScore: number;
  createdAt: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  size: string;
  status: 'ready' | 'processing' | 'error';
  createdAt: string;
}

const AgentEnhancementPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<WrappedAgent | null>(null);
  const [wrappedAgents, setWrappedAgents] = useState<WrappedAgent[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    dataSize: '',
    requirements: ''
  });

  const steps = [
    'Select Agent',
    'Configure Knowledge',
    'Test & Deploy'
  ];

  // Mock data - replace with real API calls
  useEffect(() => {
    setWrappedAgents([
      {
        id: 'agent-1',
        name: 'Customer Support Assistant',
        description: 'AI assistant for customer support with emotional intelligence',
        provider: 'OpenAI',
        status: 'active',
        governanceLevel: 'Standard',
        trustScore: 87,
        createdAt: '2024-08-10'
      },
      {
        id: 'agent-2', 
        name: 'Sales Assistant',
        description: 'AI assistant for sales inquiries and lead qualification',
        provider: 'Anthropic',
        status: 'active',
        governanceLevel: 'Advanced',
        trustScore: 92,
        createdAt: '2024-08-09'
      },
      {
        id: 'agent-3',
        name: 'Technical Support Bot',
        description: 'Specialized technical support with code analysis',
        provider: 'Cohere',
        status: 'inactive',
        governanceLevel: 'Basic',
        trustScore: 78,
        createdAt: '2024-08-08'
      }
    ]);

    setKnowledgeBases([
      {
        id: 'kb-1',
        name: 'Product Documentation',
        description: 'Complete product manuals and user guides',
        documentCount: 45,
        size: '12.3 MB',
        status: 'ready',
        createdAt: '2024-08-10'
      },
      {
        id: 'kb-2',
        name: 'FAQ Database',
        description: 'Frequently asked questions and answers',
        documentCount: 128,
        size: '3.7 MB', 
        status: 'ready',
        createdAt: '2024-08-09'
      }
    ]);
  }, []);

  const handleAgentSelect = (agent: WrappedAgent) => {
    setSelectedAgent(agent);
    setActiveStep(1);
  };

  const handleContactSubmit = () => {
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    setContactDialogOpen(false);
    // Show success message
  };

  const renderAgentSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Agent to Enhance
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Choose a wrapped agent to enhance with knowledge and training capabilities.
      </Typography>

      <Grid container spacing={3}>
        {wrappedAgents.map((agent) => (
          <Grid item xs={12} md={6} lg={4} key={agent.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedAgent?.id === agent.id ? 2 : 1,
                borderColor: selectedAgent?.id === agent.id ? 'primary.main' : 'divider',
                '&:hover': { borderColor: 'primary.main' }
              }}
              onClick={() => handleAgentSelect(agent)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AgentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{agent.name}</Typography>
                  <Chip 
                    label={agent.status} 
                    color={agent.status === 'active' ? 'success' : 'default'}
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {agent.description}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="caption">Provider: {agent.provider}</Typography>
                  <Typography variant="caption">Trust: {agent.trustScore}%</Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip label={agent.governanceLevel} size="small" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    Created {agent.createdAt}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {wrappedAgents.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            No wrapped agents found. Please wrap an agent first using the Universal Agent Wrapper.
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1 }}
            href="/ui/agents/wrapping"
          >
            Wrap an Agent
          </Button>
        </Alert>
      )}
    </Box>
  );

  const renderKnowledgeConfiguration = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Knowledge & Training
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Enhance your agent with knowledge bases and training data for better responses.
      </Typography>

      {/* RAG Configuration Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <KnowledgeIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Knowledge Bases (RAG)</Typography>
            <Chip label="Self-Service" color="success" size="small" sx={{ ml: 2 }} />
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Upload documents and create knowledge bases for retrieval-augmented generation.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: '2px dashed', borderColor: 'primary.main' }}>
                <Box textAlign="center">
                  <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>Upload Documents</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Drag & drop or click to upload PDFs, Word docs, text files
                  </Typography>
                  <Button variant="contained" startIcon={<UploadIcon />}>
                    Choose Files
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Existing Knowledge Bases</Typography>
              <List dense>
                {knowledgeBases.map((kb) => (
                  <ListItem key={kb.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={kb.name}
                      secondary={`${kb.documentCount} docs • ${kb.size}`}
                    />
                    <Chip label={kb.status} size="small" color="success" />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>

          <Box mt={3}>
            <Button variant="contained" startIcon={<SearchIcon />} sx={{ mr: 2 }}>
              Test Knowledge Search
            </Button>
            <Button variant="outlined" startIcon={<AnalyticsIcon />}>
              View Analytics
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Fine-tuning Section */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FineTuningIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Custom Model Training (Fine-tuning)</Typography>
            <Badge badgeContent="Enterprise" color="secondary">
              <Chip label="Contact Sales" color="warning" size="small" sx={{ ml: 2 }} />
            </Badge>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Create custom models trained specifically on your data and use cases.
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Fine-tuning is available as a premium enterprise service.</strong> Our team will work with you to create custom models tailored to your specific needs.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <PerformanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Better Performance</Typography>
                <Typography variant="body2" color="text.secondary">
                  Custom models perform 40-60% better on domain-specific tasks
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <GovernanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Full Governance</Typography>
                <Typography variant="body2" color="text.secondary">
                  All custom models include complete Promethios governance oversight
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <EnterpriseIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Enterprise Support</Typography>
                <Typography variant="body2" color="text.secondary">
                  Dedicated support team and custom pricing for your organization
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography variant="subtitle1">Provider Cost Comparison (Educational)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">HuggingFace</Typography>
                    <Typography variant="h4" color="success.main">$1.50</Typography>
                    <Typography variant="caption">Typical training cost</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Perplexity</Typography>
                    <Typography variant="h4">$30</Typography>
                    <Typography variant="caption">Base models only</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Cohere</Typography>
                    <Typography variant="h4">$60</Typography>
                    <Typography variant="caption">Custom models</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">OpenAI</Typography>
                    <Typography variant="h4">$240</Typography>
                    <Typography variant="caption">Premium option</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Box mt={3} textAlign="center">
            <Button 
              variant="contained" 
              size="large"
              startIcon={<ContactIcon />}
              onClick={() => setContactDialogOpen(true)}
            >
              Contact Sales for Fine-tuning
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderTestAndDeploy = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Test & Deploy Enhanced Agent
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test your enhanced agent and deploy it to your chat system.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Knowledge Testing
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Test how well your agent retrieves and uses knowledge from your documents.
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Ask a question to test knowledge retrieval..."
                sx={{ mb: 2 }}
              />
              
              <Button variant="contained" fullWidth>
                Test Knowledge
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Performance Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Monitor your enhanced agent's performance and governance metrics.
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2">Knowledge Accuracy</Typography>
                <LinearProgress variant="determinate" value={87} sx={{ mb: 1 }} />
                <Typography variant="caption">87% - Excellent</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2">Response Relevance</Typography>
                <LinearProgress variant="determinate" value={92} sx={{ mb: 1 }} />
                <Typography variant="caption">92% - Outstanding</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2">Governance Compliance</Typography>
                <LinearProgress variant="determinate" value={95} sx={{ mb: 1 }} />
                <Typography variant="caption">95% - Excellent</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={4} textAlign="center">
        <Button 
          variant="contained" 
          size="large"
          startIcon={<CheckIcon />}
          sx={{ mr: 2 }}
        >
          Deploy Enhanced Agent
        </Button>
        <Button 
          variant="outlined" 
          size="large"
          startIcon={<ArrowIcon />}
        >
          Go to Chat Dashboard
        </Button>
      </Box>
    </Box>
  );

  const renderContactDialog = () => (
    <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <EnterpriseIcon sx={{ mr: 1 }} />
          Enterprise Fine-tuning Consultation
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Tell us about your fine-tuning requirements and our team will create a custom solution for your organization.
        </Typography>

        <Grid container spacing={2}>
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
            <FormControl fullWidth margin="normal">
              <InputLabel>Data Size</InputLabel>
              <Select
                value={contactForm.dataSize}
                onChange={(e) => setContactForm({...contactForm, dataSize: e.target.value})}
                label="Data Size"
              >
                <MenuItem value="small">Small (< 1K samples)</MenuItem>
                <MenuItem value="medium">Medium (1K - 10K samples)</MenuItem>
                <MenuItem value="large">Large (10K - 100K samples)</MenuItem>
                <MenuItem value="enterprise">Enterprise (> 100K samples)</MenuItem>
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
              multiline
              rows={3}
              label="Requirements"
              value={contactForm.requirements}
              onChange={(e) => setContactForm({...contactForm, requirements: e.target.value})}
              margin="normal"
              placeholder="Describe your specific requirements, compliance needs, performance goals..."
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
          Enhance Your Agent
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Add knowledge bases and training capabilities to your wrapped agents for better performance.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ p: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box>
        {activeStep === 0 && renderAgentSelection()}
        {activeStep === 1 && renderKnowledgeConfiguration()}
        {activeStep === 2 && renderTestAndDeploy()}
      </Box>

      {renderContactDialog()}

      {selectedAgent && (
        <Box mt={4}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Selected Agent:</strong> {selectedAgent.name} ({selectedAgent.provider})
            </Typography>
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default AgentEnhancementPage;

