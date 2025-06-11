import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  Tooltip, 
  IconButton,
  Divider,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatIcon from '@mui/icons-material/Chat';
import BuildIcon from '@mui/icons-material/Build';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpeedIcon from '@mui/icons-material/Speed';
import BookIcon from '@mui/icons-material/Book';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import SupportIcon from '@mui/icons-material/Support';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import StorageIcon from '@mui/icons-material/Storage';

// Navigation width constants
const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 60;

// Styled components
const NavContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>(({ theme, open }) => ({
  width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1000,
  backgroundColor: theme.palette.mode === 'light' ? '#1a2035' : '#121212',
  color: theme.palette.common.white,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
}));

const NavHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  minHeight: 64,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const NavList = styled(List)({
  padding: 0,
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
});

const NavItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ theme, active }) => ({
  padding: theme.spacing(1, 2),
  color: active ? theme.palette.primary.main : theme.palette.common.white,
  backgroundColor: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
}));

const NavItemText = styled(ListItemText)(({ theme }) => ({
  margin: 0,
  '& .MuiTypography-root': {
    fontWeight: 500,
  },
}));

const NavItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 40,
  color: 'inherit',
}));

const NavToggleButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
}));

// Types
interface NavItemType {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItemType[];
  requiredPermission?: string;
}

interface CollapsibleNavigationProps {
  userPermissions?: string[];
  isAdmin?: boolean;
}

