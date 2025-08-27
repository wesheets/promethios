/**
 * TokenBudgetWidget - Real-time token cost tracking and budget management
 * Part of the revolutionary token-aware AI collaboration system
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  AccountBalanceWallet,
  Warning,
  Error as ErrorIcon,
  Settings,
  TrendingUp,
  TrendingDown,
  Info
} from '@mui/icons-material';
import { TokenEconomicsService } from '../services/TokenEconomicsService';

export interface TokenBudgetWidgetProps {
  sessionId: string;
  userId: string;
  onBudgetExceeded?: () => void;
  onBudgetWarning?: (percentage: number) => void;
  compact?: boolean;
}

export const TokenBudgetWidget: React.FC<TokenBudgetWidgetProps> = ({
  sessionId,
  userId,
  onBudgetExceeded,
  onBudgetWarning,
  compact = false
}) => {
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newBudget, setNewBudget] = useState('5.00');
  const [autoStopEnabled, setAutoStopEnabled] = useState(true);
  const [maxExchanges, setMaxExchanges] = useState('5');
  const [isLoading, setIsLoading] = useState(false);

  const tokenService = TokenEconomicsService.getInstance();

  // Load budget data
  useEffect(() => {
    const loadBudgetData = async () => {
      try {
        let summary = tokenService.getBudgetSummary(sessionId);
        
        // Create budget if it doesn't exist
        if (!summary) {
          await tokenService.createSessionBudget(sessionId, userId);
          summary = tokenService.getBudgetSummary(sessionId);
        }
        
        setBudgetSummary(summary);

        // Trigger callbacks
        if (summary) {
          if (summary.status === 'critical' && onBudgetExceeded) {
            onBudgetExceeded();
          } else if (summary.status === 'warning' && onBudgetWarning) {
            onBudgetWarning(summary.usagePercentage);
          }
        }
      } catch (error) {
        console.error('❌ [TokenBudget] Error loading budget data:', error);
      }
    };

    loadBudgetData();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadBudgetData, 5000);
    return () => clearInterval(interval);
  }, [sessionId, userId]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'warning': return <Warning sx={{ fontSize: 16 }} />;
      case 'critical': return <ErrorIcon sx={{ fontSize: 16 }} />;
      default: return <Info sx={{ fontSize: 16 }} />;
    }
  };

  // Handle budget update
  const handleUpdateBudget = async () => {
    try {
      setIsLoading(true);
      const budget = parseFloat(newBudget);
      const exchanges = parseInt(maxExchanges);
      
      if (budget > 0 && exchanges > 0) {
        await tokenService.createSessionBudget(sessionId, userId, budget, {
          autoStopEnabled,
          maxAgentExchanges: exchanges
        });
        
        // Refresh data
        const summary = tokenService.getBudgetSummary(sessionId);
        setBudgetSummary(summary);
        setShowSettings(false);
      }
    } catch (error) {
      console.error('❌ [TokenBudget] Error updating budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!budgetSummary) {
    return (
      <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Loading budget...
        </Typography>
      </Paper>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalanceWallet sx={{ fontSize: 16, color: getStatusColor(budgetSummary.status) }} />
        <Typography variant="caption" sx={{ color: 'white' }}>
          ${budgetSummary.remainingBudget.toFixed(3)}
        </Typography>
        <Chip
          label={`${budgetSummary.usagePercentage.toFixed(0)}%`}
          size="small"
          sx={{
            bgcolor: getStatusColor(budgetSummary.status),
            color: 'white',
            fontSize: '0.7rem',
            height: 20
          }}
        />
      </Box>
    );
  }

  return (
    <>
      <Paper
        sx={{
          bgcolor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 2
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountBalanceWallet sx={{ color: '#3b82f6', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
              Token Budget Tracker
            </Typography>
            
            <Chip
              icon={getStatusIcon(budgetSummary.status)}
              label={budgetSummary.status.toUpperCase()}
              size="small"
              sx={{
                bgcolor: getStatusColor(budgetSummary.status),
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          </Box>

          <IconButton 
            size="small" 
            sx={{ color: '#94a3b8' }}
            onClick={() => setShowSettings(true)}
          >
            <Settings />
          </IconButton>
        </Box>

        {/* Budget Overview */}
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Budget Progress */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Budget Usage
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  ${budgetSummary.usedBudget.toFixed(4)} / ${budgetSummary.totalBudget.toFixed(2)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(budgetSummary.usagePercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getStatusColor(budgetSummary.status),
                    borderRadius: 4
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                {budgetSummary.usagePercentage.toFixed(1)}% used
              </Typography>
            </Box>

            {/* Exchange Counter */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Agent Exchanges
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {budgetSummary.exchangesUsed} / {budgetSummary.maxExchanges}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(budgetSummary.exchangesUsed / budgetSummary.maxExchanges) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#3b82f6',
                    borderRadius: 3
                  }
                }}
              />
            </Box>

            {/* Remaining Budget */}
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#0f172a',
                borderRadius: 1,
                border: `1px solid ${getStatusColor(budgetSummary.status)}20`
              }}
            >
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                Remaining Budget
              </Typography>
              <Typography variant="h6" sx={{ color: getStatusColor(budgetSummary.status), fontWeight: 600 }}>
                ${budgetSummary.remainingBudget.toFixed(4)}
              </Typography>
            </Box>

            {/* Budget Alerts */}
            {budgetSummary.status === 'warning' && (
              <Alert 
                severity="warning" 
                sx={{ 
                  bgcolor: '#f59e0b20', 
                  border: '1px solid #f59e0b40',
                  '& .MuiAlert-message': { color: '#f59e0b' }
                }}
              >
                Budget usage is approaching the warning threshold. Monitor remaining interactions carefully.
              </Alert>
            )}

            {budgetSummary.status === 'critical' && (
              <Alert 
                severity="error"
                sx={{ 
                  bgcolor: '#ef444420', 
                  border: '1px solid #ef444440',
                  '& .MuiAlert-message': { color: '#ef4444' }
                }}
              >
                Critical budget usage! Consider stopping the conversation or increasing your budget.
              </Alert>
            )}

            {/* Help Text */}
            <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                💡 Token costs are tracked in real-time. Agents are economically responsible 
                and will only engage when they can add significant value.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* Budget Settings Dialog */}
      <Dialog 
        open={showSettings} 
        onClose={() => setShowSettings(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #334155'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Token Budget Settings
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Total Budget ($)"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              inputProps={{ step: 0.01, min: 0.01 }}
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

            <TextField
              label="Max Agent Exchanges"
              type="number"
              value={maxExchanges}
              onChange={(e) => setMaxExchanges(e.target.value)}
              inputProps={{ min: 1, max: 20 }}
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

            <FormControlLabel
              control={
                <Switch
                  checked={autoStopEnabled}
                  onChange={(e) => setAutoStopEnabled(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3b82f6'
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#3b82f6'
                    }
                  }}
                />
              }
              label="Auto-stop when budget exceeded"
              sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSettings(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateBudget}
            disabled={isLoading}
            sx={{ 
              bgcolor: '#3b82f6', 
              color: 'white',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Update Budget
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TokenBudgetWidget;

