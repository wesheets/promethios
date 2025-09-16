/**
 * Enhanced Collapsible Navigation with Multi-Agent Systems
 * 
 * Extends the existing navigation to include a new "Multi-Agent Systems" parent tab
 * with Think Tank Platform, conversation management, and workflow templates.
 */

import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Tooltip,
  Box,
  Divider,
  Typography,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SmartToy as AgentsIcon,
  Security as GovernanceIcon,
  VerifiedUser as TrustIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  Chat as ChatIcon,
  CloudUpload as DeployIcon,
  Storage as RegistryIcon,
  Assessment as ScorecardIcon,
  Assessment,
  Timeline,
  Badge as IdentityIcon,
  Speed as BenchmarksIcon,
  Visibility as OverviewIcon,
  Policy as PoliciesIcon,
  Warning as ViolationsIcon,
  Report as ReportsIcon,
  Psychology as VeritasIcon,
  Shield as BoundariesIcon,
  Verified as AttestationsIcon,
  // Social Collaboration Icons
  Search as DiscoveryIcon,
  Person as ProfileIcon,
  Feed as SocialFeedIcon,
  Business as OrganizationsIcon,
  Tag as ChannelsIcon,
  Message as MessageIcon,
  People as NetworkIcon,
  FlashOn,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Tune as PreferencesIcon,
  Business as OrganizationIcon,
  Extension as IntegrationsIcon,
  Storage as DataIcon,
  Key as ApiKeyIcon,
  Tour as ToursIcon,
  Description as DocsIcon,
  Support as SupportIcon,
  AutoAwesome as WrapIcon,
  Hub as MultiAgentIcon,
  LibraryBooks as LibraryBooksIcon,
  Assessment as AuditIcon,
  // New MAS icons
  Psychology as ThinkTankIcon,
  Groups as CollaborationIcon,
  AccountTree as WorkflowIcon,
  History as ConversationHistoryIcon,
  Description as TemplateIcon,
  Analytics as AnalyticsIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  AutoAwesome as OrchestratorIcon,
  Memory as MemoryIcon,
  Insights as InsightsIcon,
  People,
  // Promethios Chat icons
  QuestionAnswer as PrometheiosChatIcon,
  SmartToy as ChatbotsIcon,
  Build as ChatSetupIcon,
  School as KnowledgeIcon,
  Link as ChatIntegrationsIcon,
  BarChart as ChatAnalyticsIcon,
  AutoAwesome as AutomationIcon,
  Api as HostedApiIcon,
  VpnKey as BYOKIcon,
  Upload as DocumentUploadIcon,
  Tune as FineTuningIcon,
  Phone as VoiceIcon,
  Email as EmailIcon,
  Public as WebIcon,
  Facebook as SocialIcon,
  Handyman as WorkflowBuilderIcon,
  PersonAdd as HandoffIcon,
  PersonAdd as ConnectionIcon,
  Language as MultiLanguageIcon,
  Palette as BrandingIcon,
  Speed,
  Business,
  Warning,
  AutoAwesome
} from '@mui/icons-material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './notifications/NotificationBell';
import ChatButton from './social/ChatButton';
import UserConnectionsModal from './social/UserConnectionsModal';
import HumanMessagingDrawer from './social/HumanMessagingDrawer';
import BottomUserSection from './navigation/BottomUserSection';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 60;

// Create a dark theme specifically for the navigation
const navigationDarkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: '#1e293b', // Match right navigation color
    borderRight: '1px solid #334155', // Match right navigation border
    color: theme.palette.text.primary,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
  },
}));

const StyledDrawerCollapsed = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH_COLLAPSED,
    backgroundColor: '#1e293b', // Match right navigation color
    borderRight: '1px solid #334155', // Match right navigation border
    color: theme.palette.text.primary,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
  },
}));

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  children?: NavigationItem[];
  adminOnly?: boolean;
  badge?: number | string;
  isNew?: boolean;
}

interface CollapsibleNavigationEnhancedProps {
  userPermissions?: string[];
  isAdmin?: boolean;
  // Expandable Panel Support
  onOpenExpandablePanel?: (route: string, width?: string) => void;
}

