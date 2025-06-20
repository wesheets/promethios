import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Divider,
  Badge,
  Tab,
  Tabs,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  FilterList,
  Star,
  Download,
  Visibility,
  CallSplit,
  Share,
  Favorite,
  FavoriteBorder,
  MoreVert,
  Verified,
  Security,
  Speed,
  Api,
  Build,
  Public,
  Lock,
  TrendingUp,
  People,
  Code,
  Description,
  Category,
  Business,
  HealthAndSafety,
  AccountBalance,
  School,
  ShoppingCart,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../theme/darkTheme';

interface RegistryAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  type: 'single' | 'multi-agent'; // New field for agent type
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  version: string;
  rating: number;
  downloads: number;
  forks: number;
  visibility: 'public' | 'private' | 'organization';
  tags: string[];
  governance: {
    compliant: boolean;
    policies: string[];
    trustScore: number;
    tier: 'basic' | 'enhanced' | 'strict'; // New governance tier
  };
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
    betaFeature: boolean; // Mark pricing as beta
  };
  lastUpdated: Date;
  featured: boolean;
  capabilities: string[];
  // Multi-agent specific fields
  agentCount?: number;
  orchestrationType?: 'sequential' | 'parallel' | 'hierarchical';
  systemComplexity?: 'simple' | 'moderate' | 'complex';
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
      id={`registry-tabpanel-${index}`}
      aria-labelledby={`registry-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AgentRegistryCard: React.FC<{ agent: RegistryAgent; onFork: (agent: RegistryAgent) => void }> = ({ agent, onFork }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'customer service': return <People sx={{ color: '#3b82f6' }} />;
      case 'data analysis': return <TrendingUp sx={{ color: '#10b981' }} />;
      case 'content creation': return <Description sx={{ color: '#f59e0b' }} />;
      case 'automation': return <Build sx={{ color: '#7c3aed' }} />;
      case 'security': return <Security sx={{ color: '#ef4444' }} />;
      default: return <Api sx={{ color: '#6b7280' }} />;
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'healthcare': return <HealthAndSafety sx={{ color: '#ef4444' }} />;
      case 'finance': return <AccountBalance sx={{ color: '#10b981' }} />;
      case 'education': return <School sx={{ color: '#3b82f6' }} />;
      case 'retail': return <ShoppingCart sx={{ color: '#f59e0b' }} />;
      case 'technology': return <Code sx={{ color: '#7c3aed' }} />;
      default: return <Business sx={{ color: '#6b7280' }} />;
    }
  };

  return (
    <Card sx={{ 
      backgroundColor: '#2d3748', 
      color: 'white',
      border: '1px solid #4a5568',
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        borderColor: '#718096',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
      }
    }}>
      {agent.featured && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          px: 2,
          py: 0.5,
          borderBottomLeftRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 600,
          zIndex: 1
        }}>
          Featured
        </Box>
      )}
      
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {agent.name}
              </Typography>
              {agent.author.verified && (
                <Verified sx={{ color: '#3b82f6', fontSize: 16 }} />
              )}
              {agent.visibility === 'private' && (
                <Lock sx={{ color: '#6b7280', fontSize: 16 }} />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar 
                src={agent.author.avatar} 
                sx={{ width: 20, height: 20 }}
              />
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                by {agent.author.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                v{agent.version}
              </Typography>
            </Box>
          </Box>
          
          <IconButton 
            sx={{ color: '#a0aec0' }}
            onClick={() => setIsFavorited(!isFavorited)}
          >
            {isFavorited ? <Favorite sx={{ color: '#ef4444' }} /> : <FavoriteBorder />}
          </IconButton>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ 
          color: '#a0aec0', 
          mb: 2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {agent.description}
        </Typography>

        {/* Category and Industry */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getCategoryIcon(agent.category)}
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              {agent.category}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getIndustryIcon(agent.industry)}
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              {agent.industry}
            </Typography>
          </Box>
        </Box>

        {/* Tags */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {agent.tags.slice(0, 3).map((tag, index) => (
              <Chip 
                key={tag} 
                label={tag} 
                size="small" 
                sx={{ 
                  backgroundColor: '#4a5568',
                  color: '#d1d5db',
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            ))}
            {agent.tags.length > 3 && (
              <Chip 
                label={`+${agent.tags.length - 3}`}
                size="small" 
                sx={{ 
                  backgroundColor: '#6b7280',
                  color: '#d1d5db',
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            )}
          </Box>
        </Box>

        {/* Metrics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Star sx={{ color: '#f59e0b', fontSize: 14 }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {agent.rating.toFixed(1)}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Rating
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                {agent.downloads.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Downloads
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                {agent.forks}
              </Typography>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Forks
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Governance and Type */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security sx={{ 
                color: agent.governance.compliant ? '#10b981' : '#ef4444', 
                fontSize: 16 
              }} />
              <Typography variant="caption" sx={{ 
                color: agent.governance.compliant ? '#10b981' : '#ef4444' 
              }}>
                {agent.governance.compliant ? 'Governance Compliant' : 'Needs Review'}
              </Typography>
              {/* Governance Tier Badge */}
              <Chip 
                label={agent.governance.tier.toUpperCase()}
                size="small"
                sx={{ 
                  backgroundColor: 
                    agent.governance.tier === 'strict' ? '#dc2626' :
                    agent.governance.tier === 'enhanced' ? '#f59e0b' : '#6b7280',
                  color: 'white',
                  fontSize: '0.6rem',
                  height: 16
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#a0aec0' }}>
              Trust: {agent.governance.trustScore}/100
            </Typography>
          </Box>
          
          {/* Agent Type and Multi-Agent Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={agent.type === 'single' ? 'Single Agent' : 'Multi-Agent System'}
              size="small"
              sx={{ 
                backgroundColor: agent.type === 'single' ? '#3b82f6' : '#8b5cf6',
                color: 'white',
                fontSize: '0.7rem',
                height: 18
              }}
            />
            {agent.type === 'multi-agent' && (
              <>
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  {agent.agentCount} agents • {agent.orchestrationType}
                </Typography>
                <Chip 
                  label={agent.systemComplexity}
                  size="small"
                  sx={{ 
                    backgroundColor: 
                      agent.systemComplexity === 'complex' ? '#dc2626' :
                      agent.systemComplexity === 'moderate' ? '#f59e0b' : '#10b981',
                    color: 'white',
                    fontSize: '0.6rem',
                    height: 16
                  }}
                />
              </>
            )}
          </Box>
        </Box>

        {/* Pricing with Beta Badge */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={
                agent.pricing.type === 'free' 
                  ? 'Free' 
                  : agent.pricing.type === 'paid' 
                    ? `$${agent.pricing.price}/month`
                    : 'Freemium'
              }
              size="small"
              sx={{ 
                backgroundColor: agent.pricing.type === 'free' ? '#10b981' : '#3b82f6',
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
            {agent.pricing.betaFeature && (
              <Chip 
                label="💰 Beta - Coming Soon"
                size="small"
                sx={{ 
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  fontSize: '0.6rem',
                  height: 18
                }}
              />
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<CallSplit />}
            onClick={() => onFork(agent)}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              flex: 1
            }}
          >
            Fork
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            sx={{
              borderColor: '#4a5568',
              color: '#a0aec0',
              '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
            }}
          >
            View
          </Button>
          <IconButton sx={{ color: '#a0aec0' }}>
            <Share />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

const RegistryPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [pricingFilter, setPricingFilter] = useState('all');
  const [registryAgents, setRegistryAgents] = useState<RegistryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<RegistryAgent | null>(null);

  useEffect(() => {
    // Mock data loading
    const loadRegistryAgents = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockRegistryAgents: RegistryAgent[] = [
        {
          id: 'registry-1',
          name: 'Customer Support Assistant',
          description: 'AI-powered customer service agent with natural language processing, sentiment analysis, and multi-channel support.',
          category: 'Customer Service',
          industry: 'Technology',
          type: 'single',
          author: {
            name: 'TechCorp Solutions',
            avatar: '/api/placeholder/32/32',
            verified: true
          },
          version: '2.1.0',
          rating: 4.8,
          downloads: 15420,
          forks: 234,
          visibility: 'public',
          tags: ['customer-service', 'nlp', 'sentiment-analysis', 'multi-channel'],
          governance: {
            compliant: true,
            policies: ['GDPR', 'CCPA', 'SOC2'],
            trustScore: 94,
            tier: 'enhanced'
          },
          pricing: {
            type: 'freemium',
            price: 49,
            betaFeature: true
          },
          lastUpdated: new Date('2024-06-15'),
          featured: true,
          capabilities: ['Natural Language Processing', 'Sentiment Analysis', 'Multi-channel Support']
        },
        {
          id: 'registry-2',
          name: 'Financial Analysis Suite',
          description: 'Comprehensive financial modeling and risk assessment agent with regulatory compliance and real-time market data integration.',
          category: 'Finance',
          industry: 'Financial Services',
          type: 'multi-agent',
          agentCount: 4,
          orchestrationType: 'hierarchical',
          systemComplexity: 'complex',
          author: {
            name: 'FinanceAI Corp',
            avatar: '/api/placeholder/32/32',
            verified: true
          },
          version: '1.5.2',
          rating: 4.9,
          downloads: 8930,
          forks: 156,
          visibility: 'public',
          tags: ['finance', 'analysis', 'compliance', 'risk-assessment'],
          governance: {
            compliant: true,
            policies: ['SOX', 'FINRA', 'Basel III'],
            trustScore: 98,
            tier: 'strict'
          },
          pricing: {
            type: 'paid',
            price: 99,
            betaFeature: true
          },
          lastUpdated: new Date('2024-06-12'),
          featured: true,
          capabilities: ['Financial Modeling', 'Risk Analysis', 'Regulatory Compliance']
        },
        {
          id: 'registry-3',
          name: 'Content Creator Studio',
          description: 'Multi-modal content creation agent for blogs, social media, marketing copy, and visual content with brand consistency.',
          category: 'Content Creation',
          industry: 'Marketing',
          type: 'single',
          author: {
            name: 'Creative Labs',
            avatar: '/api/placeholder/32/32',
            verified: false
          },
          version: '1.2.1',
          rating: 4.6,
          downloads: 12340,
          forks: 89,
          visibility: 'public',
          tags: ['content', 'marketing', 'social-media', 'branding'],
          governance: {
            compliant: true,
            policies: ['Copyright', 'Brand Safety'],
            trustScore: 87,
            tier: 'basic'
          },
          pricing: {
            type: 'free',
            betaFeature: false
          },
          lastUpdated: new Date('2024-06-08'),
          featured: false,
          capabilities: ['Content Generation', 'Brand Consistency', 'Multi-modal Output']
        },
        {
          id: 'registry-4',
          name: 'Healthcare Diagnostic Team',
          description: 'Multi-agent system for medical diagnosis, treatment recommendations, and patient care coordination with HIPAA compliance.',
          category: 'Healthcare',
          industry: 'Healthcare',
          type: 'multi-agent',
          agentCount: 6,
          orchestrationType: 'parallel',
          systemComplexity: 'complex',
          author: {
            name: 'MedTech Innovations',
            avatar: '/api/placeholder/32/32',
            verified: true
          },
          version: '3.0.1',
          rating: 4.7,
          downloads: 3210,
          forks: 45,
          visibility: 'public',
          tags: ['healthcare', 'diagnosis', 'hipaa', 'patient-care'],
          governance: {
            compliant: true,
            policies: ['HIPAA', 'FDA', 'Medical Ethics'],
            trustScore: 96,
            tier: 'strict'
          },
          pricing: {
            type: 'paid',
            price: 299,
            betaFeature: true
          },
          lastUpdated: new Date('2024-06-10'),
          featured: true,
          capabilities: ['Medical Diagnosis', 'Treatment Planning', 'Patient Coordination']
        },
        {
          id: 'registry-5',
          name: 'E-commerce Optimizer',
          description: 'Smart e-commerce agent for product recommendations, inventory management, and customer behavior analysis.',
          category: 'E-commerce',
          industry: 'Retail',
          type: 'single',
          author: {
            name: 'RetailBot Inc',
            avatar: '/api/placeholder/32/32',
            verified: false
          },
          version: '1.8.3',
          rating: 4.4,
          downloads: 9876,
          forks: 123,
          visibility: 'public',
          tags: ['e-commerce', 'recommendations', 'inventory', 'analytics'],
          governance: {
            compliant: false,
            policies: ['Basic Privacy'],
            trustScore: 73,
            tier: 'basic'
          },
          pricing: {
            type: 'freemium',
            price: 59,
            betaFeature: true
          },
          lastUpdated: new Date('2024-06-05'),
          featured: false,
          capabilities: ['Product Recommendations', 'Inventory Management', 'Customer Analytics']
        },
        {
          id: 'registry-6',
          name: 'Security Operations Center',
          description: 'Multi-agent cybersecurity system for threat detection, incident response, and security compliance monitoring.',
          category: 'Security',
          industry: 'Technology',
          type: 'multi-agent',
          agentCount: 8,
          orchestrationType: 'sequential',
          systemComplexity: 'complex',
          author: {
            name: 'CyberGuard Systems',
            avatar: '/api/placeholder/32/32',
            verified: true
          },
          version: '2.3.1',
          rating: 4.9,
          downloads: 5430,
          forks: 67,
          visibility: 'public',
          tags: ['security', 'threat-detection', 'compliance', 'monitoring'],
          governance: {
            compliant: true,
            policies: ['ISO 27001', 'NIST', 'SOC2'],
            trustScore: 97,
            tier: 'strict'
          },
          pricing: {
            type: 'paid',
            price: 199,
            betaFeature: true
          },
          lastUpdated: new Date('2024-06-13'),
          featured: true,
          capabilities: ['Threat Detection', 'Incident Response', 'Compliance Monitoring']
        }
      ];

      setRegistryAgents(mockRegistryAgents);
      setLoading(false);
    };

    loadRegistryAgents();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFork = (agent: RegistryAgent) => {
    setSelectedAgent(agent);
    setForkDialogOpen(true);
  };

  const handleForkConfirm = () => {
    // Handle fork logic here
    setForkDialogOpen(false);
    setSelectedAgent(null);
  };

  const filteredAgents = registryAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || agent.category === categoryFilter;
    const matchesIndustry = industryFilter === 'all' || agent.industry === industryFilter;
    const matchesPricing = pricingFilter === 'all' || agent.pricing.type === pricingFilter;
    const matchesVisibility = tabValue === 0 ? agent.visibility === 'public' : agent.visibility !== 'public';
    
    return matchesSearch && matchesCategory && matchesIndustry && matchesPricing && matchesVisibility;
  });

  const publicAgents = registryAgents.filter(agent => agent.visibility === 'public');
  const privateAgents = registryAgents.filter(agent => agent.visibility !== 'public');
  const featuredAgents = registryAgents.filter(agent => agent.featured);

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <Typography>Loading agent registry...</Typography>
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ p: 3, backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <Container maxWidth="xl">
          <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Agent Registry
          </Typography>

          {/* Featured Agents */}
          {featuredAgents.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                🌟 Featured Agents
              </Typography>
              <Grid container spacing={3}>
                {featuredAgents.slice(0, 3).map((agent) => (
                  <Grid item xs={12} md={6} lg={4} key={agent.id}>
                    <AgentRegistryCard agent={agent} onFork={handleFork} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Search and Filters */}
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568', mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search agents, tags, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#a0aec0' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#1a202c',
                        color: 'white',
                        '& fieldset': { borderColor: '#4a5568' },
                        '&:hover fieldset': { borderColor: '#718096' },
                        '&.Mui-focused fieldset': { borderColor: '#3182ce' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#a0aec0' }}>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      sx={{
                        backgroundColor: '#1a202c',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                      }}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="Customer Service">Customer Service</MenuItem>
                      <MenuItem value="Data Analysis">Data Analysis</MenuItem>
                      <MenuItem value="Content Creation">Content Creation</MenuItem>
                      <MenuItem value="Automation">Automation</MenuItem>
                      <MenuItem value="Security">Security</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#a0aec0' }}>Industry</InputLabel>
                    <Select
                      value={industryFilter}
                      label="Industry"
                      onChange={(e) => setIndustryFilter(e.target.value)}
                      sx={{
                        backgroundColor: '#1a202c',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                      }}
                    >
                      <MenuItem value="all">All Industries</MenuItem>
                      <MenuItem value="Technology">Technology</MenuItem>
                      <MenuItem value="Finance">Finance</MenuItem>
                      <MenuItem value="Healthcare">Healthcare</MenuItem>
                      <MenuItem value="Retail">Retail</MenuItem>
                      <MenuItem value="Marketing">Marketing</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#a0aec0' }}>Pricing</InputLabel>
                    <Select
                      value={pricingFilter}
                      label="Pricing"
                      onChange={(e) => setPricingFilter(e.target.value)}
                      sx={{
                        backgroundColor: '#1a202c',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182ce' },
                      }}
                    >
                      <MenuItem value="all">All Pricing</MenuItem>
                      <MenuItem value="free">Free</MenuItem>
                      <MenuItem value="freemium">Freemium</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    sx={{
                      borderColor: '#4a5568',
                      color: '#a0aec0',
                      '&:hover': { borderColor: '#718096', backgroundColor: '#374151' },
                      height: '56px',
                      width: '100%'
                    }}
                  >
                    More Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Registry Tabs */}
          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <Box sx={{ borderBottom: 1, borderColor: '#4a5568' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': { 
                    color: '#a0aec0',
                    '&.Mui-selected': { color: '#3b82f6' }
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
              {/* Agent Type Tabs */}
          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
                '& .MuiTab-root': { 
                  color: '#a0aec0',
                  '&.Mui-selected': { color: '#3b82f6' }
                }
              }}
            >
              <Tab label="Single Agents" />
              <Tab label="Multi-Agent Systems" />
              <Tab label="My Library" />
            </Tabs>
          </Box>

          <Card sx={{ backgroundColor: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
            <TabPanel value={tabValue} index={0}>
              {/* Single Agents */}
              {filteredAgents.filter(agent => agent.type === 'single').length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>No Single Agents Found</AlertTitle>
                  Try adjusting your search criteria or browse our featured agents above.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {filteredAgents.filter(agent => agent.type === 'single').map((agent) => (
                    <Grid item xs={12} md={6} lg={4} key={agent.id}>
                      <AgentRegistryCard agent={agent} onFork={handleFork} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Multi-Agent Systems */}
              {filteredAgents.filter(agent => agent.type === 'multi-agent').length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <AlertTitle>No Multi-Agent Systems Found</AlertTitle>
                  Try adjusting your search criteria or browse our featured systems above.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {filteredAgents.filter(agent => agent.type === 'multi-agent').map((agent) => (
                    <Grid item xs={12} md={6} lg={4} key={agent.id}>
                      <AgentRegistryCard agent={agent} onFork={handleFork} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* My Library */}
              <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                <AlertTitle>Your Private Agent Library</AlertTitle>
                This section will show agents you've created, forked, or have private access to within your organization.
              </Alert>
            </TabPanel>
          </Card>

          {/* Fork Dialog */}
          <Dialog 
            open={forkDialogOpen} 
            onClose={() => setForkDialogOpen(false)}
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
                <CallSplit sx={{ color: '#3b82f6' }} />
                Fork Agent: {selectedAgent?.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: '#a0aec0', mb: 2 }}>
                Forking this agent will create a copy in your workspace that you can customize and deploy.
              </Typography>
              <Alert severity="info" sx={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                <Typography variant="body2">
                  The forked agent will inherit all governance policies and trust metrics from the original.
                  You can modify the agent's behavior while maintaining compliance standards.
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setForkDialogOpen(false)}
                sx={{ color: '#a0aec0' }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                onClick={handleForkConfirm}
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' },
                }}
              >
                Fork Agent
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default RegistryPage;

