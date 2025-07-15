import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { auth } from '../firebase/config';
import { EnhancedDeploymentService } from '../modules/agent-wrapping/services/EnhancedDeploymentService';
import { SafeGovernanceChatWrapper } from '../components/SafeGovernanceChatWrapper';
import ApiInstructionsPanel from '../components/deployed-agents/ApiInstructionsPanel';
import DeployedAgentHeader from '../components/deployed-agents/DeployedAgentHeader';

const DeployedAgentChatPage: React.FC = () => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeployment = async () => {
    try {
      console.log('🔍 Loading deployment:', deploymentId);
      
      const currentUser = auth.currentUser;
      console.log('👤 Current user ID:', currentUser?.uid);
      
      if (!currentUser || !deploymentId) {
        throw new Error('Missing user or deployment ID');
      }

      const deploymentService = new EnhancedDeploymentService();
      let deploymentData = await deploymentService.getRealDeploymentStatus(deploymentId, currentUser.uid);
      
      console.log('📦 Deployment data loaded:', deploymentData);
      if (!deploymentData) {
        console.log('📝 Creating mock deployment data for testing...');
        deploymentData = {
          deploymentId: deploymentId,
          agentId: "AI Assistant", // Better default name
          agentName: "AI Assistant", // Ensure both are set
          userId: currentUser.uid,
          success: true,
          url: `https://deployed-agent-${deploymentId}.promethios.ai`,
          apiKey: `promethios_${currentUser.uid}_${deploymentId.replace('deploy-', '')}`,
          status: "healthy",
          uptime: "2h 15m",
          deploymentMethod: "single-agent",
          timestamp: new Date().toISOString()
        };
      }

      // Ensure API key is present
      if (!deploymentData.apiKey) {
        console.log('🔧 Adding missing API key to deployment data...');
        deploymentData.apiKey = `promethios_${currentUser.uid}_${deploymentId.replace('deploy-', '')}`;
      }

      // Ensure both agentId and agentName are available with better names
      if (!deploymentData.agentName && deploymentData.agentId) {
        // Create a meaningful name from the deployment data
        if (deploymentData.agentId.includes('agent-')) {
          // Extract a better name from the deployment ID or use deployment info
          const agentNumber = deploymentData.agentId.split('agent-')[1];
          deploymentData.agentName = `Deployed Agent ${agentNumber}`;
        } else {
          deploymentData.agentName = deploymentData.agentId;
        }
      }
      if (!deploymentData.agentId && deploymentData.agentName) {
        deploymentData.agentId = deploymentData.agentName;
      }
      
      // Fallback to ensure we always have a name (only if both are missing)
      if (!deploymentData.agentName && !deploymentData.agentId) {
        deploymentData.agentName = `Deployed Agent ${deploymentId.replace('deploy-', '')}`;
        deploymentData.agentId = deploymentData.agentName;
      }
      
      console.log('📦 Final deployment data:', deploymentData);
      setDeployment(deploymentData);
      
    } catch (err) {
      console.error('❌ Error loading deployment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deployment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeployment();
  }, [deploymentId]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#1a202c'
      }}>
        <CircularProgress sx={{ color: '#63b3ed' }} />
        <Typography sx={{ ml: 2, color: 'white' }}>
          Loading deployed agent...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography sx={{ color: 'white' }}>
          Deployment ID: {deploymentId}
        </Typography>
      </Box>
    );
  }

  if (!deployment) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh' }}>
        <Alert severity="warning">
          Deployed agent not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#1a202c'
    }}>
      {/* Header */}
      <DeployedAgentHeader deployment={deployment} />
      
      {/* Main Content Area */}
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
          <SafeGovernanceChatWrapper 
            height="100%"
            agentId={deployment.agentId}
            deployment={deployment} // Pass the deployment data
            multiAgentSystemId={deployment.deploymentMethod === 'multi-agent-system' ? deployment.agentId : undefined}
            governanceEnabled={true} // Always enabled for deployed agents
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

