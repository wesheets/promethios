import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Badge,
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
  Science as ResearchIcon,
  Description as DocumentIcon,
  Build as ToolIcon,
} from '@mui/icons-material';
import { universalGovernanceAdapter } from '../../services/UniversalGovernanceAdapter';
import { EnhancedToolReceipt } from '../../extensions/ComprehensiveToolReceiptExtension';
import { InteractiveReceiptExtension, ReceiptChatContext } from '../../extensions/InteractiveReceiptExtension';

// Enhanced interfaces for the consolidated receipts system
interface ResearchItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  sources: string[];
  findings: string[];
  cryptographicHash: string;
  agentId: string;
  sessionId: string;
}

interface DocumentItem {
  id: string;
  title: string;
  type: 'document' | 'code' | 'image' | 'video' | 'spreadsheet';
  content: string;
  timestamp: Date;
  size: number;
  cryptographicHash: string;
  agentId: string;
  sessionId: string;
}

// Tab types for the enhanced receipts viewer
type ReceiptTabType = 'tools' | 'research' | 'documents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`receipts-tabpanel-${index}`}
      aria-labelledby={`receipts-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
}

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
  // Enhanced state for consolidated receipts system
  const [activeTab, setActiveTab] = useState<number>(0);
  const [receipts, setReceipts] = useState<EnhancedToolReceipt[]>([]);
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // last_hour, last_day, last_week, last_month, custom
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [trustScoreRange, setTrustScoreRange] = useState<[number, number]>([0, 1]);
  const [governanceFilter, setGovernanceFilter] = useState<string>('all'); // compliant, warning, violation
  const [cognitiveFilter, setCognitiveFilter] = useState<string>('all'); // high_confidence, uncertain, complex
  const [emotionalFilter, setEmotionalFilter] = useState<string>('all'); // confident, curious, concerned
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [advancedSearchMode, setAdvancedSearchMode] = useState(false);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<string>('none'); // none, tool, date, session, trust_score
  const [sortBy, setSortBy] = useState<string>('timestamp'); // timestamp, trust_score, tool_name
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  
  // Interactive receipt state
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [contextMenuReceiptId, setContextMenuReceiptId] = useState<string | null>(null);
  const [interactiveExtension] = useState(() => InteractiveReceiptExtension.getInstance());

  useEffect(() => {
    loadAllReceiptData();
    
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

  // Enhanced loading function that wires to 69-field cryptographic audit logs
  const loadAllReceiptData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔐 Loading comprehensive receipt data from cryptographic audit logs for agent ${agentId}`);
      
      // Wire to UniversalAuditLoggingService for 69-field audit data
      const auditLogs = await universalGovernanceAdapter.searchAuditLogs({
        agentId,
        limit: 1000, // Load more for comprehensive search
        includeAllFields: true // Get all 69 fields
      });
      
      // Transform audit logs into different receipt types
      const toolReceipts: EnhancedToolReceipt[] = [];
      const research: ResearchItem[] = [];
      const documents: DocumentItem[] = [];
      
      auditLogs.forEach((log: any) => {
        // Tool execution receipts
        if (log.contextType === 'tool_execution') {
          toolReceipts.push({
            receiptId: log.interactionId,
            toolName: log.toolName || 'Unknown Tool',
            actionType: log.actionType || 'execute',
            timestamp: new Date(log.timestamp),
            status: log.success ? 'success' : 'failed',
            cryptographicHash: log.cryptographicHash,
            trustScore: log.trustScore || 0,
            governanceStatus: log.complianceScore > 0.8 ? 'compliant' : 'warning',
            // Map all 69 fields for comprehensive search
            auditData: log
          });
        }
        
        // Research receipts
        if (log.contextType === 'research' || log.toolName === 'web_search') {
          research.push({
            id: log.interactionId,
            title: log.inputMessage?.substring(0, 100) || 'Research Session',
            description: log.outputResponse?.substring(0, 200) || '',
            timestamp: new Date(log.timestamp),
            sources: log.sources || [],
            findings: log.findings || [log.outputResponse],
            cryptographicHash: log.cryptographicHash,
            agentId: log.agentId,
            sessionId: log.sessionId
          });
        }
        
        // Document receipts
        if (log.contextType === 'document_creation' || log.toolName === 'document_generation') {
          documents.push({
            id: log.interactionId,
            title: log.documentTitle || log.inputMessage?.substring(0, 50) || 'Generated Document',
            type: log.documentType || 'document',
            content: log.outputResponse || '',
            timestamp: new Date(log.timestamp),
            size: log.outputResponse?.length || 0,
            cryptographicHash: log.cryptographicHash,
            agentId: log.agentId,
            sessionId: log.sessionId
          });
        }
      });
      
      setReceipts(toolReceipts);
      setResearchItems(research);
      setDocumentItems(documents);
      
      console.log(`✅ Loaded ${toolReceipts.length} tool receipts, ${research.length} research items, ${documents.length} documents from cryptographic audit logs`);
      
    } catch (err) {
      console.error('❌ Failed to load receipt data from audit logs:', err);
      setError('Failed to load receipt data. Please try again.');
      
      // Fallback to existing service for backwards compatibility
      try {
        const { chatPanelGovernanceService } = await import('../../services/ChatPanelGovernanceService');
        const agentReceipts = await chatPanelGovernanceService.getAgentReceipts(agentId, 100);
        setReceipts(agentReceipts);
        console.log(`⚠️ Fallback: Loaded ${agentReceipts.length} receipts from legacy service`);
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive filtering function for massive receipt datasets
  const getFilteredData = () => {
    const currentData = activeTab === 0 ? receipts : activeTab === 1 ? researchItems : documentItems;
    
    return currentData.filter((item: any) => {
      // Text search across all fields
      const searchableText = JSON.stringify(item).toLowerCase();
      const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm.toLowerCase());
      
      // Date filtering
      const itemDate = new Date(item.timestamp);
      const now = new Date();
      let matchesDate = true;
      
      switch (dateFilter) {
        case 'last_hour':
          matchesDate = (now.getTime() - itemDate.getTime()) <= 3600000;
          break;
        case 'last_day':
          matchesDate = (now.getTime() - itemDate.getTime()) <= 86400000;
          break;
        case 'last_week':
          matchesDate = (now.getTime() - itemDate.getTime()) <= 604800000;
          break;
        case 'last_month':
          matchesDate = (now.getTime() - itemDate.getTime()) <= 2592000000;
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            matchesDate = itemDate >= customDateRange.start && itemDate <= customDateRange.end;
          }
          break;
        default:
          matchesDate = true;
      }
      
      // Tool type filtering (for receipts tab)
      const matchesTool = activeTab === 0 ? 
        (toolFilter === 'all' || (item as EnhancedToolReceipt).toolName === toolFilter) : true;
      
      // Status filtering
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      // Trust score filtering (for receipts)
      const matchesTrustScore = activeTab === 0 ? 
        ((item as EnhancedToolReceipt).trustScore >= trustScoreRange[0] && 
         (item as EnhancedToolReceipt).trustScore <= trustScoreRange[1]) : true;
      
      // Governance filtering
      const matchesGovernance = activeTab === 0 ? 
        (governanceFilter === 'all' || (item as EnhancedToolReceipt).governanceStatus === governanceFilter) : true;
      
      // Session filtering
      const matchesSession = sessionFilter === 'all' || item.sessionId === sessionFilter;
      
      return matchesSearch && matchesDate && matchesTool && matchesStatus && 
             matchesTrustScore && matchesGovernance && matchesSession;
    }).sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'trust_score':
          aValue = a.trustScore || 0;
          bValue = b.trustScore || 0;
          break;
        case 'tool_name':
          aValue = a.toolName || a.title || '';
          bValue = b.toolName || b.title || '';
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Quick filter functions
  const applyQuickFilter = (filterType: string) => {
    switch (filterType) {
      case 'today':
        setDateFilter('last_day');
        break;
      case 'successful':
        setStatusFilter('success');
        break;
      case 'high_trust':
        setTrustScoreRange([0.8, 1]);
        break;
      case 'violations':
        setGovernanceFilter('violation');
        break;
      case 'research_only':
        setActiveTab(1);
        break;
      case 'documents_only':
        setActiveTab(2);
        break;
      default:
        break;
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setToolFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setCustomDateRange({start: null, end: null});
    setTrustScoreRange([0, 1]);
    setGovernanceFilter('all');
    setCognitiveFilter('all');
    setEmotionalFilter('all');
    setSessionFilter('all');
    setQuickFilters([]);
  };

  const filteredData = getFilteredData();

  // Get unique values for filter dropdowns
  const uniqueTools = [...new Set(receipts.map(r => r.toolName))];
  const uniqueSessions = [...new Set([...receipts.map(r => r.sessionId || ''), ...researchItems.map(r => r.sessionId), ...documentItems.map(r => r.sessionId)])];

  // Update references to use filteredData instead of filteredReceipts
  const currentTabData = filteredData;

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
      {/* Enhanced Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
            Agent Receipts & Artifacts
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {agentName} • {currentTabData.length} items • Cryptographically verified
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadAllReceiptData}
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

      {/* Enhanced Tab Navigation */}
      <Paper sx={{ mb: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': { color: '#94a3b8' },
            '& .Mui-selected': { color: '#3b82f6' },
            '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
          }}
        >
          <Tab
            icon={<ToolIcon />}
            label={
              <Badge badgeContent={receipts.length} color="primary">
                Tool Executions
              </Badge>
            }
          />
          <Tab
            icon={<ResearchIcon />}
            label={
              <Badge badgeContent={researchItems.length} color="primary">
                Research
              </Badge>
            }
          />
          <Tab
            icon={<DocumentIcon />}
            label={
              <Badge badgeContent={documentItems.length} color="primary">
                Documents
              </Badge>
            }
          />
        </Tabs>
      </Paper>

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

