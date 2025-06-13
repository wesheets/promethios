import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Paper,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { AgentCardWithChat } from './AgentCardWithChat';
import { ChatMode } from '../types';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  category: string;
  rating: number;
  totalChats: number;
  governanceScore?: number;
  isMultiAgent?: boolean;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  tags: string[];
  lastActive: Date;
}

interface AgentProfilesWithChatProps {
  userId: string;
  onOpenFullChat?: (agentId: string, sessionId?: string) => void;
  onCreateAgent?: () => void;
  onViewMetrics?: (agentId: string) => void;
}

export const AgentProfilesWithChat: React.FC<AgentProfilesWithChatProps> = ({
  userId,
  onOpenFullChat,
  onCreateAgent,
  onViewMetrics
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Mock agent data
  useEffect(() => {
    const mockAgents: Agent[] = [
      {
        id: 'agent-1',
        name: 'Research Assistant',
        description: 'Specialized in academic research, data analysis, and report generation',
        category: 'Research',
        rating: 4.8,
        totalChats: 1247,
        governanceScore: 95,
        isMultiAgent: false,
        capabilities: ['Research', 'Data Analysis', 'Report Writing', 'Citation Management'],
        status: 'online',
        tags: ['academic', 'research', 'analysis'],
        lastActive: new Date()
      },
      {
        id: 'agent-2',
        name: 'Code Review Team',
        description: 'Multi-agent system for comprehensive code review and quality assurance',
        category: 'Development',
        rating: 4.9,
        totalChats: 892,
        governanceScore: 88,
        isMultiAgent: true,
        capabilities: ['Code Review', 'Security Analysis', 'Performance Optimization', 'Documentation'],
        status: 'online',
        tags: ['development', 'code-review', 'security'],
        lastActive: new Date()
      },
      {
        id: 'agent-3',
        name: 'Content Creator',
        description: 'Creative writing, marketing copy, and content strategy specialist',
        category: 'Creative',
        rating: 4.6,
        totalChats: 634,
        governanceScore: 92,
        isMultiAgent: false,
        capabilities: ['Creative Writing', 'Marketing Copy', 'SEO', 'Social Media'],
        status: 'busy',
        tags: ['creative', 'marketing', 'content'],
        lastActive: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'agent-4',
        name: 'Legal Advisory Panel',
        description: 'Multi-agent legal consultation system with specialized expertise',
        category: 'Legal',
        rating: 4.7,
        totalChats: 456,
        governanceScore: 98,
        isMultiAgent: true,
        capabilities: ['Legal Research', 'Contract Review', 'Compliance', 'Risk Assessment'],
        status: 'online',
        tags: ['legal', 'compliance', 'contracts'],
        lastActive: new Date()
      },
      {
        id: 'agent-5',
        name: 'Data Scientist',
        description: 'Advanced analytics, machine learning, and statistical modeling',
        category: 'Analytics',
        rating: 4.5,
        totalChats: 789,
        governanceScore: 85,
        isMultiAgent: false,
        capabilities: ['Machine Learning', 'Statistics', 'Data Visualization', 'Predictive Modeling'],
        status: 'offline',
        tags: ['data-science', 'ml', 'analytics'],
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'agent-6',
        name: 'Customer Support Hub',
        description: 'Multi-agent customer service system with escalation capabilities',
        category: 'Support',
        rating: 4.4,
        totalChats: 2156,
        governanceScore: 90,
        isMultiAgent: true,
        capabilities: ['Customer Service', 'Issue Resolution', 'Escalation Management', 'Knowledge Base'],
        status: 'online',
        tags: ['support', 'customer-service', 'help'],
        lastActive: new Date()
      }
    ];

    setAgents(mockAgents);
    setFilteredAgents(mockAgents);
  }, []);

  // Filter and sort agents
  useEffect(() => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase())) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(agent => agent.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(agent => agent.status === statusFilter);
    }

    // Tab filter
    if (activeTab === 1) { // Multi-Agent only
      filtered = filtered.filter(agent => agent.isMultiAgent);
    } else if (activeTab === 2) { // High Governance only
      filtered = filtered.filter(agent => (agent.governanceScore || 0) >= 90);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'chats':
          return b.totalChats - a.totalChats;
        case 'governance':
          return (b.governanceScore || 0) - (a.governanceScore || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return b.lastActive.getTime() - a.lastActive.getTime();
        default:
          return 0;
      }
    });

    setFilteredAgents(filtered);
  }, [agents, searchQuery, categoryFilter, statusFilter, sortBy, activeTab]);

  // Get unique categories
  const categories = Array.from(new Set(agents.map(agent => agent.category)));

  // Get counts for tabs
  const multiAgentCount = agents.filter(agent => agent.isMultiAgent).length;
  const highGovernanceCount = agents.filter(agent => (agent.governanceScore || 0) >= 90).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Agent Profiles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover and chat with AI agents. Test capabilities with quick chat or full governance monitoring.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setLoading(true)}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateAgent}
          >
            Create Agent
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All Agents (${agents.length})`} />
          <Tab 
            label={
              <Badge badgeContent={multiAgentCount} color="primary" max={99}>
                <span>Multi-Agent Systems</span>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={highGovernanceCount} color="success" max={99}>
                <span>High Governance</span>
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search agents, capabilities, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ flex: 1 }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            Filters
          </Button>

          <Tooltip title="Grid view">
            <IconButton
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridViewIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="List view">
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ListViewIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={showFilters}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="busy">Busy</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="chats">Total Chats</MenuItem>
                <MenuItem value="governance">Governance Score</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="recent">Recently Active</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Collapse>
      </Paper>

      {/* Results Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredAgents.length} of {agents.length} agents
        </Typography>

        {searchQuery && (
          <Alert severity="info" sx={{ py: 0 }}>
            Search results for "{searchQuery}"
          </Alert>
        )}
      </Box>

      {/* Agent Grid/List */}
      {filteredAgents.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No agents found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredAgents.map((agent) => (
            <Grid 
              item 
              xs={12} 
              sm={viewMode === 'grid' ? 6 : 12} 
              md={viewMode === 'grid' ? 4 : 12} 
              lg={viewMode === 'grid' ? 3 : 12}
              key={agent.id}
            >
              <AgentCardWithChat
                agent={agent}
                userId={userId}
                onOpenFullChat={onOpenFullChat}
                onViewProfile={(agentId) => console.log('View profile:', agentId)}
                onViewMetrics={onViewMetrics}
                compact={viewMode === 'list'}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

