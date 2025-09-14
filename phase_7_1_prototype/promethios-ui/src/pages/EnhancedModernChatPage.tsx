/**
 * Enhanced Modern Chat Page
 * Main chat page that uses the adaptive chat container with modern features
 * Provides the complete multi-agent chat experience
 */

import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useLocation, useSearchParams } from 'react-router-dom';

// Import modern components
import { CollapsiblePanelManager } from '../components/modern/CollapsiblePanelManager';
import { AdaptiveChatContainer } from '../modules/chat/components/AdaptiveChatContainer';

// Import existing components for compatibility
import { useAuth } from '../context/AuthContext';

interface EnhancedModernChatPageProps {
  // Optional props for direct integration
  agentId?: string;
  multiAgentSystemId?: string;
  governanceEnabled?: boolean;
}

const EnhancedModernChatPage: React.FC<EnhancedModernChatPageProps> = ({
  agentId: propAgentId,
  multiAgentSystemId: propMultiAgentSystemId,
  governanceEnabled: propGovernanceEnabled
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // State for chat configuration
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [governanceEnabled, setGovernanceEnabled] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Initialize chat configuration from props or URL
  useEffect(() => {
    // Priority: props > URL params > defaults
    const agentId = propAgentId || searchParams.get('agent');
    const systemId = propMultiAgentSystemId || searchParams.get('system');
    const governance = propGovernanceEnabled ?? (searchParams.get('governance') === 'true');
    
    setSelectedAgent(agentId);
    setSelectedSystem(systemId);
    setGovernanceEnabled(governance);
    
    // Generate session ID
    const newSessionId = `chat_${user?.uid || 'anonymous'}_${Date.now()}`;
    setSessionId(newSessionId);
    
    console.log('🚀 [EnhancedModernChatPage] Initialized:', {
      agentId,
      systemId,
      governance,
      sessionId: newSessionId
    });
  }, [propAgentId, propMultiAgentSystemId, propGovernanceEnabled, searchParams, user]);

  // Handle layout changes
  const handleLayoutChange = (layoutConfig: any) => {
    console.log('📐 [EnhancedModernChatPage] Layout changed:', layoutConfig);
  };

  // Handle errors
  const handleError = (error: string) => {
    setError(error);
    console.error('❌ [EnhancedModernChatPage] Error:', error);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <Box
      sx={{
        height: 'calc(100vh - 60px)', // Account for top navigation
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a202c',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Page Header - Optional, can be hidden for full-screen chat */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #4a5568',
          backgroundColor: '#2d3748',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '60px'
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
            Enhanced Chat
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', mt: 0.5 }}>
            {selectedAgent && `Chatting with Agent: ${selectedAgent}`}
            {selectedSystem && `Multi-Agent System: ${selectedSystem}`}
            {!selectedAgent && !selectedSystem && 'Select an agent or system to start chatting'}
          </Typography>
        </Box>
        
        {governanceEnabled && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}
            />
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
              Governance Active
            </Typography>
          </Box>
        )}
      </Box>

      {/* Main Chat Area with Collapsible Panel Management */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <CollapsiblePanelManager
          maxPanels={2}
          autoCollapseThreshold={768}
          animationDuration={300}
          onLayoutChange={handleLayoutChange}
        >
          <AdaptiveChatContainer
            height="100%"
            agentId={selectedAgent || undefined}
            multiAgentSystemId={selectedSystem || undefined}
            governanceEnabled={governanceEnabled}
            sessionId={sessionId}
          />
        </CollapsiblePanelManager>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Development Info - Only in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            p: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 1,
            fontSize: '10px',
            color: '#a0aec0',
            fontFamily: 'monospace',
            maxWidth: '300px',
            opacity: 0.7
          }}
        >
          <Typography variant="caption" sx={{ display: 'block' }}>
            Session: {sessionId}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Agent: {selectedAgent || 'None'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            System: {selectedSystem || 'None'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Governance: {governanceEnabled ? 'Enabled' : 'Disabled'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedModernChatPage;

