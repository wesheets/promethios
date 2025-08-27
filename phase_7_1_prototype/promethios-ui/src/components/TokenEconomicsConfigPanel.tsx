/**
 * TokenEconomicsConfigPanel - Enhanced configuration for token economics and multi-agent settings
 * Part of the revolutionary token-aware AI collaboration system
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Stack,
  Divider,
  Card,
  CardContent,
  Chip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Grid
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Psychology,
  Settings,
  Info,
  Warning,
  CheckCircle,
  AttachMoney,
  Speed,
  Star,
  Group
} from '@mui/icons-material';
import { TokenEconomicsService } from '../services/TokenEconomicsService';

export interface TokenEconomicsConfigPanelProps {
  sessionId?: string;
  userId: string;
  onConfigChange?: (config: TokenEconomicsConfig) => void;
}

export interface TokenEconomicsConfig {
  // Budget Settings
  defaultBudget: number;
  autoStopEnabled: boolean;
  maxAgentExchanges: number;
  warningThreshold: number;
  criticalThreshold: number;
  
  // Agent Engagement Settings
  minValueScore: number;
  maxCostPerInteraction: number;
  engagementStrategy: 'conservative' | 'balanced' | 'aggressive';
  qualityOverCost: boolean;
  
  // Multi-Agent Settings
  maxConcurrentAgents: number;
  agentSelectionStrategy: 'cost_optimized' | 'quality_optimized' | 'balanced';
  allowAgentNegotiation: boolean;
  
  // Advanced Settings
  dynamicPricing: boolean;
  learningEnabled: boolean;
  complianceMode: boolean;
}

const DEFAULT_CONFIG: TokenEconomicsConfig = {
  defaultBudget: 5.0,
  autoStopEnabled: true,
  maxAgentExchanges: 5,
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
  minValueScore: 5,
  maxCostPerInteraction: 0.01,
  engagementStrategy: 'balanced',
  qualityOverCost: false,
  maxConcurrentAgents: 3,
  agentSelectionStrategy: 'balanced',
  allowAgentNegotiation: false,
  dynamicPricing: false,
  learningEnabled: true,
  complianceMode: false
};

export const TokenEconomicsConfigPanel: React.FC<TokenEconomicsConfigPanelProps> = ({
  sessionId,
  userId,
  onConfigChange
}) => {
  const [config, setConfig] = useState<TokenEconomicsConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [estimatedCosts, setEstimatedCosts] = useState({
    lowUsage: 0,
    mediumUsage: 0,
    highUsage: 0
  });

  const tokenService = TokenEconomicsService.getInstance();

  // Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Load from localStorage or service
        const savedConfig = localStorage.getItem(`token_config_${userId}`);
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        }
      } catch (error) {
        console.error('❌ [TokenConfig] Error loading configuration:', error);
      }
    };

    loadConfig();
  }, [userId]);

  // Calculate estimated costs based on configuration
  useEffect(() => {
    const calculateEstimates = () => {
      const baseInteractionCost = 0.002; // Average cost per interaction
      const agentMultiplier = config.maxConcurrentAgents;
      const exchangeMultiplier = config.maxAgentExchanges;
      
      setEstimatedCosts({
        lowUsage: baseInteractionCost * agentMultiplier * Math.min(exchangeMultiplier, 2),
        mediumUsage: baseInteractionCost * agentMultiplier * exchangeMultiplier,
        highUsage: baseInteractionCost * agentMultiplier * exchangeMultiplier * 2
      });
    };

    calculateEstimates();
  }, [config.maxConcurrentAgents, config.maxAgentExchanges]);

  // Handle configuration changes
  const handleConfigChange = (key: keyof TokenEconomicsConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setHasChanges(true);
    onConfigChange?.(newConfig);
  };

  // Save configuration
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Save to localStorage
      localStorage.setItem(`token_config_${userId}`, JSON.stringify(config));
      
      // Apply to current session if available
      if (sessionId) {
        await tokenService.createSessionBudget(sessionId, userId, config.defaultBudget, {
          autoStopEnabled: config.autoStopEnabled,
          maxAgentExchanges: config.maxAgentExchanges,
          warningThreshold: config.warningThreshold,
          criticalThreshold: config.criticalThreshold
        });
      }
      
      setHasChanges(false);
      console.log('✅ [TokenConfig] Configuration saved successfully');
    } catch (error) {
      console.error('❌ [TokenConfig] Error saving configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  // Get strategy description
  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'conservative':
        return 'Minimize costs, only engage high-value agents';
      case 'balanced':
        return 'Balance cost and quality for optimal results';
      case 'aggressive':
        return 'Prioritize quality and comprehensive responses';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
        Token Economics Configuration
      </Typography>

      <Stack spacing={3}>
        {/* Budget Settings */}
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceWallet sx={{ color: '#3b82f6', mr: 1 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                Budget Settings
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Default Budget ($)"
                  type="number"
                  value={config.defaultBudget}
                  onChange={(e) => handleConfigChange('defaultBudget', parseFloat(e.target.value))}
                  inputProps={{ step: 0.01, min: 0.01 }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Max Agent Exchanges"
                  type="number"
                  value={config.maxAgentExchanges}
                  onChange={(e) => handleConfigChange('maxAgentExchanges', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 20 }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Budget Alert Thresholds
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Warning: {(config.warningThreshold * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={config.warningThreshold}
                    onChange={(_, value) => handleConfigChange('warningThreshold', value as number)}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    sx={{
                      color: '#f59e0b',
                      '& .MuiSlider-thumb': { bgcolor: '#f59e0b' },
                      '& .MuiSlider-track': { bgcolor: '#f59e0b' }
                    }}
                  />
                  
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Critical: {(config.criticalThreshold * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={config.criticalThreshold}
                    onChange={(_, value) => handleConfigChange('criticalThreshold', value as number)}
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    sx={{
                      color: '#ef4444',
                      '& .MuiSlider-thumb': { bgcolor: '#ef4444' },
                      '& .MuiSlider-track': { bgcolor: '#ef4444' }
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoStopEnabled}
                      onChange={(e) => handleConfigChange('autoStopEnabled', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                      }}
                    />
                  }
                  label="Auto-stop when budget exceeded"
                  sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8' } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Agent Engagement Settings */}
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Psychology sx={{ color: '#10b981', mr: 1 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                Agent Engagement Settings
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Engagement Strategy</InputLabel>
                  <Select
                    value={config.engagementStrategy}
                    onChange={(e) => handleConfigChange('engagementStrategy', e.target.value)}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                    }}
                  >
                    <MenuItem value="conservative">Conservative</MenuItem>
                    <MenuItem value="balanced">Balanced</MenuItem>
                    <MenuItem value="aggressive">Aggressive</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                  {getStrategyDescription(config.engagementStrategy)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Min Value Score (1-10)"
                  type="number"
                  value={config.minValueScore}
                  onChange={(e) => handleConfigChange('minValueScore', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Max Cost Per Interaction ($)"
                  type="number"
                  value={config.maxCostPerInteraction}
                  onChange={(e) => handleConfigChange('maxCostPerInteraction', parseFloat(e.target.value))}
                  inputProps={{ step: 0.001, min: 0.001 }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.qualityOverCost}
                      onChange={(e) => handleConfigChange('qualityOverCost', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' }
                      }}
                    />
                  }
                  label="Prioritize quality over cost"
                  sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8' } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Multi-Agent Settings */}
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Group sx={{ color: '#f59e0b', mr: 1 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                Multi-Agent Settings
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max Concurrent Agents"
                  type="number"
                  value={config.maxConcurrentAgents}
                  onChange={(e) => handleConfigChange('maxConcurrentAgents', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Agent Selection Strategy</InputLabel>
                  <Select
                    value={config.agentSelectionStrategy}
                    onChange={(e) => handleConfigChange('agentSelectionStrategy', e.target.value)}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                    }}
                  >
                    <MenuItem value="cost_optimized">Cost Optimized</MenuItem>
                    <MenuItem value="quality_optimized">Quality Optimized</MenuItem>
                    <MenuItem value="balanced">Balanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.allowAgentNegotiation}
                      onChange={(e) => handleConfigChange('allowAgentNegotiation', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#f59e0b' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#f59e0b' }
                      }}
                    />
                  }
                  label="Allow agent negotiation (experimental)"
                  sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8' } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Cost Estimates */}
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ color: '#3b82f6', mr: 1 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                Estimated Costs
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#0f172a', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Light Usage
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                    ${estimatedCosts.lowUsage.toFixed(3)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    per conversation
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#0f172a', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Medium Usage
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                    ${estimatedCosts.mediumUsage.toFixed(3)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    per conversation
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#0f172a', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Heavy Usage
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600 }}>
                    ${estimatedCosts.highUsage.toFixed(3)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    per conversation
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Settings sx={{ color: '#64748b', mr: 1 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                Advanced Settings
              </Typography>
            </Box>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.dynamicPricing}
                    onChange={(e) => handleConfigChange('dynamicPricing', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                    }}
                  />
                }
                label="Dynamic pricing based on demand"
                sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8' } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.learningEnabled}
                    onChange={(e) => handleConfigChange('learningEnabled', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' }
                    }}
                  />
                }
                label="Enable learning from user feedback"
                sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8' } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.complianceMode}
                    onChange={(e) => handleConfigChange('complianceMode', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#f59e0b' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#f59e0b' }
                    }}
                  />
                }
                label="Enhanced compliance mode (GDPR, SOX)"
                sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8' } }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              borderColor: '#64748b',
              color: '#64748b',
              '&:hover': { borderColor: '#94a3b8', color: '#94a3b8' }
            }}
          >
            Reset to Defaults
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              '&:disabled': { bgcolor: '#374151' }
            }}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>

        {/* Status Alert */}
        {hasChanges && (
          <Alert 
            severity="info"
            sx={{ bgcolor: '#3b82f620', border: '1px solid #3b82f640' }}
          >
            You have unsaved changes. Click "Save Configuration" to apply them.
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default TokenEconomicsConfigPanel;

