/**
 * Universal Knowledge Management Page
 * 
 * This page provides RAG (Retrieval-Augmented Generation) capabilities for all agent types
 * across all Promethios verticals: Chat, Education, Kids, Enterprise, Multi-Agent Systems
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Badge,
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
} from '@mui/material';
import {
  School as KnowledgeIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  SmartToy as AgentIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandIcon,
  Info as InfoIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Business as BusinessIcon,
  ChildCare as KidsIcon,
  Groups as MultiAgentIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CloudUpload as CloudIcon,
  Storage as DatabaseIcon,
  Speed as PerformanceIcon,
  Security as GovernanceIcon,
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
  knowledgeBasesCount: number;
  createdAt: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  vertical: 'chat' | 'education' | 'kids' | 'enterprise' | 'multi-agent' | 'universal';
  documentCount: number;
  size: string;
  status: 'ready' | 'processing' | 'error';
  agentsUsing: string[];
  createdAt: string;
  lastUpdated: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'processed' | 'processing' | 'error';
  chunks: number;
  uploadedAt: string;
}

const UniversalKnowledgeManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<WrappedAgent | null>(null);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [wrappedAgents, setWrappedAgents] = useState<WrappedAgent[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createKBDialogOpen, setCreateKBDialogOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  const verticalIcons = {
    chat: <ChatIcon />,
    education: <KnowledgeIcon />,
    kids: <KidsIcon />,
    enterprise: <BusinessIcon />,
    'multi-agent': <MultiAgentIcon />
  };

  const verticalColors = {
    chat: 'primary',
    education: 'secondary', 
    kids: 'success',
    enterprise: 'warning',
    'multi-agent': 'info'
  } as const;

  // Mock data - replace with real API calls
  useEffect(() => {
    setWrappedAgents([
      {
        id: 'agent-1',
        name: 'Customer Support Assistant',
        description: 'AI assistant for customer support with emotional intelligence',
        provider: 'OpenAI',
        vertical: 'chat',
        status: 'active',
        governanceLevel: 'Standard',
        trustScore: 87,
        knowledgeBasesCount: 2,
        createdAt: '2024-08-10'
      },
      {
        id: 'agent-2',
        name: 'Math Tutor',
        description: 'Educational AI for mathematics instruction',
        provider: 'Anthropic',
        vertical: 'education',
        status: 'active',
        governanceLevel: 'Advanced',
        trustScore: 92,
        knowledgeBasesCount: 3,
        createdAt: '2024-08-09'
      },
      {
        id: 'agent-3',
        name: 'Safe Learning Companion',
        description: 'Child-safe AI for educational activities',
        provider: 'Cohere',
        vertical: 'kids',
        status: 'active',
        governanceLevel: 'Maximum',
        trustScore: 95,
        knowledgeBasesCount: 1,
        createdAt: '2024-08-08'
      },
      {
        id: 'agent-4',
        name: 'Policy Compliance Bot',
        description: 'Enterprise AI for policy and compliance queries',
        provider: 'Gemini',
        vertical: 'enterprise',
        status: 'active',
        governanceLevel: 'Advanced',
        trustScore: 89,
        knowledgeBasesCount: 4,
        createdAt: '2024-08-07'
      },
      {
        id: 'agent-5',
        name: 'Research Coordinator',
        description: 'Multi-agent system coordinator for research tasks',
        provider: 'HuggingFace',
        vertical: 'multi-agent',
        status: 'active',
        governanceLevel: 'Standard',
        trustScore: 84,
        knowledgeBasesCount: 5,
        createdAt: '2024-08-06'
      }
    ]);

    setKnowledgeBases([
      {
        id: 'kb-1',
        name: 'Product Documentation',
        description: 'Complete product manuals and user guides',
        vertical: 'chat',
        documentCount: 45,
        size: '12.3 MB',
        status: 'ready',
        agentsUsing: ['agent-1'],
        createdAt: '2024-08-10',
        lastUpdated: '2024-08-11'
      },
      {
        id: 'kb-2',
        name: 'Mathematics Curriculum',
        description: 'K-12 mathematics curriculum and exercises',
        vertical: 'education',
        documentCount: 128,
        size: '45.7 MB',
        status: 'ready',
        agentsUsing: ['agent-2'],
        createdAt: '2024-08-09',
        lastUpdated: '2024-08-10'
      },
      {
        id: 'kb-3',
        name: 'Child-Safe Content',
        description: 'Age-appropriate educational content for children',
        vertical: 'kids',
        documentCount: 67,
        size: '8.2 MB',
        status: 'ready',
        agentsUsing: ['agent-3'],
        createdAt: '2024-08-08',
        lastUpdated: '2024-08-09'
      },
      {
        id: 'kb-4',
        name: 'Company Policies',
        description: 'HR policies, compliance guidelines, and procedures',
        vertical: 'enterprise',
        documentCount: 89,
        size: '23.4 MB',
        status: 'ready',
        agentsUsing: ['agent-4'],
        createdAt: '2024-08-07',
        lastUpdated: '2024-08-08'
      },
      {
        id: 'kb-5',
        name: 'Research Database',
        description: 'Shared research papers and findings',
        vertical: 'universal',
        documentCount: 234,
        size: '156.8 MB',
        status: 'ready',
        agentsUsing: ['agent-5', 'agent-2', 'agent-4'],
        createdAt: '2024-08-06',
        lastUpdated: '2024-08-11'
      }
    ]);

    setDocuments([
      {
        id: 'doc-1',
        name: 'User Manual v2.1.pdf',
        type: 'PDF',
        size: '2.3 MB',
        status: 'processed',
        chunks: 45,
        uploadedAt: '2024-08-11'
      },
      {
        id: 'doc-2',
        name: 'FAQ Database.docx',
        type: 'DOCX',
        size: '1.1 MB',
        status: 'processed',
        chunks: 23,
        uploadedAt: '2024-08-10'
      },
      {
        id: 'doc-3',
        name: 'Training Materials.pptx',
        type: 'PPTX',
        size: '5.7 MB',
        status: 'processing',
        chunks: 0,
        uploadedAt: '2024-08-11'
      }
    ]);
  }, []);

  const handleTestKnowledge = async () => {
    if (!testQuery.trim()) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTestResults([
        {
          content: "Based on the product documentation, here's how to reset your password...",
          source: "User Manual v2.1.pdf",
          confidence: 0.92,
          chunk: "Section 3.2: Account Management"
        },
        {
          content: "For additional password security, we recommend enabling two-factor authentication...",
          source: "Security Guidelines.pdf",
          confidence: 0.87,
          chunk: "Section 2.1: Authentication"
        }
      ]);
      setLoading(false);
    }, 1500);
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
        Knowledge Management Overview
      </Typography>
      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
        Manage knowledge bases and RAG capabilities for all your agents across all verticals.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AgentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'white' }}>{wrappedAgents.length}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Agents</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <DatabaseIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'white' }}>{knowledgeBases.length}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Knowledge Bases</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CloudIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'white' }}>{documents.length}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Documents</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PerformanceIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'white' }}>94%</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Avg. Accuracy</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>Agents by Vertical</Typography>
      <Grid container spacing={2}>
        {Object.entries(
          wrappedAgents.reduce((acc, agent) => {
            acc[agent.vertical] = (acc[agent.vertical] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([vertical, count]) => (
          <Grid item xs={12} sm={6} md={2.4} key={vertical}>
            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                {verticalIcons[vertical as keyof typeof verticalIcons]}
                <Typography variant="h6" sx={{ mt: 1, color: 'white' }}>{count}</Typography>
                <Chip 
                  label={vertical} 
                  size="small" 
                  color={verticalColors[vertical as keyof typeof verticalColors]}
                  sx={{ textTransform: 'capitalize' }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAgents = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ color: 'white' }}>Wrapped Agents</Typography>
        <Button variant="outlined" href="/ui/agents/wrapping" sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
          Wrap New Agent
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Agent</TableCell>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Vertical</TableCell>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Provider</TableCell>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Knowledge Bases</TableCell>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Trust Score</TableCell>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wrappedAgents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'white' }}>{agent.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      ID: {agent.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <Chip 
                    label={agent.vertical} 
                    size="small" 
                    color={verticalColors[agent.vertical as keyof typeof verticalColors]}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{agent.provider}</TableCell>
                <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{agent.knowledgeBasesCount}</TableCell>
                <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress 
                      variant="determinate" 
                      value={agent.trustScore} 
                      sx={{ width: 60, height: 6 }}
                    />
                    <Typography variant="body2" sx={{ color: 'white' }}>{agent.trustScore}%</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <Chip 
                    label={agent.status} 
                    size="small" 
                    color={agent.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <IconButton size="small" sx={{ color: 'white' }}>
                    <SettingsIcon />
                  </IconButton>
                  <IconButton size="small" sx={{ color: 'white' }}>
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderKnowledgeBases = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Knowledge Bases</Typography>
        <Button 
          variant="contained" 
          startIcon={<KnowledgeIcon />}
          onClick={() => setCreateKBDialogOpen(true)}
        >
          Create Knowledge Base
        </Button>
      </Box>

      <Grid container spacing={3}>
        {knowledgeBases.map((kb) => (
          <Grid item xs={12} md={6} lg={4} key={kb.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DatabaseIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{kb.name}</Typography>
                  <Chip 
                    label={kb.vertical}
                    size="small"
                    color={kb.vertical === 'universal' ? 'secondary' : verticalColors[kb.vertical as keyof typeof verticalColors]}
                    sx={{ ml: 'auto', textTransform: 'capitalize' }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {kb.description}
                </Typography>

                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="caption">
                    {kb.documentCount} documents
                  </Typography>
                  <Typography variant="caption">
                    {kb.size}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="caption">
                    Used by {kb.agentsUsing.length} agents
                  </Typography>
                  <Chip 
                    label={kb.status}
                    size="small"
                    color={kb.status === 'ready' ? 'success' : 'warning'}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" gap={1}>
                  <Button 
                    size="small" 
                    startIcon={<ViewIcon />}
                    onClick={() => setSelectedKnowledgeBase(kb)}
                  >
                    View
                  </Button>
                  <Button size="small" startIcon={<EditIcon />}>
                    Edit
                  </Button>
                  <Button size="small" startIcon={<UploadIcon />}>
                    Add Docs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDocuments = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Documents</Typography>
        <Button 
          variant="contained" 
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Documents
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Chunks</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Typography variant="subtitle2">{doc.name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={doc.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell>{doc.chunks}</TableCell>
                <TableCell>
                  <Chip 
                    label={doc.status}
                    size="small"
                    color={doc.status === 'processed' ? 'success' : doc.status === 'processing' ? 'warning' : 'error'}
                  />
                </TableCell>
                <TableCell>{doc.uploadedAt}</TableCell>
                <TableCell>
                  <IconButton size="small">
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderTesting = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Knowledge Testing
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test knowledge retrieval across all your knowledge bases and agents.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Query
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter a question to test knowledge retrieval..."
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Knowledge Base</InputLabel>
                <Select
                  value={selectedKnowledgeBase?.id || ''}
                  onChange={(e) => {
                    const kb = knowledgeBases.find(k => k.id === e.target.value);
                    setSelectedKnowledgeBase(kb || null);
                  }}
                  label="Knowledge Base"
                >
                  <MenuItem value="">All Knowledge Bases</MenuItem>
                  {knowledgeBases.map((kb) => (
                    <MenuItem key={kb.id} value={kb.id}>
                      {kb.name} ({kb.vertical})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button 
                variant="contained" 
                fullWidth
                startIcon={<SearchIcon />}
                onClick={handleTestKnowledge}
                disabled={!testQuery.trim() || loading}
              >
                {loading ? 'Searching...' : 'Test Knowledge'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Results
              </Typography>

              {loading && <LinearProgress sx={{ mb: 2 }} />}

              {testResults.length > 0 ? (
                <List>
                  {testResults.map((result, index) => (
                    <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                      <ListItemText
                        primary={result.content}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Source: {result.source} • {result.chunk}
                            </Typography>
                            <Box display="flex" alignItems="center" mt={1}>
                              <Typography variant="caption" sx={{ mr: 1 }}>
                                Confidence:
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={result.confidence * 100} 
                                sx={{ width: 100, mr: 1 }}
                              />
                              <Typography variant="caption">
                                {Math.round(result.confidence * 100)}%
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Enter a query and click "Test Knowledge" to see results.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 3, bgcolor: 'transparent' }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          Universal Knowledge Management
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Manage RAG capabilities for all agents across Chat, Education, Kids, Enterprise, and Multi-Agent verticals.
        </Typography>
      </Box>

      <Paper sx={{ 
        mb: 4, 
        bgcolor: 'rgba(255, 255, 255, 0.05)', 
        border: '1px solid rgba(255, 255, 255, 0.1)' 
      }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiTab-root': { 
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': { color: 'white' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#4299e1' }
          }}
        >
          <Tab label="Overview" />
          <Tab label="Agents" />
          <Tab label="Knowledge Bases" />
          <Tab label="Documents" />
          <Tab label="Testing" />
        </Tabs>
      </Paper>

      <Box>
        {selectedTab === 0 && renderOverview()}
        {selectedTab === 1 && renderAgents()}
        {selectedTab === 2 && renderKnowledgeBases()}
        {selectedTab === 3 && renderDocuments()}
        {selectedTab === 4 && renderTesting()}
      </Box>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Documents</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 4, border: '2px dashed', borderColor: 'primary.main', textAlign: 'center' }}>
            <CloudIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & Drop Files Here
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Supported formats: PDF, DOCX, PPTX, TXT, MD
            </Typography>
            <Button variant="contained" startIcon={<UploadIcon />}>
              Choose Files
            </Button>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Create Knowledge Base Dialog */}
      <Dialog open={createKBDialogOpen} onClose={() => setCreateKBDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Knowledge Base</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            margin="normal"
            placeholder="e.g., Product Documentation"
          />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe the purpose and content of this knowledge base"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Vertical</InputLabel>
            <Select label="Vertical">
              <MenuItem value="universal">Universal (All Verticals)</MenuItem>
              <MenuItem value="chat">Chat</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="kids">Kids</MenuItem>
              <MenuItem value="enterprise">Enterprise</MenuItem>
              <MenuItem value="multi-agent">Multi-Agent</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateKBDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UniversalKnowledgeManagement;

