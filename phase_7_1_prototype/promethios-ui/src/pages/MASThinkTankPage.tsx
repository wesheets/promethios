/**
 * MAS Think Tank Page
 * 
 * Main page for the Multi-Agent Systems Think Tank Platform.
 * Integrates with persistence service for saving/loading conversations and workflows.
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import ThinkTankPlatform from '../components/think-tank/ThinkTankPlatform';
import { 
  masPersistenceService, 
  SavedMASConversation, 
  MASWorkflowTemplate 
} from '../services/persistence/MASPersistenceService';
import { 
  naturalConversationFlowService,
  ConversationSession,
  ConversationMessage
} from '../services/conversation/NaturalConversationFlowService';

interface MASThinkTankPageProps {}

const MASThinkTankPage: React.FC<MASThinkTankPageProps> = () => {
  const { currentUser } = useAuth();
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [savedConversation, setSavedConversation] = useState<SavedMASConversation | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Auto-save conversation every 30 seconds when active
  useEffect(() => {
    if (!currentSession || !autoSaveEnabled || !currentUser) return;

    const autoSaveInterval = setInterval(async () => {
      await handleAutoSave();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentSession, autoSaveEnabled, currentUser]);

  // Handle session start
  const handleSessionStart = async (session: ConversationSession) => {
    try {
      setCurrentSession(session);
      
      // Create initial saved conversation
      const initialConversation: SavedMASConversation = {
        conversationId: session.sessionId,
        name: `${session.orchestrator.name} Session - ${new Date().toLocaleDateString()}`,
        description: `Multi-agent conversation with ${session.participants.length} participants`,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: currentUser?.uid || 'anonymous',
        
        sessionConfig: {
          orchestrator: session.orchestrator,
          participants: session.participants.map(p => ({
            agentId: p.agentId,
            agentName: p.agentName,
            agentRole: p.role,
            agentAvatar: p.avatar || '🤖',
            governanceIdentity: p.governanceIdentity,
            participationStats: {
              messageCount: 0,
              averageQuality: 0,
              averageRelevance: 0,
              auditLogShareCount: 0
            }
          })),
          autonomyLevel: session.autonomyControls.autonomyLevel,
          sessionType: session.sessionType,
          auditLogSharingEnabled: session.auditLogSharingEnabled
        },
        
        messages: [],
        auditLogShares: [],
        governanceInsights: [],
        
        sessionMetrics: {
          totalMessages: 0,
          participationBalance: 1.0,
          conversationQuality: 0.0,
          governanceCompliance: 1.0,
          learningValue: 0.0,
          consensusLevel: 0.0,
          duration: 0
        },
        
        tags: ['think-tank', session.sessionType, session.orchestrator.id],
        isTemplate: false,
        isPublic: false
      };
      
      setSavedConversation(initialConversation);
      await masPersistenceService.saveConversation(initialConversation);
      
      showSnackbar('Session started and saved successfully');
    } catch (error) {
      console.error('Error starting session:', error);
      showSnackbar('Error starting session');
    }
  };

  // Handle new message
  const handleNewMessage = async (message: ConversationMessage) => {
    if (!currentSession || !savedConversation) return;

    try {
      // Update saved conversation with new message
      const updatedConversation: SavedMASConversation = {
        ...savedConversation,
        messages: [
          ...savedConversation.messages,
          {
            messageId: message.messageId,
            agentId: message.agentId,
            agentName: message.agentName,
            timestamp: message.timestamp,
            messageType: message.messageType,
            content: {
              text: message.content,
              attachments: message.attachments
            },
            qualityMetrics: message.qualityMetrics,
            governanceInsights: message.governanceInsights?.map(insight => ({
              insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: insight.type as any,
              description: insight.description,
              confidence: insight.confidence,
              actionable: insight.actionable,
              recommendations: insight.recommendations,
              timestamp: new Date(),
              agentId: message.agentId
            })) || []
          }
        ],
        sessionMetrics: {
          ...savedConversation.sessionMetrics,
          totalMessages: savedConversation.messages.length + 1,
          conversationQuality: message.qualityMetrics.overall,
          governanceCompliance: message.qualityMetrics.governance,
          duration: Math.floor((new Date().getTime() - savedConversation.createdAt.getTime()) / 60000) // minutes
        },
        updatedAt: new Date()
      };

      setSavedConversation(updatedConversation);
      
      // Auto-save if enabled
      if (autoSaveEnabled) {
        await handleAutoSave(updatedConversation);
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  // Handle audit log share
  const handleAuditLogShare = async (auditLogShare: any) => {
    if (!savedConversation) return;

    try {
      const updatedConversation: SavedMASConversation = {
        ...savedConversation,
        auditLogShares: [
          ...savedConversation.auditLogShares,
          {
            shareId: auditLogShare.shareId,
            sharedBy: auditLogShare.sharedBy,
            sharedWith: auditLogShare.sharedWith,
            timestamp: new Date(),
            trigger: auditLogShare.trigger,
            relevanceScore: auditLogShare.relevanceScore,
            filteredReasoning: auditLogShare.filteredReasoning,
            originalCryptographicHash: auditLogShare.originalCryptographicHash,
            filteredContentHash: auditLogShare.filteredContentHash,
            complianceValidation: auditLogShare.complianceValidation
          }
        ],
        updatedAt: new Date()
      };

      setSavedConversation(updatedConversation);
      
      if (autoSaveEnabled) {
        await handleAutoSave(updatedConversation);
      }
    } catch (error) {
      console.error('Error handling audit log share:', error);
    }
  };

  // Handle auto-save
  const handleAutoSave = async (conversation?: SavedMASConversation) => {
    if (!currentUser) return;

    try {
      setSaveStatus('saving');
      const conversationToSave = conversation || savedConversation;
      
      if (conversationToSave) {
        await masPersistenceService.saveConversation(conversationToSave);
        setLastSaveTime(new Date());
        setSaveStatus('saved');
        
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Handle manual save
  const handleManualSave = async () => {
    await handleAutoSave();
    showSnackbar('Conversation saved successfully');
  };

  // Handle session end
  const handleSessionEnd = async () => {
    if (!savedConversation) return;

    try {
      // Final save with session completion
      const finalConversation: SavedMASConversation = {
        ...savedConversation,
        sessionMetrics: {
          ...savedConversation.sessionMetrics,
          duration: Math.floor((new Date().getTime() - savedConversation.createdAt.getTime()) / 60000)
        },
        updatedAt: new Date()
      };

      await masPersistenceService.saveConversation(finalConversation);
      
      setCurrentSession(null);
      setSavedConversation(null);
      setLastSaveTime(null);
      setSaveStatus('idle');
      
      showSnackbar('Session ended and saved successfully');
    } catch (error) {
      console.error('Error ending session:', error);
      showSnackbar('Error saving session');
    }
  };

  // Handle load conversation
  const handleLoadConversation = async (conversationId: string) => {
    try {
      const conversation = await masPersistenceService.loadConversation(conversationId);
      if (conversation) {
        setSavedConversation(conversation);
        
        // Recreate session from saved conversation
        const session: ConversationSession = {
          sessionId: conversation.conversationId,
          orchestrator: conversation.sessionConfig.orchestrator,
          participants: conversation.sessionConfig.participants.map(p => ({
            agentId: p.agentId,
            agentName: p.agentName,
            role: p.agentRole,
            avatar: p.agentAvatar,
            governanceIdentity: p.governanceIdentity
          })),
          autonomyControls: {
            autonomyLevel: conversation.sessionConfig.autonomyLevel as any,
            maxTeamSize: conversation.sessionConfig.participants.length,
            allowPrivateCommunication: true,
            requireHumanApproval: false,
            escalationThreshold: 0.8
          },
          sessionType: conversation.sessionConfig.sessionType as any,
          auditLogSharingEnabled: conversation.sessionConfig.auditLogSharingEnabled,
          startTime: conversation.createdAt,
          status: 'active'
        };
        
        setCurrentSession(session);
        showSnackbar('Conversation loaded successfully');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      showSnackbar('Error loading conversation');
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please log in to access the Think Tank Platform.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #2d3748' }}>
        <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
          🧠 Think Tank Platform
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
          Revolutionary AI-to-AI collaboration with governance-native orchestration
        </Typography>
        
        {/* Save Status */}
        {currentSession && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Status: 
              {saveStatus === 'saving' && ' Saving...'}
              {saveStatus === 'saved' && ' ✅ Saved'}
              {saveStatus === 'error' && ' ❌ Save Error'}
              {saveStatus === 'idle' && ' Ready'}
            </Typography>
            
            {lastSaveTime && (
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                Last saved: {lastSaveTime.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Think Tank Platform */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ThinkTankPlatform
          onSessionStart={handleSessionStart}
          onSessionEnd={handleSessionEnd}
          onNewMessage={handleNewMessage}
          onAuditLogShare={handleAuditLogShare}
          onManualSave={handleManualSave}
          onLoadConversation={handleLoadConversation}
          currentSession={currentSession}
          savedConversation={savedConversation}
          autoSaveEnabled={autoSaveEnabled}
          onAutoSaveToggle={setAutoSaveEnabled}
        />
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default MASThinkTankPage;

