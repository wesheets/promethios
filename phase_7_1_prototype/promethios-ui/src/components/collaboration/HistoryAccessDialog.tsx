/**
 * HistoryAccessDialog - Interface for setting conversation history access when inviting users
 * Provides granular controls for what history new participants can see
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
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Schedule as TimeIcon,
  Numbers as CountIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import ConversationHistoryService, { HistoryAccessLevel, FilteredHistory } from '../../services/ConversationHistoryService';

export interface HistoryAccessDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (accessLevel: HistoryAccessLevel) => void;
  conversationId: string;
  inviteeName: string;
  conversationName: string;
}

export const HistoryAccessDialog: React.FC<HistoryAccessDialogProps> = ({
  open,
  onClose,
  onConfirm,
  conversationId,
  inviteeName,
  conversationName
}) => {
  const [selectedAccess, setSelectedAccess] = useState<HistoryAccessLevel['type']>('recent');
  const [customMessageCount, setCustomMessageCount] = useState(50);
  const [customTimeValue, setCustomTimeValue] = useState(2);
  const [customTimeUnit, setCustomTimeUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [historyPreview, setHistoryPreview] = useState<FilteredHistory | null>(null);
  const [conversationSummary, setConversationSummary] = useState<any>(null);

  const historyService = ConversationHistoryService.getInstance();

  // Load conversation summary
  useEffect(() => {
    if (open && conversationId) {
      const summary = historyService.getHistorySummary(conversationId);
      setConversationSummary(summary);
    }
  }, [open, conversationId]);

  // Generate preview when access level changes
  useEffect(() => {
    if (open && conversationId && showPreview) {
      generatePreview();
    }
  }, [selectedAccess, customMessageCount, customTimeValue, customTimeUnit, customStartDate, customEndDate, showPreview]);

  const generatePreview = async () => {
    const accessLevel = getCurrentAccessLevel();
    
    // Mock participant ID for preview
    const mockParticipantId = 'preview_user';
    
    try {
      await historyService.setParticipantHistoryAccess(conversationId, mockParticipantId, accessLevel, 'current_user');
      const preview = await historyService.getFilteredHistory(conversationId, mockParticipantId);
      setHistoryPreview(preview);
    } catch (error) {
      console.error('Failed to generate history preview:', error);
    }
  };

  const getCurrentAccessLevel = (): HistoryAccessLevel => {
    switch (selectedAccess) {
      case 'none':
        return { type: 'none' };
      
      case 'limited':
        return {
          type: 'limited',
          messageCount: customMessageCount,
          timeRange: { value: customTimeValue, unit: customTimeUnit }
        };
      
      case 'custom':
        return {
          type: 'custom',
          startDate: customStartDate ? new Date(customStartDate) : undefined,
          endDate: customEndDate ? new Date(customEndDate) : undefined
        };
      
      case 'full':
      default:
        return { type: 'full' };
    }
  };

  const handleConfirm = () => {
    const accessLevel = getCurrentAccessLevel();
    onConfirm(accessLevel);
    onClose();
  };

  const accessOptions = historyService.getHistoryAccessOptions();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          color: 'white',
          border: '1px solid #334155',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid #334155', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ color: '#3b82f6' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Conversation History Access
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Choose what history {inviteeName} can see in "{conversationName}"
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {/* Conversation Summary */}
        {conversationSummary && (
          <Card sx={{ mb: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#3b82f6' }}>
                Conversation Overview
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CountIcon />}
                  label={`${conversationSummary.totalMessages} messages`}
                  size="small"
                  sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
                />
                <Chip
                  icon={<SecurityIcon />}
                  label={`${conversationSummary.privateSegments} private segments`}
                  size="small"
                  sx={{ bgcolor: '#ef444420', color: '#ef4444' }}
                />
                <Chip
                  icon={<CalendarIcon />}
                  label={conversationSummary.timeSpan}
                  size="small"
                  sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Access Level Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            History Access Level
          </Typography>
          
          <RadioGroup
            value={selectedAccess}
            onChange={(e) => setSelectedAccess(e.target.value as HistoryAccessLevel['type'])}
          >
            {accessOptions.map((option) => (
              <Box key={option.type} sx={{ mb: 2 }}>
                <FormControlLabel
                  value={option.type}
                  control={<Radio sx={{ color: '#3b82f6' }} />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {option.icon} {option.label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {option.description}
                      </Typography>
                    </Box>
                  }
                />

                {/* Custom controls for limited access */}
                {selectedAccess === 'limited' && option.type === 'limited' && (
                  <Box sx={{ ml: 4, mt: 2, p: 2, bgcolor: '#0f172a', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Limit Settings
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1, display: 'block' }}>
                        Maximum Messages: {customMessageCount}
                      </Typography>
                      <Slider
                        value={customMessageCount}
                        onChange={(_, value) => setCustomMessageCount(value as number)}
                        min={10}
                        max={500}
                        step={10}
                        sx={{ color: '#3b82f6' }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TextField
                        label="Time Limit"
                        type="number"
                        value={customTimeValue}
                        onChange={(e) => setCustomTimeValue(Number(e.target.value))}
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#1e293b',
                            color: 'white',
                            '& fieldset': { borderColor: '#475569' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#94a3b8' }
                        }}
                      />
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={customTimeUnit}
                          onChange={(e) => setCustomTimeUnit(e.target.value as any)}
                          sx={{
                            bgcolor: '#1e293b',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
                          }}
                        >
                          <MenuItem value="minutes">Minutes</MenuItem>
                          <MenuItem value="hours">Hours</MenuItem>
                          <MenuItem value="days">Days</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                )}

                {/* Custom controls for custom range */}
                {selectedAccess === 'custom' && option.type === 'custom' && (
                  <Box sx={{ ml: 4, mt: 2, p: 2, bgcolor: '#0f172a', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Custom Date Range
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Start Date"
                        type="datetime-local"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        size="small"
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#1e293b',
                            color: 'white',
                            '& fieldset': { borderColor: '#475569' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#94a3b8' }
                        }}
                      />
                      <TextField
                        label="End Date"
                        type="datetime-local"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        size="small"
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#1e293b',
                            color: 'white',
                            '& fieldset': { borderColor: '#475569' },
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                          },
                          '& .MuiInputLabel-root': { color: '#94a3b8' }
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </RadioGroup>
        </Box>

        <Divider sx={{ bgcolor: '#334155', my: 3 }} />

        {/* Privacy Notice */}
        <Alert
          severity="info"
          icon={<SecurityIcon />}
          sx={{
            mb: 3,
            bgcolor: '#3b82f620',
            border: '1px solid #3b82f6',
            '& .MuiAlert-icon': { color: '#3b82f6' },
            '& .MuiAlert-message': { color: '#e2e8f0' }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            Privacy Protection Active
          </Typography>
          <Typography variant="caption">
            Private conversation segments are automatically hidden from new participants, 
            regardless of history access level.
          </Typography>
        </Alert>

        {/* History Preview */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <IconButton
              onClick={() => setShowPreview(!showPreview)}
              size="small"
              sx={{ color: '#94a3b8' }}
            >
              {showPreview ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Preview What {inviteeName} Will See
            </Typography>
          </Box>

          <Collapse in={showPreview}>
            {historyPreview && (
              <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155' }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      icon={<VisibilityIcon />}
                      label={`${historyPreview.accessibleMessages} accessible messages`}
                      size="small"
                      sx={{ bgcolor: '#10b98120', color: '#10b981' }}
                    />
                    <Chip
                      icon={<VisibilityOffIcon />}
                      label={`${historyPreview.hiddenSegments} private segments hidden`}
                      size="small"
                      sx={{ bgcolor: '#ef444420', color: '#ef4444' }}
                    />
                  </Box>
                  
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Time range: {historyPreview.timeRange.start.toLocaleString()} - {historyPreview.timeRange.end.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Collapse>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #334155', pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: '#94a3b8' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' }
          }}
        >
          Set History Access
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistoryAccessDialog;

