import React from 'react';
import { Chip, Tooltip, Badge, Avatar } from '@mui/material';
import { Group as TeamIcon } from '@mui/icons-material';

interface TeamMemberBadgeProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'chip' | 'badge' | 'icon';
  showTooltip?: boolean;
}

/**
 * TeamMemberBadge - A badge component to indicate team membership
 * 
 * Can be displayed as a chip, badge, or icon depending on the context.
 */
const TeamMemberBadge: React.FC<TeamMemberBadgeProps> = ({
  size = 'small',
  variant = 'chip',
  showTooltip = true,
}) => {
  const badgeContent = (
    <TeamIcon 
      fontSize={size === 'small' ? 'small' : size === 'medium' ? 'medium' : 'large'} 
      sx={{ color: '#4299e1' }}
    />
  );

  const renderBadge = () => {
    switch (variant) {
      case 'chip':
        return (
          <Chip
            icon={<TeamIcon />}
            label="Team Member"
            size={size === 'large' ? 'medium' : 'small'}
            color="primary"
            sx={{
              backgroundColor: '#4299e1',
              color: 'white',
              fontWeight: 500,
              '& .MuiChip-icon': {
                color: 'white',
              },
            }}
          />
        );
      case 'badge':
        return (
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Avatar
                sx={{
                  width: size === 'small' ? 12 : size === 'medium' ? 16 : 20,
                  height: size === 'small' ? 12 : size === 'medium' ? 16 : 20,
                  backgroundColor: '#4299e1',
                }}
              >
                <TeamIcon 
                  sx={{ 
                    fontSize: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
                    color: 'white',
                  }} 
                />
              </Avatar>
            }
          >
            {/* This is a placeholder for the content to be badged */}
            <div />
          </Badge>
        );
      case 'icon':
      default:
        return badgeContent;
    }
  };

  if (showTooltip) {
    return (
      <Tooltip title="Team Member" arrow>
        {renderBadge()}
      </Tooltip>
    );
  }

  return renderBadge();
};

export default TeamMemberBadge;

