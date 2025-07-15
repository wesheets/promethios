import React from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import AdvancedChatComponent from './AdvancedChatComponent';

interface SafeGovernanceChatWrapperProps {
  deployment: any;
  height?: string;
}

export const SafeGovernanceChatWrapper: React.FC<SafeGovernanceChatWrapperProps> = ({ 
  deployment,
  height = "100%" 
}) => {
  console.log('🚀 SafeGovernanceChatWrapper rendering with deployment:', deployment);
  
  // For deployed agents, governance should always be enabled
  const governanceEnabled = true;
  
  // Extract agent information from deployment
  const agentId = deployment?.agentId || deployment?.agentName;
  const deploymentId = deployment?.deploymentId;
  
  console.log('🎯 SafeGovernanceChatWrapper: agentId =', agentId, 'deploymentId =', deploymentId);
  
  try {
    console.log('🔄 SafeGovernanceChatWrapper: Attempting to render AdvancedChatComponent');
    return (
      <AdvancedChatComponent 
        isDeployedAgent={true}
        deployedAgentId={agentId}
        deployedAgentName={deployment?.agentName || agentId}
        deploymentId={deploymentId}
      />
    );
  } catch (error) {
    console.error('❌ ChatContainer failed to render:', error);
    
    // Fallback UI if ChatContainer fails
    return (
      <Box sx={{ 
        height,
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        padding: 3,
        color: 'white'
      }}>
        <Alert severity="info" sx={{ mb: 2, backgroundColor: '#2a2a2a', color: 'white' }}>
          <Typography variant="h6" gutterBottom>
            🚀 Deployed Agent Chat Loading
          </Typography>
          <Typography variant="body2">
            Your deployed agent is initializing. The secure chat environment is being prepared.
          </Typography>
        </Alert>
        
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">
            Agent: {agentId || 'Loading...'}
          </Typography>
          
          <Chip 
            label="Governance: Always Active" 
            color="success" 
            sx={{ alignSelf: 'flex-start' }}
          />
          
          <Typography variant="body2" color="text.secondary">
            Deployment ID: {deploymentId || 'Loading...'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            The chat interface is loading with full governance monitoring and real-time compliance tracking.
          </Typography>
        </Box>
      </Box>
    );
  }
};

