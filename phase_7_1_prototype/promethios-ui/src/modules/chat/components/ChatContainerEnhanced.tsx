/**
 * Enhanced Chat Container with AI Think Tank Support
 * 
 * This component provides the chat interface for both single agent
 * and revolutionary AI Think Tank multi-system collaboration.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Send,
  Psychology,
  Groups,
  ExpandMore,
  CheckCircle,
  Warning,
  Speed,
  Science,
} from '@mui/icons-material';

interface ChatMessage {
  message_id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: string;
  agent_id?: string;
  governance_metadata?: Record<string, any>;
  trust_score?: number;
  policy_results?: Array<Record<string, any>>;
}

interface ChatSession {
  session_id: string;
  user_id: string;
  session_type: 'single_agent' | 'multi_agent';
  governance_config: any;
  agent_config?: any;
  multi_agent_config?: any;
  created_at: string;
  last_activity: string;
  message_count: number;
  trust_metrics: Record<string, number>;
  governance_summary: Record<string, any>;
}

interface MessageResponse {
  message_id: string;
  session_id: string;
  response_content: string;
  governance_status: string;
  trust_score: number;
  policy_compliance: boolean;
  observer_notes?: string;
  processing_time_ms: number;
  coordination_details?: {
    pattern?: string;
    participating_agents?: string[];
    consensus_score?: number;
    individual_responses?: Array<{
      agent_id: string;
      content: string;
      confidence: number;
      trust_score: number;
    }>;
  };
}

interface ChatContainerProps {
  height?: string;
  session?: ChatSession | null;
  messages?: ChatMessage[];
  isLoading?: boolean;
  isSending?: boolean;
  onSendMessage?: (message: string) => Promise<MessageResponse>;
  error?: string | null;
  onClearError?: () => void;
  thinkTankMode?: boolean;
  lastResponse?: MessageResponse | null;
  governanceEnabled?: boolean;
  agentId?: string;
  multiAgentSystemId?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  height = '500px',
  session,
  messages = [],
  isLoading = false,
  isSending = false,
  onSendMessage,
  error,
  onClearError,
  thinkTankMode = false,
  lastResponse,
  governanceEnabled = true,
  agentId,
  multiAgentSystemId,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !onSendMessage) return;

    try {
      await onSendMessage(inputMessage.trim());
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getAgentAvatar = (agentId?: string) => {
    const agentColors: Record<string, string> = {
      'factual-agent': '#2196F3',
      'creative-agent': '#9C27B0',
      'governance-agent': '#4CAF50',
      'baseline-agent': '#FF9800',
      'multi-tool-agent': '#F44336',
    };

    return (
      <Avatar
        sx={{
          bgcolor: agentColors[agentId || 'baseline-agent'] || '#757575',
          width: 32,
          height: 32,
        }}
      >
        {agentId ? agentId.charAt(0).toUpperCase() : 'A'}
      </Avatar>
    );
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isThinkTankResponse = message.governance_metadata?.think_tank_response;
    const coordinationDetails = message.governance_metadata?.coordination_details;

    return (
      <Box
        key={message.message_id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: '80%',
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          {!isUser && getAgentAvatar(message.agent_id)}
          
          <Paper
            sx={{
              p: 2,
              bgcolor: isUser ? 'primary.main' : 'background.paper',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              border: isThinkTankResponse ? '2px solid #2196F3' : undefined,
              background: isThinkTankResponse 
                ? 'linear-gradient(45deg, #f8f9fa 30%, #e3f2fd 90%)'
                : undefined,
            }}
          >
            {/* Message Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {isThinkTankResponse && (
                <Chip
                  icon={<Groups />}
                  label="AI Think Tank"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {message.governance_metadata?.trust_score && (
                <Chip
                  label={`Trust: ${(message.governance_metadata.trust_score * 100).toFixed(0)}%`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(message.timestamp)}
              </Typography>
            </Box>

            {/* Message Content */}
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>

            {/* Think Tank Coordination Details */}
            {coordinationDetails && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Science />
                    <Typography variant="subtitle2">
                      Coordination Details
                    </Typography>
                    {coordinationDetails.consensus_score && (
                      <Chip
                        label={`Consensus: ${(coordinationDetails.consensus_score * 100).toFixed(0)}%`}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {coordinationDetails.pattern && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Coordination Pattern:
                        </Typography>
                        <Chip
                          label={coordinationDetails.pattern}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )}
                    
                    {coordinationDetails.participating_agents && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Participating AI Systems:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {coordinationDetails.participating_agents.map((agentId) => (
                            <Chip
                              key={agentId}
                              label={agentId}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {coordinationDetails.individual_responses && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Individual AI Responses:
                        </Typography>
                        {coordinationDetails.individual_responses.map((response, idx) => (
                          <Paper key={idx} sx={{ p: 1, mt: 1, bgcolor: 'background.default' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getAgentAvatar(response.agent_id)}
                              <Typography variant="caption" fontWeight="bold">
                                {response.agent_id}
                              </Typography>
                              <Chip
                                label={`Confidence: ${(response.confidence * 100).toFixed(0)}%`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <Typography variant="body2">
                              {response.content}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Governance Metadata */}
            {message.governance_metadata && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {message.governance_metadata.governance_status && (
                  <Chip
                    icon={<CheckCircle />}
                    label={message.governance_metadata.governance_status}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
                {message.governance_metadata.processing_time_ms && (
                  <Chip
                    icon={<Speed />}
                    label={`${message.governance_metadata.processing_time_ms}ms`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {thinkTankMode ? <Groups /> : <Psychology />}
          <Typography variant="h6">
            {thinkTankMode ? '🚀 AI Think Tank' : 'AI Assistant'}
          </Typography>
          {session && (
            <Chip
              label={session.session_type.replace('_', ' ').toUpperCase()}
              size="small"
              color="primary"
            />
          )}
          {governanceEnabled && (
            <Chip
              label="Governed"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          onClose={onClearError}
          sx={{ m: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {thinkTankMode 
                ? '🚀 Welcome to the AI Think Tank!'
                : 'Start a conversation with your AI assistant'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {thinkTankMode
                ? 'Experience multi-system AI collaboration with governance oversight'
                : 'Your messages are governed and monitored for compliance'
              }
            </Typography>
          </Box>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isSending && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getAgentAvatar()}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">
                    {thinkTankMode ? 'AI systems are collaborating...' : 'Thinking...'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              thinkTankMode
                ? 'Ask the AI Think Tank a complex question...'
                : 'Type your message...'
            }
            disabled={isSending}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <Send />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

