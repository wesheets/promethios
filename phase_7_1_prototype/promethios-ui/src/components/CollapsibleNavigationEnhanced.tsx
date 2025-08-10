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
  Person as ProfileIcon,
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
  Workflow as WorkflowIcon,
  History as ConversationHistoryIcon,
  Template as TemplateIcon,
  Analytics as AnalyticsIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  AutoAwesome as OrchestratorIcon,
  Memory as MemoryIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserPreferences } from '../hooks/useUserPreferences';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 60;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: '#1a202c',
    borderRight: '1px solid #2d3748',
    color: 'white',
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
    backgroundColor: '#1a202c',
    borderRight: '1px solid #2d3748',
    color: 'white',
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
  children?: NavigationItem[];
  adminOnly?: boolean;
  badge?: number | string;
  isNew?: boolean;
}

interface CollapsibleNavigationEnhancedProps {
  userPermissions?: string[];
  isAdmin?: boolean;
}

const CollapsibleNavigationEnhanced: React.FC<CollapsibleNavigationEnhancedProps> = ({
  userPermissions = [],
  isAdmin = false,
}) => {
  const { preferences, updateNavigationState } = useUserPreferences();
  const [expandedSections, setExpandedSections] = useState<string[]>(['multi-agent-systems']); // Expand MAS by default
  const navigate = useNavigate();
  const location = useLocation();

  const collapsed = preferences.navigationCollapsed;

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/ui/dashboard',
    },
    {
      id: 'multi-agent-systems',
      label: 'Multi-Agent Systems',
      icon: <ThinkTankIcon />,
      isNew: true,
      children: [
        { 
          id: 'think-tank', 
          label: 'Think Tank Platform', 
          icon: <ThinkTankIcon />, 
          path: '/ui/mas/think-tank',
          isNew: true
        },
        { 
          id: 'process-builder', 
          label: 'Process Builder', 
          icon: <WorkflowIcon />, 
          path: '/ui/mas/process-builder',
          isNew: true
        },
        { 
          id: 'conversation-history', 
          label: 'Conversation History', 
          icon: <ConversationHistoryIcon />, 
          path: '/ui/mas/conversations' 
        },
        { 
          id: 'workflow-templates', 
          label: 'Workflow Templates', 
          icon: <TemplateIcon />, 
          path: '/ui/mas/templates' 
        },
        { 
          id: 'mas-analytics', 
          label: 'MAS Analytics', 
          icon: <AnalyticsIcon />, 
          path: '/ui/mas/analytics' 
        },
        { 
          id: 'orchestrator-library', 
          label: 'Orchestrator Library', 
          icon: <OrchestratorIcon />, 
          path: '/ui/mas/orchestrators' 
        },
        { 
          id: 'collaboration-insights', 
          label: 'Collaboration Insights', 
          icon: <InsightsIcon />, 
          path: '/ui/mas/insights' 
        },
        { 
          id: 'boundaries', 
          label: 'Agent Boundaries', 
          icon: <BoundariesIcon />, 
          path: '/ui/trust/boundaries' 
        },
        { 
          id: 'attestations', 
          label: 'Agent Attestations', 
          icon: <AttestationsIcon />, 
          path: '/ui/trust/attestations' 
        },
      ],
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <AgentsIcon />,
      children: [
        { id: 'my-agents', label: 'My Agents', icon: <ProfileIcon />, path: '/ui/agents/profiles' },
        { id: 'agent-wrapping', label: 'Agent Wrapping', icon: <WrapIcon />, path: '/ui/agents/wrapping' },
        { id: 'multi-agent-wrapping', label: 'Multi-Agent Wrapping', icon: <MultiAgentIcon />, path: '/ui/agents/multi-wrapping' },
        { id: 'agent-lifecycle', label: 'Agent Lifecycle', icon: <TimelineIcon />, path: '/ui/agents/lifecycle' },
        { id: 'chat', label: 'Chat', icon: <ChatIcon />, path: '/ui/modern-chat' },
        { id: 'deploy', label: 'Deploy', icon: <DeployIcon />, path: '/ui/agents/deploy' },
      ],
    },
    {
      id: 'governance',
      label: 'Governance',
      icon: <GovernanceIcon />,
      children: [
        { id: 'gov-dashboard', label: 'Governance Dashboard', icon: <OverviewIcon />, path: '/ui/governance/dashboard' },
        { id: 'policies', label: 'Policies', icon: <PoliciesIcon />, path: '/ui/governance/policies' },
        { id: 'violations', label: 'Violations', icon: <ViolationsIcon />, path: '/ui/governance/violations' },
        { id: 'audit-reports', label: 'Audit Reports', icon: <AuditIcon />, path: '/ui/governance/audit-reports' },
      ],
    },
    {
      id: 'trust-metrics',
      label: 'Trust Metrics',
      icon: <TrustIcon />,
      children: [
        { id: 'trust-overview', label: 'Trust Overview', icon: <OverviewIcon />, path: '/ui/trust/overview' },
        { id: 'trust-scoring', label: 'Trust Scoring', icon: <Assessment />, path: '/ui/trust/scoring' },
        { id: 'trust-history', label: 'Trust History', icon: <Timeline />, path: '/ui/trust/history' },
      ],
    },
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
    console.log('🔄 Navigating to:', path);
    navigate(path);
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
                  onClick={() => child.path && handleNavigation(child.path)}
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
                  color: isItemActive ? '#4299e1' : 'white',
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
              onClick={() => item.path && handleNavigation(item.path)}
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
                  color: isItemActive ? '#4299e1' : 'white',
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
              if (hasChildren) {
                handleSectionToggle(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
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
                color: isItemActive ? '#4299e1' : 'white',
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
                color: isItemActive ? '#4299e1' : 'white',
                '& .MuiListItemText-primary': {
                  fontSize: '14px',
                  fontWeight: isItemActive ? 600 : 400,
                }
              }} 
            />
            {hasChildren && (
              isExpanded ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />
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
    <DrawerComponent
      variant="permanent"
      anchor="left"
      sx={{
        width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: '64px', // Account for header height
          height: 'calc(100vh - 64px)',
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
          borderBottom: '1px solid #2d3748',
        }}
      >
        <IconButton onClick={handleToggleCollapse} sx={{ color: 'white' }}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <List sx={{ pt: 0 }}>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>

      {/* Footer section for collapsed state */}
      {collapsed && (
        <Box sx={{ mt: 'auto', p: 1, borderTop: '1px solid #2d3748' }}>
          <Tooltip title="Settings" placement="right" arrow>
            <IconButton 
              sx={{ color: 'white', width: '100%' }}
              onClick={() => handleNavigation('/ui/settings')}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Footer section for expanded state */}
      {!collapsed && (
        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ borderColor: '#2d3748' }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/ui/settings')}>
                <ListItemIcon sx={{ color: 'white' }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" sx={{ color: 'white' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigation('/ui/help')}>
                <ListItemIcon sx={{ color: 'white' }}>
                  <HelpIcon />
                </ListItemIcon>
                <ListItemText primary="Help & Support" sx={{ color: 'white' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      )}
    </DrawerComponent>
  );
};

export default CollapsibleNavigationEnhanced;

