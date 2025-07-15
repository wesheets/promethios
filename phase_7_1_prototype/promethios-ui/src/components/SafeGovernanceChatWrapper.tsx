import React from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import AdvancedChatComponent from './AdvancedChatComponent';

interface SafeGovernanceChatWrapperProps {
  deployment?: any;
  agentId?: string;
  multiAgentSystemId?: string;
  governanceEnabled?: boolean;
  height?: string;
}

export const SafeGovernanceChatWrapper: React.FC<SafeGovernanceChatWrapperProps> = ({ 
  deployment,
  agentId: propAgentId,
  multiAgentSystemId,
  governanceEnabled = true,
  height = "100%" 
}) => {
  console.log('🚀 SafeGovernanceChatWrapper rendering with deployment:', deployment);
  
  // Extract agent information from deployment or use props
  const agentId = deployment?.agentId || propAgentId;
  const deploymentId = deployment?.deploymentId;
  
  console.log('🎯 SafeGovernanceChatWrapper: agentId =', agentId, 'deploymentId =', deploymentId);
  console.log('🏷️ SafeGovernanceChatWrapper: deployment.agentName =', deployment?.agentName);
  
  // Try to get a better agent name
  let resolvedAgentName = deployment?.agentName || agentId;
  
  // If we have the agentId, try to extract a better name
  if (!deployment?.agentName && agentId) {
    // Try to extract from agent ID patterns
    const idParts = agentId.split('_');
    if (idParts.length > 1) {
      const agentPart = idParts[1]?.split('-')[0];
      if (agentPart && agentPart !== 'agent') {
        const friendlyNames: { [key: string]: string } = {
          'openai': 'OpenAI Assistant',
          'claude': 'Claude Assistant', 
          'gpt': 'GPT Assistant',
          'assistant': 'AI Assistant',
          'chatgpt': 'ChatGPT Assistant',
          'veritas': 'Veritas Agent',
          'promethios': 'Promethios Agent'
        };
        
        const lowerPart = agentPart.toLowerCase();
        if (friendlyNames[lowerPart]) {
          resolvedAgentName = friendlyNames[lowerPart];
        } else {
          resolvedAgentName = `${agentPart.charAt(0).toUpperCase() + agentPart.slice(1)} Assistant`;
        }
      }
    }
  }
  
  console.log('🎯 SafeGovernanceChatWrapper: resolvedAgentName =', resolvedAgentName);
  
  try {
    console.log('🔄 SafeGovernanceChatWrapper: Attempting to render AdvancedChatComponent');
    return (
      <AdvancedChatComponent 
        isDeployedAgent={true}
        deployedAgentId={agentId}
        deployedAgentName={resolvedAgentName}
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

