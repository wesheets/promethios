import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Import the existing navigation component
import NewHeader from '../components/navigation/NewHeader';

/**
 * MainLayoutProxy Component
 * 
 * This proxy component serves as a bridge to the navigation system.
 * It uses the existing NewHeader component to ensure a consistent navigation experience.
 */
interface MainLayoutProxyProps {
  children: ReactNode;
}

const MainLayoutProxy: React.FC<MainLayoutProxyProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      
      {/* Header Navigation Bar */}
      <NewHeader />
      
      {/* Main content area - adjust margin to account for fixed header */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px', // Header height
          p: 3,
          backgroundColor: '#1a202c', // Dark background to match the theme
          minHeight: 'calc(100vh - 64px)', // Full height minus header
          color: 'white', // Light text for dark background
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayoutProxy;
