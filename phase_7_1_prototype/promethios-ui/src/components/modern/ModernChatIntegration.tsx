/**
 * Modern Chat Integration
 * Wraps the existing ChatbotProfilesPageEnhanced with modern chat features
 * Provides progressive enhancement without breaking existing functionality
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { ModernChatProvider } from './ModernChatProvider';
import { ChatModeDetector, Participant } from './ChatModeDetector';
import { useModernChatFeature } from '../../config/modernChatConfig';

interface ModernChatIntegrationProps {
  children: React.ReactNode;
  
  // Integration with existing chat system
  sessionId?: string;
  currentUser?: any;
  chatbotProfiles?: any[];
  onMessageSent?: (message: any) => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, prompt: string) => void;
  
  // Configuration
  enableAnalytics?: boolean;
  debugMode?: boolean;
}

export const ModernChatIntegration: React.FC<ModernChatIntegrationProps> = ({
  children,
  sessionId = 'default-session',
  currentUser,
  chatbotProfiles = [],
  onMessageSent,
  onBehaviorPrompt,
  enableAnalytics = true,
  debugMode = false
}) => {
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Feature flags
  const modernChatEnabled = useModernChatFeature('enhanced-message-wrapper');
  const unifiedStateEnabled = useModernChatFeature('unified-state-management');
  
  // Initialize participants from existing chat data
  useEffect(() => {
    const initializeParticipants = () => {
      const newParticipants: Participant[] = [];
      
      // Add current user as human participant
      if (currentUser) {
        newParticipants.push({
          id: currentUser.uid || 'current-user',
          name: currentUser.displayName || currentUser.email || 'You',
          type: 'human',
          isActive: true
        });
      }
      
      // Add chatbot profiles as AI participants
      chatbotProfiles.forEach((profile, index) => {
        newParticipants.push({
          id: profile.id || `agent-${index}`,
          name: profile.name || profile.displayName || `Agent ${index + 1}`,
          type: 'ai',
          isActive: true,
          role: profile.role || 'assistant',
          color: profile.color || getAgentColor(index)
        });
      });
      
      setParticipants(newParticipants);
      setIsInitialized(true);
      
      if (debugMode) {
        console.log('🎯 [ModernChatIntegration] Initialized participants:', newParticipants);
      }
    };
    
    if (!isInitialized) {
      initializeParticipants();
    }
  }, [currentUser, chatbotProfiles, isInitialized, debugMode]);
  
  // Handle mode changes
  const handleModeChange = useCallback((mode: string) => {
    if (debugMode) {
      console.log(`🎯 [ModernChatIntegration] Chat mode changed to: ${mode}`);
    }
    
    // Emit analytics event
    if (enableAnalytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'chat_mode_change', {
        new_mode: mode,
        participant_count: participants.length,
        session_id: sessionId
      });
    }
  }, [debugMode, enableAnalytics, participants.length, sessionId]);
  
  // Enhanced message handler that integrates with modern chat
  const handleEnhancedMessageSent = useCallback((message: any) => {
    // Call original handler
    onMessageSent?.(message);
    
    // Add to modern chat state (handled by ModernChatProvider)
    if (debugMode) {
      console.log('📨 [ModernChatIntegration] Enhanced message sent:', message);
    }
  }, [onMessageSent, debugMode]);
  
  // Enhanced behavior prompt handler
  const handleEnhancedBehaviorPrompt = useCallback((agentId: string, agentName: string, prompt: string) => {
    // Call original handler
    onBehaviorPrompt?.(agentId, agentName, prompt);
    
    if (debugMode) {
      console.log('🎭 [ModernChatIntegration] Enhanced behavior prompt:', { agentId, agentName, prompt });
    }
  }, [onBehaviorPrompt, debugMode]);
  
  // If modern chat is disabled, return original children
  if (!modernChatEnabled) {
    if (debugMode) {
      console.log('🎯 [ModernChatIntegration] Modern chat disabled, rendering original children');
    }
    return <>{children}</>;
  }
  
  // If not initialized yet, return loading state
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          opacity: 0.7
        }}
      >
        Initializing modern chat features...
      </Box>
    );
  }
  
  return (
    <ChatModeDetector
      initialParticipants={participants}
      onModeChange={handleModeChange}
    >
      <ModernChatProvider
        sessionId={sessionId}
        onMessageSent={handleEnhancedMessageSent}
        onBehaviorPrompt={handleEnhancedBehaviorPrompt}
        enableAnalytics={enableAnalytics}
        debugMode={debugMode}
      >
        <ModernChatWrapper debugMode={debugMode}>
          {children}
        </ModernChatWrapper>
      </ModernChatProvider>
    </ChatModeDetector>
  );
};

// Wrapper component that provides modern chat context to children
const ModernChatWrapper: React.FC<{
  children: React.ReactNode;
  debugMode: boolean;
}> = ({ children, debugMode }) => {
  
  if (debugMode) {
    return (
      <Box
        sx={{
          position: 'relative',
          '&::before': {
            content: '"🎯 Modern Chat Active"',
            position: 'absolute',
            top: 0,
            right: 0,
            fontSize: '10px',
            color: 'rgba(139, 92, 246, 0.7)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            padding: '2px 6px',
            borderRadius: '0 0 0 4px',
            zIndex: 1000,
            pointerEvents: 'none'
          }
        }}
      >
        {children}
      </Box>
    );
  }
  
  return <>{children}</>;
};

// Utility function to generate agent colors
const getAgentColor = (index: number): string => {
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280'  // Gray
  ];
  
  return colors[index % colors.length];
};

export default ModernChatIntegration;

