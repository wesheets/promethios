import React from 'react';
import { Tooltip, IconButton, Typography, Box } from '@mui/material';
import { Info, HelpOutline } from '@mui/icons-material';

interface InfoTooltipProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'icon' | 'text' | 'underline';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  children,
  placement = 'top',
  variant = 'icon'
}) => {
  const tooltipContent = (
    <Box sx={{ maxWidth: 300 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2">
        {description}
      </Typography>
    </Box>
  );

  if (variant === 'text' && children) {
    return (
      <Tooltip 
        title={tooltipContent} 
        placement={placement}
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: '#2d3748',
              color: 'white',
              border: '1px solid #4a5568',
              fontSize: '0.875rem',
              maxWidth: 300
            }
          },
          arrow: {
            sx: {
              color: '#2d3748'
            }
          }
        }}
      >
        <Box 
          component="span" 
          sx={{ 
            cursor: 'help',
            color: '#3b82f6',
            fontWeight: 'medium'
          }}
        >
          {children}
        </Box>
      </Tooltip>
    );
  }

  if (variant === 'underline' && children) {
    return (
      <Tooltip 
        title={tooltipContent} 
        placement={placement}
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: '#2d3748',
              color: 'white',
              border: '1px solid #4a5568',
              fontSize: '0.875rem',
              maxWidth: 300
            }
          },
          arrow: {
            sx: {
              color: '#2d3748'
            }
          }
        }}
      >
        <Box 
          component="span" 
          sx={{ 
            cursor: 'help',
            borderBottom: '1px dotted #3b82f6',
            color: 'inherit'
          }}
        >
          {children}
        </Box>
      </Tooltip>
    );
  }

  // Default icon variant
  return (
    <Tooltip 
      title={tooltipContent} 
      placement={placement}
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: '#2d3748',
            color: 'white',
            border: '1px solid #4a5568',
            fontSize: '0.875rem',
            maxWidth: 300
          }
        },
        arrow: {
          sx: {
            color: '#2d3748'
          }
        }
      }}
    >
      <IconButton 
        size="small" 
        sx={{ 
          color: '#3b82f6', 
          ml: 0.5,
          '&:hover': { 
            backgroundColor: 'rgba(59, 130, 246, 0.1)' 
          }
        }}
      >
        <HelpOutline fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default InfoTooltip;

