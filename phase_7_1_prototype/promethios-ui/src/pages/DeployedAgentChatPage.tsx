import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { auth } from '../firebase/config';
import { EnhancedDeploymentService } from '../modules/agent-wrapping/services/EnhancedDeploymentService';
// Temporarily comment out ChatContainer to debug
// import { ChatContainer } from '../modules/chat/components/ChatContainer';
import ApiInstructionsPanel from '../components/deployed-agents/ApiInstructionsPanel';
import DeployedAgentHeader from '../components/deployed-agents/DeployedAgentHeader';

const DeployedAgentChatPage: React.FC = () => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deploymentId) {
      loadDeployment(deploymentId);
    }
  }, [deploymentId]);

  const loadDeployment = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading deployment:', id);
      
      const deploymentService = new EnhancedDeploymentService();
      
      // Get current user ID from auth context
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid;
      
      console.log('👤 Current user ID:', userId);
      
      const deploymentData = await deploymentService.getRealDeploymentStatus(id, userId);
      
      console.log('📦 Deployment data loaded:', deploymentData);
      
      if (!deploymentData) {
        // For now, create mock deployment data for testing
        console.log('🔧 Creating mock deployment data for testing...');
        const mockDeployment = {
          deploymentId: id,
          agentId: 'AI Assistant',
          userId: userId || 'unknown',
          success: true,
          url: `https://deployed-agent-${id}.promethios.ai`,
          apiKey: `promethios_${userId}_${id.split('-').pop()}`,
          timestamp: new Date().toISOString(),
          deploymentMethod: 'enhanced',
          status: 'healthy',
          uptime: '2h 15m'
        };
        setDeployment(mockDeployment);
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
          borderRight: '1px solid #2d3748',
          backgroundColor: '#1a202c',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            🚀 Chat Interface Coming Soon
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', textAlign: 'center', maxWidth: 400 }}>
            This will be the chat interface for your deployed agent: <strong>{deployment.agentId}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mt: 2 }}>
            Deployment ID: {deployment.deploymentId}
          </Typography>
          {/* Temporarily removed ChatContainer to debug white screen
          <ChatContainer 
            height="100%"
            agentId={deployment.agentId}
            multiAgentSystemId={deployment.deploymentMethod === 'multi-agent-system' ? deployment.agentId : undefined}
            governanceEnabled={true} // Always enabled for deployed agents
            // TODO: Add deployed agent mode when we extend ChatContainer
          />
          */}
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

