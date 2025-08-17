import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Chip,
  Stack,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore,
  Psychology,
  SmartToy,
  Save,
  Refresh,
  Info,
  CheckCircle,
  Warning,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { ChatbotProfile } from '../../../services/ChatbotStorageService';
import { AgentRoleManager } from '../../governance/AgentRoleManager';
import { AgentRole, RoleContextualData } from '../../../services/AgentRoleService';

interface PersonalityEditorProps {
  chatbot: ChatbotProfile;
  onSave: (updates: Partial<ChatbotProfile>) => void;
  onCancel: () => void;
}

type PersonalityType = 'professional' | 'friendly' | 'casual' | 'helpful';
type BehaviorPattern = 'helpful' | 'conversational' | 'technical' | 'sales-focused' | 'educational' | 'supportive';
type UseCaseType = 'customer_support' | 'sales' | 'technical_support' | 'general_assistant' | 'education' | 'healthcare';

const personalityOptions: { value: PersonalityType; label: string; description: string; color: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal, business-appropriate tone with structured responses',
    color: '#3b82f6'
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable language while remaining helpful',
    color: '#10b981'
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed, conversational tone while staying informative',
    color: '#f59e0b'
  },
  {
    value: 'helpful',
    label: 'Helpful',
    description: 'Maximally useful, detailed, and solution-oriented',
    color: '#8b5cf6'
  }
];

const behaviorOptions: { value: BehaviorPattern; label: string; description: string }[] = [
  {
    value: 'helpful',
    label: 'Helpful',
    description: 'Focuses on providing assistance and solving problems'
  },
  {
    value: 'conversational',
    label: 'Conversational',
    description: 'Engages in natural dialogue and builds rapport'
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Provides detailed technical information and explanations'
  },
  {
    value: 'sales-focused',
    label: 'Sales-Focused',
    description: 'Guides users toward products/services and conversions'
  },
  {
    value: 'educational',
    label: 'Educational',
    description: 'Teaches and explains concepts in an instructional manner'
  },
  {
    value: 'supportive',
    label: 'Supportive',
    description: 'Provides emotional support and encouragement'
  }
];

const useCaseOptions: { value: UseCaseType; label: string; description: string; icon: string }[] = [
  {
    value: 'customer_support',
    label: 'Customer Support',
    description: 'Handle customer inquiries, troubleshooting, and issue resolution',
    icon: '🎧'
  },
  {
    value: 'sales',
    label: 'Sales',
    description: 'Lead qualification, product information, and conversion assistance',
    icon: '💼'
  },
  {
    value: 'technical_support',
    label: 'Technical Support',
    description: 'Technical troubleshooting, documentation, and expert assistance',
    icon: '🔧'
  },
  {
    value: 'general_assistant',
    label: 'General Assistant',
    description: 'Multi-purpose assistance across various topics and tasks',
    icon: '🤖'
  },
  {
    value: 'education',
    label: 'Education',
    description: 'Teaching, tutoring, and educational content delivery',
    icon: '📚'
  },
  {
    value: 'healthcare',
    label: 'Healthcare',
    description: 'Health information, appointment scheduling, and patient support',
    icon: '🏥'
  }
];

