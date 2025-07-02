import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Fade,
  Slide,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Minimize as MinimizeIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { sendObserverMessage } from '../api/observerChat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'observer';
  timestamp: Date;
  type?: 'info' | 'warning' | 'success' | 'suggestion';
}

interface EnhancedObserverAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  dashboardData?: any;
  currentContext?: string;
}

const EnhancedObserverAgent: React.FC<EnhancedObserverAgentProps> = ({
  isOpen,
  onClose,
  onMinimize,
  dashboardData,
  currentContext = 'dashboard'
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Hello! I'm your Promethios Governance Assistant. I have comprehensive knowledge about all Promethios features, governance frameworks, AI safety protocols, and can help you with anything related to your AI governance journey. What would you like to know?`,
        sender: 'observer',
        timestamp: new Date(),
        type: 'info'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    try {
      const response = await sendObserverMessage({
        message: inputValue,
        context: currentContext,
        systemPrompt: getEnhancedSystemPrompt(),
        dashboardData
      });

      const observerMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'observer',
        timestamp: new Date(),
        type: 'info'
      };

      setMessages(prev => [...prev, observerMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'observer',
        timestamp: new Date(),
        type: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const getEnhancedSystemPrompt = () => {
    return `You are the Promethios Observer Agent, an expert AI governance assistant with comprehensive knowledge of the Promethios platform.

CURRENT USER CONTEXT:
- Page: ${currentContext}
- Trust Score: ${dashboardData?.trustScore || 'N/A'}
- Governance Score: ${dashboardData?.governanceScore || 'N/A'}
- Active Violations: ${dashboardData?.violations || '0'}
- User: ${currentUser?.email || 'Anonymous'}

PROMETHIOS KNOWLEDGE BASE:
You have complete knowledge of all Promethios features including:

CORE SYSTEMS:
- PRISM: Real-time monitoring and risk assessment system
- Vigil: Trust boundary management and relationship monitoring
- Veritas: Truth verification and hallucination detection
- Atlas: Comprehensive agent management and deployment

GOVERNANCE FEATURES:
- Policy Management: Create, update, and enforce governance policies
- Compliance Monitoring: Real-time compliance tracking and reporting
- Trust Metrics: Multi-dimensional trust scoring (Competence, Reliability, Honesty, Transparency)
- Violation Management: Detection, reporting, and resolution of policy violations
- Audit Trails: Complete logging and tracking of all governance activities

AGENT MANAGEMENT:
- Agent Deployment: Deploy and manage AI agents with governance oversight
- Agent Monitoring: Real-time performance and compliance monitoring
- Agent Relationships: Manage trust boundaries and agent interactions
- Agent Policies: Apply and enforce policies at the agent level

TRUST & SAFETY:
- Trust Boundaries: Define and manage trust relationships
- Risk Assessment: Continuous risk evaluation and mitigation
- Safety Protocols: Implement and monitor AI safety measures
- Transparency Controls: Ensure transparency in AI decision-making

SETTINGS & CONFIGURATION:
- Organization Settings: Manage organization-wide governance settings
- User Preferences: Customize notification and interface preferences
- Integration Settings: Configure external system integrations
- Data Management: Control data retention and privacy settings

REPORTING & ANALYTICS:
- Governance Reports: Generate comprehensive governance reports
- Trust Analytics: Analyze trust metrics and trends
- Compliance Reports: Track compliance status and improvements
- Performance Metrics: Monitor system and agent performance

INSTRUCTIONS:
- Provide thoughtful, detailed responses about any Promethios feature
- Use real data from the user's dashboard when available
- Offer specific, actionable guidance
- Explain complex governance concepts clearly
- Suggest relevant features and workflows
- Be proactive in identifying improvement opportunities
- Reference specific Promethios systems and features by name
- Provide step-by-step guidance when appropriate

Respond as a knowledgeable expert who understands both the technical and governance aspects of the platform.`;
  };

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
    onMinimize();
  };

  const getQuickSuggestions = () => {
    const suggestions = [];
    
    if (dashboardData?.violations && parseInt(dashboardData.violations) > 0) {
      suggestions.push({
        text: `Help me resolve ${dashboardData.violations} policy violations`,
        icon: <WarningIcon />,
        color: '#f59e0b'
      });
    }
    
    if (dashboardData?.trustScore && parseInt(dashboardData.trustScore) < 85) {
      suggestions.push({
        text: `How can I improve my trust score from ${dashboardData.trustScore}?`,
        icon: <TrendingUpIcon />,
        color: '#10b981'
      });
    }
    
    suggestions.push(
      {
        text: 'Explain Promethios governance frameworks',
        icon: <SecurityIcon />,
        color: '#3b82f6'
      },
      {
        text: 'How do PRISM, Vigil, and Veritas work together?',
        icon: <PsychologyIcon />,
        color: '#8b5cf6'
      },
      {
        text: 'Best practices for AI safety and compliance',
        icon: <CheckCircleIcon />,
        color: '#06b6d4'
      }
    );
    
    return suggestions;
  };

  if (!isOpen) return null;

  return (
    <Slide direction="left" in={isOpen} mountOnEnter unmountOnExit>
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          top: 80,
          right: 20,
          width: isMinimized ? 350 : 600,
          height: isMinimized ? 400 : 700,
          zIndex: 1300,
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          transition: 'all 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(90deg, #0ea5e9 0%, #3b82f6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: 'linear-gradient(45deg, #22c55e, #10b981)',
                animation: 'pulse 2s infinite'
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Promethios Observer
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                AI Governance Assistant
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isMinimized ? "Expand" : "Minimize"}>
              <IconButton
                onClick={handleMinimizeToggle}
                sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              >
                <MinimizeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton
                onClick={onClose}
                sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Status Bar */}
        <Box
          sx={{
            px: 2,
            py: 1,
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Chip
            icon={<CheckCircleIcon />}
            label="Governed by Promethios"
            size="small"
            sx={{
              backgroundColor: '#22c55e',
              color: 'white',
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Context: {currentContext} | Trust: {dashboardData?.trustScore || 'N/A'}
          </Typography>
        </Box>

        {/* Quick Suggestions */}
        {!isMinimized && (
          <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
            <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1, fontSize: '0.85rem' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getQuickSuggestions().slice(0, 3).map((suggestion, index) => (
                <Chip
                  key={index}
                  icon={suggestion.icon}
                  label={suggestion.text}
                  size="small"
                  clickable
                  onClick={() => setInputValue(suggestion.text)}
                  sx={{
                    backgroundColor: suggestion.color,
                    color: 'white',
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': { color: 'white' },
                    '&:hover': { opacity: 0.8 }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  backgroundColor: message.sender === 'user' ? '#3b82f6' : '#374151',
                  color: 'white',
                  borderRadius: message.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  {message.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                    fontSize: '0.7rem'
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}
          
          {isThinking && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
              <CircularProgress size={16} sx={{ color: '#3b82f6' }} />
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                Observer is thinking...
              </Typography>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #334155',
            backgroundColor: '#1e293b'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about governance, trust metrics, or any Promethios feature..."
              variant="outlined"
              size="small"
              disabled={isThinking}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f172a',
                  color: 'white',
                  '& fieldset': { borderColor: '#475569' },
                  '&:hover fieldset': { borderColor: '#64748b' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#94a3b8',
                  opacity: 1
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isThinking}
              sx={{
                backgroundColor: '#3b82f6',
                color: 'white',
                '&:hover': { backgroundColor: '#2563eb' },
                '&:disabled': { backgroundColor: '#374151', color: '#6b7280' }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

export default EnhancedObserverAgent;

