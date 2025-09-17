/**
 * MarketplacePanel - Buy and sell agents, tools, and extensions
 * 
 * This panel allows users to:
 * - Browse and purchase AI agents
 * - Sell their own agents and tools
 * - Fork existing agents
 * - Buy draggable tools and extensions
 * - Manage marketplace transactions
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Storefront as StorefrontIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Fork as ForkIcon,
  Extension as ExtensionIcon,
  SmartToy as AgentIcon
} from '@mui/icons-material';

interface MarketplacePanelProps {
  open: boolean;
  onClose: () => void;
  width: string;
}

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  type: 'agent' | 'tool' | 'extension' | 'workflow';
  price: number;
  rating: number;
  reviewCount: number;
  downloads: number;
  author: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  featured: boolean;
}

const MarketplacePanel: React.FC<MarketplacePanelProps> = ({ open, onClose, width }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample marketplace items
  const [marketplaceItems] = useState<MarketplaceItem[]>([
    {
      id: 'item-1',
      name: 'Customer Support Agent Pro',
      description: 'Advanced customer support agent with sentiment analysis and escalation logic',
      type: 'agent',
      price: 49.99,
      rating: 4.8,
      reviewCount: 156,
      downloads: 2340,
      author: { name: 'Sarah Chen', avatar: 'SC' },
      tags: ['Customer Service', 'NLP', 'Sentiment Analysis'],
      featured: true
    },
    {
      id: 'item-2',
      name: 'Data Visualization Tool',
      description: 'Drag-and-drop tool for creating interactive charts and dashboards',
      type: 'tool',
      price: 29.99,
      rating: 4.9,
      reviewCount: 89,
      downloads: 1567,
      author: { name: 'Marcus Rodriguez', avatar: 'MR' },
      tags: ['Visualization', 'Charts', 'Dashboard'],
      featured: false
    },
    {
      id: 'item-3',
      name: 'Email Integration Extension',
      description: 'Connect your agents to Gmail, Outlook, and other email providers',
      type: 'extension',
      price: 19.99,
      rating: 4.7,
      reviewCount: 234,
      downloads: 3456,
      author: { name: 'Elena Kowalski', avatar: 'EK' },
      tags: ['Email', 'Integration', 'Automation'],
      featured: true
    },
    {
      id: 'item-4',
      name: 'Sales Pipeline Workflow',
      description: 'Complete sales automation workflow with lead scoring and follow-up',
      type: 'workflow',
      price: 79.99,
      rating: 5.0,
      reviewCount: 67,
      downloads: 890,
      author: { name: 'David Kim', avatar: 'DK' },
      tags: ['Sales', 'CRM', 'Automation', 'Lead Scoring'],
      featured: true
    }
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'agent': return <AgentIcon sx={{ color: '#6366f1' }} />;
      case 'tool': return <ExtensionIcon sx={{ color: '#10b981' }} />;
      case 'extension': return <ExtensionIcon sx={{ color: '#f59e0b' }} />;
      case 'workflow': return <ForkIcon sx={{ color: '#a855f7' }} />;
      default: return <StorefrontIcon sx={{ color: '#6b7280' }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'agent': return '#6366f1';
      case 'tool': return '#10b981';
      case 'extension': return '#f59e0b';
      case 'workflow': return '#a855f7';
      default: return '#6b7280';
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        width,
        height: '100vh',
        bgcolor: '#0f172a',
        borderLeft: '1px solid #334155',
        zIndex: 1250,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StorefrontIcon sx={{ color: '#a855f7', fontSize: '2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700 }}>
              Marketplace
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Buy & sell agents, tools, and extensions
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#a855f7'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#a855f7'
            }
          }}
        >
          <Tab label="Browse" />
          <Tab label="My Purchases" />
          <Tab label="Sell Items" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Browse Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search agents, tools, extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1e293b',
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#475569' },
                  '&.Mui-focused fieldset': { borderColor: '#a855f7' },
                  '& input': { color: '#f8fafc' }
                }
              }}
            />

            {/* Featured Items */}
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2 }}>
              Featured Items
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {marketplaceItems.filter(item => item.featured).map((item) => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        {getTypeIcon(item.type)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          <Chip
                            label={item.type.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: getTypeColor(item.type),
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                        {item.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Rating value={item.rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {item.rating} ({item.reviewCount})
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {item.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              bgcolor: '#334155',
                              color: '#cbd5e1',
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                          ${item.price}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {item.downloads.toLocaleString()} downloads
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        startIcon={<CartIcon />}
                        sx={{
                          bgcolor: '#a855f7',
                          '&:hover': { bgcolor: '#9333ea' }
                        }}
                      >
                        Buy Now
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ForkIcon />}
                        sx={{
                          borderColor: '#334155',
                          color: '#cbd5e1',
                          '&:hover': { borderColor: '#475569', bgcolor: '#1e293b' }
                        }}
                      >
                        Fork
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* All Items */}
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2 }}>
              All Items
            </Typography>
            
            <Grid container spacing={2}>
              {marketplaceItems.map((item) => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        {getTypeIcon(item.type)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            by {item.author.name}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                          ${item.price}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                        {item.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={item.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            ({item.reviewCount})
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {item.downloads.toLocaleString()} downloads
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* My Purchases Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 3 }}>
              Your Purchases
            </Typography>
            
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <Typography variant="body1" sx={{ color: '#cbd5e1', textAlign: 'center' }}>
                Purchase history will be displayed here
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Sell Items Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#f8fafc' }}>
                Sell Your Items
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: '#a855f7',
                  '&:hover': { bgcolor: '#9333ea' }
                }}
              >
                List New Item
              </Button>
            </Box>
            
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <Typography variant="body1" sx={{ color: '#cbd5e1', textAlign: 'center' }}>
                Item listing form will be implemented here
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MarketplacePanel;

