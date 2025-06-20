import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Divider,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextareaAutosize
} from '@mui/material';
import {
  Search,
  Support,
  ContactSupport,
  Help,
  BugReport,
  Feedback,
  QuestionAnswer,
  ExpandMore,
  Send,
  Phone,
  Email,
  Chat,
  Schedule,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Close,
  Launch,
  Article,
  VideoLibrary,
  School,
  Community,
  Forum,
  LiveHelp
} from '@mui/icons-material';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'agents' | 'governance' | 'trust' | 'billing' | 'technical';
  tags: string[];
  helpful: number;
  lastUpdated: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface ContactMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  availability: string;
  responseTime: string;
  supportLevel: 'all' | 'pro' | 'enterprise';
}

const SupportPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTicketDialog, setShowTicketDialog] = useState<boolean>(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });

  const contactMethods: ContactMethod[] = [
    {
      id: 'observer-chat',
      name: 'Observer Agent',
      description: 'Get instant help from our AI-powered Observer Agent',
      icon: <Chat />,
      availability: '24/7',
      responseTime: 'Immediate',
      supportLevel: 'all'
    },
    {
      id: 'email-support',
      name: 'Email Support',
      description: 'Send detailed questions and get comprehensive responses',
      icon: <Email />,
      availability: 'Business Hours',
      responseTime: '4-8 hours',
      supportLevel: 'all'
    },
    {
      id: 'live-chat',
      name: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: <LiveHelp />,
      availability: 'Mon-Fri 9AM-6PM EST',
      responseTime: '< 5 minutes',
      supportLevel: 'pro'
    },
    {
      id: 'phone-support',
      name: 'Phone Support',
      description: 'Direct phone line for urgent issues',
      icon: <Phone />,
      availability: 'Mon-Fri 9AM-6PM EST',
      responseTime: 'Immediate',
      supportLevel: 'enterprise'
    },
    {
      id: 'dedicated-support',
      name: 'Dedicated Support Manager',
      description: 'Your personal support manager for enterprise needs',
      icon: <ContactSupport />,
      availability: 'Business Hours',
      responseTime: '< 1 hour',
      supportLevel: 'enterprise'
    }
  ];

  const faqItems: FAQItem[] = [
    {
      id: 'what-is-promethios',
      question: 'What is Promethios and how does it work?',
      answer: 'Promethios is an AI governance platform that enables organizations to deploy, monitor, and govern AI agents with confidence. It provides comprehensive tools for agent wrapping, policy enforcement, trust metrics, and compliance management. The platform works by wrapping existing AI agents with governance controls, monitoring their behavior in real-time, and ensuring compliance with organizational policies and regulatory requirements.',
      category: 'general',
      tags: ['overview', 'platform', 'governance'],
      helpful: 245,
      lastUpdated: '2025-06-20'
    },
    {
      id: 'agent-wrapping-process',
      question: 'How do I wrap an existing AI agent with governance controls?',
      answer: 'To wrap an AI agent: 1) Navigate to Agents > Wrapping, 2) Choose Single or Multi-Agent wrapping, 3) Configure agent details including name, type, and API endpoint, 4) Set governance policies using templates or custom rules, 5) Configure trust settings and thresholds, 6) Deploy the wrapped agent. The wrapping process adds monitoring, policy enforcement, and trust evaluation without modifying your original agent.',
      category: 'agents',
      tags: ['wrapping', 'deployment', 'governance'],
      helpful: 189,
      lastUpdated: '2025-06-19'
    },
    {
      id: 'trust-dimensions-explained',
      question: 'What are the four trust dimensions and how are they calculated?',
      answer: 'Promethios evaluates trust across four dimensions: 1) Competence - Technical capability and accuracy based on task performance, 2) Reliability - Consistency and dependability over time, 3) Honesty - Truthfulness and transparency in responses, 4) Transparency - Explainability and auditability of decisions. Each dimension is scored 0-1 based on evidence collection, historical performance, and attestation chains.',
      category: 'trust',
      tags: ['trust-metrics', 'scoring', 'dimensions'],
      helpful: 156,
      lastUpdated: '2025-06-18'
    },
    {
      id: 'policy-templates',
      question: 'What governance policy templates are available?',
      answer: 'Promethios provides several pre-built policy templates: 1) HIPAA Compliance - Healthcare data protection and privacy, 2) SOC2 Compliance - Security and availability controls, 3) GDPR Compliance - Data protection and privacy rights, 4) Financial Services - Regulatory compliance for financial institutions, 5) Custom Templates - Build your own policies from scratch. Templates can be customized to match your specific requirements.',
      category: 'governance',
      tags: ['policies', 'templates', 'compliance'],
      helpful: 134,
      lastUpdated: '2025-06-17'
    },
    {
      id: 'billing-plans',
      question: 'What are the different pricing plans and what do they include?',
      answer: 'Promethios offers three main plans: 1) Starter ($29/month) - Up to 5 agents, basic governance, email support, 2) Professional ($99/month) - Up to 25 agents, advanced policies, live chat support, API access, 3) Enterprise (Custom) - Unlimited agents, custom policies, dedicated support, on-premise deployment. All plans include core trust metrics and basic monitoring.',
      category: 'billing',
      tags: ['pricing', 'plans', 'features'],
      helpful: 98,
      lastUpdated: '2025-06-16'
    },
    {
      id: 'api-integration',
      question: 'How do I integrate Promethios with my existing systems?',
      answer: 'Integration options include: 1) REST API - Full programmatic access to all platform features, 2) Webhooks - Real-time notifications for events and violations, 3) SDKs - Python, JavaScript, and Go libraries for easy integration, 4) External Integrations - Pre-built connectors for Slack, Jira, GitHub, and more. API keys can be generated in Settings > Integrations.',
      category: 'technical',
      tags: ['api', 'integration', 'webhooks'],
      helpful: 87,
      lastUpdated: '2025-06-15'
    },
    {
      id: 'trust-boundaries',
      question: 'How do I configure trust boundaries and what happens when they are violated?',
      answer: 'Trust boundaries are configured in Trust Metrics > Boundaries. Set minimum thresholds for each trust dimension (0.0-1.0). When boundaries are violated: 1) Immediate alerts are sent to administrators, 2) Agent actions may be blocked or require approval, 3) Violations are logged for audit trails, 4) Automatic remediation actions can be triggered. Boundaries can be set globally or per-agent.',
      category: 'trust',
      tags: ['boundaries', 'thresholds', 'violations'],
      helpful: 76,
      lastUpdated: '2025-06-14'
    },
    {
      id: 'data-export',
      question: 'Can I export my data and configurations from Promethios?',
      answer: 'Yes, comprehensive data export is available in Settings > Data Management: 1) Configuration Export - All policies, settings, and agent configurations, 2) Audit Logs - Complete audit trail and compliance records, 3) Trust Data - Historical trust scores and evaluations, 4) Reports - Generated compliance and performance reports. Exports are available in JSON, CSV, and PDF formats.',
      category: 'technical',
      tags: ['export', 'data', 'backup'],
      helpful: 65,
      lastUpdated: '2025-06-13'
    },
    {
      id: 'multi-agent-coordination',
      question: 'Does Promethios support multi-agent systems and coordination?',
      answer: 'Yes, Promethios supports multi-agent systems through: 1) Multi-Agent Wrapping - Wrap multiple agents simultaneously, 2) Agent Groups - Organize agents by function or department, 3) Coordination Policies - Define interaction rules between agents, 4) Trust Networks - Evaluate trust relationships between agents, 5) Collective Governance - Apply policies across agent groups.',
      category: 'agents',
      tags: ['multi-agent', 'coordination', 'groups'],
      helpful: 54,
      lastUpdated: '2025-06-12'
    },
    {
      id: 'compliance-reporting',
      question: 'What compliance reports can Promethios generate?',
      answer: 'Promethios generates various compliance reports: 1) SOC2 Reports - Security and availability controls, 2) HIPAA Audit Reports - Healthcare compliance documentation, 3) GDPR Data Processing Reports - Privacy and data protection records, 4) Custom Compliance Reports - Tailored to your regulatory requirements, 5) Violation Reports - Policy breach summaries and remediation actions. Reports can be scheduled and automatically delivered.',
      category: 'governance',
      tags: ['compliance', 'reports', 'audit'],
      helpful: 43,
      lastUpdated: '2025-06-11'
    }
  ];

  const filteredFAQs = faqItems.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSubmitTicket = () => {
    // In a real implementation, this would submit the ticket to the backend
    console.log('Submitting ticket:', ticketForm);
    setShowTicketDialog(false);
    setTicketForm({ subject: '', description: '', category: '', priority: 'medium' });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: '#3b82f6',
      agents: '#10b981',
      governance: '#8b5cf6',
      trust: '#ef4444',
      billing: '#f59e0b',
      technical: '#06b6d4'
    };
    return colors[category] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const getSupportLevelBadge = (level: string) => {
    const badges = {
      all: { label: 'All Plans', color: '#10b981' },
      pro: { label: 'Pro+', color: '#f59e0b' },
      enterprise: { label: 'Enterprise', color: '#8b5cf6' }
    };
    return badges[level] || badges.all;
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Support Center
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Get help, find answers, and connect with our support team
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              backgroundColor: '#2d3748', 
              border: '1px solid #4a5568',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { borderColor: '#3b82f6', transform: 'translateY(-2px)' }
            }}
            onClick={() => setShowTicketDialog(true)}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <BugReport sx={{ fontSize: 48, color: '#3b82f6', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Submit a Ticket
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Report issues or request help from our support team
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              backgroundColor: '#2d3748', 
              border: '1px solid #4a5568',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
            }}
            onClick={() => setSelectedTab(1)}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <QuestionAnswer sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Browse FAQ
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Find quick answers to common questions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              backgroundColor: '#2d3748', 
              border: '1px solid #4a5568',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { borderColor: '#f59e0b', transform: 'translateY(-2px)' }
            }}
            onClick={() => setSelectedTab(2)}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <ContactSupport sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Contact Support
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Get in touch through multiple support channels
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: '#a0aec0' },
              '& .Mui-selected': { color: '#3b82f6' },
              '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
            }}
          >
            <Tab label="Getting Started" icon={<School />} iconPosition="start" />
            <Tab label="FAQ" icon={<QuestionAnswer />} iconPosition="start" />
            <Tab label="Contact Support" icon={<ContactSupport />} iconPosition="start" />
            <Tab label="Resources" icon={<Article />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Getting Started Tab */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Getting Started with Promethios
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                        <School sx={{ mr: 1, color: '#3b82f6' }} />
                        Quick Start Guide
                      </Typography>
                      <List>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Complete platform tour"
                            secondary="Take the guided tour to understand core features"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Wrap your first agent"
                            secondary="Follow the agent wrapping workflow"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Configure governance policies"
                            secondary="Set up policies using templates"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Monitor trust metrics"
                            secondary="Understand trust scoring and boundaries"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                        <VideoLibrary sx={{ mr: 1, color: '#8b5cf6' }} />
                        Video Tutorials
                      </Typography>
                      <List>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <VideoLibrary sx={{ color: '#8b5cf6' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Platform Overview (5 min)"
                            secondary="Introduction to Promethios features"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <VideoLibrary sx={{ color: '#8b5cf6' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Agent Wrapping Demo (8 min)"
                            secondary="Step-by-step wrapping process"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <VideoLibrary sx={{ color: '#8b5cf6' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Trust Metrics Explained (6 min)"
                            secondary="Understanding trust dimensions"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <VideoLibrary sx={{ color: '#8b5cf6' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Policy Configuration (10 min)"
                            secondary="Creating and managing policies"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  color: '#3b82f6',
                  '& .MuiAlert-icon': { color: '#3b82f6' }
                }}
              >
                <Typography variant="body2">
                  <strong>New to AI governance?</strong> Start with our guided tours in the Help section to learn the fundamentals of AI agent management and compliance.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* FAQ Tab */}
          {selectedTab === 1 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="Search frequently asked questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: '#a0aec0' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#4a5568' },
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                        },
                        '& .MuiInputBase-input': { color: 'white' },
                        '& .MuiInputBase-input::placeholder': { color: '#a0aec0' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                        }}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        <MenuItem value="general">General</MenuItem>
                        <MenuItem value="agents">Agents</MenuItem>
                        <MenuItem value="governance">Governance</MenuItem>
                        <MenuItem value="trust">Trust Metrics</MenuItem>
                        <MenuItem value="billing">Billing</MenuItem>
                        <MenuItem value="technical">Technical</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                {filteredFAQs.map((faq) => (
                  <Accordion 
                    key={faq.id}
                    sx={{ 
                      backgroundColor: '#1a202c', 
                      border: '1px solid #4a5568',
                      mb: 2,
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ color: '#a0aec0' }} />}
                      sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant="h6" sx={{ color: 'white', flexGrow: 1 }}>
                          {faq.question}
                        </Typography>
                        <Chip
                          label={faq.category}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(faq.category),
                            color: 'white',
                            ml: 2
                          }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body1" sx={{ color: '#a0aec0', mb: 2 }}>
                        {faq.answer}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {faq.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: '#4a5568', color: '#a0aec0', fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#6b7280', mr: 2 }}>
                            {faq.helpful} found this helpful
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Updated: {faq.lastUpdated}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          )}

          {/* Contact Support Tab */}
          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Contact Support
              </Typography>
              
              <Grid container spacing={3}>
                {contactMethods.map((method) => {
                  const badge = getSupportLevelBadge(method.supportLevel);
                  return (
                    <Grid item xs={12} md={6} key={method.id}>
                      <Card 
                        sx={{ 
                          backgroundColor: '#1a202c', 
                          border: '1px solid #4a5568',
                          height: '100%',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': { borderColor: '#3b82f6', transform: 'translateY(-2px)' }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Avatar sx={{ backgroundColor: '#3b82f6', mr: 2 }}>
                              {method.icon}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" sx={{ color: 'white', mr: 2 }}>
                                  {method.name}
                                </Typography>
                                <Chip
                                  label={badge.label}
                                  size="small"
                                  sx={{ backgroundColor: badge.color, color: 'white' }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                                {method.description}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                Availability
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {method.availability}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                Response Time
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {method.responseTime}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Divider sx={{ borderColor: '#4a5568', my: 4 }} />

              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Emergency Contact Information
              </Typography>
              <Alert 
                severity="warning" 
                sx={{ 
                  backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                  color: '#f59e0b',
                  '& .MuiAlert-icon': { color: '#f59e0b' }
                }}
              >
                <Typography variant="body2">
                  <strong>Critical Issues:</strong> For system outages or security incidents affecting production environments, 
                  contact our emergency hotline at <strong>+1 (555) 123-4567</strong> (Enterprise customers only).
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Resources Tab */}
          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Additional Resources
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Article sx={{ mr: 1, color: '#3b82f6' }} />
                        Documentation
                      </Typography>
                      <List>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <Launch sx={{ color: '#3b82f6' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="API Reference"
                            secondary="Complete API documentation and examples"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <Launch sx={{ color: '#3b82f6' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="User Guides"
                            secondary="Step-by-step guides for all features"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <Launch sx={{ color: '#3b82f6' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Best Practices"
                            secondary="Recommended patterns and configurations"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Community sx={{ mr: 1, color: '#10b981' }} />
                        Community
                      </Typography>
                      <List>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <Forum sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Community Forum"
                            secondary="Connect with other Promethios users"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <Launch sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="GitHub Repository"
                            secondary="Open source examples and integrations"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, cursor: 'pointer' }}>
                          <ListItemIcon>
                            <Launch sx={{ color: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Slack Community"
                            secondary="Real-time chat with users and experts"
                            primaryTypographyProps={{ color: 'white' }}
                            secondaryTypographyProps={{ color: '#a0aec0' }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Submit Ticket Dialog */}
      <Dialog
        open={showTicketDialog}
        onClose={() => setShowTicketDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d3748', color: 'white' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BugReport sx={{ color: '#3b82f6', mr: 2 }} />
            <Typography variant="h6" sx={{ color: 'white' }}>
              Submit Support Ticket
            </Typography>
          </Box>
          <IconButton onClick={() => setShowTicketDialog(false)} sx={{ color: '#a0aec0' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: '#a0aec0' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
                <Select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                  }}
                >
                  <MenuItem value="technical">Technical Issue</MenuItem>
                  <MenuItem value="billing">Billing Question</MenuItem>
                  <MenuItem value="feature">Feature Request</MenuItem>
                  <MenuItem value="bug">Bug Report</MenuItem>
                  <MenuItem value="general">General Question</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Priority</InputLabel>
                <Select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                  }}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={6}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Please provide detailed information about your issue or question..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#3b82f6' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiInputLabel-root': { color: '#a0aec0' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTicketDialog(false)} sx={{ color: '#a0aec0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSubmitTicket}
            disabled={!ticketForm.subject || !ticketForm.description || !ticketForm.category}
            sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            Submit Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportPage;