const CollapsibleNavigationEnhanced: React.FC<CollapsibleNavigationEnhancedProps> = ({
  userPermissions = [],
  isAdmin = false,
  onOpenExpandablePanel,
}) => {
  const { preferences, updateNavigationState } = useUserPreferences();
  const { currentUser } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['multi-agent-systems']); // Expand MAS by default
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [messagingDrawerOpen, setMessagingDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const collapsed = preferences.navigationCollapsed;

  const navigationItems: NavigationItem[] = [
    // Hidden for social AI platform focus
    // {
    //   id: 'dashboard',
    //   label: 'Dashboard',
    //   icon: <DashboardIcon />,
    //   path: '/ui/dashboard',
    // },
    {
      id: 'promethios-chat',
      label: 'Promethios Chat',
      icon: <PrometheiosChatIcon />,
      isNew: true,
      children: [
        { 
          id: 'chat-dashboard', 
          label: 'Chat Dashboard', 
          icon: <DashboardIcon />, 
          path: '/ui/chat/dashboard',
          isNew: true
        },
        { 
          id: 'my-chatbots', 
          label: 'My Chatbots', 
          icon: <ChatbotsIcon />, 
          path: '/ui/chat/chatbots' 
        },
        { 
          id: 'chatbot-setup', 
          label: 'Chatbot Setup', 
          icon: <ChatSetupIcon />, 
          path: '/ui/chat/setup',
          children: [
            { id: 'quick-start', label: 'Quick Start', icon: <FlashOn />, path: '/ui/chat/setup/quick-start' },
            { id: 'hosted-api', label: 'Hosted API', icon: <HostedApiIcon />, path: '/ui/chat/setup/hosted-api' },
            { id: 'byok', label: 'Bring Your Own Key', icon: <BYOKIcon />, path: '/ui/chat/setup/byok' },
            { id: 'enterprise', label: 'Enterprise Setup', icon: <OrganizationIcon />, path: '/ui/chat/setup/enterprise' },
          ]
        },
        { 
          id: 'knowledge-training', 
          label: 'Knowledge & Training', 
          icon: <KnowledgeIcon />, 
          path: '/ui/governance/knowledge',
          children: [
            { id: 'knowledge-management', label: 'Knowledge Management', icon: <KnowledgeIcon />, path: '/ui/governance/knowledge' },
            { id: 'training-management', label: 'Training & Fine-tuning', icon: <FineTuningIcon />, path: '/ui/governance/training' },
          ]
        },
        { 
          id: 'chat-integrations', 
          label: 'Integrations', 
          icon: <ChatIntegrationsIcon />, 
          path: '/ui/chat/integrations',
          children: [
            { id: 'business-systems', label: 'Business Systems', icon: <OrganizationIcon />, path: '/ui/chat/integrations/business' },
            { id: 'helpdesk', label: 'Helpdesk', icon: <SupportIcon />, path: '/ui/chat/integrations/helpdesk' },
            { id: 'crm', label: 'CRM', icon: <People />, path: '/ui/chat/integrations/crm' },
            { id: 'ecommerce', label: 'E-commerce', icon: <Business />, path: '/ui/chat/integrations/ecommerce' },
          ]
        },
        { 
          id: 'chat-analytics', 
          label: 'Analytics & Insights', 
          icon: <ChatAnalyticsIcon />, 
          path: '/ui/chat/analytics',
          children: [
            { id: 'performance', label: 'Performance', icon: <Speed />, path: '/ui/chat/analytics/performance' },
            { id: 'governance-metrics', label: 'Governance Metrics', icon: <TrustIcon />, path: '/ui/chat/analytics/governance' },
            { id: 'customer-satisfaction', label: 'Customer Satisfaction', icon: <Assessment />, path: '/ui/chat/analytics/csat' },
            { id: 'resolution-rates', label: 'Resolution Rates', icon: <Timeline />, path: '/ui/chat/analytics/resolution' },
          ]
        },
        { 
          id: 'chat-automation', 
          label: 'Automation', 
          icon: <AutomationIcon />, 
          path: '/ui/chat/automation',
          children: [
            { id: 'workflow-builder', label: 'Workflow Builder', icon: <WorkflowBuilderIcon />, path: '/ui/chat/automation/workflows' },
            { id: 'human-handoff', label: 'Human Handoff', icon: <HandoffIcon />, path: '/ui/chat/automation/handoff' },
            { id: 'escalation-rules', label: 'Escalation Rules', icon: <Warning />, path: '/ui/chat/automation/escalation' },
            { id: 'auto-responses', label: 'Auto Responses', icon: <AutoAwesome />, path: '/ui/chat/automation/responses' },
          ]
        },
        { 
          id: 'deployment', 
          label: 'Deployment', 
          icon: <DeployIcon />, 
          path: '/ui/chat/deployment',
          children: [
            { id: 'web-widget', label: 'Web Widget', icon: <WebIcon />, path: '/ui/chat/deployment/web' },
            { id: 'voice-phone', label: 'Voice & Phone', icon: <VoiceIcon />, path: '/ui/chat/deployment/voice' },
            { id: 'email-support', label: 'Email Support', icon: <EmailIcon />, path: '/ui/chat/deployment/email' },
            { id: 'social-media', label: 'Social Media', icon: <SocialIcon />, path: '/ui/chat/deployment/social' },
            { id: 'api-endpoints', label: 'API Endpoints', icon: <ApiKeyIcon />, path: '/ui/chat/deployment/api' },
          ]
        },
      ],
    },
    // Social AI Collaboration Platform
    {
      id: 'social-collaboration',
      label: 'AI Network',
      icon: <NetworkIcon />,
      isNew: true,
      children: [
        { 
          id: 'discovery', 
          label: 'Discovery', 
          icon: <DiscoveryIcon />, 
          path: '/ui/social/discovery',
          isNew: true
        },
        { 
          id: 'profiles', 
          label: 'Profiles', 
          icon: <ProfileIcon />, 
          path: '/ui/social/profiles' 
        },
        { 
          id: 'social-feed', 
          label: 'Social Feed', 
          icon: <SocialFeedIcon />, 
          path: '/ui/social/feed' 
        },
        { 
          id: 'organizations', 
          label: 'Organizations', 
          icon: <OrganizationsIcon />, 
          path: '/ui/social/organizations' 
        },
        { 
          id: 'channels', 
          label: 'Channels', 
          icon: <ChannelsIcon />, 
          path: '/ui/social/channels' 
        },
        { 
          id: 'messages', 
          label: 'Messages', 
          icon: <MessageIcon />, 
          onClick: () => handleMessagesClick(),
          isNew: true
        },
        { 
          id: 'connections', 
          label: 'Connections', 
          icon: <ConnectionIcon />, 
          onClick: () => handleConnectionsClick()
        },
      ],
    },
    // Hidden for social AI platform focus - Multi-Agent Systems section
    // {
    //   id: 'multi-agent-systems',
    //   label: 'Multi-Agent Systems',
    //   icon: <ThinkTankIcon />,
    //   isNew: true,
    //   children: [
    //     { 
    //       id: 'think-tank', 
    //       label: 'Think Tank Platform', 
    //       icon: <ThinkTankIcon />, 
    //       path: '/ui/mas/think-tank',
    //       isNew: true
    //     },
    //     { 
    //       id: 'process-builder', 
    //       label: 'Process Builder', 
    //       icon: <WorkflowIcon />, 
    //       path: '/ui/mas/process-builder',
    //       isNew: true
    //     },
    //     { 
    //       id: 'conversation-history', 
    //       label: 'Conversation History', 
    //       icon: <ConversationHistoryIcon />, 
    //       path: '/ui/mas/conversations' 
    //     },
    //     { 
    //       id: 'workflow-templates', 
    //       label: 'Workflow Templates', 
    //       icon: <TemplateIcon />, 
    //       path: '/ui/mas/templates' 
    //     },
    //     { 
    //       id: 'mas-analytics', 
    //       label: 'MAS Analytics', 
    //       icon: <AnalyticsIcon />, 
    //       path: '/ui/mas/analytics' 
    //     },
    //     { 
    //       id: 'orchestrator-library', 
    //       label: 'Orchestrator Library', 
    //       icon: <OrchestratorIcon />, 
    //       path: '/ui/mas/orchestrators' 
    //     },
    //     { 
    //       id: 'collaboration-insights', 
    //       label: 'Collaboration Insights', 
    //       icon: <InsightsIcon />, 
    //       path: '/ui/mas/insights' 
    //     },
    //     { 
    //       id: 'boundaries', 
    //       label: 'Agent Boundaries', 
    //       icon: <BoundariesIcon />, 
    //       path: '/ui/trust/boundaries' 
    //     },
    //     { 
    //       id: 'attestations', 
    //       label: 'Agent Attestations', 
    //       icon: <AttestationsIcon />, 
    //       path: '/ui/trust/attestations' 
    //     },
    //   ],
    // },
    // {
    //   id: 'agents',
    //   label: 'Agents',
    //   icon: <AgentsIcon />,
    //   children: [
    //     { id: 'my-agents', label: 'My Agents', icon: <ProfileIcon />, path: '/ui/agents/profiles' },
    //     { id: 'agent-wrapping', label: 'Agent Wrapping', icon: <WrapIcon />, path: '/ui/agents/wrapping' },
    //     { id: 'multi-agent-wrapping', label: 'Multi-Agent Wrapping', icon: <MultiAgentIcon />, path: '/ui/agents/multi-wrapping' },
    //     { id: 'agent-lifecycle', label: 'Agent Lifecycle', icon: <TimelineIcon />, path: '/ui/agents/lifecycle' },
    //     { id: 'chat', label: 'Chat', icon: <ChatIcon />, path: '/ui/modern-chat' },
    //     { id: 'deploy', label: 'Deploy', icon: <DeployIcon />, path: '/ui/agents/deploy' },
    //   ],
    // },
    // {
    //   id: 'governance',
    //   label: 'Governance',
    //   icon: <GovernanceIcon />,
    //   children: [
    //     { id: 'gov-dashboard', label: 'Governance Dashboard', icon: <OverviewIcon />, path: '/ui/governance/dashboard' },
    //     { id: 'policies', label: 'Policies', icon: <PoliciesIcon />, path: '/ui/governance/policies' },
    //     { id: 'violations', label: 'Violations', icon: <ViolationsIcon />, path: '/ui/governance/violations' },
    //     { id: 'audit-reports', label: 'Audit Reports', icon: <AuditIcon />, path: '/ui/governance/audit-reports' },
    //     { id: 'knowledge-management', label: 'Knowledge Management', icon: <KnowledgeIcon />, path: '/ui/governance/knowledge', isNew: true },
    //     { id: 'training-management', label: 'Training & Fine-tuning', icon: <FineTuningIcon />, path: '/ui/governance/training', isNew: true },
    //   ],
    // },
    // {
    //   id: 'trust-metrics',
    //   label: 'Trust Metrics',
    //   icon: <TrustIcon />,
    //   children: [
    //     { id: 'trust-overview', label: 'Trust Overview', icon: <OverviewIcon />, path: '/ui/trust/overview' },
    //     { id: 'trust-scoring', label: 'Trust Scoring', icon: <Assessment />, path: '/ui/trust/scoring' },
    //     { id: 'trust-history', label: 'Trust History', icon: <Timeline />, path: '/ui/trust/history' },
    //   ],
    // },
  ];

  // Add admin section if user is admin
  if (isAdmin) {
    navigationItems.push({
      id: 'admin',
      label: 'Admin',
      icon: <AdminIcon />,
      adminOnly: true,
      children: [
        { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <DashboardIcon />, path: '/ui/admin/dashboard' },
        { id: 'mas-data-collection', label: 'MAS Data Collection', icon: <DataIcon />, path: '/ui/admin/mas-data-collection', isNew: true },
        { id: 'user-management', label: 'User Management', icon: <People />, path: '/ui/admin/users' },
        { id: 'system-settings', label: 'System Settings', icon: <SettingsIcon />, path: '/ui/admin/settings' },
      ],
    });
  }

  const handleToggleCollapse = async () => {
    try {
      await updateNavigationState(!collapsed);
    } catch (error) {
      console.error('Failed to update navigation state:', error);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    if (collapsed) return;
    
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigation = (path: string) => {
    console.log('🔄 Navigating via path for:', path);
    console.log('📍 Current location before navigation:', location.pathname);
    
    // Check if this route should open in an expandable panel
    const expandablePanelRoutes = [
      '/ui/social/feed',
      '/ui/social/profiles', 
      '/ui/social/organizations',
      '/ui/social/discovery',
      '/ui/social/channels',
      '/ui/social/connections'
    ];
    
    if (expandablePanelRoutes.includes(path) && onOpenExpandablePanel) {
      console.log('🎯 Opening route in expandable panel:', path);
      onOpenExpandablePanel(path, '50%');
      return;
    }
    
    const currentPath = location.pathname;
    
    try {
      // Attempt React Router navigation first
      console.log('🚀 Executing React Router navigate() for:', path);
      navigate(path);
      
      // Log that navigate() was called (doesn't mean it worked)
      console.log('✅ React Router navigate() called for:', path);
      
      // Check if navigation actually happened after a short delay
      setTimeout(() => {
        console.log('🔍 Checking navigation result...');
        console.log('📍 Current location after navigation attempt:', location.pathname);
        
        if (location.pathname === currentPath) {
          console.warn('⚠️ React Router navigation did not change location! Falling back to window.location.href');
          console.log('🔄 Falling back to window.location.href for:', path);
          
          try {
            window.location.href = path;
            console.log('✅ Fallback navigation executed for:', path);
          } catch (fallbackError) {
            console.error('❌ Fallback navigation also failed for:', path, 'Error:', fallbackError);
          }
        } else {
          console.log('✅ React Router navigation successful! Changed from', currentPath, 'to', location.pathname);
        }
      }, 100); // Check after 100ms
      
    } catch (error) {
      console.error('❌ React Router navigation failed for:', path, 'Error:', error);
      
      // Immediate fallback for caught errors
      console.log('🔄 Falling back to window.location.href for:', path);
      try {
        window.location.href = path;
        console.log('✅ Fallback navigation executed for:', path);
      } catch (fallbackError) {
        console.error('❌ Fallback navigation also failed for:', path, 'Error:', fallbackError);
      }
    }
  };

  const handleConnectionsClick = () => {
    setConnectionsModalOpen(true);
  };

  const handleMessagesClick = () => {
    setMessagingDrawerOpen(true);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isItemActive = item.path ? isActive(item.path) : false;

    if (collapsed && hasChildren) {
      // For collapsed state with children, show tooltip with submenu
      return (
        <Tooltip
          key={item.id}
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.label}
                {item.isNew && (
                  <Badge
                    badgeContent="NEW"
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '8px',
                        height: '16px',
                        minWidth: '24px'
                      }
                    }}
                  />
                )}
              </Typography>
              {item.children?.map(child => (
                <Box
                  key={child.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 0.5,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                  onClick={() => {
                    console.log('🖱️ Child navigation item clicked:', child.label, 'Path:', child.path);
                    if (child.path) {
                      console.log('🎯 Executing navigation for child item:', child.label);
                      handleNavigation(child.path);
                    } else {
                      console.warn('⚠️ Child item has no path defined:', child.label);
                    }
                  }}
                >
                  <Box sx={{ mr: 1, display: 'flex' }}>{child.icon}</Box>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {child.label}
                    {child.isNew && (
                      <Badge
                        badgeContent="NEW"
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '6px',
                            height: '12px',
                            minWidth: '20px'
                          }
                        }}
                      />
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          }
          placement="right"
          arrow
        >
          <ListItem disablePadding>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: 'center',
                px: 2.5,
                backgroundColor: isItemActive ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: 'center',
                  color: isItemActive ? 'primary.main' : 'text.primary',
                }}
              >
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="primary">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      );
    }

    if (collapsed && !hasChildren) {
      // For collapsed state without children
      return (
        <Tooltip 
          key={item.id} 
          title={
            <Box display="flex" alignItems="center" gap={1}>
              {item.label}
              {item.isNew && (
                <Badge
                  badgeContent="NEW"
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '8px',
                      height: '16px',
                      minWidth: '24px'
                    }
                  }}
                />
              )}
            </Box>
          } 
          placement="right" 
          arrow
        >
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                console.log('🖱️ Main navigation item clicked:', item.label);
                console.log('📋 Item details:', { id: item.id, path: item.path, hasOnClick: !!item.onClick });
                
                if (item.onClick) {
                  console.log('🎯 Executing custom onClick for:', item.label);
                  item.onClick();
                } else if (item.path) {
                  console.log('🎯 Executing navigation for:', item.label, 'to path:', item.path);
                  handleNavigation(item.path);
                } else {
                  console.warn('⚠️ Navigation item has no onClick or path defined:', item.label);
                }
              }}
              sx={{
                minHeight: 48,
                justifyContent: 'center',
                px: 2.5,
                backgroundColor: isItemActive ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: 'center',
                  color: isItemActive ? 'primary.main' : 'text.primary',
                }}
              >
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="primary">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      );
    }

    // For expanded state
    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton
            onClick={() => {
              console.log('🖱️ Expanded navigation item clicked:', item.label);
              console.log('📋 Item details:', { id: item.id, path: item.path, hasChildren, hasOnClick: !!item.onClick });
              
              if (hasChildren) {
                console.log('🔄 Toggling section for:', item.label);
                handleSectionToggle(item.id);
              } else if (item.onClick) {
                console.log('🎯 Executing custom onClick for:', item.label);
                item.onClick();
              } else if (item.path) {
                console.log('🎯 Executing navigation for:', item.label, 'to path:', item.path);
                handleNavigation(item.path);
              } else {
                console.warn('⚠️ Expanded navigation item has no action defined:', item.label);
              }
            }}
            sx={{
              minHeight: 48,
              backgroundColor: isItemActive ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isItemActive ? 'primary.main' : 'text.primary',
              }}
            >
              {item.badge ? (
                <Badge badgeContent={item.badge} color="primary">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  {item.label}
                  {item.isNew && (
                    <Badge
                      badgeContent="NEW"
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '8px',
                          height: '16px',
                          minWidth: '24px'
                        }
                      }}
                    />
                  )}
                </Box>
              }
              sx={{ 
                color: isItemActive ? 'primary.main' : 'text.primary',
                '& .MuiListItemText-primary': {
                  fontSize: '14px',
                  fontWeight: isItemActive ? 600 : 400,
                }
              }} 
            />
            {hasChildren && (
              isExpanded ? <ExpandLess sx={{ color: 'text.primary' }} /> : <ExpandMore sx={{ color: 'text.primary' }} />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const DrawerComponent = collapsed ? StyledDrawerCollapsed : StyledDrawer;

  return (
    <ThemeProvider theme={navigationDarkTheme}>
      <DrawerComponent
        variant="permanent"
        anchor="left"
        sx={{
          width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 0, // Remove header height offset
          height: '100vh', // Full height
          position: 'fixed',
          zIndex: 1200,
        },
      }}
    >
      {/* Collapse/Expand Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          padding: '8px',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton onClick={handleToggleCollapse} sx={{ color: 'text.primary' }}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <List sx={{ pt: 0 }}>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>

      {/* Bottom User Section */}
      <BottomUserSection 
        collapsed={collapsed} 
        onNavigate={handleNavigation}
      />
    </DrawerComponent>

    {/* Connections Modal */}
    {currentUser && (
      <UserConnectionsModal
        open={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
        userId={currentUser.uid}
        userName={currentUser.displayName || 'User'}
      />
    )}

    {/* Human Messaging Drawer */}
    <HumanMessagingDrawer
      open={messagingDrawerOpen}
      onClose={() => setMessagingDrawerOpen(false)}
      onAgentDrop={(agentId, messageId) => {
        console.log('Agent dropped:', agentId, 'on message:', messageId);
        // TODO: Implement agent drop functionality
      }}
    />
    </ThemeProvider>
  );
};

export default CollapsibleNavigationEnhanced;

