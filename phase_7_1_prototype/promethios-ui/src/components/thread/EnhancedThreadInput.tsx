/**
 * EnhancedThreadInput - Exact copy of main chat input bar for thread interface
 * Copied from ChatbotProfilesPageEnhanced.tsx to maintain identical functionality
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Send,
  Mic,
  MicOff,
  AttachFile,
  SmartToy,
  Receipt,
  Search,
  Image as ImageIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import AgentAvatarSelector from '../AgentAvatarSelector';
import HoverOrchestrationTrigger, { ParticipantData } from '../collaboration/HoverOrchestrationTrigger';

interface EnhancedThreadInputProps {
  // Thread-specific props
  threadId: string;
  currentUserId: string;
  currentUserName: string;
  
  // Input state
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  disabled?: boolean;
  loading?: boolean;
  
  // Agent selection
  hostAgent: any;
  guestAgents: any[];
  selectedAgents: string[];
  onAgentSelectionChange: (agents: string[]) => void;
  
  // Additional props from main chat
  selectedTarget?: any;
  onTargetChange?: (target: any) => void;
  onBehaviorPrompt?: (agentId: string, agentName: string, behavior: string, isDirect?: boolean, targetMessageId?: string) => void;
  
  // Smart suggestions
  showSuggestions?: boolean;
  smartSuggestions?: string[];
  selectedSuggestionIndex?: number;
  onSuggestionSelect?: (suggestion: string) => void;
  
  // Behavioral orchestration
  participantData?: ParticipantData[];
  onBehaviorChange?: (settings: any) => void;
  onQuickBehaviorTrigger?: (agentId: string, agentName: string, behavior: string) => void;
  
  // Voice recording
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  
  // File handling
  attachedFiles?: any[];
  onFileAttach?: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  
  // Connected apps
  selectedConnectedApps?: any[];
  
  // Styling
  autonomousStarsActive?: boolean;
  
  // Shared mode context
  isSharedMode?: boolean;
  activeSharedConversation?: string;
  
  // Key handlers
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const EnhancedThreadInput: React.FC<EnhancedThreadInputProps> = ({
  threadId,
  currentUserId,
  currentUserName,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  disabled = false,
  loading = false,
  hostAgent,
  guestAgents = [],
  selectedAgents = [],
  onAgentSelectionChange,
  selectedTarget,
  onTargetChange,
  onBehaviorPrompt,
  showSuggestions = false,
  smartSuggestions = [],
  selectedSuggestionIndex = -1,
  onSuggestionSelect,
  participantData = [],
  onBehaviorChange,
  onQuickBehaviorTrigger,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  attachedFiles = [],
  onFileAttach,
  onFileRemove,
  selectedConnectedApps = [],
  autonomousStarsActive = false,
  isSharedMode = false,
  activeSharedConversation,
  onKeyDown,
  onKeyPress,
  onPaste,
  onFocus,
  onBlur
}) => {
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [connectedAppsMenuOpen, setConnectedAppsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (value: string) => {
    onMessageInputChange(value);
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleKeyPressEvent = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showSuggestions && selectedSuggestionIndex >= 0 && onSuggestionSelect) {
        e.preventDefault();
        onSuggestionSelect(smartSuggestions[selectedSuggestionIndex]);
      } else {
        onSendMessage();
      }
    }
    
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    if (onPaste) {
      onPaste(e);
    }
  };

  const handleFocusEvent = () => {
    if (autonomousStarsActive && messageInput.trim() && onFocus) {
      onFocus();
    }
  };

  const handleBlurEvent = () => {
    if (onBlur) {
      // Delay hiding suggestions to allow clicking
      setTimeout(() => onBlur(), 200);
    }
  };

  const handleSearchReceiptsClick = () => {
    onMessageInputChange('Search Receipts+ ');
    setAddMenuAnchor(null);
    
    // Focus on the message input for user to continue typing
    setTimeout(() => {
      const messageInputElement = document.querySelector('input[placeholder*="thread"]') as HTMLInputElement;
      if (messageInputElement) {
        messageInputElement.focus();
        // Position cursor at the end
        messageInputElement.setSelectionRange(messageInputElement.value.length, messageInputElement.value.length);
      }
    }, 100);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Integrated Input with Avatar Selection Inside */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        p: 1,
        bgcolor: '#1e293b',
        borderRadius: 2,
        border: '1px solid #334155',
        mb: 1
      }}>
        {/* Text Input with Integrated Avatar Selector */}
        <TextField
          fullWidth
          placeholder={
            isSharedMode && activeSharedConversation 
              ? "Reply to thread in shared conversation... (or use @agent-name or @human-name)"
              : "Reply to thread... (or use @agent-name or @human-name)"
          }
          value={messageInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyNavigation}
          onKeyPress={handleKeyPressEvent}
          onPaste={handlePasteEvent}
          onFocus={handleFocusEvent}
          onBlur={handleBlurEvent}
          variant="outlined"
          disabled={disabled || loading}
          multiline
          maxRows={4}
          InputProps={{
            startAdornment: (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                mr: 1,
                flexShrink: 0
              }}>
                {/* Agent Avatar Selector - Inside Input */}
                <AgentAvatarSelector
                  hostAgent={hostAgent}
                  guestAgents={guestAgents}
                  selectedAgents={selectedAgents}
                  onSelectionChange={(agentIds: string[]) => {
                    console.log('🎯 [EnhancedThreadInput] AgentAvatarSelector selection changed:', agentIds);
                    console.log('🎯 [EnhancedThreadInput] Host agent ID:', hostAgent?.id);
                    console.log('🎯 [EnhancedThreadInput] Calling onAgentSelectionChange with:', agentIds);
                    onAgentSelectionChange(agentIds);
                  }}
                  teamMembers={[]} // Thread-specific: no team members in thread context
                  aiAgents={
                    // Thread-specific: Only show the host agent (original message sender)
                    // Don't include guest agents to avoid duplication in thread context
                    hostAgent ? [{
                      id: hostAgent.id,
                      name: hostAgent.name,
                      avatar: hostAgent.avatar,
                      color: hostAgent.color || '#f97316', // 🔧 FIX: Ensure color is set for highlighting
                      type: 'ai_agent' as const, // 🔧 FIX: Use correct type
                      status: 'active' as const,
                      hotkey: 'c' // Add hotkey for Claude Assistant
                    }] : []
                  }
                  connectionsLoading={false}
                  onAddGuests={() => {}} // Thread-specific: disable guest adding in threads
                  unifiedParticipants={[]} // Thread-specific: simplified for thread context
                  humanParticipants={[]} // Thread-specific: no human participants in thread context
                  selectedTarget={selectedTarget}
                  onTargetChange={onTargetChange}
                  onBehaviorPrompt={onBehaviorPrompt}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  conversationId={threadId} // Use thread ID as conversation ID
                  conversationName={`Thread ${threadId}`}
                  hideHostAgent={false}
                  isSharedMode={isSharedMode}
                  sharedConversationParticipants={[]}
                  chatSession={undefined} // Thread-specific: no chat session context
                  agentId={hostAgent?.id}
                  user={{ uid: currentUserId, displayName: currentUserName }}
                />
                
                {/* Behavioral Orchestration Hover Triggers */}
                {participantData.length > 0 && (
                  <HoverOrchestrationTrigger
                    participants={participantData}
                    onBehaviorChange={onBehaviorChange}
                    onQuickBehaviorTrigger={onQuickBehaviorTrigger}
                    currentUserId={currentUserId}
                    showBehavioralControls={isSharedMode || selectedAgents.length > 1}
                  />
                )}
              </Box>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0f172a',
              color: 'white',
              '& fieldset': { 
                borderColor: autonomousStarsActive ? '#f59e0b' : '#475569',
                borderWidth: 1
              },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { 
                borderColor: autonomousStarsActive ? '#f59e0b' : '#3b82f6',
                borderWidth: 2
              },
              '& input::placeholder': {
                color: '#9ca3af',
                opacity: 1
              }
            }
          }}
        />
      </Box>
      
      {/* Amazon-Style Smart Suggestions Dropdown (Below Input) */}
      {showSuggestions && smartSuggestions.length > 0 && onSuggestionSelect && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 1,
            mt: 0.5,
            maxHeight: 200,
            overflow: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          {smartSuggestions.map((suggestion, index) => (
            <Box
              key={index}
              onClick={() => onSuggestionSelect(suggestion)}
              sx={{
                p: 1.5,
                cursor: 'pointer',
                bgcolor: selectedSuggestionIndex === index ? '#f3f4f6' : 'transparent',
                '&:hover': { bgcolor: '#f9fafb' },
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: index < smartSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}
            >
              <Box sx={{ color: '#6b7280', fontSize: '16px', minWidth: '20px' }}>
                {suggestion.includes('Create') ? '💡' : 
                 suggestion.includes('team') ? '👥' : 
                 suggestion.includes('project') ? '📁' : 
                 suggestion.includes('task') ? '🚀' : 
                 suggestion.includes('Continue') ? '▶️' : 
                 suggestion.includes('Check') ? '📬' : '⭐'}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#374151', 
                  flex: 1,
                  fontSize: '14px',
                  fontWeight: selectedSuggestionIndex === index ? 500 : 400
                }}
              >
                {suggestion}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Action Buttons Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        {/* Voice Recording Button */}
        {(onStartRecording && onStopRecording) && (
          <IconButton
            onClick={isRecording ? onStopRecording : onStartRecording}
            sx={{ 
              color: isRecording ? '#ef4444' : '#94a3b8',
              '&:hover': { color: isRecording ? '#dc2626' : '#3b82f6' }
            }}
          >
            {isRecording ? <MicOff /> : <Mic />}
          </IconButton>
        )}
        
        {/* Add Menu Button */}
        <IconButton
          onClick={(e) => setAddMenuAnchor(e.currentTarget)}
          sx={{ color: '#94a3b8', '&:hover': { color: '#3b82f6' } }}
        >
          <AttachFile />
        </IconButton>
        
        {/* Send Button */}
        <Button
          variant="contained"
          onClick={onSendMessage}
          disabled={(!messageInput.trim() && attachedFiles.length === 0) || loading}
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
            minWidth: 'auto',
            px: 3
          }}
        >
          {loading ? <CircularProgress size={20} /> : <Send />}
        </Button>
      </Box>

      {/* Add Menu */}
      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={() => setAddMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': { bgcolor: '#374151' }
            }
          }
        }}
      >
        <MenuItem onClick={() => { fileInputRef.current?.click(); setAddMenuAnchor(null); }}>
          <AttachFile sx={{ mr: 2 }} />
          Add photos & files
        </MenuItem>
        <MenuItem onClick={() => setAddMenuAnchor(null)}>
          <SmartToy sx={{ mr: 2 }} />
          Agent mode
        </MenuItem>
        <MenuItem onClick={handleSearchReceiptsClick}>
          <Receipt sx={{ mr: 2 }} />
          Search Receipts
        </MenuItem>
        <MenuItem onClick={() => setAddMenuAnchor(null)}>
          <Search sx={{ mr: 2 }} />
          Deep research
        </MenuItem>
        <MenuItem onClick={() => setAddMenuAnchor(null)}>
          <ImageIcon sx={{ mr: 2 }} />
          Create image
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setConnectedAppsMenuOpen(true);
            setAddMenuAnchor(null);
          }}
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 2 }} />
            Connected apps
          </Box>
          {selectedConnectedApps.length > 0 && (
            <Chip
              label={selectedConnectedApps.length}
              size="small"
              sx={{
                bgcolor: '#3b82f6',
                color: 'white',
                height: 20,
                fontSize: '0.7rem'
              }}
            />
          )}
        </MenuItem>
      </Menu>

      {/* Connected Apps Submenu */}
      <Menu
        anchorEl={addMenuAnchor}
        open={connectedAppsMenuOpen}
        onClose={() => setConnectedAppsMenuOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            minWidth: 300,
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': { bgcolor: '#374151' }
            }
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
            Connected Apps
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Select apps to use in this thread
          </Typography>
        </Box>
        
        {/* Connected apps would be listed here */}
        <MenuItem onClick={() => setConnectedAppsMenuOpen(false)}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
            No connected apps available
          </Typography>
        </MenuItem>
      </Menu>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && onFileAttach) {
            onFileAttach(Array.from(e.target.files));
          }
        }}
      />
    </Box>
  );
};

export default EnhancedThreadInput;
