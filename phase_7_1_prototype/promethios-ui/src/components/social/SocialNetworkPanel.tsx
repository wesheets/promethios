/**
 * SocialNetworkPanel - Complete LinkedIn-style social network in a slide-out panel
 * 
 * This is a self-contained professional networking interface that slides out
 * from the Collaborations panel, providing a complete social network experience.
 */

import React, { useState } from 'react';
import {
  Drawer,
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
import SocialProfileMini from './SocialProfileMini';
import { useAuth } from '../../context/AuthContext';

interface SocialNetworkPanelProps {
  open: boolean;
  onClose: () => void;
}

const SocialNetworkPanel: React.FC<SocialNetworkPanelProps> = ({
  open,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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
    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <SocialFeedPage />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ p: 3, color: '#f8fafc' }}>
            <Typography variant="h5">My Network</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Network content coming soon...
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ p: 3, color: '#f8fafc' }}>
            <Typography variant="h5">Jobs</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Job listings coming soon...
            </Typography>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ p: 3, color: '#f8fafc' }}>
            <Typography variant="h5">Messaging</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Professional messaging coming soon...
            </Typography>
          </Box>
        );
      case 4:
        return (
          <Box sx={{ p: 3, color: '#f8fafc' }}>
            <Typography variant="h5">Notifications</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Notifications coming soon...
            </Typography>
          </Box>
        );
      case 5:
        return (
          <Box sx={{ p: 3, color: '#f8fafc' }}>
            <Typography variant="h5">For Business</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#cbd5e1' }}>
              Business features coming soon...
            </Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <SocialFeedPage />
          </Box>
        );
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          width: '80vw',
          maxWidth: '1200px',
          bgcolor: '#0f172a',
          color: '#f8fafc',
          borderLeft: '1px solid #475569',
          zIndex: 1300,
        },
      }}
    >
      {/* LinkedIn-style Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: '#1e293b',
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
              bgcolor: '#334155',
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
                bgcolor: '#334155'
              }
            }}
          >
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 64px)',
        overflow: 'hidden'
      }}>
        {/* Main Content */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          bgcolor: '#0f172a'
        }}>
          {renderTabContent()}
        </Box>

        {/* Right Sidebar - Mini Profile (only on Home tab) */}
        {activeTab === 0 && (
          <Box sx={{ 
            width: 300, 
            borderLeft: '1px solid #475569',
            bgcolor: '#1e293b',
            overflow: 'auto'
          }}>
            <SocialProfileMini />
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default SocialNetworkPanel;

