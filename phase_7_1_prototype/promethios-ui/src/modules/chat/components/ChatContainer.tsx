/**
 * Basic ChatContainer component that combines all chat functionality
 */

import React, { useState } from 'react';
import { Box, Paper, FormControlLabel, Switch, Tabs, Tab } from '@mui/material';
import { Message as MessageType, ChatMode, Agent, AdHocMultiAgentConfig } from '../types';
import { messageService } from '../services/MessageService';
import { governanceMonitoringService } from '../services/GovernanceMonitoringService';
import { FileUploadResult } from '../services/FileUploadService';
import { adHocMultiAgentService, MultiAgentConversation } from '../services/AdHocMultiAgentService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EnhancedMessageInput from './EnhancedMessageInput';
import GovernancePanel from './GovernancePanel';
import FileUploadComponents from './FileUploadComponents';
import AgentSelector from './AgentSelector';

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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [multiAgentConfig, setMultiAgentConfig] = useState<AdHocMultiAgentConfig | null>(null);
  const [useEnhancedInput, setUseEnhancedInput] = useState(true);

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    // Add user message with attachments
    const userMessage = messageService.addMessage({
      content,
      sender: 'user'
    });

    // Handle attachments if present
    if (attachments && attachments.length > 0) {
      const attachmentInfo = attachments.map(att => {
        if (att.type === 'image') {
          return `📷 ${att.name}`;
        }
        return `📎 ${att.name}`;
      }).join(', ');
      
      // Add attachment info to message
      const attachmentMessage = messageService.addMessage({
        content: `Attachments: ${attachmentInfo}`,
        sender: 'system'
      });
    }

    // Handle different modes
    if (mode === 'multi-agent' && (selectedAgent || multiAgentConfig)) {
      await handleMultiAgentMessage(content);
    } else {
      await handleStandardMessage(content);
    }

    // Update state with all messages
    setMessages(messageService.getMessages());
  };

  const handleStandardMessage = async (content: string) => {
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
  };

  const handleMultiAgentMessage = async (content: string) => {
    if (selectedAgent) {
      // Single agent response
      const agentMessage = messageService.addMessage({
        content: `${selectedAgent.name}: Based on my expertise in ${selectedAgent.description.toLowerCase()}, I would say: ${content} - this is an interesting perspective that requires careful consideration.`,
        sender: 'agent',
        agentId: selectedAgent.id
      });
    } else if (multiAgentConfig) {
      // Multi-agent conversation
      try {
        const conversation = await adHocMultiAgentService.startMultiAgentConversation(
          content,
          multiAgentConfig
        );

        // Add each agent response as a separate message
        conversation.responses.forEach((response, index) => {
          setTimeout(() => {
            const agentMessage = messageService.addMessage({
              content: `${response.agentName}: ${response.content}`,
              sender: 'agent',
              agentId: response.agentId
            });
            setMessages(messageService.getMessages());
          }, index * 1000); // Stagger responses by 1 second
        });
      } catch (error) {
        const errorMessage = messageService.addMessage({
          content: 'Error: Failed to coordinate multi-agent response. Please try again.',
          sender: 'system'
        });
      }
    }
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
    
    // Reset agent selections when changing modes
    if (newMode !== 'multi-agent') {
      setSelectedAgent(null);
      setMultiAgentConfig(null);
    }
  };

  return (
    <Box>
      {/* Mode Controls */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={mode === 'governance'}
              onChange={(e) => handleModeChange(e.target.checked ? 'governance' : 'standard')}
            />
          }
          label="Governance Mode"
        />
        <FormControlLabel
          control={
            <Switch
              checked={mode === 'multi-agent'}
              onChange={(e) => handleModeChange(e.target.checked ? 'multi-agent' : 'standard')}
            />
          }
          label="Multi-Agent Mode"
        />
        <FormControlLabel
          control={
            <Switch
              checked={useEnhancedInput}
              onChange={(e) => setUseEnhancedInput(e.target.checked)}
            />
          }
          label="Enhanced Input (Copy/Paste)"
        />
      </Box>

      {/* Governance Panel */}
      {showGovernance && <GovernancePanel />}

      {/* Agent Selector */}
      <AgentSelector
        mode={mode}
        onAgentSelected={setSelectedAgent}
        onMultiAgentConfigured={setMultiAgentConfig}
      />

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
          {useEnhancedInput ? (
            <EnhancedMessageInput onSendMessage={handleSendMessage} />
          ) : (
            <MessageInput onSendMessage={(content) => handleSendMessage(content)} />
          )}
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

