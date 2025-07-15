import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { EnhancedDeploymentService } from '../../../../modules/agent-wrapping/services/EnhancedDeploymentService';
import { ChatContainer } from '../../../../modules/chat/components/ChatContainer';
import ApiInstructionsPanel from '../../../../components/deployed-agents/ApiInstructionsPanel';
import DeployedAgentHeader from '../../../../components/deployed-agents/DeployedAgentHeader';

const DeployedAgentChatPage: React.FC = () => {
  const router = useRouter();
  const { deploymentId } = router.query;
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deploymentId && typeof deploymentId === 'string') {
      loadDeployment(deploymentId);
    }
  }, [deploymentId]);

  const loadDeployment = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading deployment:', id);
      
      const deploymentService = new EnhancedDeploymentService();
      const deploymentData = await deploymentService.getRealDeploymentStatus(id);
      
      console.log('📦 Deployment data loaded:', deploymentData);
      
      if (!deploymentData) {
        setError('Deployed agent not found');
        return;
      }
      
      setDeployment(deploymentData);
    } catch (error) {
      console.error('❌ Failed to load deployment:', error);
      setError('Failed to load deployed agent');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a202c',
        color: 'white',
        gap: 2
      }}>
        <CircularProgress sx={{ color: '#63b3ed' }} />
        <Typography variant="h6">Loading deployed agent...</Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
          Deployment ID: {deploymentId}
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error || !deployment) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a202c',
        color: 'white',
        p: 3,
        gap: 2
      }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          {error || 'Deployed agent not found'}
        </Alert>
        <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: 500 }}>
          The deployed agent you're looking for doesn't exist or has been removed.
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0', textAlign: 'center' }}>
          Deployment ID: {deploymentId}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', // Account for header
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a202c',
      overflow: 'hidden'
    }}>
      {/* Deployed Agent Header */}
      <DeployedAgentHeader deployment={deployment} />
      
      {/* Main Chat Interface */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Chat Area (Left 60%) */}
        <Box sx={{ 
          flex: '0 0 60%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #2d3748'
        }}>
          <ChatContainer 
            height="100%"
            agentId={deployment.agentId}
            multiAgentSystemId={deployment.deploymentMethod === 'multi-agent-system' ? deployment.agentId : undefined}
            governanceEnabled={true} // Always enabled for deployed agents
            // TODO: Add deployed agent mode when we extend ChatContainer
          />
        </Box>
        
        {/* API Instructions Panel (Right 40%) */}
        <Box sx={{ 
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#2d3748'
        }}>
          <ApiInstructionsPanel deployment={deployment} />
        </Box>
      </Box>
    </Box>
  );
};

export default DeployedAgentChatPage;

