/**
 * Enhanced Chat Interface with Real-Time Governance
 * 
 * Adds real-time trust scores, governance badges, and
 * comparison mode for single agents based on multi-agent learnings.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Badge,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Security,
  Shield,
  CheckCircle,
  Warning,
  Info,
  CompareArrows,
  Assessment,
  Visibility,
  Download
} from '@mui/icons-material';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  governance_data?: {
    trust_score: number;
    compliant: boolean;
    policy_checks: string[];
    seal_reference: string;
    response_time: number;
    compliance_score: number;
  };
}

interface EnhancedChatInterfaceProps {
  agentName: string;
  agentId: string;
  governanceEnabled: boolean;
  trustThreshold: number;
  complianceLevel: string;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  agentName,
  agentId,
  governanceEnabled,
  trustThreshold,
  complianceLevel
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [governanceToggle, setGovernanceToggle] = useState(governanceEnabled);
  const [showGovernanceDetails, setShowGovernanceDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAgentResponse = async (userMessage: string, withGovernance: boolean): Promise<Message> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const baseResponse = `Based on your request about "${userMessage.substring(0, 30)}...", I recommend implementing a comprehensive approach that considers multiple factors and stakeholder perspectives.`;

    const governanceData = withGovernance ? {
      trust_score: 0.75 + Math.random() * 0.2, // Random score between 0.75-0.95
      compliant: Math.random() > 0.1, // 90% compliance rate
      policy_checks: ['Content Policy', 'Trust Verification', 'Quality Assurance'],
      seal_reference: `seal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      response_time: 1.8 + Math.random() * 0.8, // 1.8-2.6 seconds
      compliance_score: 0.85 + Math.random() * 0.1 // 0.85-0.95
    } : undefined;

    return {
      id: `msg_${Date.now()}_${Math.random()}`,
      content: withGovernance ? `[GOVERNED] ${baseResponse}` : `[UNGOVERNED] ${baseResponse}`,
      sender: 'agent',
      timestamp: new Date(),
      governance_data: governanceData
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (showComparison) {
        // Send both governed and ungoverned responses
        const [governedResponse, ungovernedResponse] = await Promise.all([
          simulateAgentResponse(inputValue, true),
          simulateAgentResponse(inputValue, false)
        ]);

        setMessages(prev => [...prev, governedResponse, ungovernedResponse]);
      } else {
        // Send single response based on governance toggle
        const response = await simulateAgentResponse(inputValue, governanceToggle);
        setMessages(prev => [...prev, response]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const downloadGovernanceReport = () => {
    const governedMessages = messages.filter(m => m.governance_data);
    const report = {
      agent_name: agentName,
      agent_id: agentId,
      report_generated: new Date().toISOString(),
      governance_summary: {
        total_messages: governedMessages.length,
        average_trust_score: governedMessages.reduce((sum, m) => sum + (m.governance_data?.trust_score || 0), 0) / governedMessages.length,
        compliance_rate: governedMessages.filter(m => m.governance_data?.compliant).length / governedMessages.length,
        average_response_time: governedMessages.reduce((sum, m) => sum + (m.governance_data?.response_time || 0), 0) / governedMessages.length
      },
      messages: governedMessages.map(m => ({
        timestamp: m.timestamp,
        content: m.content,
        governance_data: m.governance_data
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance_report_${agentName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getGovernanceStats = () => {
    const governedMessages = messages.filter(m => m.governance_data);
    if (governedMessages.length === 0) return null;

    return {
      averageTrustScore: governedMessages.reduce((sum, m) => sum + (m.governance_data?.trust_score || 0), 0) / governedMessages.length,
      complianceRate: governedMessages.filter(m => m.governance_data?.compliant).length / governedMessages.length,
      totalMessages: governedMessages.length,
      averageResponseTime: governedMessages.reduce((sum, m) => sum + (m.governance_data?.response_time || 0), 0) / governedMessages.length
    };
  };

  const governanceStats = getGovernanceStats();

  return (
    <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Governance Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6">{agentName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {governanceToggle ? 'Governance Enabled' : 'Governance Disabled'}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={governanceToggle}
                  onChange={(e) => setGovernanceToggle(e.target.checked)}
                  color="primary"
                />
              }
              label="Governance"
            />
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<CompareArrows />}
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? 'Single Mode' : 'Compare Mode'}
            </Button>

            {governanceStats && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
                onClick={downloadGovernanceReport}
              >
                Export Report
              </Button>
            )}
          </Box>
        </Box>

        {/* Governance Stats */}
        {governanceStats && (
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {Math.round(governanceStats.averageTrustScore * 100)}%
                  </Typography>
                  <Typography variant="caption">Avg Trust Score</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {Math.round(governanceStats.complianceRate * 100)}%
                  </Typography>
                  <Typography variant="caption">Compliance Rate</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="info.main">
                    {governanceStats.totalMessages}
                  </Typography>
                  <Typography variant="caption">Governed Messages</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="warning.main">
                    {governanceStats.averageResponseTime.toFixed(1)}s
                  </Typography>
                  <Typography variant="caption">Avg Response Time</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Messages Area */}
      <Paper sx={{ flex: 1, p: 2, overflow: 'auto', mb: 2 }}>
        {messages.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              Start a conversation to see governance in action
            </Typography>
            {showComparison && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Comparison mode: Each message will show both governed and ungoverned responses
              </Alert>
            )}
          </Box>
        )}

        {messages.map((message) => (
          <Box key={message.id} mb={2}>
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Avatar sx={{ bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main' }}>
                {message.sender === 'user' ? <Person /> : <SmartToy />}
              </Avatar>
              
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="subtitle2">
                    {message.sender === 'user' ? 'You' : agentName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>

                <Paper sx={{ p: 2, bgcolor: message.sender === 'user' ? 'grey.100' : 'primary.50' }}>
                  <Typography variant="body1">{message.content}</Typography>
                  
                  {/* Governance Data */}
                  {message.governance_data && (
                    <Box mt={2}>
                      <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                        <Chip
                          label={`Trust: ${Math.round(message.governance_data.trust_score * 100)}%`}
                          size="small"
                          color="primary"
                          icon={<Shield />}
                        />
                        <Chip
                          label={message.governance_data.compliant ? 'Compliant' : 'Non-Compliant'}
                          size="small"
                          color={message.governance_data.compliant ? 'success' : 'error'}
                          icon={message.governance_data.compliant ? <CheckCircle /> : <Warning />}
                        />
                        <Chip
                          label={`${message.governance_data.response_time.toFixed(1)}s`}
                          size="small"
                          color="info"
                        />
                        <Tooltip title={`Seal: ${message.governance_data.seal_reference}`}>
                          <Chip
                            label="Verified"
                            size="small"
                            color="secondary"
                            icon={<Security />}
                          />
                        </Tooltip>
                      </Box>

                      {/* Trust Score Progress */}
                      <Box mt={1}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption">Trust Score</Typography>
                          <Typography variant="caption">
                            {Math.round(message.governance_data.trust_score * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={message.governance_data.trust_score * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#E5E7EB',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: message.governance_data.trust_score >= trustThreshold ? '#10B981' : '#F59E0B',
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          </Box>
        ))}

        {isLoading && (
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {agentName} is thinking...
              </Typography>
              <LinearProgress sx={{ width: 200, mt: 1 }} />
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Input Area */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            sx={{ minWidth: 'auto', px: 3 }}
          >
            <Send />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EnhancedChatInterface;

