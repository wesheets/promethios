/**
 * TokenResponseIcon - Small expandable token icon for agent responses
 * Replaces the large response quality section with a clean, minimal icon
 */

import React, { useState } from 'react';
import {
  IconButton,
  Popover,
  Box,
  Typography,
  Chip,
  Rating,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  AttachMoney as TokenIcon,
  TrendingUp,
  TrendingDown,
  Star
} from '@mui/icons-material';

interface TokenResponseIconProps {
  agentId: string;
  cost: number;
  quality?: number;
  value?: 'high' | 'medium' | 'low';
  onRate?: (rating: number) => void;
}

const TokenResponseIcon: React.FC<TokenResponseIconProps> = ({
  agentId,
  cost,
  quality = 0,
  value = 'medium',
  onRate
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [userRating, setUserRating] = useState<number>(quality);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRatingChange = (newValue: number | null) => {
    if (newValue !== null) {
      setUserRating(newValue);
      onRate?.(newValue);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? `token-popover-${agentId}` : undefined;

  const getValueColor = () => {
    switch (value) {
      case 'high': return '#10b981';
      case 'low': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getValueIcon = () => {
    switch (value) {
      case 'high': return <TrendingUp sx={{ fontSize: 12 }} />;
      case 'low': return <TrendingDown sx={{ fontSize: 12 }} />;
      default: return <TokenIcon sx={{ fontSize: 12 }} />;
    }
  };

  return (
    <>
      <Tooltip title={`Token cost: $${cost.toFixed(4)} • Click for details`}>
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            ml: 1,
            p: 0.5,
            color: getValueColor(),
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${getValueColor()}`,
            borderRadius: '50%',
            width: 24,
            height: 24,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          {getValueIcon()}
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 2,
            p: 2,
            minWidth: 280,
            maxWidth: 320
          }
        }}
      >
        <Box>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle2" color="white" fontWeight="600">
              Response Quality
            </Typography>
            <Chip
              label={`$${cost.toFixed(4)}`}
              size="small"
              sx={{
                backgroundColor: getValueColor(),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}
            />
          </Box>

          {/* Quality Rating */}
          <Box mb={2}>
            <Typography variant="body2" color="#94a3b8" mb={1}>
              How valuable was this response?
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Rating
                value={userRating}
                onChange={(_, newValue) => handleRatingChange(newValue)}
                size="small"
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: '#fbbf24'
                  },
                  '& .MuiRating-iconEmpty': {
                    color: '#374151'
                  }
                }}
              />
              <Typography variant="caption" color="#94a3b8">
                ({userRating}/5 stars)
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ backgroundColor: '#334155', mb: 2 }} />

          {/* Cost Analysis */}
          <Box>
            <Typography variant="body2" color="#94a3b8" mb={1}>
              Consider: Was it insightful? Did it add unique value? Worth the token cost?
            </Typography>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                icon={getValueIcon()}
                label={`${value.toUpperCase()} VALUE`}
                size="small"
                sx={{
                  backgroundColor: `${getValueColor()}20`,
                  color: getValueColor(),
                  border: `1px solid ${getValueColor()}`,
                  fontSize: '0.7rem',
                  height: 24
                }}
              />
              
              {value === 'high' && (
                <Chip
                  icon={<Star sx={{ fontSize: 12 }} />}
                  label="EXCELLENT"
                  size="small"
                  sx={{
                    backgroundColor: '#10b98120',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    fontSize: '0.7rem',
                    height: 24
                  }}
                />
              )}
              
              {value === 'low' && (
                <Chip
                  label="NEEDS IMPROVEMENT"
                  size="small"
                  sx={{
                    backgroundColor: '#ef444420',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    fontSize: '0.7rem',
                    height: 24
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Estimated Cost Breakdown */}
          <Box mt={2} p={1.5} backgroundColor="#0f172a" borderRadius={1}>
            <Typography variant="caption" color="#64748b" display="block" mb={0.5}>
              Estimated Cost
            </Typography>
            <Typography variant="body2" color="white" fontWeight="500">
              ${cost.toFixed(4)}
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default TokenResponseIcon;

