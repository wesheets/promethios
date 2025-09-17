/**
 * SocialNetworkPanel - Adjacent social network panel with improved UX
 * 
 * This panel opens adjacent to the collaboration panel, providing a seamless
 * professional networking experience with mini profile on left and feed on right.
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Badge,
  Avatar,
  InputBase,
  Paper,
  Slide,
} from '@mui/material';
import {
  Close,
  Search,
  Home,
  People,
  Work,
  Message,
  Notifications,
  Business,
  ExpandMore,
} from '@mui/icons-material';
import SocialFeedPage from '../../pages/SocialFeedPage';
import LinkedInStyleProfilePage from '../../pages/LinkedInStyleProfilePage';
import DiscoveryPage from '../../pages/DiscoveryPage';
import OrganizationsPage from '../../pages/OrganizationsPage';
import SocialProfileMini from './SocialProfileMini';
import { useAuth } from '../../context/AuthContext';

interface SocialNetworkPanelProps {
  open: boolean;
  onClose: () => void;
  width?: string;
}

const SocialNetworkPanel: React.FC<SocialNetworkPanelProps> = ({
  open,
  onClose,
  width = '100%'
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View state for different pages within the social network
  const [currentView, setCurrentView] = useState<'feed' | 'profiles' | 'discovery' | 'organizations'>('feed');
  const [viewHistory, setViewHistory] = useState<string[]>(['feed']);

  // Navigation functions
  const navigateToView = (view: typeof currentView) => {
    setViewHistory(prev => [...prev, view]);
    setCurrentView(view);
  };

  const navigateBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop(); // Remove current view
      const previousView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentView(previousView as typeof currentView);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const navigationTabs = [
    { label: 'Home', icon: <Home />, value: 0 },
    { label: 'My Network', icon: <People />, value: 1 },
    { label: 'Jobs', icon: <Work />, value: 2 },
    { label: 'Messaging', icon: <Message />, value: 3 },
    { label: 'Notifications', icon: <Notifications />, value: 4, badge: 3 },
    { label: 'For Business', icon: <Business />, value: 5 },
  ];

  const renderTabContent = () => {
    // For Home tab, show different views based on currentView
    if (activeTab === 0) {
      switch (currentView) {
        case 'profiles':
          return (
            <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#1e293b' }}>
              <LinkedInStyleProfilePage />
            </Box>
          );
        case 'discovery':
          return (
            <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#1e293b' }}>
              <DiscoveryPage />
            </Box>
          );
        case 'organizations':
          return (
            <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#1e293b' }}>
              <OrganizationsPage />
            </Box>
          );
        case 'feed':
        default:
          return (
            <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#1e293b' }}>
              <SocialFeedPage />
            </Box>
          );
      }
    }

    // Other tabs remain the same
    switch (activeTab) {
      case 1:
        return (
          <Box sx={{ p: 3, color: '#f8fafc', bgcolor: '#1e293b', height: '100%' }}>
            <Typography variant="h5">My Network</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Network content coming soon...
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ p: 3, color: '#f8fafc', bgcolor: '#1e293b', height: '100%' }}>
            <Typography variant="h5">Jobs</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Jobs content coming soon...
            </Typography>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ p: 3, color: '#f8fafc', bgcolor: '#1e293b', height: '100%' }}>
            <Typography variant="h5">Messaging</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Messaging content coming soon...
            </Typography>
          </Box>
        );
      case 4:
        return (
          <Box sx={{ p: 3, color: '#f8fafc', bgcolor: '#1e293b', height: '100%' }}>
            <Typography variant="h5">Notifications</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Notifications content coming soon...
            </Typography>
          </Box>
        );
      case 5:
        return (
          <Box sx={{ p: 3, color: '#f8fafc', bgcolor: '#1e293b', height: '100%' }}>
            <Typography variant="h5">For Business</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Business content coming soon...
            </Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#1e293b' }}>
            <SocialFeedPage />
          </Box>
        );
    }
  };

  if (!open) return null;

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: '384px', // Position after left nav (64px) + collaboration panel (320px)
          width: width === '100%' ? 'calc(100vw - 384px)' : width === '50%' ? 'calc(50vw - 192px)' : width,
          height: '100vh',
          bgcolor: '#1e293b', // Match left navigation background
          borderLeft: '1px solid #334155', // Match left navigation border
          zIndex: 1199, // Just below collaboration panel
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* LinkedIn-style Header */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: '#334155', // Slightly lighter than main background
            borderBottom: '1px solid #475569'
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important', px: 2 }}>
            {/* Logo/Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#6366f1',
                  fontSize: '1.5rem'
                }}
              >
                promethios
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 1,
                  color: '#cbd5e1',
                  fontSize: '0.75rem'
                }}
              >
                social
              </Typography>
            </Box>

            {/* Search Bar */}
            <Paper
              component="form"
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: 300,
                height: 36,
                bgcolor: '#1e293b', // Match main background
                border: '1px solid #475569',
                borderRadius: '4px',
                mr: 3,
                '&:hover': {
                  border: '1px solid #64748b'
                },
                '&:focus-within': {
                  border: '1px solid #6366f1'
                }
              }}
              elevation={0}
            >
              <IconButton sx={{ p: '8px', color: '#cbd5e1' }} aria-label="search">
                <Search fontSize="small" />
              </IconButton>
              <InputBase
                sx={{ 
                  ml: 1, 
                  flex: 1, 
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  '& input::placeholder': {
                    color: '#94a3b8',
                    opacity: 1
                  }
                }}
                placeholder="Search professionals, companies, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Paper>

            {/* Navigation Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                flexGrow: 1,
                '& .MuiTab-root': {
                  color: '#cbd5e1',
                  minWidth: 'auto',
                  px: 2,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: '#6366f1'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#6366f1'
                }
              }}
            >
              {navigationTabs.map((tab) => (
                <Tab
                  key={tab.value}
                  icon={
                    tab.badge ? (
                      <Badge badgeContent={tab.badge} color="error">
                        {tab.icon}
                      </Badge>
                    ) : (
                      tab.icon
                    )
                  }
                  label={tab.label}
                  iconPosition="top"
                  sx={{
                    '& .MuiTab-iconWrapper': {
                      fontSize: '1.2rem',
                      mb: 0.5
                    }
                  }}
                />
              ))}
            </Tabs>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Avatar
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: '#6366f1',
                  fontSize: '0.875rem'
                }}
              >
                {currentUser?.displayName?.charAt(0) || 'U'}
              </Avatar>
              <IconButton sx={{ color: '#cbd5e1', ml: 1 }}>
                <ExpandMore />
              </IconButton>
            </Box>

            {/* Close Button */}
            <IconButton
              onClick={onClose}
              sx={{ 
                color: '#cbd5e1',
                ml: 2,
                '&:hover': {
                  bgcolor: '#475569'
                }
              }}
            >
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Main Content Area - Mini Profile Left, Feed Right */}
        <Box sx={{ 
          display: 'flex', 
          height: 'calc(100vh - 64px)',
          overflow: 'hidden'
        }}>
          {/* Left Sidebar - Mini Profile (only on Home tab) */}
          {activeTab === 0 && (
            <Box sx={{ 
              width: 300, 
              borderRight: '1px solid #334155',
              bgcolor: '#1e293b',
              overflow: 'auto'
            }}>
              <SocialProfileMini 
                onNavigateToProfiles={() => navigateToView('profiles')}
                onNavigateToDiscovery={() => navigateToView('discovery')}
                onNavigateToOrganizations={() => navigateToView('organizations')}
              />
            </Box>
          )}

          {/* Main Content - Social Feed */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            bgcolor: '#1e293b' // Match theme background
          }}>
            {renderTabContent()}
          </Box>
        </Box>
      </Box>
    </Slide>
  );
};

export default SocialNetworkPanel;