const CollapsibleNavigation: React.FC<CollapsibleNavigationProps> = ({
  userPermissions = [],
  isAdmin = false,
}) => {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    // Get from localStorage or default to true
    const savedState = localStorage.getItem('navExpanded');
    return savedState !== null ? savedState === 'true' : true;
  });
  
  // Track open/collapsed state for each nav section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    agents: false,
    governance: false,
    trustMetrics: false,
    settings: false,
    help: false,
  });

  // Navigation items with children
  const navItems: NavItemType[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
    },
    {
      title: 'Agents',
      path: '/agents',
      icon: <SmartToyIcon />,
      children: [
        {
          title: 'Agent Wrapping',
          path: '/agents/wrapping',
          icon: <BuildIcon />,
        },
        {
          title: 'Chat',
          path: '/agents/chat',
          icon: <ChatIcon />,
        },
        {
          title: 'Deploy',
          path: '/agents/deploy',
          icon: <CloudUploadIcon />,
        },
        {
          title: 'Registry',
          path: '/agents/registry',
          icon: <StorageIcon />,
        },
        {
          title: 'Scorecard',
          path: '/agents/scorecard',
          icon: <BarChartIcon />,
        },
        {
          title: 'Identity',
          path: '/agents/identity',
          icon: <FingerprintIcon />,
        },
        {
          title: 'Benchmarks',
          path: '/agents/benchmarks',
          icon: <SpeedIcon />,
        },
      ],
    },
    {
      title: 'Governance',
      path: '/governance',
      icon: <SecurityIcon />,
      children: [
        {
          title: 'Overview',
          path: '/governance/overview',
          icon: <DashboardIcon />,
        },
        {
          title: 'Policies',
          path: '/governance/policies',
          icon: <VerifiedUserIcon />,
        },
        {
          title: 'Violations',
          path: '/governance/violations',
          icon: <SecurityIcon />,
        },
        {
          title: 'Reports',
          path: '/governance/reports',
          icon: <BarChartIcon />,
        },
        {
          title: 'Emotional Veritas',
          path: '/governance/emotional-veritas',
          icon: <VerifiedUserIcon />,
        },
      ],
    },
    {
      title: 'Trust Metrics',
      path: '/trust-metrics',
      icon: <VerifiedUserIcon />,
      children: [
        {
          title: 'Overview',
          path: '/trust-metrics/overview',
          icon: <DashboardIcon />,
        },
        {
          title: 'Boundaries',
          path: '/trust-metrics/boundaries',
          icon: <SecurityIcon />,
        },
        {
          title: 'Attestations',
          path: '/trust-metrics/attestations',
          icon: <VerifiedUserIcon />,
        },
      ],
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <SettingsIcon />,
      children: [
        {
          title: 'User Profile',
          path: '/settings/profile',
          icon: <FingerprintIcon />,
        },
        {
          title: 'Preferences',
          path: '/settings/preferences',
          icon: <SettingsIcon />,
        },
        {
          title: 'Organization',
          path: '/settings/organization',
          icon: <SecurityIcon />,
        },
        {
          title: 'Integrations',
          path: '/settings/integrations',
          icon: <IntegrationInstructionsIcon />,
        },
        {
          title: 'Data Management',
          path: '/settings/data',
          icon: <StorageIcon />,
        },
      ],
    },
    {
      title: 'Help',
      path: '/help',
      icon: <HelpIcon />,
      children: [
        {
          title: 'Guided Tours',
          path: '/help/tours',
          icon: <LiveHelpIcon />,
        },
        {
          title: 'Documentation',
          path: '/help/docs',
          icon: <BookIcon />,
        },
        {
          title: 'Support',
          path: '/help/support',
          icon: <SupportIcon />,
        },
      ],
    },
  ];

  // Admin-only navigation items
  const adminNavItems: NavItemType[] = [
    {
      title: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: <SecurityIcon />,
      requiredPermission: 'admin',
    },
  ];

  // Filter navigation items based on permissions
  const filteredNavItems = [...navItems];
  
  // Add admin items if user is admin
  if (isAdmin) {
    filteredNavItems.push(...adminNavItems);
  }

  // Toggle navigation expansion
  const toggleNav = () => {
    const newOpen = !open;
    setOpen(newOpen);
    localStorage.setItem('navExpanded', String(newOpen));
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section],
    });
  };

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Check if a section should be open based on current path
  useEffect(() => {
    const newOpenSections = { ...openSections };
    
    // Check each nav item with children
    navItems.forEach(item => {
      if (item.children) {
        // If any child path matches current location, open the section
        const shouldBeOpen = item.children.some(child => 
          location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
        );
        
        if (shouldBeOpen) {
          newOpenSections[item.title.toLowerCase()] = true;
        }
      }
    });
    
    setOpenSections(newOpenSections);
  }, [location.pathname]);

  // Render navigation items recursively
  const renderNavItems = (items: NavItemType[]) => {
    return items.map((item) => {
      // Skip items that require permissions the user doesn't have
      if (item.requiredPermission && !isAdmin && !userPermissions.includes(item.requiredPermission)) {
        return null;
      }

      const active = isActive(item.path);
      const hasChildren = item.children && item.children.length > 0;
      const sectionKey = item.title.toLowerCase();
      const sectionOpen = openSections[sectionKey];

      return (
        <React.Fragment key={item.path}>
          {hasChildren ? (
            <>
              <NavItem 
                button 
                active={active}
                onClick={() => toggleSection(sectionKey)}
              >
                <NavItemIcon>{item.icon}</NavItemIcon>
                {open && (
                  <>
                    <NavItemText primary={item.title} />
                    {sectionOpen ? <ExpandLess /> : <ExpandMore />}
                  </>
                )}
              </NavItem>
              {open && (
                <Collapse in={sectionOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children!.map((child) => (
                      <NavItem
                        button
                        component={Link}
                        to={child.path}
                        key={child.path}
                        active={isActive(child.path)}
                        sx={{ pl: 4 }}
                      >
                        <NavItemIcon>{child.icon}</NavItemIcon>
                        <NavItemText primary={child.title} />
                      </NavItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </>
          ) : (
            <Tooltip title={open ? '' : item.title} placement="right">
              <NavItem
                button
                component={Link}
                to={item.path}
                active={active}
              >
                <NavItemIcon>{item.icon}</NavItemIcon>
                {open && <NavItemText primary={item.title} />}
              </NavItem>
            </Tooltip>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <NavContainer open={open}>
      <NavHeader>
        {open && (
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Promethios
          </Typography>
        )}
        <NavToggleButton onClick={toggleNav}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </NavToggleButton>
      </NavHeader>
      <Divider />
      <NavList>
        {renderNavItems(filteredNavItems)}
      </NavList>
    </NavContainer>
  );
};

export default CollapsibleNavigation;
