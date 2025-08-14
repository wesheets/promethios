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
  };
  return iconMap[iconName] || SettingsIcon;
};

export const ToolConfigurationPanel: React.FC<ToolConfigurationPanelProps> = ({
  chatbot,
  onClose,
  onSave
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
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

  // Initialize configuration service
  const configService = new AgentConfigurationService();

  // Load existing configuration on mount
  useEffect(() => {
    loadAgentConfiguration();
  }, [chatbot.identity.id]);

  const loadAgentConfiguration = async () => {
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
  };

  const saveConfiguration = async () => {
    try {
      setSaveStatus('saving');
      
      // Create updated configuration
      const updatedConfig: Partial<AgentConfiguration> = {
        toolProfile: {
          ...toolProfile,
          lastUpdated: new Date(),
          totalToolsEnabled: toolProfile.enabledTools.filter(t => t.enabled).length,
          enterpriseToolsEnabled: toolProfile.enabledTools.filter(t => t.enabled && t.tier === 'enterprise').length
        }
      };

      // Save configuration
      await configService.saveConfiguration(chatbot.identity.id, updatedConfig);
      
      // Notify parent component
      if (onSave) {
        onSave(updatedConfig);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      console.log('✅ Tool configuration saved successfully');
    } catch (error) {
      console.error('❌ Failed to save tool configuration:', error);
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
          height: '100%',
          border: isEnabled ? '2px solid #3b82f6' : '1px solid #334155',
          bgcolor: isEnabled ? 'rgba(59, 130, 246, 0.05)' : '#1e293b',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: getTierColor(tool.tier), width: 40, height: 40 }}>
                <IconComponent sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {tool.name}
                </Typography>
                <Chip
                  label={tool.tier.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: tierColors.bg,
                    color: tierColors.text,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Box>
            <Switch
              checked={isEnabled}
              onChange={() => toggleTool(tool)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#3b82f6',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#3b82f6',
                },
              }}
            />
          </Box>

          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.5 }}>
            {tool.description}
          </Typography>

          {tool.pricing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Pricing:
              </Typography>
              <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                ${tool.pricing.monthly}/month
                {tool.pricing.usage_based && ' + usage'}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            {isEnabled && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => openConfiguration(tool)}
                sx={{
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  '&:hover': {
                    borderColor: '#2563eb',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                  }
                }}
              >
                Configure
              </Button>
            )}
            <Tooltip title={`View ${tool.name} details`}>
              <IconButton size="small" sx={{ color: '#64748b' }}>
                <InfoIcon />
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
            bgcolor: '#1e293b',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: getTierColor(selectedTool.tier) }}>
              {React.createElement(getIconComponent(selectedTool.icon))}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedTool.name} Configuration</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Configure settings and credentials for this tool
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
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
                      bgcolor: '#0f172a',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' },
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
                <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(59, 130, 246, 0.1)' }}>
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
                        bgcolor: '#0f172a',
                        '& fieldset': { borderColor: '#334155' },
                        '&:hover fieldset': { borderColor: '#475569' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                      },
                      '& .MuiInputLabel-root': { color: '#94a3b8' },
                      '& .MuiInputBase-input': { color: 'white' },
                    }}
                  />
                ))}
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #334155' }}>
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#3b82f6' }}>
              <SettingsIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Tool Configuration
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {chatbot.identity.name} • {toolProfile.totalToolsEnabled} tools enabled
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <ExpandMoreIcon sx={{ transform: 'rotate(90deg)' }} />
          </IconButton>
        </Box>

        {/* Stats */}
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                {toolProfile.totalToolsEnabled}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Total Tools
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 700 }}>
                {toolProfile.enterpriseToolsEnabled}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Enterprise
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 700 }}>
                {TOOL_CATEGORIES.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Categories
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Search */}
      <Box sx={{ p: 3, borderBottom: '1px solid #334155' }}>
        <TextField
          fullWidth
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#64748b', mr: 1 }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0f172a',
              '& fieldset': { borderColor: '#334155' },
              '&:hover fieldset': { borderColor: '#475569' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputBase-input': { color: 'white' },
          }}
        />
      </Box>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: '1px solid #334155' }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: '#64748b',
              '&.Mui-selected': { color: '#3b82f6' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#3b82f6' }
          }}
        >
          <Tab label="All Tools" />
          {TOOL_CATEGORIES.map((category) => (
            <Tab key={category.id} label={category.name} />
          ))}
        </Tabs>
      </Box>

      {/* Tools Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Grid container spacing={3}>
          {getFilteredTools(selectedTab === 0 ? undefined : TOOL_CATEGORIES[selectedTab - 1]?.id)
            .map((tool) => (
              <Grid item xs={12} sm={6} lg={4} key={tool.id}>
                {renderToolCard(tool)}
              </Grid>
            ))}
        </Grid>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 3, borderTop: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: '#475569',
              color: '#94a3b8',
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
            sx={{
              bgcolor: saveStatus === 'saved' ? '#10b981' : '#3b82f6',
              '&:hover': { 
                bgcolor: saveStatus === 'saved' ? '#059669' : '#2563eb' 
              },
              '&:disabled': {
                bgcolor: '#475569',
                color: '#94a3b8'
              }
            }}
          >
            {saveStatus === 'saving' && <CircularProgress size={16} sx={{ mr: 1 }} />}
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

