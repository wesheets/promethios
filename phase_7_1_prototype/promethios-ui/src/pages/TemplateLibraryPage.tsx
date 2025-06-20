import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Stack,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  LibraryBooks,
  CallSplit,
  Star,
  Download,
  Verified,
  Security,
  Business,
  Psychology,
  Code,
  Analytics,
  Support,
  ContentCopy,
  Launch,
  Info,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Dark theme for consistency
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1a202c',
      paper: '#2d3748',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0aec0',
    },
  },
});

// Template interface
interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  governanceLevel: 'basic' | 'enhanced' | 'strict';
  trustScore: number;
  downloads: number;
  stars: number;
  tags: string[];
  author: string;
  version: string;
  lastUpdated: Date;
  verified: boolean;
  previewImage?: string;
  capabilities: string[];
  governancePolicies: string[];
  complianceFrameworks: string[];
}

// Template Card Component
const TemplateCard: React.FC<{ template: AgentTemplate; onFork: (template: AgentTemplate) => void }> = ({ 
  template, 
  onFork 
}) => {
  const getGovernanceLevelColor = (level: string) => {
    switch (level) {
      case 'strict': return '#ef4444';
      case 'enhanced': return '#f59e0b';
      case 'basic': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Customer Support': return <Support />;
      case 'Data Analysis': return <Analytics />;
      case 'Content Creation': return <ContentCopy />;
      case 'Security': return <Security />;
      case 'Business Intelligence': return <Business />;
      case 'Healthcare': return <Psychology />;
      default: return <Code />;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        backgroundColor: '#2d3748', 
        color: 'white',
        border: '1px solid #4a5568',
        '&:hover': { borderColor: '#718096', transform: 'translateY(-2px)' },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent>
        {/* Header with Icon and Verification */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#3182ce', width: 48, height: 48 }}>
              {getCategoryIcon(template.category)}
            </Avatar>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {template.name}
                </Typography>
                {template.verified && (
                  <Tooltip title="Verified by Promethios">
                    <Verified sx={{ color: '#3182ce', fontSize: 20 }} />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                v{template.version} • by {template.author}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" sx={{ color: '#a0aec0' }}>
            <Info />
          </IconButton>
        </Box>

        {/* Category and Governance Level */}
        <Box mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={template.category}
              size="small"
              sx={{
                backgroundColor: '#4a5568',
                color: 'white',
                mb: 1,
              }}
            />
            <Chip
              label={`${template.governanceLevel} governance`}
              size="small"
              sx={{
                backgroundColor: getGovernanceLevelColor(template.governanceLevel),
                color: 'white',
                mb: 1,
              }}
            />
          </Stack>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2, minHeight: 40 }}>
          {template.description}
        </Typography>

        {/* Capabilities */}
        <Box mb={2}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
            Key Capabilities:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {template.capabilities.slice(0, 3).map((capability, index) => (
              <Chip
                key={index}
                label={capability}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#4a5568',
                  color: '#a0aec0',
                  fontSize: '0.7rem',
                  height: 24,
                  mb: 0.5,
                }}
              />
            ))}
            {template.capabilities.length > 3 && (
              <Chip
                label={`+${template.capabilities.length - 3} more`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#4a5568',
                  color: '#a0aec0',
                  fontSize: '0.7rem',
                  height: 24,
                  mb: 0.5,
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Governance Policies */}
        <Box mb={2}>
          <Typography variant="body2" sx={{ color: '#a0aec0', mb: 1 }}>
            Governance Policies:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {template.governancePolicies.map((policy, index) => (
              <Chip
                key={index}
                label={policy}
                size="small"
                sx={{
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 24,
                  mb: 0.5,
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={4}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Trust Score
              </Typography>
              <Typography variant="h6" sx={{ color: '#3182ce' }}>
                {template.trustScore}/100
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Downloads
              </Typography>
              <Typography variant="h6" sx={{ color: '#10b981' }}>
                {template.downloads.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center" p={1} bgcolor="#1a202c" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Stars
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <Star sx={{ color: '#f59e0b', fontSize: 16 }} />
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {template.stars}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          startIcon={<CallSplit />}
          fullWidth
          onClick={() => onFork(template)}
          sx={{
            backgroundColor: '#3182ce',
            color: 'white',
            '&:hover': { backgroundColor: '#2c5aa0' },
          }}
        >
          Fork Template
        </Button>
      </CardActions>
    </Card>
  );
};

// Fork Dialog Component
const ForkDialog: React.FC<{
  open: boolean;
  template: AgentTemplate | null;
  onClose: () => void;
  onConfirm: (templateId: string, agentName: string) => void;
}> = ({ open, template, onClose, onConfirm }) => {
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    if (template) {
      setAgentName(`My ${template.name}`);
    }
  }, [template]);

  const handleConfirm = () => {
    if (template && agentName.trim()) {
      onConfirm(template.id, agentName.trim());
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2d3748',
          color: 'white',
          border: '1px solid #4a5568',
        },
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CallSplit sx={{ color: '#3182ce' }} />
          Fork Agent Template
        </Box>
      </DialogTitle>
      <DialogContent>
        {template && (
          <>
            <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
              You're about to fork <strong>{template.name}</strong> and create your own agent.
              This will create a new unwrapped agent in your "My Agents" section that you own and control.
            </Typography>
            
            <TextField
              fullWidth
              label="Agent Name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a202c',
                  color: 'white',
                  '& fieldset': { borderColor: '#4a5568' },
                  '&:hover fieldset': { borderColor: '#718096' },
                  '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                },
                '& .MuiInputLabel-root': { color: '#a0aec0' },
              }}
            />

            <Alert 
              severity="info" 
              sx={{ 
                backgroundColor: '#1e3a8a', 
                color: 'white',
                '& .MuiAlert-icon': { color: 'white' },
              }}
            >
              <Typography variant="body2">
                <strong>You will own this agent.</strong> Promethios provides the governance-enhanced 
                blueprint, but you control the agent's behavior, data, and deployment.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          sx={{ color: '#a0aec0' }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={handleConfirm}
          disabled={!agentName.trim()}
          sx={{
            backgroundColor: '#3182ce',
            color: 'white',
            '&:hover': { backgroundColor: '#2c5aa0' },
          }}
        >
          Fork & Create Agent
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Template Library Page Component
const TemplateLibraryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [governanceFilter, setGovernanceFilter] = useState('all');
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  useEffect(() => {
    // Mock data loading
    const loadTemplates = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTemplates: AgentTemplate[] = [
        {
          id: 'template-1',
          name: 'HIPAA-Compliant Support Assistant',
          description: 'Healthcare customer support agent with strict privacy controls and audit trails',
          category: 'Customer Support',
          governanceLevel: 'strict',
          trustScore: 95,
          downloads: 1247,
          stars: 89,
          tags: ['healthcare', 'hipaa', 'privacy'],
          author: 'Promethios',
          version: '2.1.0',
          lastUpdated: new Date('2024-06-15'),
          verified: true,
          capabilities: ['HIPAA Compliance', 'Audit Logging', 'Privacy Controls', 'Medical Terminology'],
          governancePolicies: ['HIPAA Strict', 'Data Retention', 'Access Control'],
          complianceFrameworks: ['HIPAA', 'SOC 2', 'ISO 27001']
        },
        {
          id: 'template-2',
          name: 'Financial Services Analyst',
          description: 'AI agent for financial data analysis with regulatory compliance and risk management',
          category: 'Data Analysis',
          governanceLevel: 'enhanced',
          trustScore: 92,
          downloads: 856,
          stars: 67,
          tags: ['finance', 'compliance', 'analysis'],
          author: 'Promethios',
          version: '1.8.0',
          lastUpdated: new Date('2024-06-10'),
          verified: true,
          capabilities: ['Financial Analysis', 'Risk Assessment', 'Regulatory Compliance', 'Report Generation'],
          governancePolicies: ['Financial Services', 'Data Classification', 'Audit Trail'],
          complianceFrameworks: ['SOX', 'PCI DSS', 'GDPR']
        },
        {
          id: 'template-3',
          name: 'Content Creation Assistant',
          description: 'Marketing content generator with brand guidelines and approval workflows',
          category: 'Content Creation',
          governanceLevel: 'basic',
          trustScore: 88,
          downloads: 2103,
          stars: 124,
          tags: ['marketing', 'content', 'branding'],
          author: 'Promethios',
          version: '1.5.0',
          lastUpdated: new Date('2024-06-08'),
          verified: true,
          capabilities: ['Content Generation', 'Brand Compliance', 'SEO Optimization', 'Multi-format Output'],
          governancePolicies: ['General Business', 'Content Review', 'Brand Guidelines'],
          complianceFrameworks: ['GDPR', 'CCPA']
        },
        {
          id: 'template-4',
          name: 'Security Monitoring Agent',
          description: 'Cybersecurity monitoring with threat detection and incident response protocols',
          category: 'Security',
          governanceLevel: 'strict',
          trustScore: 97,
          downloads: 634,
          stars: 78,
          tags: ['security', 'monitoring', 'threats'],
          author: 'Promethios',
          version: '3.0.0',
          lastUpdated: new Date('2024-06-12'),
          verified: true,
          capabilities: ['Threat Detection', 'Incident Response', 'Log Analysis', 'Alert Management'],
          governancePolicies: ['Security Strict', 'Incident Handling', 'Data Protection'],
          complianceFrameworks: ['ISO 27001', 'NIST', 'SOC 2']
        },
        {
          id: 'template-5',
          name: 'Business Intelligence Reporter',
          description: 'Automated business reporting with data visualization and executive summaries',
          category: 'Business Intelligence',
          governanceLevel: 'enhanced',
          trustScore: 90,
          downloads: 945,
          stars: 56,
          tags: ['business', 'reporting', 'analytics'],
          author: 'Promethios',
          version: '2.3.0',
          lastUpdated: new Date('2024-06-05'),
          verified: true,
          capabilities: ['Data Visualization', 'Executive Reporting', 'KPI Tracking', 'Trend Analysis'],
          governancePolicies: ['Business Intelligence', 'Data Governance', 'Report Approval'],
          complianceFrameworks: ['SOX', 'GDPR']
        },
        {
          id: 'template-6',
          name: 'Healthcare Diagnostic Assistant',
          description: 'Medical diagnostic support with clinical guidelines and safety protocols',
          category: 'Healthcare',
          governanceLevel: 'strict',
          trustScore: 98,
          downloads: 423,
          stars: 92,
          tags: ['healthcare', 'diagnostics', 'clinical'],
          author: 'Promethios',
          version: '1.9.0',
          lastUpdated: new Date('2024-06-14'),
          verified: true,
          capabilities: ['Clinical Guidelines', 'Diagnostic Support', 'Safety Protocols', 'Medical Records'],
          governancePolicies: ['HIPAA Strict', 'Clinical Safety', 'Medical Ethics'],
          complianceFrameworks: ['HIPAA', 'FDA', 'ISO 13485']
        }
      ];

      setTemplates(mockTemplates);
      setLoading(false);
    };

    loadTemplates();
  }, []);

  const handleFork = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setForkDialogOpen(true);
  };

  const handleConfirmFork = (templateId: string, agentName: string) => {
    // In a real implementation, this would call an API to fork the template
    console.log(`Forking template ${templateId} as "${agentName}"`);
    
    // Navigate to My Agents page with success message
    window.location.href = `/ui/agents/profiles?forked=${encodeURIComponent(agentName)}`;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesGovernance = governanceFilter === 'all' || template.governanceLevel === governanceFilter;
    
    return matchesSearch && matchesCategory && matchesGovernance;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                Template Library
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Browse and fork governance-enhanced agent blueprints. You own and control all forked agents.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
              sx={{
                borderColor: '#4a5568',
                color: '#a0aec0',
                '&:hover': { borderColor: '#718096', backgroundColor: '#2d3748' },
              }}
            >
              Refresh
            </Button>
          </Box>
          
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: '#1e3a8a', 
              color: 'white',
              '& .MuiAlert-icon': { color: 'white' },
            }}
          >
            <Typography variant="body2">
              <strong>Fork-and-Own Model:</strong> These are verified blueprints, not hosted agents. 
              When you fork a template, you create and own the agent. Promethios provides governance 
              tools, not control over your agents.
            </Typography>
          </Alert>
        </Box>

        {/* Filters */}
        <Box mb={4}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& fieldset': { borderColor: '#4a5568' },
                    '&:hover fieldset': { borderColor: '#718096' },
                    '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                  },
                  '& .MuiInputLabel-root': { color: '#a0aec0' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0aec0' }}>Governance Level</InputLabel>
                <Select
                  value={governanceFilter}
                  label="Governance Level"
                  onChange={(e) => setGovernanceFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                  }}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="basic">Basic Governance</MenuItem>
                  <MenuItem value="enhanced">Enhanced Governance</MenuItem>
                  <MenuItem value="strict">Strict Governance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: '#a0aec0', textAlign: 'center' }}>
                {filteredTemplates.length} templates
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Templates Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <Typography>Loading templates...</Typography>
          </Box>
        ) : filteredTemplates.length === 0 ? (
          <Alert severity="info">
            No templates found matching your criteria. Try adjusting your filters.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <TemplateCard template={template} onFork={handleFork} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Fork Dialog */}
        <ForkDialog
          open={forkDialogOpen}
          template={selectedTemplate}
          onClose={() => setForkDialogOpen(false)}
          onConfirm={handleConfirmFork}
        />
      </Container>
    </ThemeProvider>
  );
};

export default TemplateLibraryPage;

