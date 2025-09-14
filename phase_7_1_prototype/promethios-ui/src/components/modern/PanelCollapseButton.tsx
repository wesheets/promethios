/**
 * PanelCollapseButton - Collapse/expand button for participant panels
 * Provides smooth animations and visual feedback
 */

import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { ChevronLeft, ChevronRight, Menu, People } from '@mui/icons-material';

interface PanelCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  position: 'left' | 'right';
  panelType: 'agents' | 'humans';
  participantCount?: number;
}

const PanelCollapseButton: React.FC<PanelCollapseButtonProps> = ({
  isCollapsed,
  onToggle,
  position,
  panelType,
  participantCount = 0
}) => {
  const getIcon = () => {
    if (isCollapsed) {
      return position === 'left' ? <ChevronRight /> : <ChevronLeft />;
    } else {
      return position === 'left' ? <ChevronLeft /> : <ChevronRight />;
    }
  };

  const getTooltipText = () => {
    const action = isCollapsed ? 'Expand' : 'Collapse';
    const type = panelType === 'agents' ? 'AI Agents' : 'Human Participants';
    return `${action} ${type} Panel${participantCount > 0 ? ` (${participantCount})` : ''}`;
  };

  const getPanelIcon = () => {
    return panelType === 'agents' ? <Menu /> : <People />;
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [position === 'left' ? 'right' : 'left']: -16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5
      }}
    >
      {/* Main collapse button */}
      <Tooltip title={getTooltipText()} placement={position === 'left' ? 'right' : 'left'}>
        <IconButton
          onClick={onToggle}
          sx={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '50%',
            width: 32,
            height: 32,
            color: '#94a3b8',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#334155',
              color: '#e2e8f0',
              transform: 'scale(1.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            },
            '&:active': {
              transform: 'scale(0.95)'
            }
          }}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>

      {/* Panel type indicator when collapsed */}
      {isCollapsed && participantCount > 0 && (
        <Box
          sx={{
            backgroundColor: panelType === 'agents' ? '#3B82F620' : '#F59E0B20',
            border: `1px solid ${panelType === 'agents' ? '#3B82F640' : '#F59E0B40'}`,
            borderRadius: '12px',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            minWidth: 24,
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              color: panelType === 'agents' ? '#3B82F6' : '#F59E0B',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.25
            }}
          >
            {React.cloneElement(getPanelIcon(), { sx: { fontSize: 12 } })}
            <span style={{ fontSize: '10px', fontWeight: 600 }}>
              {participantCount}
            </span>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PanelCollapseButton;

