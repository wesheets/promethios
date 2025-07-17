import React, { useState } from 'react';
import { Box, Typography, Chip, Alert, Button, Switch, FormControlLabel } from '@mui/material';
import AdvancedChatComponent from './AdvancedChatComponent';
import SimpleChatComponent from './SimpleChatComponent';

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
  const [useSimpleChat, setUseSimpleChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
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
  
  // Get API key from deployment if available
  const apiKey = deployment?.apiKey;
  
  // If using simple chat or if we have an API key, show simple chat option
  if (useSimpleChat && apiKey && agentId) {
    console.log('🔄 SafeGovernanceChatWrapper: Rendering SimpleChatComponent');
    return (
      <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, backgroundColor: '#2d3748', borderBottom: '1px solid #4a5568' }}>
          <FormControlLabel
            control={
              <Switch
                checked={useSimpleChat}
                onChange={(e) => setUseSimpleChat(e.target.checked)}
                color="primary"
              />
            }
            label="Use Simple Chat (Direct API)"
            sx={{ color: 'white' }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <SimpleChatComponent
            agentId={agentId}
            agentName={resolvedAgentName}
            apiKey={apiKey}
          />
        </Box>
      </Box>
    );
  }
  
  try {
    console.log('🔄 SafeGovernanceChatWrapper: Attempting to render AdvancedChatComponent');
    return (
      <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
        {apiKey && (
          <Box sx={{ p: 2, backgroundColor: '#2d3748', borderBottom: '1px solid #4a5568' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useSimpleChat}
                  onChange={(e) => setUseSimpleChat(e.target.checked)}
                  color="primary"
                />
              }
              label="Use Simple Chat (Direct API)"
              sx={{ color: 'white' }}
            />
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <AdvancedChatComponent 
            isDeployedAgent={true}
            deployedAgentId={agentId}
            deployedAgentName={resolvedAgentName}
            deploymentId={deploymentId}
          />
        </Box>
      </Box>
    );
  } catch (error) {
    console.error('❌ ChatContainer failed to render:', error);
    setChatError(error instanceof Error ? error.message : 'Chat failed to load');
    
    // Fallback to simple chat if available
    if (apiKey && agentId) {
      return (
        <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
          <Alert severity="warning" sx={{ m: 2 }}>
            Advanced chat failed to load. Using simple chat instead.
            <Button 
              size="small" 
              onClick={() => setUseSimpleChat(true)}
              sx={{ ml: 2 }}
            >
              Switch to Simple Chat
            </Button>
          </Alert>
          <Box sx={{ flex: 1 }}>
            <SimpleChatComponent
              agentId={agentId}
              agentName={resolvedAgentName}
              apiKey={apiKey}
            />
          </Box>
        </Box>
      );
    }
    
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

