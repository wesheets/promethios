/**
 * MultiAgentMentionInput - Enhanced text input with @mention autocomplete for multi-agent collaboration
 * Part of the revolutionary multi-agent collaboration system
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextField,
  Paper,
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress
} from '@mui/material';
import { MessageParser } from '../utils/MessageParser';
import { MultiAgentRoutingService } from '../services/MultiAgentRoutingService';

export interface MentionSuggestion {
  id: string;
  name: string;
  suggestion: string;
  avatar?: string;
  type: 'agent' | 'special';
}

export interface MultiAgentMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, mentions: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxRows?: number;
  hostAgentId: string;
  guestAgents: Array<{
    agentId: string;
    name: string;
    avatar?: string;
    addedAt: Date;
  }>;
  userId: string;
  conversationId: string;
  sx?: any;
}

export const MultiAgentMentionInput: React.FC<MultiAgentMentionInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Type your message... Use @agent-name to mention specific agents",
  disabled = false,
  multiline = true,
  maxRows = 4,
  hostAgentId,
  guestAgents,
  userId,
  conversationId,
  sx = {}
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [currentMention, setCurrentMention] = useState<string>('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [busyAgents, setBusyAgents] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const messageParser = MessageParser.getInstance();
  const routingService = MultiAgentRoutingService.getInstance();

  // Update busy agents periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBusyAgents(routingService.getBusyAgents());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle input changes and detect @mentions
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);

    const cursorPosition = inputRef.current?.selectionStart || newValue.length;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're in the middle of a mention (no spaces after @)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setCurrentMention(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        loadMentionSuggestions(textAfterAt);
      } else {
        hideSuggestions();
      }
    } else {
      hideSuggestions();
    }
  }, [onChange]);

  // Load mention suggestions
  const loadMentionSuggestions = useCallback(async (partialMention: string) => {
    setIsLoadingSuggestions(true);
    
    try {
      const context = {
        hostAgentId,
        guestAgents,
        userId,
        conversationId
      };

      const rawSuggestions = await routingService.generateMentionSuggestions(partialMention, context);
      
      // Convert to MentionSuggestion format
      const formattedSuggestions: MentionSuggestion[] = rawSuggestions.map(s => ({
        id: s.id,
        name: s.name,
        suggestion: s.suggestion,
        type: s.id === 'all' || s.id === 'everyone' ? 'special' : 'agent'
      }));

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('❌ [MentionInput] Error loading suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [hostAgentId, guestAgents, userId, conversationId]);

  // Hide suggestions
  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setCurrentMention('');
    setMentionStartIndex(-1);
  }, []);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: MentionSuggestion) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(mentionStartIndex + currentMention.length + 1);
    const newValue = beforeMention + suggestion.suggestion + ' ' + afterMention;
    
    onChange(newValue);
    hideSuggestions();

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPosition = beforeMention.length + suggestion.suggestion.length + 1;
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  }, [value, mentionStartIndex, currentMention, onChange, hideSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Tab':
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        hideSuggestions();
        break;
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, selectSuggestion, hideSuggestions]);

  // Handle sending message
  const handleSend = useCallback(() => {
    if (!value.trim() || disabled) return;

    // Parse mentions from the message
    const availableAgents = [
      { id: hostAgentId, name: 'Host Agent' },
      ...guestAgents.map(g => ({ id: g.agentId, name: g.name }))
    ];
    
    const parsedMessage = messageParser.parseMessage(value, availableAgents);
    const mentionedAgentIds = messageParser.getTargetAgentIds(parsedMessage, availableAgents);

    onSend(value, mentionedAgentIds);
    hideSuggestions();
  }, [value, disabled, hostAgentId, guestAgents, onSend, hideSuggestions]);

  // Get agent status indicator
  const getAgentStatusIndicator = (agentId: string) => {
    if (busyAgents.includes(agentId)) {
      return <CircularProgress size={12} sx={{ ml: 1 }} />;
    }
    return null;
  };

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TextField
        ref={inputRef}
        fullWidth
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay hiding suggestions to allow clicking
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        variant="outlined"
        disabled={disabled}
        multiline={multiline}
        maxRows={maxRows}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: '#0f172a',
            color: 'white',
            '& fieldset': { 
              borderColor: '#334155',
              borderWidth: 1
            },
            '&:hover fieldset': { borderColor: '#3b82f6' },
            '&.Mui-focused fieldset': { 
              borderColor: '#3b82f6',
              borderWidth: 2
            },
            '& input::placeholder': {
              color: '#9ca3af',
              opacity: 1
            },
            '& textarea::placeholder': {
              color: '#9ca3af',
              opacity: 1
            }
          }
        }}
      />

      {/* @Mention Suggestions Dropdown */}
      {showSuggestions && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            bgcolor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 1,
            mt: 0.5,
            maxHeight: 300,
            overflow: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}
        >
          {isLoadingSuggestions ? (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Loading suggestions...
              </Typography>
            </Box>
          ) : (
            suggestions.map((suggestion, index) => (
              <Box
                key={suggestion.id}
                onClick={() => selectSuggestion(suggestion)}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  bgcolor: selectedSuggestionIndex === index ? '#374151' : 'transparent',
                  '&:hover': { bgcolor: '#374151' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderBottom: index < suggestions.length - 1 ? '1px solid #334155' : 'none'
                }}
              >
                {/* Agent Avatar or Icon */}
                <Avatar
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: suggestion.type === 'special' ? '#3b82f6' : '#10b981',
                    fontSize: '0.75rem'
                  }}
                >
                  {suggestion.type === 'special' ? 
                    (suggestion.id === 'all' ? '👥' : '🌟') : 
                    suggestion.name.charAt(0)
                  }
                </Avatar>

                {/* Agent Name and Suggestion */}
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'white',
                      fontWeight: selectedSuggestionIndex === index ? 600 : 400
                    }}
                  >
                    {suggestion.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#94a3b8',
                      fontFamily: 'monospace'
                    }}
                  >
                    {suggestion.suggestion}
                  </Typography>
                </Box>

                {/* Status Indicator */}
                {suggestion.type === 'agent' && getAgentStatusIndicator(suggestion.id)}

                {/* Special Badge */}
                {suggestion.type === 'special' && (
                  <Chip
                    label="ALL"
                    size="small"
                    sx={{
                      bgcolor: '#3b82f6',
                      color: 'white',
                      fontSize: '0.6rem',
                      height: 20
                    }}
                  />
                )}
              </Box>
            ))
          )}

          {/* Help Text */}
          <Box sx={{ p: 1.5, borderTop: '1px solid #334155', bgcolor: '#0f172a' }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              💡 Use @agent-name to mention specific agents, or @all to address everyone
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MultiAgentMentionInput;

