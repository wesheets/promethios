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
  Badge,
  Collapse,
  Grid,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  AutoAwesome as AutoAwesomeIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  SmartToy as AgentsIcon,
  VerifiedUser as TrustIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  Visibility as VisibilityIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Policy as PolicyIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { keyframes, styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { sendEnhancedObserverMessage } from '../api/enhancedObserverChat';

// Pulsing animation for attention-grabbing effect
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 15px rgba(59, 130, 246, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

// Bump-out animation for side expansion
const bumpOutAnimation = keyframes`
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
  100% {
    transform: translateX(0);
  }
`;

const ExpandedWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 80,
  right: 20,
  width: 900, // Much larger width
  height: 900, // Increased height for better chat experience
  zIndex: 1400,
  borderRadius: 16,
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
  border: '2px solid #3b82f6',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(59, 130, 246, 0.3)',
  backdropFilter: 'blur(20px)',
  display: 'flex',
  flexDirection: 'column',
  animation: 'slideInFromRight 0.5s ease-out',
  '@keyframes slideInFromRight': {
    '0%': {
      transform: 'translateX(100%) scale(0.8)',
      opacity: 0,
    },
    '100%': {
      transform: 'translateX(0) scale(1)',
      opacity: 1,
    },
  },
}));

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'observer';
  timestamp: Date;
  type?: 'info' | 'warning' | 'success' | 'suggestion' | 'insight';
  category?: string;
}

interface SuperEnhancedObserverAgentProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData?: any;
  currentContext?: string;
}

