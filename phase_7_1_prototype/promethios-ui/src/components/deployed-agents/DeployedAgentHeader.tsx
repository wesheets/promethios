import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Refresh,
  Launch,
  ContentCopy
} from '@mui/icons-material';

interface DeployedAgentHeaderProps {
  deployment: any; // Will be replaced with proper type
}

const DeployedAgentHeader: React.FC<DeployedAgentHeaderProps> = ({ deployment }) => {
  const [status, setStatus] = useState('healthy');
  const [uptime, setUptime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Calculate uptime
    const deployedAt = new Date(deployment.timestamp);
    const now = new Date();
    const uptimeMs = now.getTime() - deployedAt.getTime();
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    setUptime(`${hours}h ${minutes}m`);
    
    // Update every minute
    const interval = setInterval(() => {
      const newUptimeMs = Date.now() - deployedAt.getTime();
      const newHours = Math.floor(newUptimeMs / (1000 * 60 * 60));
      const newMinutes = Math.floor((newUptimeMs % (1000 * 60 * 60)) / (1000 * 60));
      setUptime(`${newHours}h ${newMinutes}m`);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [deployment.timestamp]);

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle sx={{ color: '#48bb78' }} />;
      case 'degraded':
        return <Warning sx={{ color: '#ed8936' }} />;
      case 'offline':
        return <Error sx={{ color: '#f56565' }} />;
      default:
        return <CheckCircle sx={{ color: '#48bb78' }} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return '#48bb78';
      case 'degraded':
        return '#ed8936';
      case 'offline':
        return '#f56565';
      default:
        return '#48bb78';
    }
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(deployment.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  const openDeploymentUrl = () => {
    if (deployment.url) {
      window.open(deployment.url, '_blank');
    }
  };

  const refreshStatus = () => {
    // TODO: Implement status refresh
    console.log('Refreshing deployment status...');
  };

  return (
    <Box sx={{
      backgroundColor: '#2d3748',
      borderBottom: '1px solid #4a5568',
      p: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left side - Agent info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            🚀 {deployment.agentName || 'Deployed Agent'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getStatusIcon()}
              <Typography variant="body2" sx={{ color: getStatusColor(), fontWeight: 500 }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Uptime: {uptime}
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              🛡️ Governance: Always Active
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right side - Actions and info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* API Key */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            API:
          </Typography>
          <Chip 
            label={`${deployment.apiKey.substring(0, 20)}...`}
            size="small"
            sx={{ 
              backgroundColor: '#4a5568',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}
          />
          <Tooltip title={copied ? "Copied!" : "Copy API Key"}>
            <IconButton size="small" onClick={copyApiKey} sx={{ color: '#a0aec0' }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Deployment URL */}
        {deployment.url && (
          <Tooltip title="Open Deployment URL">
            <IconButton size="small" onClick={openDeploymentUrl} sx={{ color: '#a0aec0' }}>
              <Launch fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Refresh Status */}
        <Tooltip title="Refresh Status">
          <IconButton size="small" onClick={refreshStatus} sx={{ color: '#a0aec0' }}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DeployedAgentHeader;

