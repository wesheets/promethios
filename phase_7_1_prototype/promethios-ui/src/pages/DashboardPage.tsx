import React from 'react';
import { Box } from '@mui/material';

/**
 * DashboardPage - Simplified dashboard with centered embossed flame logo
 * 
 * Features:
 * - Full screen centered layout
 * - Dark background (#161a1f)
 * - Embossed flame logo centered
 * - Clean, minimal design
 */
const DashboardPage: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        bgcolor: '#161a1f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Centered Embossed Flame Logo */}
      <Box
        component="img"
        src="/embossflame.png"
        alt="Promethios"
        sx={{
          width: '200px',
          height: '200px',
          objectFit: 'contain',
          opacity: 0.8,
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
        }}
      />
    </Box>
  );
};

export default DashboardPage;