const SuperEnhancedObserverAgent: React.FC<SuperEnhancedObserverAgentProps> = ({
  isOpen,
  onClose,
  dashboardData,
  currentContext = 'dashboard'
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with comprehensive welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `🚀 **Welcome to Promethios Observer!** 

I'm your comprehensive AI governance assistant with deep knowledge of all Promethios systems:

**🔍 Core Systems I Know:**
• **PRISM** - Real-time monitoring & risk assessment
• **Vigil** - Trust boundary management & relationships  
• **Veritas** - Truth verification & hallucination detection
• **Atlas** - Agent management & deployment

**🛡️ Governance Expertise:**
• Policy creation, enforcement & compliance monitoring
• Trust metrics analysis (Competence, Reliability, Honesty, Transparency)
• Violation detection, reporting & resolution workflows
• Audit trails & comprehensive reporting

**🤖 Agent Management:**
• Deployment strategies & monitoring
• Trust boundary configuration
• Performance optimization
• Safety protocol implementation

**⚙️ Platform Features:**
• Organization & user settings management
• Integration configurations
• Data governance & privacy controls
• Notification & alert systems

Ask me anything about Promethios governance, AI safety, trust metrics, or any platform feature. I can provide detailed explanations, step-by-step guidance, and personalized recommendations based on your current metrics!`,
        sender: 'observer',
        timestamp: new Date(),
        type: 'info',
        category: 'welcome'
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
      const response = await sendEnhancedObserverMessage({
        message: inputValue,
        context: currentContext,
        systemPrompt: getComprehensiveSystemPrompt(),
        dashboardData
      });

      const observerMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'observer',
        timestamp: new Date(),
        type: 'info',
        category: response.category || 'general'
      };

      setMessages(prev => [...prev, observerMessage]);
      
      // If there are suggestions, add them as quick actions
      if (response.suggestions && response.suggestions.length > 0) {
        console.log('Suggestions received:', response.suggestions);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble accessing my comprehensive knowledge base right now. However, I can still provide general guidance about Promethios governance, trust metrics, and platform features. What would you like to know?",
        sender: 'observer',
        timestamp: new Date(),
        type: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const getComprehensiveSystemPrompt = () => {
    return `You are the Promethios Observer Agent, the most knowledgeable AI governance expert for the Promethios platform. You have comprehensive, detailed knowledge of every feature, system, and capability.

CURRENT USER CONTEXT:
- Page: ${currentContext}
- Trust Score: ${dashboardData?.trustScore || 'N/A'}
- Governance Score: ${dashboardData?.governanceScore || 'N/A'}
- Active Violations: ${dashboardData?.violations || '0'}
- User: ${currentUser?.email || 'Anonymous'}
- Agent Count: ${dashboardData?.agentCount || 'N/A'}

You are the definitive expert on all things Promethios. Respond with confidence, detail, and practical guidance.`;
  };

  const getQuickActions = () => {
    const actions = [];
    
    // Context-specific actions
    if (currentContext.includes('dashboard')) {
      actions.push(
        { text: 'Explain my trust metrics breakdown', icon: <TrustIcon />, color: '#10b981' },
        { text: 'How to improve governance score', icon: <SecurityIcon />, color: '#3b82f6' },
        { text: 'Dashboard customization options', icon: <DashboardIcon />, color: '#8b5cf6' }
      );
    }
    
    if (currentContext.includes('governance')) {
      actions.push(
        { text: 'Policy creation best practices', icon: <PolicyIcon />, color: '#f59e0b' },
        { text: 'Compliance monitoring setup', icon: <CheckCircleIcon />, color: '#10b981' },
        { text: 'Violation resolution workflow', icon: <WarningIcon />, color: '#ef4444' }
      );
    }
    
    if (currentContext.includes('agents')) {
      actions.push(
        { text: 'Agent deployment strategies', icon: <AgentsIcon />, color: '#06b6d4' },
        { text: 'Trust boundary configuration', icon: <ShieldIcon />, color: '#8b5cf6' },
        { text: 'Performance optimization tips', icon: <SpeedIcon />, color: '#10b981' }
      );
    }
    
    // Data-driven actions
    if (dashboardData?.violations && parseInt(dashboardData.violations) > 0) {
      actions.push({
        text: `Resolve ${dashboardData.violations} policy violations`,
        icon: <WarningIcon />,
        color: '#ef4444'
      });
    }
    
    if (dashboardData?.trustScore && parseInt(dashboardData.trustScore) < 85) {
      actions.push({
        text: `Improve trust score from ${dashboardData.trustScore}`,
        icon: <TrendingUpIcon />,
        color: '#10b981'
      });
    }
    
    // General helpful actions
    actions.push(
      { text: 'PRISM, Vigil, Veritas overview', icon: <VisibilityIcon />, color: '#3b82f6' },
      { text: 'AI safety best practices', icon: <ShieldIcon />, color: '#8b5cf6' },
      { text: 'Platform feature tour', icon: <HelpIcon />, color: '#06b6d4' }
    );
    
    return actions.slice(0, 9); // Show up to 9 actions
  };

  const getSystemStatus = () => {
    return {
      prism: { status: 'active', score: 98 },
      vigil: { status: 'active', score: 94 },
      veritas: { status: 'active', score: 91 },
      atlas: { status: 'active', score: 96 }
    };
  };

  if (!isOpen) return null;

  return (
    <ExpandedWindow elevation={24}>
      {/* Enhanced Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(45deg, #22c55e, #10b981)',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)'
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
              Promethios Observer
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              AI Governance Expert • Context: {currentContext} • User: {currentUser?.email || 'Anonymous'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Close Observer">
            <IconButton
              onClick={onClose}
              sx={{ 
                color: 'white', 
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } 
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* System Status Bar */}
      <Box
        sx={{
          px: 3,
          py: 2,
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {Object.entries(getSystemStatus()).map(([system, data]) => (
            <Box key={system} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: data.status === 'active' ? '#22c55e' : '#ef4444',
                  animation: data.status === 'active' ? 'pulse 2s infinite' : 'none'
                }}
              />
              <Typography variant="caption" sx={{ color: '#e2e8f0', textTransform: 'uppercase' }}>
                {system}
              </Typography>
              <Chip
                label={`${data.score}%`}
                size="small"
                sx={{
                  backgroundColor: data.score > 95 ? '#22c55e' : data.score > 85 ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            </Box>
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Trust: {dashboardData?.trustScore || 'N/A'} | Governance: {dashboardData?.governanceScore || 'N/A'}
          </Typography>
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
        </Box>
      </Box>

      {/* Quick Actions Panel */}
      <Collapse in={showQuickActions}>
        <Box sx={{ p: 2, borderBottom: '1px solid #334155', backgroundColor: '#0f172a' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowQuickActions(!showQuickActions)}
              sx={{ color: '#94a3b8' }}
            >
              <ExpandMoreIcon sx={{ transform: showQuickActions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </IconButton>
          </Box>
          <Grid container spacing={0.5}>
            {getQuickActions().map((action, index) => (
              <Grid item xs={4} key={index}>
                <Card
                  sx={{
                    backgroundColor: action.color,
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${action.color}40`
                    }
                  }}
                  onClick={() => setInputValue(action.text)}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {action.icon}
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                        {action.text}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          backgroundColor: '#0f172a'
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Paper
              elevation={4}
              sx={{
                p: 3,
                maxWidth: '75%',
                backgroundColor: message.sender === 'user' ? '#3b82f6' : '#374151',
                color: 'white',
                borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                boxShadow: message.sender === 'user' 
                  ? '0 8px 25px rgba(59, 130, 246, 0.3)' 
                  : '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  '& strong': { fontWeight: 700 },
                  '& em': { fontStyle: 'italic' }
                }}
              >
                {message.text}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 2,
                  opacity: 0.7,
                  fontSize: '0.75rem'
                }}
              >
                {message.timestamp.toLocaleTimeString()} {message.category && `• ${message.category}`}
              </Typography>
            </Paper>
          </Box>
        ))}
        
        {isThinking && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#94a3b8', p: 2 }}>
            <CircularProgress size={20} sx={{ color: '#3b82f6' }} />
            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
              Observer is analyzing your request and accessing the knowledge base...
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Enhanced Input Area */}
      <Box
        sx={{
          p: 3,
          borderTop: '1px solid #334155',
          backgroundColor: '#1e293b'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about governance, trust metrics, PRISM/Vigil/Veritas systems, agent management, or any Promethios feature..."
            variant="outlined"
            disabled={isThinking}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f172a',
                color: 'white',
                fontSize: '1rem',
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
              width: 56,
              height: 56,
              '&:hover': { backgroundColor: '#2563eb', transform: 'scale(1.05)' },
              '&:disabled': { backgroundColor: '#374151', color: '#6b7280' },
              transition: 'all 0.3s ease'
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
        
        <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
          💡 Tip: I have comprehensive knowledge of all Promethios systems. Ask specific questions for detailed guidance!
        </Typography>
      </Box>
    </ExpandedWindow>
  );
};

export default SuperEnhancedObserverAgent;

