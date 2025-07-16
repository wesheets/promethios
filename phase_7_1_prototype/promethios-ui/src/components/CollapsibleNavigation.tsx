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
  Tour as ToursIcon,
  Description as DocsIcon,
  Support as SupportIcon,
  AutoAwesome as WrapIcon,
  AutoAwesome,
  Hub as MultiAgentIcon,
  LibraryBooks as LibraryBooksIcon,
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
}

interface CollapsibleNavigationProps {
  userPermissions?: string[];
  isAdmin?: boolean;
}

const CollapsibleNavigation: React.FC<CollapsibleNavigationProps> = ({
  userPermissions = [],
  isAdmin = false,
}) => {
  const { preferences, updateNavigationState } = useUserPreferences();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
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
      id: 'agents',
      label: 'Agents',
      icon: <AgentsIcon />,
      children: [
        { id: 'my-agents', label: 'My Agents', icon: <ProfileIcon />, path: '/ui/agents/profiles' },
        { id: 'promethios-llm', label: 'Promethios LLM', icon: <AutoAwesome />, path: '/ui/agents/promethios-llm' },
        { id: 'template-library', label: 'Template Library', icon: <LibraryBooksIcon />, path: '/ui/agents/templates' },
        { id: 'agent-wrapping', label: 'Agent Wrapping', icon: <WrapIcon />, path: '/ui/agents/wrapping' },
        { id: 'multi-agent-wrapping', label: 'Multi-Agent Wrapping', icon: <MultiAgentIcon />, path: '/ui/agents/multi-wrapping' },
        { id: 'agent-lifecycle', label: 'Agent Lifecycle', icon: <TimelineIcon />, path: '/ui/agents/lifecycle' },
        { id: 'chat', label: 'Chat', icon: <ChatIcon />, path: '/ui/modern-chat' },
        { id: 'deploy', label: 'Deploy', icon: <DeployIcon />, path: '/ui/agents/deploy' },
        { id: 'registry', label: 'Registry', icon: <RegistryIcon />, path: '/ui/agents/registry' },
      ],
    },
    {
      id: 'governance',
      label: 'Governance',
      icon: <GovernanceIcon />,
      children: [
        { id: 'gov-overview', label: 'Overview', icon: <OverviewIcon />, path: '/ui/governance/overview' },
        { id: 'policies', label: 'Policies', icon: <PoliciesIcon />, path: '/ui/governance/policies' },
        { id: 'violations', label: 'Violations', icon: <ViolationsIcon />, path: '/ui/governance/violations' },
        { id: 'reports', label: 'Reports', icon: <ReportsIcon />, path: '/ui/governance/reports' },
        { id: 'veritas', label: 'Emotional Veritas', icon: <VeritasIcon />, path: '/ui/governance/veritas' },
      ],
    },
    {
      id: 'trust-metrics',
      label: 'Trust Metrics',
      icon: <TrustIcon />,
      children: [
        { id: 'trust-overview', label: 'Overview', icon: <OverviewIcon />, path: '/ui/trust/overview' },
        { id: 'boundaries', label: 'Boundaries', icon: <BoundariesIcon />, path: '/ui/trust/boundaries' },
        { id: 'attestations', label: 'Attestations', icon: <AttestationsIcon />, path: '/ui/trust/attestations' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      children: [
        { id: 'profile', label: 'User Profile', icon: <ProfileIcon />, path: '/ui/settings/profile' },
        { id: 'preferences', label: 'Preferences', icon: <PreferencesIcon />, path: '/ui/settings/preferences' },
        { id: 'organization', label: 'Organization', icon: <OrganizationIcon />, path: '/ui/settings/organization' },
        { id: 'integrations', label: 'Integrations', icon: <IntegrationsIcon />, path: '/ui/settings/integrations' },
        { id: 'data', label: 'Data Management', icon: <DataIcon />, path: '/ui/settings/data' },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpIcon />,
      children: [
        { id: 'tours', label: 'Guided Tours', icon: <ToursIcon />, path: '/ui/help/tours' },
        { id: 'docs', label: 'Documentation', icon: <DocsIcon />, path: '/ui/help/documentation' },
        { id: 'support', label: 'Support', icon: <SupportIcon />, path: '/ui/help/support' },
      ],
    },
  ];

  // Add admin dashboard if user is admin
  if (isAdmin) {
    navigationItems.push({
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <AdminIcon />,
      path: '/ui/admin/dashboard',
      adminOnly: true,
    });
  }

  const handleToggleCollapse = async () => {
    try {
      await updateNavigationState(!collapsed);
    } catch (error) {
      console.error('Failed to update navigation state:', error);
      // The UI will still update due to the preferences state change
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    if (collapsed) return; // Don't expand sections when collapsed
    
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigation = (path: string) => {
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
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {item.label}
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
                  <Typography variant="body2">{child.label}</Typography>
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
                {item.icon}
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      );
    }

    if (collapsed && !hasChildren) {
      // For collapsed state without children
      return (
        <Tooltip key={item.id} title={item.label} placement="right" arrow>
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
                {item.icon}
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      );
    }

    // For expanded state
    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleSectionToggle(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            sx={{
              pl: level * 2 + 2,
              backgroundColor: isItemActive ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: isItemActive ? '#4299e1' : 'white' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{ 
                '& .MuiListItemText-primary': {
                  color: isItemActive ? '#4299e1' : 'white',
                  fontWeight: isItemActive ? 600 : 400,
                }
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
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
  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          backgroundColor: '#1a202c',
          borderRight: '1px solid #2d3748',
          color: 'white',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          marginTop: '64px', // Header height
          height: 'calc(100vh - 64px)',
        },
      }}
    >
      {/* Space for floating Observer Agent bubble */}
      <Box
        sx={{
          height: '80px', // Space for the floating purple bubble
          borderBottom: '1px solid #2d3748',
          position: 'relative',
          // This creates the void/space where the floating bubble will hover
        }}
      />

      {/* Toggle Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
          p: 1,
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
    </Drawer>
  );
};

export default CollapsibleNavigation;
