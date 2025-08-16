import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Checkbox,
  Menu,
  MenuList,
  ListItemButton,
} from '@mui/material';
import {
  ExpandMore,
  Receipt,
  Verified,
  Download,
  Search,
  FilterList,
  CheckCircle,
  Error,
  Warning,
  Info,
  Link,
  ContentCopy,
  Refresh,
  Chat,
  PlayArrow,
  Compare,
  Timeline,
  Psychology,
} from '@mui/icons-material';
import { universalGovernanceAdapter } from '../../services/UniversalGovernanceAdapter';
import { EnhancedToolReceipt } from '../../extensions/ComprehensiveToolReceiptExtension';
import { InteractiveReceiptExtension, ReceiptChatContext } from '../../extensions/InteractiveReceiptExtension';

interface AgentReceiptViewerProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  // New props for interactive functionality
  onReceiptClick?: (receiptId: string, context: ReceiptChatContext) => void;
  onMultiReceiptSelect?: (receiptIds: string[], context: ReceiptChatContext) => void;
  enableInteractiveMode?: boolean;
  currentUserId?: string;
  currentSessionId?: string;
}

const AgentReceiptViewer: React.FC<AgentReceiptViewerProps> = ({
  agentId,
  agentName,
  onClose,
  // Interactive props with defaults
  onReceiptClick,
  onMultiReceiptSelect,
  enableInteractiveMode = false,
  currentUserId = '',
  currentSessionId = '',
}) => {
  const [receipts, setReceipts] = useState<EnhancedToolReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  
  // Interactive receipt state
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [contextMenuReceiptId, setContextMenuReceiptId] = useState<string | null>(null);
  const [interactiveExtension] = useState(() => InteractiveReceiptExtension.getInstance());

  useEffect(() => {
    loadReceipts();
    
    // Initialize interactive extension if enabled
    if (enableInteractiveMode) {
      initializeInteractiveMode();
    }
  }, [agentId, enableInteractiveMode]);

  const initializeInteractiveMode = async () => {
    try {
      await interactiveExtension.initialize();
      console.log('✅ Interactive receipt mode initialized');
    } catch (error) {
      console.error('❌ Failed to initialize interactive receipt mode:', error);
    }
  };

  // Interactive receipt handlers
  const handleReceiptClick = async (receiptId: string, event: React.MouseEvent) => {
    if (!enableInteractiveMode || !onReceiptClick) return;
    
    // Prevent accordion expansion when clicking for interaction
    event.stopPropagation();
    
    try {
      const context = await interactiveExtension.handleReceiptClick(
        receiptId, 
        currentUserId, 
        currentSessionId
      );
      
      onReceiptClick(receiptId, context);
      console.log('✅ Receipt clicked:', receiptId);
    } catch (error) {
      console.error('❌ Failed to handle receipt click:', error);
    }
  };

  const handleReceiptSelect = (receiptId: string, selected: boolean) => {
    const newSelection = new Set(selectedReceipts);
    if (selected) {
      newSelection.add(receiptId);
    } else {
      newSelection.delete(receiptId);
    }
    setSelectedReceipts(newSelection);
  };

  const handleMultiReceiptAction = async () => {
    if (!enableInteractiveMode || !onMultiReceiptSelect || selectedReceipts.size === 0) return;
    
    try {
      const receiptIds = Array.from(selectedReceipts);
      const context = await interactiveExtension.handleMultiReceiptSelection(
        receiptIds,
        currentUserId,
        currentSessionId
      );
      
      onMultiReceiptSelect(receiptIds, context);
      setSelectedReceipts(new Set()); // Clear selection
      console.log('✅ Multi-receipt selection processed:', receiptIds);
    } catch (error) {
      console.error('❌ Failed to handle multi-receipt selection:', error);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, receiptId: string) => {
    if (!enableInteractiveMode) return;
    
    event.preventDefault();
    setContextMenuAnchor(event.currentTarget as HTMLElement);
    setContextMenuReceiptId(receiptId);
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
    setContextMenuReceiptId(null);
  };

  const handleContextMenuAction = async (action: string) => {
    if (!contextMenuReceiptId) return;
    
    try {
      switch (action) {
        case 'explain':
          await handleReceiptClick(contextMenuReceiptId, {} as React.MouseEvent);
          break;
        case 'retry':
          // TODO: Implement retry functionality
          console.log('Retry action for receipt:', contextMenuReceiptId);
          break;
        case 'continue':
          // TODO: Implement continue workflow functionality
          console.log('Continue workflow from receipt:', contextMenuReceiptId);
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('❌ Failed to handle context menu action:', error);
    } finally {
      handleContextMenuClose();
    }
  };

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use ChatPanelGovernanceService for receipt loading
      const { chatPanelGovernanceService } = await import('../../services/ChatPanelGovernanceService');
      const agentReceipts = await chatPanelGovernanceService.getAgentReceipts(agentId, 100);
      
      setReceipts(agentReceipts);
      console.log(`✅ Loaded ${agentReceipts.length} receipts for agent ${agentId}`);
      
    } catch (err) {
      console.error('❌ Failed to load receipts:', err);
      setError('Failed to load receipts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.receiptId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTool = toolFilter === 'all' || receipt.toolName.toLowerCase() === toolFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || receipt.outcome === statusFilter;
    
    return matchesSearch && matchesTool && matchesStatus;
  });

  const getStatusIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircle sx={{ color: '#10b981' }} />;
      case 'failure':
        return <Error sx={{ color: '#ef4444' }} />;
      case 'partial':
        return <Warning sx={{ color: '#f59e0b' }} />;
      default:
        return <Info sx={{ color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return '#10b981';
      case 'failure':
        return '#ef4444';
      case 'partial':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadReceipt = (receipt: EnhancedToolReceipt) => {
    const receiptData = JSON.stringify(receipt, null, 2);
    const blob = new Blob([receiptData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${receipt.receiptId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uniqueTools = [...new Set(receipts.map(r => r.toolName))];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2, color: '#94a3b8' }}>
          Loading receipts...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
            Agent Receipts
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {agentName} • {filteredReceipts.length} receipts
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadReceipts}
            sx={{
              borderColor: '#374151',
              color: '#94a3b8',
              '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: '#374151',
              color: '#94a3b8',
              '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
            }}
          >
            Close
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: '#7f1d1d', color: '#fecaca' }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: '#6b7280', mr: 1 }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  '& fieldset': { borderColor: '#374151' },
                  '&:hover fieldset': { borderColor: '#4b5563' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Tool</InputLabel>
              <Select
                value={toolFilter}
                onChange={(e) => setToolFilter(e.target.value)}
                sx={{
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                }}
              >
                <MenuItem value="all">All Tools</MenuItem>
                {uniqueTools.map(tool => (
                  <MenuItem key={tool} value={tool}>{tool}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failure">Failure</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
              {filteredReceipts.length} results
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#1e293b', borderRadius: 2 }}>
          <Receipt sx={{ fontSize: 48, color: '#6b7280', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
            No receipts found
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            This agent hasn't performed any tool actions yet, or no receipts match your filters.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {filteredReceipts.map((receipt) => (
            <Accordion
              key={receipt.receiptId}
              expanded={expandedReceipt === receipt.receiptId}
              onChange={() => setExpandedReceipt(
                expandedReceipt === receipt.receiptId ? null : receipt.receiptId
              )}
              sx={{
                mb: 2,
                bgcolor: '#1e293b',
                color: '#e2e8f0',
                '&:before': { display: 'none' },
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#94a3b8' }} />}
                sx={{
                  bgcolor: '#334155',
                  '&:hover': { bgcolor: enableInteractiveMode ? '#3b82f6' : '#475569' },
                  cursor: enableInteractiveMode ? 'pointer' : 'default',
                }}
                onContextMenu={(e) => handleContextMenu(e, receipt.receiptId)}
              >
                <Box display="flex" alignItems="center" width="100%" gap={2}>
                  {/* Interactive checkbox for multi-select */}
                  {enableInteractiveMode && (
                    <Checkbox
                      checked={selectedReceipts.has(receipt.receiptId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleReceiptSelect(receipt.receiptId, e.target.checked);
                      }}
                      sx={{
                        color: '#94a3b8',
                        '&.Mui-checked': { color: '#3b82f6' },
                      }}
                    />
                  )}
                  
                  {getStatusIcon(receipt.outcome)}
                  <Box flex={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {receipt.toolName}: {receipt.actionType}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {new Date(receipt.timestamp).toLocaleString()} • {receipt.receiptId}
                    </Typography>
                  </Box>
                  <Chip
                    label={receipt.outcome}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(receipt.outcome),
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                  
                  {/* Interactive action buttons */}
                  {enableInteractiveMode && (
                    <Box display="flex" gap={1}>
                      <Tooltip title="Load into chat">
                        <IconButton
                          size="small"
                          onClick={(e) => handleReceiptClick(receipt.receiptId, e)}
                          sx={{
                            color: '#3b82f6',
                            '&:hover': { bgcolor: '#1e40af', color: 'white' },
                          }}
                        >
                          <Chat />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Show thinking process">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Show cognitive context
                          }}
                          sx={{
                            color: '#8b5cf6',
                            '&:hover': { bgcolor: '#7c3aed', color: 'white' },
                          }}
                        >
                          <Psychology />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: '#1e293b' }}>
                <Grid container spacing={3}>
                  {/* Receipt Details */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#f1f5f9' }}>
                      Receipt Details
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Receipt ID"
                          secondary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                {receipt.receiptId}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(receipt.receiptId)}
                              >
                                <ContentCopy sx={{ fontSize: 16, color: '#6b7280' }} />
                              </IconButton>
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Checksum"
                          secondary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                {receipt.checksum.substring(0, 16)}...
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(receipt.checksum)}
                              >
                                <ContentCopy sx={{ fontSize: 16, color: '#6b7280' }} />
                              </IconButton>
                            </Box>
                          }
                        />
                      </ListItem>
                      {receipt.apiCallId && (
                        <ListItem>
                          <ListItemText
                            primary="API Call ID"
                            secondary={receipt.apiCallId}
                          />
                        </ListItem>
                      )}
                      {receipt.recordIds && receipt.recordIds.length > 0 && (
                        <ListItem>
                          <ListItemText
                            primary="Record IDs"
                            secondary={receipt.recordIds.join(', ')}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>

                  {/* Governance Info */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#f1f5f9' }}>
                      Governance
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          {receipt.governanceCheck ? (
                            <CheckCircle sx={{ color: '#10b981' }} />
                          ) : (
                            <Error sx={{ color: '#ef4444' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary="Governance Check"
                          secondary={receipt.governanceCheck ? 'Passed' : 'Failed'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Trust Score Impact"
                          secondary={`${receipt.trustScoreImpact > 0 ? '+' : ''}${receipt.trustScoreImpact}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Compliance Status"
                          secondary={receipt.complianceStatus}
                        />
                      </ListItem>
                    </List>
                  </Grid>

                  {/* Action Details */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#f1f5f9' }}>
                      Action Details
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                        Parameters:
                      </Typography>
                      <pre style={{ 
                        color: '#e2e8f0', 
                        fontSize: '12px', 
                        overflow: 'auto',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {JSON.stringify(receipt.parameters, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12}>
                    <Box display="flex" gap={2} justifyContent="flex-end">
                      {receipt.verificationUrl && (
                        <Button
                          variant="outlined"
                          startIcon={<Link />}
                          onClick={() => window.open(receipt.verificationUrl, '_blank')}
                          sx={{
                            borderColor: '#374151',
                            color: '#94a3b8',
                            '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
                          }}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => downloadReceipt(receipt)}
                        sx={{
                          borderColor: '#374151',
                          color: '#94a3b8',
                          '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
                        }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Multi-select action bar */}
      {enableInteractiveMode && selectedReceipts.size > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 2,
            bgcolor: '#1e293b',
            border: '1px solid #374151',
            borderRadius: 2,
            zIndex: 1000,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {selectedReceipts.size} receipt{selectedReceipts.size !== 1 ? 's' : ''} selected
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Compare />}
              onClick={handleMultiReceiptAction}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Analyze Together
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedReceipts(new Set())}
              sx={{
                borderColor: '#374151',
                color: '#94a3b8',
                '&:hover': { borderColor: '#4b5563', bgcolor: '#1e293b' },
              }}
            >
              Clear
            </Button>
          </Box>
        </Paper>
      )}

      {/* Context menu for receipt actions */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            border: '1px solid #374151',
            '& .MuiMenuItem-root': {
              color: '#e2e8f0',
              '&:hover': { bgcolor: '#334155' },
            },
          },
        }}
      >
        <MenuList>
          <ListItemButton onClick={() => handleContextMenuAction('explain')}>
            <ListItemIcon>
              <Psychology sx={{ color: '#94a3b8' }} />
            </ListItemIcon>
            <ListItemText primary="Explain Decision" />
          </ListItemButton>
          <ListItemButton onClick={() => handleContextMenuAction('retry')}>
            <ListItemIcon>
              <PlayArrow sx={{ color: '#94a3b8' }} />
            </ListItemIcon>
            <ListItemText primary="Retry with Changes" />
          </ListItemButton>
          <ListItemButton onClick={() => handleContextMenuAction('continue')}>
            <ListItemIcon>
              <Timeline sx={{ color: '#94a3b8' }} />
            </ListItemIcon>
            <ListItemText primary="Continue Workflow" />
          </ListItemButton>
        </MenuList>
      </Menu>
    </Box>
  );
};

export { AgentReceiptViewer };
export default AgentReceiptViewer;

