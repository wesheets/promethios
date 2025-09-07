/**
 * Behavioral Injection Modal
 * Reuses existing AgentConfigurationPopup components and data
 * Provides enhanced configuration for drag & drop behavioral injection
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import { trackFeatureUsage } from '../../config/modernChatConfig';
import { useChatMode } from './ChatModeDetector';

// Import existing role and behavior data
const CAREER_ROLES = [
  { value: 'ceo', label: 'CEO', description: 'Strategic leadership and decision-making' },
  { value: 'cto', label: 'CTO', description: 'Technical strategy and architecture' },
  { value: 'cfo', label: 'CFO', description: 'Financial planning and analysis' },
  { value: 'cmo', label: 'CMO', description: 'Marketing strategy and brand management' },
  { value: 'hr_director', label: 'HR Director', description: 'Human resources and talent management' },
  { value: 'legal_counsel', label: 'Legal Counsel', description: 'Legal compliance and risk assessment' },
  { value: 'product_manager', label: 'Product Manager', description: 'Product strategy and roadmap' },
  { value: 'sales_director', label: 'Sales Director', description: 'Sales strategy and revenue growth' },
  { value: 'operations_manager', label: 'Operations Manager', description: 'Process optimization and efficiency' },
  { value: 'customer_success', label: 'Customer Success', description: 'Customer satisfaction and retention' },
  { value: 'data_scientist', label: 'Data Scientist', description: 'Data analysis and insights' },
  { value: 'security_expert', label: 'Security Expert', description: 'Cybersecurity and risk management' },
  { value: 'compliance_officer', label: 'Compliance Officer', description: 'Regulatory compliance and governance' },
  { value: 'business_analyst', label: 'Business Analyst', description: 'Business process analysis and improvement' },
  { value: 'general', label: 'General Assistant', description: 'General purpose assistance' }
];

const BEHAVIORS = [
  { value: 'collaborative', label: '🤝 Collaborative', description: 'Work together constructively' },
  { value: 'analytical', label: '🔍 Analytical', description: 'Deep analysis and critical thinking' },
  { value: 'creative', label: '💡 Creative', description: 'Innovative and out-of-the-box thinking' },
  { value: 'devil_advocate', label: '😈 Devil\'s Advocate', description: 'Challenge ideas and find flaws' },
  { value: 'supportive', label: '🤗 Supportive', description: 'Encouraging and positive approach' },
  { value: 'expert', label: '🎓 Expert', description: 'Authoritative and knowledgeable' },
  { value: 'mentor', label: '👨‍🏫 Mentor', description: 'Guiding and educational approach' }
];

export interface BehavioralInjectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: BehavioralInjectionConfig) => void;
  
  // Agent and message context
  agentData: {
    agentId: string;
    agentName: string;
    agentColor?: string;
    availableRoles?: string[];
    availableBehaviors?: string[];
  };
  
  messageContext: {
    messageId: string;
    messageContent: string;
    messageType: 'human' | 'ai';
  };
  
  // Default values
  defaultRole?: string;
  defaultBehavior?: string;
  defaultPrompt?: string;
}

export interface BehavioralInjectionConfig {
  agentId: string;
  agentName: string;
  targetMessageId: string;
  careerRole: string;
  behavior: string;
  customPrompt: string;
  contextualPrompt: string;
  metadata: {
    messageContent: string;
    messageType: string;
    injectionType: 'drag-drop';
    timestamp: Date;
  };
}

export const BehavioralInjectionModal: React.FC<BehavioralInjectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  agentData,
  messageContext,
  defaultRole = 'general',
  defaultBehavior = 'analytical',
  defaultPrompt = ''
}) => {
  
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [selectedBehavior, setSelectedBehavior] = useState(defaultBehavior);
  const [customPrompt, setCustomPrompt] = useState(defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  
  const { mode } = useChatMode();
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedRole(defaultRole);
      setSelectedBehavior(defaultBehavior);
      setCustomPrompt(defaultPrompt);
      setIsLoading(false);
    }
  }, [open, defaultRole, defaultBehavior, defaultPrompt]);
  
  // Get available roles (filter by agent's available roles if specified)
  const availableRoles = agentData.availableRoles?.length 
    ? CAREER_ROLES.filter(role => agentData.availableRoles!.includes(role.value))
    : CAREER_ROLES;
  
  // Get available behaviors (filter by agent's available behaviors if specified)
  const availableBehaviors = agentData.availableBehaviors?.length
    ? BEHAVIORS.filter(behavior => agentData.availableBehaviors!.includes(behavior.value))
    : BEHAVIORS;
  
  // Generate contextual prompt based on message content and selections
  const generateContextualPrompt = () => {
    const roleData = CAREER_ROLES.find(r => r.value === selectedRole);
    const behaviorData = BEHAVIORS.find(b => b.value === selectedBehavior);
    
    const messagePreview = messageContext.messageContent.length > 100 
      ? messageContext.messageContent.substring(0, 100) + '...'
      : messageContext.messageContent;
    
    let contextualPrompt = `As a ${roleData?.label || 'assistant'}, please provide a ${behaviorData?.label.toLowerCase() || 'analytical'} response to this ${messageContext.messageType === 'human' ? 'user message' : 'AI response'}:\n\n"${messagePreview}"`;
    
    if (customPrompt.trim()) {
      contextualPrompt += `\n\nAdditional instructions: ${customPrompt}`;
    }
    
    return contextualPrompt;
  };
  
  // Handle form submission
  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      const config: BehavioralInjectionConfig = {
        agentId: agentData.agentId,
        agentName: agentData.agentName,
        targetMessageId: messageContext.messageId,
        careerRole: selectedRole,
        behavior: selectedBehavior,
        customPrompt: customPrompt.trim(),
        contextualPrompt: generateContextualPrompt(),
        metadata: {
          messageContent: messageContext.messageContent,
          messageType: messageContext.messageType,
          injectionType: 'drag-drop',
          timestamp: new Date()
        }
      };
      
      // Track the injection configuration
      trackFeatureUsage('drag-drop-injection', 'injection_configured', {
        agentId: agentData.agentId,
        agentName: agentData.agentName,
        role: selectedRole,
        behavior: selectedBehavior,
        hasCustomPrompt: customPrompt.trim().length > 0,
        messageType: messageContext.messageType,
        chatMode: mode
      });
      
      onConfirm(config);
      onClose();
      
    } catch (error) {
      console.error('Error configuring behavioral injection:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectedRoleData = CAREER_ROLES.find(r => r.value === selectedRole);
  const selectedBehaviorData = BEHAVIORS.find(b => b.value === selectedBehavior);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: agentData.agentColor || '#3b82f6',
              width: 40,
              height: 40
            }}
          >
            {agentData.agentName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">
              🎭 Behavioral Injection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure {agentData.agentName}'s response to this message
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {/* Message Context */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            📝 Target Message ({messageContext.messageType === 'human' ? 'Human' : 'AI'})
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontStyle: 'italic',
              color: 'text.secondary',
              maxHeight: 100,
              overflow: 'auto'
            }}
          >
            "{messageContext.messageContent}"
          </Typography>
        </Paper>
        
        {/* Role Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Career Role</InputLabel>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            label="Career Role"
          >
            {availableRoles.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                <Box>
                  <Typography variant="body1">{role.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {role.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Behavior Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Behavior Style</InputLabel>
          <Select
            value={selectedBehavior}
            onChange={(e) => setSelectedBehavior(e.target.value)}
            label="Behavior Style"
          >
            {availableBehaviors.map((behavior) => (
              <MenuItem key={behavior.value} value={behavior.value}>
                <Box>
                  <Typography variant="body1">{behavior.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {behavior.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Custom Instructions */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Additional Instructions (Optional)"
          placeholder="Add specific context or requirements for the response..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          sx={{ mb: 3 }}
        />
        
        {/* Preview */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎯 Configuration Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={selectedRoleData?.label}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              label={selectedBehaviorData?.label}
              color="secondary"
              variant="outlined"
              size="small"
            />
          </Box>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Generated Prompt:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {generateContextualPrompt()}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isLoading}
          sx={{
            bgcolor: agentData.agentColor || '#3b82f6',
            '&:hover': {
              bgcolor: agentData.agentColor || '#2563eb'
            }
          }}
        >
          {isLoading ? 'Injecting...' : '🎭 Inject Response'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BehavioralInjectionModal;

