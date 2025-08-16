import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore,
  Memory,
  Psychology,
  TrendingUp,
  Lightbulb,
  History,
  AutoAwesome,
  CheckCircle,
  Schedule,
  Refresh,
  Search,
  ContentCopy,
} from '@mui/icons-material';
import { universalGovernanceAdapter } from '../../services/UniversalGovernanceAdapter';
import { MemoryContext } from '../../extensions/RecursiveMemoryExtension';

interface AgentMemoryViewerProps {
  agentId: string;
  agentName: string;
  sessionId?: string;
  onClose: () => void;
}

const AgentMemoryViewer: React.FC<AgentMemoryViewerProps> = ({
  agentId,
  agentName,
  sessionId,
  onClose,
}) => {
  const [memoryContext, setMemoryContext] = useState<MemoryContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('patterns');

  useEffect(() => {
    loadMemoryContext();
  }, [agentId, sessionId]);

  const loadMemoryContext = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (sessionId) {
        const context = await universalGovernanceAdapter.getAgentMemoryContext(agentId, sessionId);
        setMemoryContext(context);
        console.log(`✅ Loaded memory context for agent ${agentId}, session ${sessionId}`);
      } else {
        // Create a demo memory context for display
        const demoContext = await createDemoMemoryContext();
        setMemoryContext(demoContext);
        console.log(`✅ Created demo memory context for agent ${agentId}`);
      }
      
    } catch (err) {
      console.error('❌ Failed to load memory context:', err);
      setError('Failed to load memory context. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createDemoMemoryContext = async (): Promise<MemoryContext> => {
    return {
      agentId,
      sessionId: sessionId || 'demo-session',
      businessObjective: 'Customer support and lead generation',
      contextTags: ['customer_service', 'sales', 'technical_support'],
      createdAt: new Date(),
      lastUpdated: new Date(),
      receiptChains: [
        {
          chainId: 'chain_1',
          receipts: ['receipt_1', 'receipt_2', 'receipt_3'],
          pattern: 'email_followup_sequence',
          businessValue: 'Lead nurturing workflow',
          successRate: 0.85,
          lastUsed: new Date()
        },
        {
          chainId: 'chain_2',
          receipts: ['receipt_4', 'receipt_5'],
          pattern: 'salesforce_lead_creation',
          businessValue: 'Lead qualification and CRM entry',
          successRate: 0.92,
          lastUsed: new Date()
        }
      ],
      learnedPatterns: [
        {
          patternId: 'pattern_1',
          name: 'Email Follow-up Sequence',
          description: 'Automated email sequence for lead nurturing',
          triggerConditions: ['new_lead', 'email_inquiry'],
          actionSequence: [
            'Send welcome email',
            'Schedule follow-up in 3 days',
            'Create Salesforce lead record'
          ],
          successMetrics: {
            conversionRate: 0.23,
            responseRate: 0.67,
            satisfactionScore: 4.2
          },
          usageCount: 15,
          lastRefined: new Date()
        },
        {
          patternId: 'pattern_2',
          name: 'Technical Support Escalation',
          description: 'Escalation workflow for complex technical issues',
          triggerConditions: ['technical_complexity_high', 'customer_frustration'],
          actionSequence: [
            'Gather detailed issue information',
            'Create support ticket',
            'Assign to senior technician',
            'Send status update to customer'
          ],
          successMetrics: {
            resolutionTime: 2.5,
            customerSatisfaction: 4.6,
            escalationRate: 0.12
          },
          usageCount: 8,
          lastRefined: new Date()
        }
      ],
      workflowSuggestions: [
        {
          suggestionId: 'suggestion_1',
          title: 'Optimize Email Response Time',
          description: 'Based on recent patterns, consider automating initial email responses',
          confidence: 0.78,
          potentialImpact: 'High',
          estimatedTimeSaving: '2 hours/day',
          basedOnReceipts: ['receipt_1', 'receipt_2', 'receipt_6']
        },
        {
          suggestionId: 'suggestion_2',
          title: 'Integrate Slack Notifications',
          description: 'Add Slack notifications to high-priority lead workflows',
          confidence: 0.65,
          potentialImpact: 'Medium',
          estimatedTimeSaving: '30 minutes/day',
          basedOnReceipts: ['receipt_3', 'receipt_4']
        }
      ],
      contextualInsights: [
        'Agent performs best with customer service inquiries between 9 AM - 5 PM',
        'Email response patterns show 23% higher engagement with personalized subject lines',
        'Salesforce integration reduces manual data entry by 67%',
        'Technical escalations are most effective when including detailed error logs'
      ],
      memoryStats: {
        totalReceipts: 25,
        totalPatterns: 2,
        totalWorkflows: 3,
        averageSuccessRate: 0.88,
        memoryEfficiency: 0.92,
        lastOptimization: new Date()
      }
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return '#10b981';
    if (rate >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2, color: '#94a3b8' }}>
          Loading memory context...
        </Typography>
      </Box>
    );
  }

  if (!memoryContext) {
    return (
      <Box sx={{ p: 3, bgcolor: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#1e293b', borderRadius: 2 }}>
          <Memory sx={{ fontSize: 48, color: '#6b7280', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
            No memory context available
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            This agent hasn't built up memory context yet. Memory is created through tool usage and pattern learning.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
            Agent Memory
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {agentName} • {memoryContext.memoryStats.totalReceipts} receipts • {memoryContext.memoryStats.totalPatterns} patterns
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadMemoryContext}
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

      {/* Memory Stats Overview */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#f1f5f9' }}>
          Memory Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                {memoryContext.memoryStats.totalReceipts}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Total Receipts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 600 }}>
                {memoryContext.memoryStats.totalPatterns}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Learned Patterns
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                {Math.round(memoryContext.memoryStats.averageSuccessRate * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Success Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                {Math.round(memoryContext.memoryStats.memoryEfficiency * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Efficiency
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Business Objective */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#f1f5f9' }}>
          Business Objective
        </Typography>
        <Typography variant="body1" sx={{ color: '#e2e8f0', mb: 2 }}>
          {memoryContext.businessObjective}
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {memoryContext.contextTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                bgcolor: '#374151',
                color: '#e2e8f0',
                '&:hover': { bgcolor: '#4b5563' },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Learned Patterns */}
      <Accordion
        expanded={expandedSection === 'patterns'}
        onChange={() => setExpandedSection(expandedSection === 'patterns' ? null : 'patterns')}
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
            '&:hover': { bgcolor: '#475569' },
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Psychology sx={{ color: '#8b5cf6' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Learned Patterns ({memoryContext.learnedPatterns.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ bgcolor: '#1e293b' }}>
          {memoryContext.learnedPatterns.map((pattern) => (
            <Card key={pattern.patternId} sx={{ mb: 2, bgcolor: '#0f172a', borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 1 }}>
                      {pattern.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                      {pattern.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={`Used ${pattern.usageCount} times`}
                    size="small"
                    sx={{ bgcolor: '#374151', color: '#e2e8f0' }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#f1f5f9', mb: 1 }}>
                      Trigger Conditions:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      {pattern.triggerConditions.map((condition, index) => (
                        <Chip
                          key={index}
                          label={condition}
                          size="small"
                          sx={{ bgcolor: '#1e293b', color: '#94a3b8' }}
                        />
                      ))}
                    </Box>

                    <Typography variant="subtitle2" sx={{ color: '#f1f5f9', mb: 1 }}>
                      Action Sequence:
                    </Typography>
                    <List dense>
                      {pattern.actionSequence.map((action, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                              {index + 1}.
                            </Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={action}
                            sx={{ '& .MuiListItemText-primary': { color: '#e2e8f0', fontSize: '0.875rem' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: '#f1f5f9', mb: 1 }}>
                      Success Metrics:
                    </Typography>
                    <Box mb={2}>
                      {Object.entries(pattern.successMetrics).map(([key, value]) => (
                        <Box key={key} display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                            {typeof value === 'number' && value < 1 ? 
                              `${Math.round(value * 100)}%` : 
                              value
                            }
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Last refined: {pattern.lastRefined.toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Workflow Suggestions */}
      <Accordion
        expanded={expandedSection === 'suggestions'}
        onChange={() => setExpandedSection(expandedSection === 'suggestions' ? null : 'suggestions')}
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
            '&:hover': { bgcolor: '#475569' },
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Lightbulb sx={{ color: '#f59e0b' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Workflow Suggestions ({memoryContext.workflowSuggestions.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ bgcolor: '#1e293b' }}>
          {memoryContext.workflowSuggestions.map((suggestion) => (
            <Card key={suggestion.suggestionId} sx={{ mb: 2, bgcolor: '#0f172a', borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box flex={1}>
                    <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 1 }}>
                      {suggestion.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                      {suggestion.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={suggestion.potentialImpact}
                    size="small"
                    sx={{
                      bgcolor: getImpactColor(suggestion.potentialImpact),
                      color: 'white',
                      fontWeight: 600,
                      ml: 2,
                    }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={suggestion.confidence * 100}
                      sx={{
                        mt: 1,
                        bgcolor: '#374151',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getSuccessRateColor(suggestion.confidence),
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Estimated Time Saving: {suggestion.estimatedTimeSaving}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="body2" sx={{ color: '#6b7280', mt: 2 }}>
                  Based on {suggestion.basedOnReceipts.length} receipts
                </Typography>
              </CardContent>
            </Card>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Contextual Insights */}
      <Paper sx={{ p: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#f1f5f9' }}>
          Contextual Insights
        </Typography>
        <List>
          {memoryContext.contextualInsights.map((insight, index) => (
            <ListItem key={index} sx={{ py: 1 }}>
              <ListItemIcon>
                <AutoAwesome sx={{ color: '#8b5cf6' }} />
              </ListItemIcon>
              <ListItemText
                primary={insight}
                sx={{ '& .MuiListItemText-primary': { color: '#e2e8f0' } }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default AgentMemoryViewer;