const PersonalityEditor: React.FC<PersonalityEditorProps> = ({ chatbot, onSave, onCancel }) => {
  const [personality, setPersonality] = useState<PersonalityType>(
    chatbot.chatbotConfig.personality as PersonalityType || 'professional'
  );
  const [behavior, setBehavior] = useState<BehaviorPattern>(
    (chatbot.chatbotConfig as any).behavior as BehaviorPattern || 'helpful'
  );
  const [useCase, setUseCase] = useState<UseCaseType>(
    chatbot.chatbotConfig.useCase as UseCaseType || 'customer_support'
  );
  const [customInstructions, setCustomInstructions] = useState<string>(
    (chatbot.chatbotConfig as any).customInstructions || ''
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [assignedRoles, setAssignedRoles] = useState<AgentRole[]>([]);
  const [roleContextualData, setRoleContextualData] = useState<RoleContextualData | null>(null);

  useEffect(() => {
    const originalPersonality = chatbot.chatbotConfig.personality as PersonalityType || 'professional';
    const originalBehavior = (chatbot.chatbotConfig as any).behavior as BehaviorPattern || 'helpful';
    const originalUseCase = chatbot.chatbotConfig.useCase as UseCaseType || 'customer_support';
    const originalInstructions = (chatbot.chatbotConfig as any).customInstructions || '';

    const changed = personality !== originalPersonality || 
                   behavior !== originalBehavior || 
                   useCase !== originalUseCase ||
                   customInstructions !== originalInstructions;
    
    setHasChanges(changed);
  }, [personality, behavior, useCase, customInstructions, chatbot]);

  const handleSave = () => {
    const updates: Partial<ChatbotProfile> = {
      chatbotConfig: {
        ...chatbot.chatbotConfig,
        personality,
        useCase,
        behavior,
        customInstructions,
      }
    };
    
    onSave(updates);
  };

  const handleReset = () => {
    setPersonality(chatbot.chatbotConfig.personality as PersonalityType || 'professional');
    setBehavior((chatbot.chatbotConfig as any).behavior as BehaviorPattern || 'helpful');
    setUseCase(chatbot.chatbotConfig.useCase as UseCaseType || 'customer_support');
    setCustomInstructions((chatbot.chatbotConfig as any).customInstructions || '');
  };

  const handleRoleChange = (roles: AgentRole[]) => {
    setAssignedRoles(roles);
  };

  const handleContextualDataUpdate = (data: RoleContextualData | null) => {
    setRoleContextualData(data);
  };

  const selectedPersonality = personalityOptions.find(p => p.value === personality);
  const selectedBehavior = behaviorOptions.find(b => b.value === behavior);
  const selectedUseCase = useCaseOptions.find(u => u.value === useCase);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Psychology sx={{ color: '#3b82f6', mr: 2 }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Personality & Behavior Settings
        </Typography>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3, bgcolor: '#1e3a8a', color: 'white' }}>
          You have unsaved changes. Click "Save Changes" to apply them.
        </Alert>
      )}

      {/* Role Context Display */}
      {roleContextualData && (
        <Alert severity="info" sx={{ mb: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
          <Typography variant="body2" sx={{ color: 'white' }}>
            <strong>Active Role:</strong> {roleContextualData.roleName} | 
            <strong> Trust Score:</strong> {(roleContextualData.governanceMetrics.trustScore * 100).toFixed(0)}% | 
            <strong> Compliance:</strong> {(roleContextualData.governanceMetrics.complianceScore * 100).toFixed(0)}%
          </Typography>
        </Alert>
      )}

      {/* Tabs for Personality and Roles */}
      <Tabs 
        value={selectedTab} 
        onChange={(_, newValue) => setSelectedTab(newValue)} 
        sx={{ 
          mb: 3,
          '& .MuiTab-root': { color: '#64748b' },
          '& .Mui-selected': { color: '#3b82f6' },
          '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' }
        }}
      >
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Psychology sx={{ mr: 1 }} />
              Personality
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ mr: 1 }} />
              Agent Roles
              {assignedRoles.length > 0 && (
                <Chip 
                  label={assignedRoles.length} 
                  size="small" 
                  sx={{ ml: 1, bgcolor: '#3b82f6', color: 'white' }}
                />
              )}
            </Box>
          } 
        />
      </Tabs>

      {/* Personality Tab */}
      {selectedTab === 0 && (
        <Box>

      {/* Personality Selection */}
      <Accordion defaultExpanded sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ color: selectedPersonality?.color || '#3b82f6', mr: 2 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                Personality Type
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                How your agent communicates and interacts with users
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {personalityOptions.map((option) => (
              <Grid item xs={12} sm={6} key={option.value}>
                <Card 
                  sx={{ 
                    bgcolor: personality === option.value ? '#1e40af' : '#0f172a',
                    border: `2px solid ${personality === option.value ? option.color : '#334155'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: personality === option.value ? '#1e40af' : '#1e293b',
                      borderColor: option.color
                    }
                  }}
                  onClick={() => setPersonality(option.value)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: option.color, 
                          mr: 1 
                        }} 
                      />
                      <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {option.label}
                      </Typography>
                      {personality === option.value && (
                        <CheckCircle sx={{ color: option.color, ml: 'auto', fontSize: 20 }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {option.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Behavior Pattern */}
      <Accordion sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Psychology sx={{ color: '#10b981', mr: 2 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                Behavior Pattern
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Specific behavioral approach and response style
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth>
            <Select
              value={behavior}
              onChange={(e) => setBehavior(e.target.value as BehaviorPattern)}
              sx={{ 
                bgcolor: '#0f172a', 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' }
              }}
            >
              {behaviorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {option.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedBehavior && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#0f172a', borderRadius: 1, border: '1px solid #334155' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                <strong>Selected:</strong> {selectedBehavior.description}
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Use Case */}
      <Accordion sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ color: '#f59e0b', mr: 2 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                Primary Use Case
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Main purpose and specialization area
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {useCaseOptions.map((option) => (
              <Grid item xs={12} sm={6} key={option.value}>
                <Card 
                  sx={{ 
                    bgcolor: useCase === option.value ? '#92400e' : '#0f172a',
                    border: `2px solid ${useCase === option.value ? '#f59e0b' : '#334155'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: useCase === option.value ? '#92400e' : '#1e293b',
                      borderColor: '#f59e0b'
                    }
                  }}
                  onClick={() => setUseCase(option.value)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontSize: '1.2rem', mr: 1 }}>
                        {option.icon}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {option.label}
                      </Typography>
                      {useCase === option.value && (
                        <CheckCircle sx={{ color: '#f59e0b', ml: 'auto', fontSize: 20 }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {option.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Custom Instructions */}
      <Accordion sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Info sx={{ color: '#8b5cf6', mr: 2 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                Custom Instructions
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Additional specific instructions for your agent
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any specific instructions, guidelines, or constraints for your agent..."
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0f172a',
                color: 'white',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#8b5cf6' },
                '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 1, fontSize: '0.85rem' }}>
            These instructions will be added to your agent's system prompt to guide its behavior.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Current Configuration Summary */}
      <Paper sx={{ bgcolor: '#0f172a', border: '1px solid #334155', p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
          Current Configuration
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip 
            label={`${selectedPersonality?.label} Personality`}
            sx={{ bgcolor: selectedPersonality?.color, color: 'white' }}
            size="small"
          />
          <Chip 
            label={`${selectedBehavior?.label} Behavior`}
            sx={{ bgcolor: '#10b981', color: 'white' }}
            size="small"
          />
          <Chip 
            label={selectedUseCase?.label}
            sx={{ bgcolor: '#f59e0b', color: 'white' }}
            size="small"
          />
          {customInstructions && (
            <Chip 
              label="Custom Instructions"
              sx={{ bgcolor: '#8b5cf6', color: 'white' }}
              size="small"
            />
          )}
        </Stack>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={!hasChanges}
          sx={{ 
            borderColor: '#64748b', 
            color: '#64748b',
            '&:hover': { borderColor: '#94a3b8', color: '#94a3b8' }
          }}
        >
          <Refresh sx={{ mr: 1, fontSize: 20 }} />
          Reset
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ 
            borderColor: '#64748b', 
            color: '#64748b',
            '&:hover': { borderColor: '#94a3b8', color: '#94a3b8' }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges}
          sx={{ 
            bgcolor: '#3b82f6', 
            '&:hover': { bgcolor: '#2563eb' },
            '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
          }}
        >
          <Save sx={{ mr: 1, fontSize: 20 }} />
          Save Changes
        </Button>
      </Box>
        </Box>
      )}

      {/* Agent Roles Tab */}
      {selectedTab === 1 && (
        <Box>
          <AgentRoleManager
            agentId={chatbot.id}
            onRoleChange={handleRoleChange}
            onContextualDataUpdate={handleContextualDataUpdate}
          />
        </Box>
      )}
    </Box>
  );
};

export default PersonalityEditor;

