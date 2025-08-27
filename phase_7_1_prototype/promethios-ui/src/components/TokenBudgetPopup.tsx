import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { TokenEconomicsService } from '../services/TokenEconomicsService';

interface TokenBudgetPopupProps {
  open: boolean;
  onClose: () => void;
  sessionId?: string;
}

interface BudgetData {
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  agentExchanges: number;
  maxExchanges: number;
  usagePercentage: number;
  estimatedTimeRemaining: string;
}

const TokenBudgetPopup: React.FC<TokenBudgetPopupProps> = ({
  open,
  onClose,
  sessionId
}) => {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 5.00,
    usedBudget: 0.00,
    remainingBudget: 5.00,
    agentExchanges: 0,
    maxExchanges: 5,
    usagePercentage: 0,
    estimatedTimeRemaining: 'Unlimited'
  });
  const [newBudget, setNewBudget] = useState<string>('5.00');
  const [showSettings, setShowSettings] = useState(false);
  const [autoStop, setAutoStop] = useState(true);
  const [warningThreshold, setWarningThreshold] = useState(70);

  const tokenService = TokenEconomicsService.getInstance();

  useEffect(() => {
    if (open && sessionId) {
      loadBudgetData();
      const interval = setInterval(loadBudgetData, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [open, sessionId]);

  const loadBudgetData = async () => {
    if (!sessionId) return;

    try {
      const budget = await tokenService.getSessionBudget(sessionId);
      const usage = await tokenService.getSessionUsage(sessionId);
      
      const usedBudget = usage?.totalCost || 0;
      const remainingBudget = Math.max(0, budget.amount - usedBudget);
      const usagePercentage = budget.amount > 0 ? (usedBudget / budget.amount) * 100 : 0;

      setBudgetData({
        totalBudget: budget.amount,
        usedBudget,
        remainingBudget,
        agentExchanges: usage?.exchanges || 0,
        maxExchanges: 5, // Could be configurable
        usagePercentage,
        estimatedTimeRemaining: remainingBudget > 0 ? 'Active' : 'Depleted'
      });
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  };

  const handleBudgetUpdate = async () => {
    if (!sessionId) return;

    try {
      const amount = parseFloat(newBudget);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid budget amount');
        return;
      }

      await tokenService.updateSessionBudget(sessionId, amount);
      await loadBudgetData();
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Failed to update budget');
    }
  };

  const handleRefresh = () => {
    loadBudgetData();
  };

  const getBudgetColor = () => {
    if (budgetData.usagePercentage >= 90) return '#ef4444';
    if (budgetData.usagePercentage >= warningThreshold) return '#f59e0b';
    return '#10b981';
  };

  const getBudgetStatus = () => {
    if (budgetData.usagePercentage >= 90) return 'Critical';
    if (budgetData.usagePercentage >= warningThreshold) return 'Warning';
    return 'Good';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WalletIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" sx={{ color: '#f1f5f9' }}>
            Token Budget Tracker
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={handleRefresh}
            sx={{ color: '#94a3b8' }}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton 
            onClick={() => setShowSettings(!showSettings)}
            sx={{ color: '#94a3b8' }}
            size="small"
          >
            <SettingsIcon />
          </IconButton>
          <IconButton 
            onClick={onClose}
            sx={{ color: '#94a3b8' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Budget Status Alert */}
        {budgetData.usagePercentage >= warningThreshold && (
          <Alert 
            severity={budgetData.usagePercentage >= 90 ? "error" : "warning"}
            sx={{ 
              mb: 2, 
              bgcolor: budgetData.usagePercentage >= 90 ? '#ef444420' : '#f59e0b20',
              border: `1px solid ${budgetData.usagePercentage >= 90 ? '#ef444440' : '#f59e0b40'}`
            }}
          >
            {budgetData.usagePercentage >= 90 
              ? 'Budget critically low! Consider increasing your budget.'
              : 'Budget warning: You\'re approaching your spending limit.'
            }
          </Alert>
        )}

        {/* Main Budget Display */}
        <Card sx={{ mb: 2, bgcolor: '#0f172a', border: '1px solid #334155' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Budget Usage
                </Typography>
                <Typography variant="h4" sx={{ color: getBudgetColor(), fontWeight: 'bold' }}>
                  ${budgetData.usedBudget.toFixed(4)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  of ${budgetData.totalBudget.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Remaining Budget
                </Typography>
                <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                  ${budgetData.remainingBudget.toFixed(4)}
                </Typography>
                <Chip 
                  label={getBudgetStatus()}
                  size="small"
                  sx={{ 
                    bgcolor: getBudgetColor() + '20',
                    color: getBudgetColor(),
                    border: `1px solid ${getBudgetColor()}40`
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Usage Progress
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  {budgetData.usagePercentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(budgetData.usagePercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getBudgetColor(),
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Agent Exchanges */}
        <Card sx={{ mb: 2, bgcolor: '#0f172a', border: '1px solid #334155' }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
              Agent Exchanges
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 'bold' }}>
                {budgetData.agentExchanges}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                / {budgetData.maxExchanges}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(budgetData.agentExchanges / budgetData.maxExchanges) * 100}
                sx={{
                  flexGrow: 1,
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
          </CardContent>
        </Card>

        {/* Settings Panel */}
        {showSettings && (
          <Card sx={{ mb: 2, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 2 }}>
                Budget Settings
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="New Budget Amount"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#1e293b',
                      '& fieldset': { borderColor: '#475569' },
                      '&:hover fieldset': { borderColor: '#64748b' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                    '& .MuiInputBase-input': { color: '#f1f5f9' }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleBudgetUpdate}
                  sx={{
                    bgcolor: '#3b82f6',
                    '&:hover': { bgcolor: '#2563eb' }
                  }}
                >
                  Update Budget
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowSettings(false)}
                  sx={{
                    borderColor: '#475569',
                    color: '#94a3b8',
                    '&:hover': { borderColor: '#64748b' }
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
          💡 Token costs are tracked in real-time. Agents are economically responsible and will only engage when they can add significant value.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default TokenBudgetPopup;

