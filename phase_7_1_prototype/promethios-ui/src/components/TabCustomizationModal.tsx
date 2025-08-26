/**
 * TabCustomizationModal - Modal for customizing visible tabs in the right panel
 * 
 * Allows users to hide/show tabs to personalize their interface and reduce clutter.
 * Settings are persisted in localStorage for each user.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'core' | 'advanced' | 'enterprise' | 'debug';
  description?: string;
  isNew?: boolean;
}

interface TabCustomizationModalProps {
  open: boolean;
  onClose: () => void;
  availableTabs: TabConfig[];
  visibleTabs: string[];
  onTabVisibilityChange: (visibleTabs: string[]) => void;
  userId: string;
}

const TabCustomizationModal: React.FC<TabCustomizationModalProps> = ({
  open,
  onClose,
  availableTabs,
  visibleTabs,
  onTabVisibilityChange,
  userId
}) => {
  const [localVisibleTabs, setLocalVisibleTabs] = useState<string[]>(visibleTabs);

  useEffect(() => {
    setLocalVisibleTabs(visibleTabs);
  }, [visibleTabs]);

  const handleTabToggle = (tabId: string) => {
    setLocalVisibleTabs(prev => {
      if (prev.includes(tabId)) {
        return prev.filter(id => id !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };

  const handleSave = () => {
    onTabVisibilityChange(localVisibleTabs);
    
    // Persist to localStorage
    const storageKey = `tab_preferences_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(localVisibleTabs));
    
    onClose();
  };

  const handleReset = () => {
    // Reset to default (show all tabs)
    const allTabIds = availableTabs.map(tab => tab.id);
    setLocalVisibleTabs(allTabIds);
  };

  const handleCancel = () => {
    setLocalVisibleTabs(visibleTabs); // Reset to original state
    onClose();
  };

  const getTabsByCategory = (category: string) => {
    return availableTabs.filter(tab => tab.category === category);
  };

  const renderTabCategory = (category: string, title: string, description: string) => {
    const categoryTabs = getTabsByCategory(category);
    if (categoryTabs.length === 0) return null;

    return (
      <Box key={category} sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        
        <Grid container spacing={1}>
          {categoryTabs.map(tab => (
            <Grid item xs={6} key={tab.id}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localVisibleTabs.includes(tab.id)}
                    onChange={() => handleTabToggle(tab.id)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.icon}
                    <Typography variant="body2">
                      {tab.label}
                    </Typography>
                    {tab.isNew && (
                      <Chip label="NEW" size="small" color="primary" sx={{ fontSize: '0.6rem', height: 16 }} />
                    )}
                  </Box>
                }
                sx={{ 
                  m: 0,
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const visibleCount = localVisibleTabs.length;
  const totalCount = availableTabs.length;
  const hiddenCount = totalCount - visibleCount;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          color: 'white',
          border: '1px solid #334155'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <SettingsIcon />
        <Typography variant="h6">
          Customize Tabs
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Summary */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3,
          p: 2,
          bgcolor: '#334155',
          borderRadius: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon color="primary" />
            <Typography variant="body2">
              <strong>{visibleCount}</strong> visible
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityOffIcon color="secondary" />
            <Typography variant="body2">
              <strong>{hiddenCount}</strong> hidden
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total: {totalCount} tabs
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose which tabs to show in your Command Center. Hidden tabs can be re-enabled anytime.
        </Typography>

        {/* Tab Categories */}
        {renderTabCategory('core', 'Core Features', 'Essential tabs for basic functionality')}
        
        <Divider sx={{ my: 2, borderColor: '#334155' }} />
        
        {renderTabCategory('advanced', 'Advanced Features', 'Power user features and customization')}
        
        <Divider sx={{ my: 2, borderColor: '#334155' }} />
        
        {renderTabCategory('enterprise', 'Enterprise Features', 'Team collaboration and governance')}
        
        <Divider sx={{ my: 2, borderColor: '#334155' }} />
        
        {renderTabCategory('debug', 'Development & Debug', 'Developer tools and debugging features')}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={handleReset}
          variant="outlined"
          size="small"
          sx={{ 
            borderColor: '#64748b',
            color: '#94a3b8',
            '&:hover': {
              borderColor: '#94a3b8',
              bgcolor: 'rgba(148, 163, 184, 0.1)'
            }
          }}
        >
          Show All
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Button 
          onClick={handleCancel}
          variant="outlined"
          size="small"
          sx={{ 
            borderColor: '#64748b',
            color: '#94a3b8',
            '&:hover': {
              borderColor: '#94a3b8',
              bgcolor: 'rgba(148, 163, 184, 0.1)'
            }
          }}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleSave}
          variant="contained"
          size="small"
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': {
              bgcolor: '#2563eb'
            }
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TabCustomizationModal;

