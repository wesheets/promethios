/**
 * MASCollaborationPanel - Multi-Agent System Collaboration Control Panel
 * Comprehensive control interface for all multi-agent collaboration features
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Slider,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Groups as GroupsIcon,
  Settings as SettingsIcon,
  MonetizationOn as TokenIcon,
  Notifications as NotificationsIcon,
  SmartToy as SmartToyIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';

export interface MASCollaborationSettings {
  // Chat Interface Controls
  chatFeatures: {
    conversationContextSharing: boolean;
    crossAgentReferences: boolean;
    realTimeCollaboration: boolean;
    visualAgentSelection: boolean;
    mentionSystemEnabled: boolean;
  };
  
  // 🚀 NEW: Agent-to-Agent Communication Controls
  agentToAgentCommunication: {
    enabled: boolean;
    allowDirectTagging: boolean;
    hoverTriggeredResponses: boolean;
    autoResponseToMentions: boolean;
    crossAgentConversations: boolean;
    responseDelay: number; // seconds
    maxChainLength: number; // max consecutive agent responses
  };
  
  // Autonomous Behaviors
  autonomousBehaviors: {
    proactiveInterjection: boolean;
    smartSuggestions: boolean;
    contextualHandRaising: boolean;
    triggerBasedEngagement: boolean;
    collaborativeFiltering: boolean;
  };
  
  // Temporary Role Assignments
  temporaryRoles: {
    [agentId: string]: {
      careerRole: 'legal' | 'hr' | 'customer_service' | 'cto' | 'cfo' | 'marketing' | 'sales' | 'product_manager' | 'engineer' | 'designer' | 'analyst' | 'consultant' | 'researcher' | 'writer' | 'educator' | 'none';
      behavior: 'collaborative' | 'devils_advocate' | 'expert' | 'facilitator' | 'critic' | 'creative' | 'analyst';
      duration: number; // minutes
      assignedAt: Date;
    };
  };
  
  // Token Economics
  tokenEconomics: {
    maxTokensPerAgent: number;
    suggestionThreshold: number;
    monitoringBudget: number;
    interjectionCost: number;
    enableSmartBudgeting: boolean;
  };
  
  // Trigger Settings
  triggerSettings: {
    keywordTriggers: string[];
    topicTriggers: string[];
    questionTriggers: boolean;
    disagreementTriggers: boolean;
    expertiseTriggers: boolean;
    sensitivityLevel: number; // 1-10
  };
}

export interface MASCollaborationPanelProps {
  settings: MASCollaborationSettings;
  onSettingsChange: (settings: MASCollaborationSettings) => void;
  availableAgents: Array<{
    id: string;
    name: string;
    avatar?: string;
    expertise?: string[];
  }>;
  currentTokenUsage: {
    [agentId: string]: {
      used: number;
      budget: number;
      efficiency: number;
    };
  };
}

const MASCollaborationPanel: React.FC<MASCollaborationPanelProps> = ({
  settings,
  onSettingsChange,
  availableAgents,
  currentTokenUsage
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['chat-features']);
  const [tempRoleSelections, setTempRoleSelections] = useState<{
    [agentId: string]: {
      careerRole?: string;
      behavior?: string;
    };
  }>({});

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateSettings = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings as any;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    onSettingsChange(newSettings);
  };

  const updateTempRoleSelection = (agentId: string, field: 'careerRole' | 'behavior', value: string) => {
    setTempRoleSelections(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: value
      }
    }));
  };

  const assignTemporaryRole = (agentId: string) => {
    const selection = tempRoleSelections[agentId];
    if (!selection?.careerRole || !selection?.behavior) return;

    const newRoles = {
      ...settings.temporaryRoles,
      [agentId]: {
        careerRole: selection.careerRole as any,
        behavior: selection.behavior as any,
        duration: 60, // Default 60 minutes
        assignedAt: new Date()
      }
    };
    updateSettings('temporaryRoles', newRoles);
    
    // Clear the temporary selection
    setTempRoleSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[agentId];
      return newSelections;
    });
  };

  const removeTemporaryRole = (agentId: string) => {
    const newRoles = { ...settings.temporaryRoles };
    delete newRoles[agentId];
    updateSettings('temporaryRoles', newRoles);
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <GroupsIcon />
        MAS Collaboration
      </Typography>

      {/* Chat Interface Controls */}
      <Accordion 
        expanded={expandedSections.includes('chat-features')}
        onChange={() => handleSectionToggle('chat-features')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon fontSize="small" />
            Chat Interface Features
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.chatFeatures.conversationContextSharing}
                  onChange={(e) => updateSettings('chatFeatures.conversationContextSharing', e.target.checked)}
                />
              }
              label="Conversation Context Sharing"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.chatFeatures.crossAgentReferences}
                  onChange={(e) => updateSettings('chatFeatures.crossAgentReferences', e.target.checked)}
                />
              }
              label="Cross-Agent References"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.chatFeatures.realTimeCollaboration}
                  onChange={(e) => updateSettings('chatFeatures.realTimeCollaboration', e.target.checked)}
                />
              }
              label="Real-Time Collaboration"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.chatFeatures.visualAgentSelection}
                  onChange={(e) => updateSettings('chatFeatures.visualAgentSelection', e.target.checked)}
                />
              }
              label="Visual Agent Selection"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.chatFeatures.mentionSystemEnabled}
                  onChange={(e) => updateSettings('chatFeatures.mentionSystemEnabled', e.target.checked)}
                />
              }
              label="@Mention System"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 🚀 NEW: Agent-to-Agent Communication */}
      <Accordion 
        expanded={expandedSections.includes('agent-to-agent')}
        onChange={() => handleSectionToggle('agent-to-agent')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuestionAnswerIcon fontSize="small" />
            🤖➡️🤖 Agent-to-Agent Communication
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.agentToAgentCommunication.enabled}
                  onChange={(e) => updateSettings('agentToAgentCommunication', 'enabled', e.target.checked)}
                />
              }
              label="Enable Agent-to-Agent Communication"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.agentToAgentCommunication.allowDirectTagging}
                  onChange={(e) => updateSettings('agentToAgentCommunication', 'allowDirectTagging', e.target.checked)}
                  disabled={!settings.agentToAgentCommunication.enabled}
                />
              }
              label="Allow Direct Agent Tagging (e.g., 'Claude, ask OpenAI...')"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.agentToAgentCommunication.hoverTriggeredResponses}
                  onChange={(e) => updateSettings('agentToAgentCommunication', 'hoverTriggeredResponses', e.target.checked)}
                  disabled={!settings.agentToAgentCommunication.enabled}
                />
              }
              label="Hover-Triggered Agent Responses"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.agentToAgentCommunication.autoResponseToMentions}
                  onChange={(e) => updateSettings('agentToAgentCommunication', 'autoResponseToMentions', e.target.checked)}
                  disabled={!settings.agentToAgentCommunication.enabled}
                />
              }
              label="Auto-Response to Agent Mentions"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.agentToAgentCommunication.crossAgentConversations}
                  onChange={(e) => updateSettings('agentToAgentCommunication', 'crossAgentConversations', e.target.checked)}
                  disabled={!settings.agentToAgentCommunication.enabled}
                />
              }
              label="Allow Cross-Agent Conversations"
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Response Delay: {settings.agentToAgentCommunication.responseDelay}s
              </Typography>
              <Slider
                value={settings.agentToAgentCommunication.responseDelay}
                onChange={(_, value) => updateSettings('agentToAgentCommunication', 'responseDelay', value as number)}
                min={0}
                max={10}
                step={1}
                disabled={!settings.agentToAgentCommunication.enabled}
                sx={{ width: '100%' }}
              />
            </Box>
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Max Chain Length: {settings.agentToAgentCommunication.maxChainLength} responses
              </Typography>
              <Slider
                value={settings.agentToAgentCommunication.maxChainLength}
                onChange={(_, value) => updateSettings('agentToAgentCommunication', 'maxChainLength', value as number)}
                min={1}
                max={10}
                step={1}
                disabled={!settings.agentToAgentCommunication.enabled}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Autonomous Behaviors */}
      <Accordion 
        expanded={expandedSections.includes('autonomous')}
        onChange={() => handleSectionToggle('autonomous')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon fontSize="small" />
            Autonomous Behaviors
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autonomousBehaviors.smartSuggestions}
                  onChange={(e) => updateSettings('autonomousBehaviors.smartSuggestions', e.target.checked)}
                />
              }
              label="Smart Suggestions"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autonomousBehaviors.contextualHandRaising}
                  onChange={(e) => updateSettings('autonomousBehaviors.contextualHandRaising', e.target.checked)}
                />
              }
              label="Contextual Hand Raising"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autonomousBehaviors.triggerBasedEngagement}
                  onChange={(e) => updateSettings('autonomousBehaviors.triggerBasedEngagement', e.target.checked)}
                />
              }
              label="Trigger-Based Engagement"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autonomousBehaviors.collaborativeFiltering}
                  onChange={(e) => updateSettings('autonomousBehaviors.collaborativeFiltering', e.target.checked)}
                />
              }
              label="Collaborative Filtering"
            />
            
            <Alert severity="info" sx={{ mt: 1, fontSize: '12px' }}>
              💡 Smart suggestions use trigger detection instead of constant monitoring to save tokens
            </Alert>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Temporary Role Assignments */}
      <Accordion 
        expanded={expandedSections.includes('roles')}
        onChange={() => handleSectionToggle('roles')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon fontSize="small" />
            Temporary Roles
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {availableAgents.map(agent => (
              <Card key={agent.id} variant="outlined" sx={{ 
                p: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(49, 130, 206, 0.3)'
                }
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {agent.name}
                </Typography>
                
                {settings.temporaryRoles[agent.id] ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Career: ${settings.temporaryRoles[agent.id].careerRole.replace('_', ' ').toUpperCase()}`}
                      color="primary"
                      size="small"
                    />
                    <Chip 
                      label={`Behavior: ${settings.temporaryRoles[agent.id].behavior.replace('_', ' ')}`}
                      color="secondary"
                      size="small"
                    />
                    <Button 
                      size="small" 
                      onClick={() => removeTemporaryRole(agent.id)}
                      color="error"
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Career Role</InputLabel>
                      <Select 
                        value={tempRoleSelections[agent.id]?.careerRole || ''}
                        onChange={(e) => updateTempRoleSelection(agent.id, 'careerRole', e.target.value)}
                      >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="legal">Legal</MenuItem>
                        <MenuItem value="hr">HR</MenuItem>
                        <MenuItem value="customer_service">Customer Service</MenuItem>
                        <MenuItem value="cto">CTO</MenuItem>
                        <MenuItem value="cfo">CFO</MenuItem>
                        <MenuItem value="marketing">Marketing</MenuItem>
                        <MenuItem value="sales">Sales</MenuItem>
                        <MenuItem value="product_manager">Product Manager</MenuItem>
                        <MenuItem value="engineer">Engineer</MenuItem>
                        <MenuItem value="designer">Designer</MenuItem>
                        <MenuItem value="analyst">Analyst</MenuItem>
                        <MenuItem value="consultant">Consultant</MenuItem>
                        <MenuItem value="researcher">Researcher</MenuItem>
                        <MenuItem value="writer">Writer</MenuItem>
                        <MenuItem value="educator">Educator</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Behavior</InputLabel>
                      <Select 
                        value={tempRoleSelections[agent.id]?.behavior || ''}
                        onChange={(e) => updateTempRoleSelection(agent.id, 'behavior', e.target.value)}
                      >
                        <MenuItem value="collaborative">Collaborative</MenuItem>
                        <MenuItem value="devils_advocate">Devil's Advocate</MenuItem>
                        <MenuItem value="expert">Expert</MenuItem>
                        <MenuItem value="facilitator">Facilitator</MenuItem>
                        <MenuItem value="critic">Critic</MenuItem>
                        <MenuItem value="creative">Creative</MenuItem>
                        <MenuItem value="analyst">Analyst</MenuItem>
                      </Select>
                    </FormControl>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => assignTemporaryRole(agent.id)}
                      disabled={!tempRoleSelections[agent.id]?.careerRole || !tempRoleSelections[agent.id]?.behavior}
                    >
                      Assign
                    </Button>
                  </Box>
                )}
              </Card>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Token Economics */}
      <Accordion 
        expanded={expandedSections.includes('tokens')}
        onChange={() => handleSectionToggle('tokens')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TokenIcon fontSize="small" />
            Token Economics
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.tokenEconomics.enableSmartBudgeting}
                  onChange={(e) => updateSettings('tokenEconomics.enableSmartBudgeting', e.target.checked)}
                />
              }
              label="Smart Budgeting"
            />
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Suggestion Threshold: {settings.tokenEconomics.suggestionThreshold}
              </Typography>
              <Slider
                value={settings.tokenEconomics.suggestionThreshold}
                onChange={(_, value) => updateSettings('tokenEconomics.suggestionThreshold', value)}
                min={1}
                max={100}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Token Usage Dashboard */}
            <Typography variant="subtitle2">Current Usage:</Typography>
            {Object.entries(currentTokenUsage).map(([agentId, usage]) => {
              const agent = availableAgents.find(a => a.id === agentId);
              return (
                <Box key={agentId} sx={{ mb: 1 }}>
                  <Typography variant="caption">
                    {agent?.name}: {usage.used}/{usage.budget} tokens ({Math.round(usage.efficiency * 100)}% efficiency)
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 4, 
                    bgcolor: '#e0e0e0', 
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${(usage.used / usage.budget) * 100}%`, 
                      height: '100%', 
                      bgcolor: usage.used > usage.budget * 0.8 ? '#f44336' : '#4caf50'
                    }} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Trigger Settings */}
      <Accordion 
        expanded={expandedSections.includes('triggers')}
        onChange={() => handleSectionToggle('triggers')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon fontSize="small" />
            Smart Triggers
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.triggerSettings.questionTriggers}
                  onChange={(e) => updateSettings('triggerSettings.questionTriggers', e.target.checked)}
                />
              }
              label="Question Detection"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.triggerSettings.disagreementTriggers}
                  onChange={(e) => updateSettings('triggerSettings.disagreementTriggers', e.target.checked)}
                />
              }
              label="Disagreement Detection"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.triggerSettings.expertiseTriggers}
                  onChange={(e) => updateSettings('triggerSettings.expertiseTriggers', e.target.checked)}
                />
              }
              label="Expertise Matching"
            />
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Sensitivity Level: {settings.triggerSettings.sensitivityLevel}
              </Typography>
              <Slider
                value={settings.triggerSettings.sensitivityLevel}
                onChange={(_, value) => updateSettings('triggerSettings.sensitivityLevel', value)}
                min={1}
                max={10}
                valueLabelDisplay="auto"
              />
            </Box>

            <TextField
              label="Custom Keywords (comma-separated)"
              multiline
              rows={2}
              value={settings.triggerSettings.keywordTriggers.join(', ')}
              onChange={(e) => updateSettings('triggerSettings.keywordTriggers', e.target.value.split(', '))}
              size="small"
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default MASCollaborationPanel;

