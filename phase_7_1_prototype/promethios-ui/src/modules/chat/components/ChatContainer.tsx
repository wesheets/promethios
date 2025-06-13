/**
 * Basic ChatContainer component that combines all chat functionality
 */

import React, { useState } from 'react';
import { Box, Paper, FormControlLabel, Switch, Tabs, Tab } from '@mui/material';
import { Message as MessageType, ChatMode } from '../types';
import { messageService } from '../services/MessageService';
import { governanceMonitoringService } from '../services/GovernanceMonitoringService';
import { FileUploadResult } from '../services/FileUploadService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GovernancePanel from './GovernancePanel';
import FileUploadComponents from './FileUploadComponents';

interface ChatContainerProps {
  height?: string | number;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  height = 600 
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [mode, setMode] = useState<ChatMode>('standard');
  const [showGovernance, setShowGovernance] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage = messageService.addMessage({
      content,
      sender: 'user'
    });

    // Simulate governance analysis
    const governanceStatus = Math.random() > 0.8 ? 'warning' : 'compliant';
    
    // Add bot response with governance status
    const botMessage = messageService.addMessage({
      content: `Echo: ${content}`,
      sender: 'agent',
      governanceStatus
    });

    // Update governance metrics if in governance mode
    if (mode === 'governance') {
      // Simulate metric updates
      const complianceScore = Math.floor(Math.random() * 20) + 80; // 80-100
      governanceMonitoringService.updateMetric('constitutional_compliance', complianceScore);
      
      if (governanceStatus === 'warning') {
        governanceMonitoringService.addAlert({
          type: 'warning',
          message: `Potential compliance concern detected in response`,
          agentId: 'echo-agent'
        });
      }
    }

    // Update state with all messages
    setMessages(messageService.getMessages());
  };

  const handleFileUploaded = (result: FileUploadResult) => {
    if (result.success) {
      // Add file upload message
      const fileMessage = messageService.addMessage({
        content: `📎 Uploaded: ${result.fileName} (${(result.fileSize / 1024).toFixed(1)}KB)`,
        sender: 'user'
      });

      // Add bot response about the file
      const responseContent = result.content 
        ? `I've received your file "${result.fileName}". ${result.content.length > 100 ? 'This appears to be a substantial document.' : 'I can see the content.'} How can I help you with this file?`
        : `I've received your file "${result.fileName}". How would you like me to help you with this file?`;

      const botMessage = messageService.addMessage({
        content: responseContent,
        sender: 'agent'
      });

      // Update state with all messages
      setMessages(messageService.getMessages());
    }
  };

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setShowGovernance(newMode === 'governance');
  };

  return (
    <Box>
      {/* Mode Controls */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={mode === 'governance'}
              onChange={(e) => handleModeChange(e.target.checked ? 'governance' : 'standard')}
            />
          }
          label="Governance Mode"
        />
      </Box>

      {/* Governance Panel */}
      {showGovernance && <GovernancePanel />}

      {/* Main Interface Tabs */}
      <Paper elevation={2} sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Chat" />
          <Tab label="File Upload" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper
          elevation={2}
          sx={{
            height,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <MessageList messages={messages} />
          <MessageInput onSendMessage={handleSendMessage} />
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <FileUploadComponents onFileUploaded={handleFileUploaded} />
        </Paper>
      )}
    </Box>
  );
};

export default ChatContainer;

