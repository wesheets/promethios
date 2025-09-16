/**
 * Tool Configuration Panel
 * 
 * Comprehensive interface for configuring agent tools including
 * enterprise integrations, communication tools, and business tools.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  Button,
  Chip,
  Avatar,
  IconButton,
  Divider,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Alert,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Message as MessageSquareIcon,
  ShoppingCart as ShoppingCartIcon,
  Business as BriefcaseIcon,
  Share as Share2Icon,
  BarChart as BarChart3Icon,
  Bolt as ZapIcon,
  Description as FileTextIcon,
  Public as GlobeIcon,
  Email as MailIcon,
  CreditCard as CreditCardIcon,
  Group as UsersIcon,
  Event as CalendarIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedinIcon,
  PieChart as PieChartIcon,
  AccountTree as GitBranchIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { ChatbotProfile } from '../../types/ChatbotTypes';
import { 
  TOOL_CATEGORIES, 
  AVAILABLE_TOOLS, 
  ToolConfiguration, 
  ToolCategory,
  AgentToolProfile 
} from '../../types/ToolTypes';
import { AgentConfigurationService } from '../../services/AgentConfigurationService';
import { AgentConfiguration } from '../../types/AgentConfigurationTypes';

interface ToolConfigurationPanelProps {
  chatbot: ChatbotProfile;
  onClose: () => void;
  onSave: (toolProfile: AgentToolProfile) => void;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType> = {
    Search: SearchIcon,
    MessageSquare: MessageSquareIcon,
    ShoppingCart: ShoppingCartIcon,
    Briefcase: BriefcaseIcon,
    Share2: Share2Icon,
    BarChart3: BarChart3Icon,
    Zap: ZapIcon,
    FileText: FileTextIcon,
    Globe: GlobeIcon,
    Mail: MailIcon,
    CreditCard: CreditCardIcon,
    Users: UsersIcon,
    Calendar: CalendarIcon,
    Twitter: TwitterIcon,
    Linkedin: LinkedinIcon,
    PieChart: PieChartIcon,
    GitBranch: GitBranchIcon,
    Code: CodeIcon,
  };
  return iconMap[iconName] || SettingsIcon;
};

export const ToolConfigurationPanel: React.FC<ToolConfigurationPanelProps> = ({
  chatbot,
  onClose,
  onSave
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Safety check for chatbot prop
  if (!chatbot || !chatbot.identity) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Tool Configuration
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Loading chatbot configuration...
        </Typography>
      </Box>
    );
  }
  
  const [toolProfile, setToolProfile] = useState<AgentToolProfile>({
    agentId: chatbot.identity.id,
    enabledTools: [],
    toolConfigurations: {},
    lastUpdated: new Date(),
    totalToolsEnabled: 0,
    enterpriseToolsEnabled: 0,
  });
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolConfiguration | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Initialize configuration service only once
  const configService = React.useMemo(() => new AgentConfigurationService(), []);

  const loadAgentConfiguration = React.useCallback(async () => {
    try {
      setLoading(true);
      const config = await configService.getConfiguration(chatbot.identity.id);
      if (config) {
        setToolProfile(config.toolProfile);
      }
    } catch (error) {
      console.error('Failed to load agent configuration:', error);
    } finally {
      setLoading(false);
    }
  }, [configService, chatbot.identity.id]);

  // Load existing configuration on mount
  useEffect(() => {
    loadAgentConfiguration();
  }, [loadAgentConfiguration]);

  const saveConfiguration = async () => {
    try {
      setSaveStatus('saving');
      
      console.log('💾 [ToolPanel] Starting configuration save process');
      
      // Initialize Firebase service with user context if not already done
      // TODO: Get actual user ID from auth context
      const userId = 'current_user_id'; // Replace with actual user ID from auth
      configService.initializeFirebase(userId, chatbot.identity.organizationId || 'default');
      
      // Create updated tool profile
      const updatedToolProfile: AgentToolProfile = {
        ...toolProfile,
        agentId: chatbot.identity.id,
        lastUpdated: new Date(),
        totalToolsEnabled: toolProfile.enabledTools.filter(t => t.enabled).length,
        enterpriseToolsEnabled: toolProfile.enabledTools.filter(t => t.enabled && t.tier === 'enterprise').length
      };

      // Save tool profile to Firebase
      await configService.updateToolProfile(chatbot.identity.id, updatedToolProfile);
      
      // Update local state
      setToolProfile(updatedToolProfile);
      
      // Notify parent component
      if (onSave) {
        onSave(updatedToolProfile);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      console.log('✅ [ToolPanel] Tool configuration saved successfully to Firebase');
    } catch (error) {
      console.error('❌ [ToolPanel] Failed to save tool configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Filter tools by category and search
  const getFilteredTools = (categoryId?: string) => {
    let filtered = AVAILABLE_TOOLS;
    
    if (categoryId) {
      filtered = filtered.filter(tool => tool.category === categoryId);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Toggle tool enabled/disabled
  const toggleTool = (tool: ToolConfiguration) => {
    const existingTool = toolProfile.enabledTools.find(t => t.name === tool.name);
    const isEnabled = existingTool?.enabled || false;
    
    if (isEnabled) {
      // Disable tool
      setToolProfile(prev => ({
        ...prev,
        enabledTools: prev.enabledTools.map(t => 
          t.name === tool.name ? { ...t, enabled: false } : t
        ),
        totalToolsEnabled: prev.totalToolsEnabled - 1,
        enterpriseToolsEnabled: tool.tier === 'enterprise' 
          ? prev.enterpriseToolsEnabled - 1 
          : prev.enterpriseToolsEnabled,
        lastUpdated: new Date(),
      }));
    } else {
      // Enable tool or add new tool
      const newTool = {
        name: tool.name,
        enabled: true,
        tier: tool.tier,
        category: tool.category,
        configuration: {},
        credentials: {}
      };

      setToolProfile(prev => {
        const existingIndex = prev.enabledTools.findIndex(t => t.name === tool.name);
        const updatedTools = existingIndex >= 0 
          ? prev.enabledTools.map(t => t.name === tool.name ? newTool : t)
          : [...prev.enabledTools, newTool];

        return {
          ...prev,
          enabledTools: updatedTools,
          totalToolsEnabled: prev.totalToolsEnabled + (existingIndex >= 0 ? 0 : 1),
          enterpriseToolsEnabled: tool.tier === 'enterprise' 
            ? prev.enterpriseToolsEnabled + (existingIndex >= 0 ? 0 : 1)
            : prev.enterpriseToolsEnabled,
          lastUpdated: new Date(),
        };
      });
    }
  };

  // Open configuration dialog
  const openConfiguration = (tool: ToolConfiguration) => {
    setSelectedTool(tool);
    setConfigDialogOpen(true);
  };

  // Save tool configuration
  const saveToolConfiguration = (config: Record<string, any>, credentials?: Record<string, string>) => {
    if (!selectedTool) return;

    setToolProfile(prev => ({
      ...prev,
      toolConfigurations: {
        ...prev.toolConfigurations,
        [selectedTool.id]: {
          ...selectedTool,
          configuration: config,
          credentials: credentials || selectedTool.credentials,
        }
      },
      lastUpdated: new Date(),
    }));

    setConfigDialogOpen(false);
    setSelectedTool(null);
  };

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return '#10b981';
      case 'professional': return '#f59e0b';
      case 'enterprise': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  // Get tier badge
  const getTierBadge = (tier: string) => {
    const colors = {
      basic: { bg: '#dcfce7', text: '#166534' },
      professional: { bg: '#fef3c7', text: '#92400e' },
      enterprise: { bg: '#ede9fe', text: '#5b21b6' },
    };
    
    return colors[tier as keyof typeof colors] || colors.basic;
  };

  // Render tool card
  const renderToolCard = (tool: ToolConfiguration) => {
    const existingTool = toolProfile.enabledTools.find(t => t.name === tool.name);
    const isEnabled = existingTool?.enabled || false;
    const IconComponent = getIconComponent(tool.icon);
    const tierColors = getTierBadge(tool.tier);

    return (
      <Card
        key={tool.id}
        sx={{
          width: '100%',
          maxWidth: '100%',
          border: isEnabled ? '1px solid #3b82f6' : '1px solid #1e293b',
          bgcolor: isEnabled ? 'rgba(59, 130, 246, 0.08)' : '#1e293b',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          boxSizing: 'border-box',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            bgcolor: isEnabled ? 'rgba(59, 130, 246, 0.12)' : '#334155',
          }
        }}
      >
        <CardContent sx={{ 
          p: 1, 
          '&:last-child': { pb: 1 },
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between', 
            mb: 0.5,
            width: '100%',
            maxWidth: '100%',
            gap: 0.5
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.75, 
              flex: 1, 
              minWidth: 0,
              maxWidth: 'calc(100% - 50px)' // Account for switch
            }}>
              <Avatar sx={{ 
                bgcolor: getTierColor(tool.tier), 
                width: 24, 
                height: 24, 
                flexShrink: 0 
              }}>
                <IconComponent sx={{ fontSize: 12 }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1, maxWidth: '100%' }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.1,
                    mb: 0.25
                  }}
                >
                  {tool.name}
                </Typography>
                <Chip
                  label={tool.tier.toUpperCase()}
                  size="small"
                  sx={{
                    ...tierColors,
                    height: '16px',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 0.5,
                      py: 0
                    }
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <Switch
                checked={isEnabled}
                onChange={() => toggleTool(tool)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase': {
                    color: '#64748b',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#3b82f6',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: '#475569',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#3b82f6',
                  },
                }}
              />
            </Box>
          </Box>

          <Typography 
            variant="body2" 
            sx={{ 
              color: '#94a3b8', 
              mb: 1, 
              lineHeight: 1.2,
              fontSize: '0.65rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word'
            }}
          >
            {tool.description}
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            width: '100%'
          }}>
            {isEnabled && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SettingsIcon sx={{ fontSize: '10px !important' }} />}
                onClick={() => openConfiguration(tool)}
                sx={{
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  fontSize: '0.6rem',
                  minWidth: 'auto',
                  px: 0.75,
                  py: 0.25,
                  height: '20px',
                  '&:hover': {
                    borderColor: '#2563eb',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                  }
                }}
              >
                Config
              </Button>
            )}
            <Tooltip title={`View ${tool.name} details`}>
              <IconButton size="small" sx={{ 
                color: '#64748b', 
                p: 0.25,
                minWidth: 'auto',
                width: '20px',
                height: '20px'
              }}>
                <InfoIcon sx={{ fontSize: '12px' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render configuration dialog
  const renderConfigurationDialog = () => {
    if (!selectedTool) return null;

    return (
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f172a',
            color: 'white',
            border: '1px solid #1e293b'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #1e293b' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: getTierColor(selectedTool.tier) }}>
              {React.createElement(getIconComponent(selectedTool.icon))}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedTool.name} Configuration</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Configure settings and credentials for this tool
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#0f172a' }}>
          <Stack spacing={3}>
            {/* Configuration Settings */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Configuration Settings
              </Typography>
              {Object.entries(selectedTool.configuration || {}).map(([key, value]) => (
                <TextField
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={value}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#1e293b',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    },
                    '& .MuiInputLabel-root': { color: '#64748b' },
                    '& .MuiInputBase-input': { color: 'white' },
                  }}
                />
              ))}
            </Box>

            {/* Credentials */}
            {selectedTool.credentials && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Credentials & API Keys
                </Typography>
                <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #1e293b' }}>
                  Credentials are encrypted and stored securely. They are only used for API calls.
                </Alert>
                {Object.entries(selectedTool.credentials).map(([key, value]) => (
                  <TextField
                    key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={value}
                    type={key.includes('secret') || key.includes('password') ? 'password' : 'text'}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    placeholder={`Enter your ${key.replace(/_/g, ' ')}`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#1e293b',
                        '& fieldset': { borderColor: '#334155' },
                        '&:hover fieldset': { borderColor: '#475569' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                      },
                      '& .MuiInputLabel-root': { color: '#64748b' },
                      '& .MuiInputBase-input': { color: 'white' },
                    }}
                  />
                ))}
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #1e293b', bgcolor: '#0f172a' }}>
          <Button onClick={() => setConfigDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => saveToolConfiguration(selectedTool.configuration, selectedTool.credentials)}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100%',
      maxWidth: '100%',
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#0f172a',
      color: 'white',
      overflow: 'hidden', // Prevent any overflow from this container
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #1e293b', 
        flexShrink: 0,
        bgcolor: '#0f172a',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
            <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32, flexShrink: 0 }}>
              <SettingsIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" sx={{ 
                color: 'white', 
                fontWeight: 600, 
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                Tool Configuration
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#64748b',
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {chatbot.identity.name} • {toolProfile.totalToolsEnabled} tools enabled
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#64748b', flexShrink: 0 }}>
            <ExpandMoreIcon sx={{ transform: 'rotate(90deg)', fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Stats */}
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 700, fontSize: '1.5rem' }}>
                {toolProfile.totalToolsEnabled}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                Total Tools
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.5rem' }}>
                {toolProfile.enterpriseToolsEnabled}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                Enterprise
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 700, fontSize: '1.5rem' }}>
                {TOOL_CATEGORIES.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                Categories
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Search */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #1e293b', 
        flexShrink: 0,
        bgcolor: '#0f172a',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <TextField
          fullWidth
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#64748b', mr: 1, fontSize: 18 }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1e293b',
              height: '36px',
              '& fieldset': { borderColor: '#334155' },
              '&:hover fieldset': { borderColor: '#475569' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputBase-input': { 
              color: 'white',
              fontSize: '0.875rem',
              padding: '8px 12px'
            },
          }}
        />
      </Box>

      {/* Category Tabs */}
      <Box sx={{ 
        borderBottom: '1px solid #1e293b', 
        flexShrink: 0,
        bgcolor: '#0f172a',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: '40px',
            '& .MuiTab-root': {
              color: '#64748b',
              fontSize: '0.75rem',
              minHeight: '40px',
              padding: '8px 12px',
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#3b82f6' },
            '& .MuiTabs-scrollButtons': {
              color: '#64748b',
              '&.Mui-disabled': { opacity: 0.3 }
            }
          }}
        >
          <Tab label="All Tools" />
          {TOOL_CATEGORIES.map((category) => (
            <Tab key={category.id} label={category.name} />
          ))}
        </Tabs>
      </Box>

      {/* Tools Grid */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 1,
        width: '100%',
        maxWidth: '100%',
        bgcolor: '#0f172a',
        boxSizing: 'border-box',
        minHeight: 0, // Important for flex child to allow scrolling
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#1e293b',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#475569',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#64748b',
        },
      }}>
        <Stack spacing={1} sx={{ 
          width: '100%', 
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {getFilteredTools(selectedTab === 0 ? undefined : TOOL_CATEGORIES[selectedTab - 1]?.id)
            .map((tool) => (
              <Box key={tool.id} sx={{ width: '100%', maxWidth: '100%' }}>
                {renderToolCard(tool)}
              </Box>
            ))}
        </Stack>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid #1e293b', 
        flexShrink: 0,
        bgcolor: '#0f172a',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            size="small"
            sx={{
              borderColor: '#475569',
              color: '#94a3b8',
              fontSize: '0.8rem',
              minWidth: 'auto',
              px: 2,
              py: 1,
              '&:hover': {
                borderColor: '#64748b',
                bgcolor: 'rgba(148, 163, 184, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveConfiguration}
            disabled={saveStatus === 'saving'}
            size="small"
            sx={{
              bgcolor: saveStatus === 'saved' ? '#10b981' : '#3b82f6',
              fontSize: '0.8rem',
              minWidth: 'auto',
              px: 2,
              py: 1,
              flex: 1,
              '&:hover': { 
                bgcolor: saveStatus === 'saved' ? '#059669' : '#2563eb' 
              },
              '&:disabled': {
                bgcolor: '#475569',
                color: '#94a3b8'
              }
            }}
          >
            {saveStatus === 'saving' && <CircularProgress size={14} sx={{ mr: 1 }} />}
            {saveStatus === 'saved' ? '✓ Saved' : 
             saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'error' ? 'Error - Retry' : 
             'Save & Deploy Tools'}
          </Button>
        </Box>
      </Box>

      {/* Configuration Dialog */}
      {renderConfigurationDialog()}
    </Box>
  );
};

export default ToolConfigurationPanel;

