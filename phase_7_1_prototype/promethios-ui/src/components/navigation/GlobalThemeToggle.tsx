import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';

/**
 * GlobalThemeToggle - A theme toggle component for the left navigation bar
 * 
 * This component provides a theme toggle button styled specifically for the
 * left navigation bar. It uses the app's ThemeContext to toggle between dark and light modes.
 */
const GlobalThemeToggle: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  if (collapsed) {
    return (
      <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} placement="right" arrow>
        <IconButton 
          onClick={toggleTheme}
          sx={{ 
            color: 'white', 
            width: '100%', 
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {isDarkMode ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {isDarkMode ? <LightMode /> : <DarkMode />}
        {!collapsed && <span style={{ marginLeft: '8px', fontSize: '14px' }}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </span>}
      </IconButton>
    </Tooltip>
  );
};

export default GlobalThemeToggle;

