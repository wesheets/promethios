/**
 * MentionInput - Enhanced input field with @mention support for shared conversations
 * Provides natural typing-based participant addressing alongside visual avatar selection
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Chip
} from '@mui/material';

export interface MentionParticipant {
  id: string;
  name: string;
  type: 'human' | 'ai';
  avatar?: string;
  displayName?: string; // For @mention display (e.g., "ted", "claude")
}

export interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, mentionedParticipants: string[]) => void;
  participants: MentionParticipant[];
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxRows?: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSend,
  participants,
  placeholder = "Type your message...",
  disabled = false,
  multiline = false,
  maxRows = 4
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect @mention typing
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const cursorPos = event.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);
    
    // Check for @mention at cursor position
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      // Found @mention being typed
      setMentionStart(cursorPos - mentionMatch[0].length);
      setSuggestionFilter(mentionMatch[1].toLowerCase());
      setShowSuggestions(true);
    } else {
      // No @mention at cursor
      setShowSuggestions(false);
      setMentionStart(-1);
      setSuggestionFilter('');
    }
  };

  // Filter participants based on typing
  const filteredParticipants = participants.filter(participant => {
    const searchName = (participant.displayName || participant.name).toLowerCase();
    return searchName.includes(suggestionFilter);
  });

  // Handle participant selection from dropdown
  const handleParticipantSelect = (participant: MentionParticipant) => {
    if (mentionStart === -1) return;
    
    const mentionText = `@${participant.displayName || participant.name.toLowerCase()}`;
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(cursorPosition);
    const newValue = beforeMention + mentionText + ' ' + afterMention;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    
    // Focus back to input and set cursor after mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionStart + mentionText.length + 1;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Parse @mentions from message
  const parseMentions = (message: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionName = match[1].toLowerCase();
      const participant = participants.find(p => 
        (p.displayName || p.name.toLowerCase()) === mentionName
      );
      if (participant) {
        mentions.push(participant.id);
      }
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  };

  // Handle send message
  const handleSend = () => {
    if (!value.trim()) return;
    
    const mentionedParticipants = parseMentions(value);
    onSend(value.trim(), mentionedParticipants);
    onChange('');
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !multiline) {
      event.preventDefault();
      handleSend();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get mentioned participants for display
  const getMentionedParticipants = (): MentionParticipant[] => {
    const mentionedIds = parseMentions(value);
    return participants.filter(p => mentionedIds.includes(p.id));
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Show mentioned participants */}
      {getMentionedParticipants().length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {getMentionedParticipants().map(participant => (
            <Chip
              key={participant.id}
              size="small"
              avatar={
                <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                  {participant.name.charAt(0).toUpperCase()}
                </Avatar>
              }
              label={`@${participant.displayName || participant.name.toLowerCase()}`}
              sx={{
                bgcolor: participant.type === 'human' ? '#3b82f6' : '#8b5cf6',
                color: 'white',
                '& .MuiChip-avatar': {
                  color: 'white'
                }
              }}
            />
          ))}
        </Box>
      )}

      {/* Input field */}
      <TextField
        ref={inputRef}
        fullWidth
        multiline={multiline}
        maxRows={maxRows}
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: '#1e293b',
            color: '#ffffff',
            '& fieldset': {
              borderColor: '#374151'
            },
            '&:hover fieldset': {
              borderColor: '#4b5563'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6'
            }
          },
          '& .MuiInputBase-input': {
            color: '#ffffff'
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#9ca3af',
            opacity: 1
          }
        }}
      />

      {/* @mention suggestions dropdown */}
      {showSuggestions && filteredParticipants.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 200,
            overflow: 'auto',
            bgcolor: '#1e293b',
            border: '1px solid #374151',
            mt: 0.5
          }}
        >
          <List dense>
            {filteredParticipants.map(participant => (
              <ListItem
                key={participant.id}
                button
                onClick={() => handleParticipantSelect(participant)}
                sx={{
                  '&:hover': {
                    bgcolor: '#374151'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: participant.type === 'human' ? '#3b82f6' : '#8b5cf6',
                      fontSize: '0.8rem'
                    }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.name}
                  secondary={`@${participant.displayName || participant.name.toLowerCase()}`}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    },
                    '& .MuiListItemText-secondary': {
                      color: '#9ca3af',
                      fontSize: '0.8rem'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default MentionInput;

